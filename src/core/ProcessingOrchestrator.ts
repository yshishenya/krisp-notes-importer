import { Notice } from 'obsidian';
import {
    IProcessingOrchestrator,
    IMeetingExtractionService,
    IMeetingParsingService,
    IMeetingImportService,
    IErrorHandlingService,
    INotificationService,
    IStatusBarService,
    ILoggingService,
    IZipExtractor
} from './serviceInterfaces';
import { KrispImporterSettings } from '../interfaces';
import * as path from 'path';

/**
 * Главный оркестратор процесса импорта Krisp заметок
 *
 * Координирует работу всех специализированных сервисов:
 * - MeetingExtractionService: извлечение ZIP и поиск папок встреч
 * - MeetingParsingService: парсинг данных с оптимизацией больших файлов
 * - MeetingImportService: создание заметок и post-processing
 * - ErrorHandlingService: централизованная обработка ошибок
 *
 * Преимущества над старым ProcessingService:
 * - Четкое разделение ответственностей (Single Responsibility Principle)
 * - Dependency injection для лучшей тестируемости
 * - Централизованная обработка ошибок
 * - Оптимизация больших файлов >100MB
 * - Прогресс-трекинг и graceful degradation
 */
export class ProcessingOrchestrator implements IProcessingOrchestrator {
    constructor(
        private extractionService: IMeetingExtractionService,
        private parsingService: IMeetingParsingService,
        private importService: IMeetingImportService,
        private errorHandlingService: IErrorHandlingService,
        private notificationService: INotificationService,
        private zipExtractor: IZipExtractor,
        private statusBarService?: IStatusBarService,
        private loggingService?: ILoggingService
    ) {}

    /**
     * Основной метод обработки ZIP файла
     */
    async processZipFile(zipFilePath: string, settings: KrispImporterSettings): Promise<void> {
        let tempDirPath: string | null = null;
        const zipFileName = path.basename(zipFilePath);
        let progressNotice: Notice | null = null;

        try {
            // Инициализация и валидация
            await this.initializeProcessing(zipFilePath, zipFileName);

            progressNotice = new Notice(`Обработка ${zipFileName}...`, 0);

            if (this.statusBarService) {
                this.statusBarService.setProcessing(zipFileName);
            }

            // ФАЗА 1: Извлечение ZIP файла
            const extractionResult = await this.executeExtractionPhase(zipFilePath, zipFileName);
            tempDirPath = extractionResult.tempDirPath;

            // ФАЗА 2: Парсинг данных встреч
            const parsingResults = await this.executeParsingPhase(extractionResult, zipFileName);

            // ФАЗА 3: Импорт заметок
            const importResult = await this.executeImportPhase(parsingResults, settings, zipFileName);

            // ФАЗА 4: Post-processing
            await this.executePostProcessingPhase(importResult, zipFilePath, settings, zipFileName);

            // Успешное завершение
            await this.finalizeProcessing(progressNotice, true);

        } catch (error) {
            await this.finalizeProcessing(progressNotice, false, error, zipFileName);
            throw error;
        } finally {
            // Cleanup всегда выполняется
            await this.ensureCleanup(tempDirPath);
        }
    }

    /**
     * Расширенный метод с прогресс-колбеком
     */
    async processZipFileWithProgress(
        zipFilePath: string,
        settings: KrispImporterSettings,
        progressCallback?: (stage: string, progress: number) => void
    ): Promise<void> {
        const updateProgress = (stage: string, progress: number) => {
            if (progressCallback) {
                progressCallback(stage, progress);
            }
        };

        let tempDirPath: string | null = null;
        const zipFileName = path.basename(zipFilePath);

        try {
            updateProgress('Инициализация', 0);
            await this.initializeProcessing(zipFilePath, zipFileName);

            updateProgress('Извлечение ZIP', 20);
            const extractionResult = await this.executeExtractionPhase(zipFilePath, zipFileName);
            tempDirPath = extractionResult.tempDirPath;

            updateProgress('Парсинг данных', 50);
            const parsingResults = await this.executeParsingPhase(extractionResult, zipFileName);

            updateProgress('Создание заметок', 70);
            const importResult = await this.executeImportPhase(parsingResults, settings, zipFileName);

            updateProgress('Финализация', 90);
            await this.executePostProcessingPhase(importResult, zipFilePath, settings, zipFileName);

            updateProgress('Завершено', 100);

        } finally {
            await this.ensureCleanup(tempDirPath);
        }
    }

    // ========================================================================================
    // ПРИВАТНЫЕ МЕТОДЫ ДЛЯ КАЖДОЙ ФАЗЫ ОБРАБОТКИ
    // ========================================================================================

    /**
     * Инициализация процесса обработки
     */
    private async initializeProcessing(zipFilePath: string, zipFileName: string): Promise<void> {
        if (this.loggingService) {
            this.loggingService.logZipProcessingStart(zipFilePath);
        }

        console.log(`[ProcessingOrchestrator] Starting processing of ${zipFileName}`);
    }

