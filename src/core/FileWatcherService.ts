import { App } from 'obsidian';
import { ProcessingService } from './ProcessingService';
import { NotificationService } from './NotificationService';
import { StatusBarService } from './StatusBarService';
import { KrispImporterSettings } from '../interfaces';
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
     * Start watching the specified folder for changes.
     *
     * This function checks if there is an ongoing watch and stops it before starting a new one.
     * It validates the folder path, ensuring it exists and is a directory. If validation fails,
     * appropriate error messages are shown using the notification service.
     *
     * @param folderPath - The path of the folder to be watched.
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
            this.watcher = fs.watch(folderPath, { persistent: true }, (eventType, filename) => {
                console.log(`[FileWatcher] Event detected: ${eventType}, filename: ${filename}`);
                if (eventType === 'rename' && filename) {
                    this.handleFileEvent(filename);
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
            // Обновляем статус при ошибке
            if (this.statusBarService) {
                this.statusBarService.setError(`Ошибка отслеживания: ${error.message}`);
            }

            console.error('[Krisp Importer] Error starting file watcher:', error);
            this.notificationService.showError(`Ошибка запуска отслеживания: ${error.message}`);
        }
    }

    /**
     * Stops watching the directory.
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
     * Checks if the current item is being watched.
     */
    isCurrentlyWatching(): boolean {
        return this.isWatching;
    }

    /**
     * Returns the path of the watched folder.
     */
    getWatchedPath(): string {
        return this.watchedPath;
    }

    /**
     * Handles a file system event, specifically for ZIP files.
     *
     * This function processes events related to ZIP files by checking if the file has the correct extension,
     * exists on disk, and is not a directory. It then waits for the file to stabilize before processing it with the current settings.
     *
     * @param filename - The name of the file that triggered the event.
     */
    private async handleFileEvent(filename: string): Promise<void> {
        console.log(`[FileWatcher] Processing file event for: ${filename}`);
        try {
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

            console.log(`[Krisp Importer] New ZIP file detected: ${filename}`);

            // Небольшая задержка, чтобы убедиться что файл полностью скопирован
            await this.waitForFileStability(fullPath);

            // Получаем актуальные настройки из плагина
            const currentSettings = this.settingsProvider();

            // Обрабатываем файл
            await this.processNewZipFile(fullPath, currentSettings);

        } catch (error) {
            console.error('[Krisp Importer] Error handling file event:', error);
            this.notificationService.showError(`Ошибка обработки файла ${filename}: ${error.message}`);
        }
    }

    /**
     * Waits for a file to stabilize (complete copying).
     *
     * This function checks the file size at regular intervals and considers the file stable if its size remains unchanged for a specified number of consecutive checks within a given maximum wait time.
     *
     * @param filePath - The path to the file to monitor for stability.
     * @param maxWaitTime - The maximum time in milliseconds to wait for the file to stabilize. Defaults to 5000ms.
     */
    private async waitForFileStability(filePath: string, maxWaitTime: number = 5000): Promise<void> {
        const checkInterval = 500; // Проверяем каждые 500мс
        let lastSize = 0;
        let stableCount = 0;
        const requiredStableChecks = 3; // Файл должен быть стабильным 3 проверки подряд

        return new Promise((resolve) => {
            /**
             * Checks the stability of a file by monitoring its size over time.
             *
             * This function continuously checks if the size of a specified file remains constant for a certain number of checks.
             * If the file size does not change and is greater than zero, it increments a stability counter.
             * Once the counter reaches the required number of stable checks, it resolves the operation.
             * If the file size changes or the maximum wait time is exceeded, it resets the counter and continues checking.
             * In case of an error accessing the file, it resolves the operation without further checks.
             *
             * @returns void
             */
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
                    // Если ошибка доступа к файлу, продолжаем обработку
                    resolve();
                }
            };

            const startTime = Date.now();
            checkStability();
        });
    }

    /**
     * Processes a newly detected ZIP file.
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
     * Scans the watched directory for existing ZIP files and processes them.
     *
     * This function first checks if the watcher is active and a valid path is set.
     * It then reads the directory, filters out ZIP files, and processes each one using the current settings.
     * If no ZIP files are found, it displays an informational message. Otherwise, it processes each file,
     * logs any errors encountered during processing, and finally shows the batch import result.
     *
     * @returns A Promise that resolves when the scanning and processing are complete.
     */
    async scanExistingFiles(): Promise<void> {
        if (!this.isWatching || !this.watchedPath) {
            return;
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
        }
    }
}
