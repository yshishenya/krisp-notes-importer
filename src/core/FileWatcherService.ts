import { App } from 'obsidian';
import { ProcessingService } from './ProcessingService';
import { NotificationService } from './NotificationService';
import { StatusBarService } from './StatusBarService';
import { KrispImporterSettings } from '../interfaces';
import { PERFORMANCE_LIMITS } from './constants';
import * as fs from 'fs';
import * as path from 'path';

export class FileWatcherService {
    private app: App;
    private processingService: ProcessingService;
    private notificationService: NotificationService;
    private statusBarService: StatusBarService | null;
    private watcher: fs.FSWatcher | null = null;
    private isWatching: boolean = false;
    private watchedPath: string = '';
    private settingsProvider: () => KrispImporterSettings;

    // Мьютекс для предотвращения race conditions
    private isProcessingFile: boolean = false;
    private pendingFiles: Set<string> = new Set();

    constructor(
        app: App,
        processingService: ProcessingService,
        notificationService: NotificationService,
        settingsProvider: () => KrispImporterSettings,
        statusBarService?: StatusBarService
    ) {
        this.app = app;
        this.processingService = processingService;
        this.notificationService = notificationService;
        this.settingsProvider = settingsProvider;
        this.statusBarService = statusBarService || null;
    }

    /**
     * Начать отслеживание указанной папки
     */
    async startWatching(folderPath: string): Promise<void> {
        if (this.isWatching) {
            await this.stopWatching();
        }

        if (!folderPath || folderPath.trim() === '') {
            this.notificationService.showError('No watched folder specified');
            return;
        }

        try {
            // Проверяем существование папки
            if (!fs.existsSync(folderPath)) {
                this.notificationService.showError(`Folder does not exist: ${folderPath}`);
                return;
            }

            // Проверяем что это действительно папка
            const stats = fs.statSync(folderPath);
            if (!stats.isDirectory()) {
                this.notificationService.showError(`Указанный путь не является папкой: ${folderPath}`);
                return;
            }

            this.watchedPath = folderPath;

            // Создаем watcher для отслеживания изменений в папке
            this.watcher = fs.watch(folderPath, { persistent: true }, async (eventType, filename) => {
                console.log(`[FileWatcher] Event detected: ${eventType}, filename: ${filename}`);
                if (eventType === 'rename' && filename) {
                    // Обрабатываем файловое событие асинхронно с правильной обработкой ошибок
                    try {
                        await this.handleFileEvent(filename);
                    } catch (error) {
                        console.error(`[FileWatcher] Error in file event handler for ${filename}:`, error);
                        this.notificationService.showError(`Критическая ошибка обработки ${filename}: ${error.message}`);
                        if (this.statusBarService) {
                            this.statusBarService.setError(`Критическая ошибка с ${filename}`);
                        }
                    }
                }
            });

            this.isWatching = true;

            // Обновляем статус в строке состояния
            if (this.statusBarService) {
                this.statusBarService.setWatching(folderPath);
            }

            this.notificationService.showSuccess(`Отслеживание папки запущено: ${folderPath}`);

            console.log(`[Krisp Importer] FileWatcher started for: ${folderPath}`);

        } catch (error) {
            // ИСПРАВЛЕНИЕ: Очищаем watcher при ошибке, чтобы избежать утечки памяти
            if (this.watcher) {
                this.watcher.close();
                this.watcher = null;
            }
            this.isWatching = false;
            this.watchedPath = '';

            // Обновляем статус при ошибке
            if (this.statusBarService) {
                this.statusBarService.setError(`Ошибка отслеживания: ${error.message}`);
            }

            console.error('[Krisp Importer] Error starting file watcher:', error);
            this.notificationService.showError(`Ошибка запуска отслеживания: ${error.message}`);
        }
    }