    /**
     * ФАЗА 1: Извлечение ZIP и поиск папок встреч
     */
    private async executeExtractionPhase(zipFilePath: string, zipFileName: string) {
        try {
            const extractionResult = await this.extractionService.extractZipFile(zipFilePath);

            if (this.loggingService) {
                this.loggingService.info('Processing', `Extracted ZIP: ${zipFileName}`, {
                    tempDir: extractionResult.tempDirPath,
                    meetingFoldersFound: extractionResult.meetingFolders.length
                });
            }

            console.log(`[ProcessingOrchestrator] Found ${extractionResult.meetingFolders.length} meeting folders`);
            return extractionResult;
        } catch (error) {
            this.errorHandlingService.handleExtractionError(error, `ZIP: ${zipFileName}`);
            throw error;
        }
    }

    /**
     * ФАЗА 2: Парсинг данных встреч
     */
    private async executeParsingPhase(extractionResult: any, zipFileName: string) {
        try {
            const parsingResults = await this.parsingService.parseAllMeetings(
                extractionResult.meetingFolders,
                extractionResult.tempDirPath
            );

            if (this.loggingService) {
                this.loggingService.info('Processing', `Parsed meetings from ${zipFileName}`, {
                    totalMeetings: extractionResult.meetingFolders.length,
                    successfullyParsed: parsingResults.length,
                    failures: extractionResult.meetingFolders.length - parsingResults.length
                });
            }

            if (parsingResults.length === 0) {
                throw new Error('No meetings could be parsed successfully');
            }

            return parsingResults;
        } catch (error) {
            this.errorHandlingService.handleParsingError(error, zipFileName);
            throw error;
        }
    }

    /**
     * ФАЗА 3: Импорт заметок
     */
    private async executeImportPhase(parsingResults: any[], settings: KrispImporterSettings, zipFileName: string) {
        try {
            const importResult = await this.importService.importParsedMeetings(parsingResults, settings);

            if (this.loggingService) {
                this.loggingService.info('Processing', `Import completed for ${zipFileName}`, {
                    imported: importResult.importedCount,
                    errors: importResult.errorCount,
                    hasLastNote: !!importResult.lastCreatedNote
                });
            }

            return importResult;
        } catch (error) {
            this.errorHandlingService.handleImportError(error, zipFileName);
            throw error;
        }
    }

    /**
     * ФАЗА 4: Post-processing действия
     */
    private async executePostProcessingPhase(
        importResult: any,
        zipFilePath: string,
        settings: KrispImporterSettings,
        zipFileName: string
    ): Promise<void> {
        try {
            await this.importService.handlePostImportActions(importResult, zipFilePath, settings);

            if (this.loggingService) {
                this.loggingService.info('Processing', `Post-processing completed for ${zipFileName}`, {
                    zipDeleted: settings.deleteZipAfterImport && importResult.errorCount === 0,
                    noteOpened: settings.openNoteAfterImport && importResult.importedCount > 0
                });
            }
        } catch (error) {
            this.errorHandlingService.handleCriticalError(error, `Post-processing: ${zipFileName}`);
            // Не перебрасываем ошибку - post-processing не критичен
        }
    }

    /**
     * Завершение процесса обработки
     */
    private async finalizeProcessing(
        progressNotice: Notice | null,
        success: boolean,
        error?: any,
        zipFileName?: string
    ): Promise<void> {
        if (progressNotice) {
            progressNotice.hide();
        }

        if (success) {
            if (this.statusBarService) {
                this.statusBarService.setIdle('Обработка завершена');
            }

            if (this.loggingService && zipFileName) {
                this.loggingService.logZipProcessingEnd(zipFileName, true);
            }
        } else {
            if (this.statusBarService) {
                this.statusBarService.setError(zipFileName ? `Ошибка: ${zipFileName}` : 'Ошибка обработки');
            }

            if (this.loggingService && zipFileName) {
                this.loggingService.logZipProcessingEnd(zipFileName, false);
            }

            if (error) {
                this.errorHandlingService.handleCriticalError(error, zipFileName || 'Unknown file');
            }
        }
    }

    /**
     * Cleanup временных файлов
     */
    private async ensureCleanup(tempDirPath: string | null): Promise<void> {
        if (tempDirPath) {
            try {
                await this.zipExtractor.cleanup(tempDirPath);
                console.log(`[ProcessingOrchestrator] Cleaned up temporary directory: ${tempDirPath}`);
            } catch (error) {
                console.warn(`[ProcessingOrchestrator] Failed to cleanup temporary directory:`, error);
                // Не критично, продолжаем
            }
        }
    }

    // ========================================================================================
    // УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ========================================================================================

    /**
     * Проверяет готовность всех сервисов
     */
    isReady(): boolean {
        return !!(
            this.extractionService &&
            this.parsingService &&
            this.importService &&
            this.errorHandlingService &&
            this.notificationService &&
            this.zipExtractor
        );
    }

    /**
     * Получает статистику использования памяти (для мониторинга)
     */
    getMemoryUsage(): { used: number; total: number } {
        const usage = process.memoryUsage();
        return {
            used: Math.round(usage.heapUsed / 1024 / 1024), // MB
            total: Math.round(usage.heapTotal / 1024 / 1024) // MB
        };
    }

    /**
     * Логирует статистику производительности
     */
    private logPerformanceStats(phase: string, startTime: number): void {
        const duration = Date.now() - startTime;
        const memory = this.getMemoryUsage();

        if (this.loggingService) {
            this.loggingService.debug('Performance', `${phase} completed`, {
                duration: `${duration}ms`,
                memoryUsed: `${memory.used}MB`,
                memoryTotal: `${memory.total}MB`
            });
        }
    }
}