    /**
     * Остановить отслеживание папки
     */
    async stopWatching(): Promise<void> {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.isWatching) {
            this.isWatching = false;

            // Обновляем статус в строке состояния
            if (this.statusBarService) {
                this.statusBarService.setIdle('Отслеживание остановлено');
            }

            this.notificationService.showInfo('Отслеживание папки остановлено');
            console.log('[Krisp Importer] FileWatcher stopped');
        }
    }

    /**
     * Проверить статус отслеживания
     */
    isCurrentlyWatching(): boolean {
        return this.isWatching;
    }

    /**
     * Получить путь отслеживаемой папки
     */
    getWatchedPath(): string {
        return this.watchedPath;
    }

    /**
     * Обработать событие файловой системы с защитой от race conditions
     */
    private async handleFileEvent(filename: string): Promise<void> {
        console.log(`[FileWatcher] Processing file event for: ${filename}`);

        // Проверяем что файл имеет расширение .zip
        if (!filename.toLowerCase().endsWith('.zip')) {
            console.log(`[FileWatcher] Ignoring non-ZIP file: ${filename}`);
            return;
        }

        const fullPath = path.join(this.watchedPath, filename);

        // Проверяем что файл существует (событие rename может быть как создание, так и удаление)
        if (!fs.existsSync(fullPath)) {
            return;
        }

        // Проверяем что это файл, а не папка
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) {
            return;
        }

        // Мьютекс: если уже обрабатываем файл, добавляем в очередь
        if (this.isProcessingFile) {
            console.log(`[FileWatcher] File processing in progress, queuing: ${filename}`);
            this.pendingFiles.add(fullPath);
            return;
        }

        // Начинаем обработку
        await this.processFileWithMutex(fullPath);
    }

    /**
     * Обрабатывает файл с мьютексом и очередью
     */
    private async processFileWithMutex(fullPath: string): Promise<void> {
        this.isProcessingFile = true;

        try {
            await this.processFileInternal(fullPath);
        } catch (error) {
            console.error(`[FileWatcher] Critical error processing ${fullPath}:`, error);
            this.notificationService.showError(`Критическая ошибка обработки ${path.basename(fullPath)}: ${error.message}`);
            if (this.statusBarService) {
                this.statusBarService.setError(`Критическая ошибка с ${path.basename(fullPath)}`);
            }
        } finally {
            this.isProcessingFile = false;

            // Обрабатываем следующий файл из очереди, если есть
            await this.processNextInQueue();
        }
    }

    /**
     * Обрабатывает следующий файл из очереди
     */
    private async processNextInQueue(): Promise<void> {
        if (this.pendingFiles.size > 0 && !this.isProcessingFile) {
            const nextFile = this.pendingFiles.values().next().value;
            this.pendingFiles.delete(nextFile);

            console.log(`[FileWatcher] Processing queued file: ${path.basename(nextFile)}`);
            await this.processFileWithMutex(nextFile);
        }
    }

    /**
     * Внутренняя логика обработки файла
     */
    private async processFileInternal(fullPath: string): Promise<void> {
        const filename = path.basename(fullPath);

        try {
            console.log(`[Krisp Importer] New ZIP file detected: ${filename}`);

            // Небольшая задержка, чтобы убедиться что файл полностью скопирован
            await this.waitForFileStability(fullPath);

            // Получаем актуальные настройки из плагина
            const currentSettings = this.settingsProvider();

            // Устанавливаем статус Processing перед вызовом processNewZipFile
            if (this.statusBarService) {
                this.statusBarService.setProcessing(filename);
            }

            // Обрабатываем файл
            await this.processNewZipFile(fullPath, currentSettings);

        } finally {
            // Восстанавливаем статус после обработки файла
            if (this.statusBarService) {
                if (this.isWatching && this.watchedPath) {
                    this.statusBarService.setWatching(this.watchedPath);
                } else {
                    // Если отслеживание было остановлено или путь не определен
                    this.statusBarService.setIdle("Обработка файла завершена");
                }
            }
        }
    }

    /**
     * Ждем пока файл стабилизируется (полностью скопируется)
     */
    private async waitForFileStability(filePath: string, maxWaitTime: number = PERFORMANCE_LIMITS.FILE_STABILITY_MAX_WAIT): Promise<void> {
        const checkInterval = PERFORMANCE_LIMITS.FILE_STABILITY_CHECK_INTERVAL; // Проверяем каждые 500мс
        let lastSize = 0;
        let stableCount = 0;
        const requiredStableChecks = PERFORMANCE_LIMITS.FILE_STABILITY_REQUIRED_CHECKS; // Файл должен быть стабильным 3 проверки подряд

        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkStability = () => {
                try {
                    if (!fs.existsSync(filePath)) {
                        resolve();
                        return;
                    }

                    const stats = fs.statSync(filePath);
                    const currentSize = stats.size;

                    if (currentSize === lastSize && currentSize > 0) {
                        stableCount++;
                        if (stableCount >= requiredStableChecks) {
                            resolve();
                            return;
                        }
                    } else {
                        stableCount = 0;
                    }

                    lastSize = currentSize;

                    // Проверяем не превысили ли максимальное время ожидания
                    if (Date.now() - startTime < maxWaitTime) {
                        setTimeout(checkStability, checkInterval);
                    } else {
                        // Время ожидания истекло, продолжаем обработку
                        resolve();
                    }
                } catch (error) {
                    console.error('[FileWatcher] Error checking file stability:', error);
                    resolve(); // Продолжаем даже при ошибке
                }
            };

            checkStability();
        });
    }

    /**
     * Обработать новый ZIP-файл
     */
    private async processNewZipFile(zipFilePath: string, settings: KrispImporterSettings): Promise<void> {
        try {
            console.log(`[FileWatcher] Processing new ZIP file: ${zipFilePath}`);
            console.log(`[FileWatcher] Settings - deleteZipAfterImport: ${settings.deleteZipAfterImport}`);

            this.notificationService.showInfo(`Обнаружен новый файл: ${path.basename(zipFilePath)}`);

            // Обрабатываем файл через ProcessingService
            await this.processingService.processZipFile(zipFilePath, settings);

        } catch (error) {
            console.error('[Krisp Importer] Error processing new ZIP file:', error);
            this.notificationService.showError(`Ошибка автоматической обработки файла: ${error.message}`);
        }
    }

    /**
     * Сканировать папку на предмет существующих ZIP-файлов
     */
    async scanExistingFiles(): Promise<void> {
        if (!this.isWatching || !this.watchedPath) {
            // Если сканирование вызвано, когда отслеживание неактивно (например, через команду, а папка не указана)
            // Уведомляем пользователя и выходим
            this.notificationService.showError("Отслеживаемая папка не настроена или отслеживание неактивно. Невозможно сканировать.");
            if (this.statusBarService) {
                this.statusBarService.setIdle("Сканирование невозможно");
            }
            return;
        }

        const initialStatusWasWatching = this.isWatching;
        const initialWatchedPath = this.watchedPath;

        if (this.statusBarService) {
            this.statusBarService.setProcessing("Сканирование существующих файлов...");
        }

        try {
            const files = fs.readdirSync(this.watchedPath);
            const zipFiles = files.filter(file => file.toLowerCase().endsWith('.zip'));

            if (zipFiles.length === 0) {
                this.notificationService.showInfo('В отслеживаемой папке нет ZIP-файлов');
                return;
            }

            this.notificationService.showInfo(`Найдено ${zipFiles.length} ZIP-файлов для обработки`);

            let processed = 0;
            let errors = 0;

            for (const zipFile of zipFiles) {
                try {
                    const fullPath = path.join(this.watchedPath, zipFile);

                    // Получаем актуальные настройки из плагина
                    const currentSettings = this.settingsProvider();

                    await this.processNewZipFile(fullPath, currentSettings);
                    processed++;
                } catch (error) {
                    console.error(`[Krisp Importer] Error processing ${zipFile}:`, error);
                    errors++;
                }
            }

            this.notificationService.showBatchImportResult(processed, errors, 0, 'массовое сканирование');

        } catch (error) {
            console.error('[Krisp Importer] Error scanning existing files:', error);
            this.notificationService.showError(`Ошибка сканирования папки: ${error.message}`);
            if (this.statusBarService) {
                this.statusBarService.setError("Ошибка сканирования");
            }
        } finally {
            if (this.statusBarService) {
                if (initialStatusWasWatching && initialWatchedPath) {
                    // Возвращаем статус к отслеживанию, если он был таким до сканирования
                    this.statusBarService.setWatching(initialWatchedPath);
                } else {
                    this.statusBarService.setIdle("Сканирование завершено");
                }
            }
        }
    }
}
