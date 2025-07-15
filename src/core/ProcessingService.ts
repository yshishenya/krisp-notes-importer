import { App, Notice, normalizePath, TFile } from 'obsidian';
import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import { ZipExtractor } from './ZipExtractor';
import { NoteParser } from './NoteParser';
import { NoteCreator } from './NoteCreator';
import { NotificationService } from './NotificationService';
import { StatusBarService } from './StatusBarService';
import { LoggingService } from './LoggingService';
import { KRISP_FILE_NAMES } from './constants';
import {
    isValidMeetingNotesContent,
    isValidTranscriptContent,
    safeStringify,
    isValidFilePath,
    isValidZipFile
} from './typeGuards';
import * as path from 'path';
import { promises as fsPromises, Dirent } from 'fs';

export class ProcessingService {
    private app: App;
    private zipExtractor: ZipExtractor;
    private noteParser: NoteParser;
    private noteCreator: NoteCreator | null;
    private notificationService: NotificationService;
    private statusBarService: StatusBarService | null;
    private loggingService: LoggingService | null;

    constructor(app: App, statusBarService?: StatusBarService, loggingService?: LoggingService) {
        this.app = app;
        this.zipExtractor = new ZipExtractor(this.app);
        this.noteParser = new NoteParser();
        this.noteCreator = null; // Будет создан с актуальными settings
        this.notificationService = new NotificationService();
        this.statusBarService = statusBarService || null;
        this.loggingService = loggingService || null;
    }

    /**
     * Обрабатывает один ZIP-файл: распаковывает, парсит, создает заметку, перемещает аудио.
     * @param zipFilePath Абсолютный путь к ZIP-файлу.
     * @param settings Актуальные настройки плагина.
     */
    async processZipFile(zipFilePath: string, settings: KrispImporterSettings): Promise<void> {
        let tempDirPath: string | null = null;
        const zipFileName = path.basename(zipFilePath);
        let initialNotice: Notice | null = new Notice(`Processing ${zipFileName}...`, 0); // 0 для неопределенной длительности

        // Обновляем статус в строке состояния
        if (this.statusBarService) {
            this.statusBarService.setProcessing(zipFileName);
        }

        // Создаем NoteCreator с актуальными settings
        this.noteCreator = new NoteCreator(this.app, settings);

        try {
            // ERROR BOUNDARY: Extraction phase
            const tempDirName = `${zipFileName.replace('.zip', '')}_${Date.now()}`;
            tempDirPath = await this.extractWithErrorHandling(zipFilePath, tempDirName, zipFileName);

            if (!tempDirPath) {
                // Extraction failed, но ошибка уже обработана в extractWithErrorHandling
                if (initialNotice) initialNotice.hide();
                return;
            }

            // ERROR BOUNDARY: Meeting folders discovery phase
            const meetingFolders = await this.discoverMeetingFoldersWithErrorHandling(tempDirPath, zipFileName);

            if (!meetingFolders || meetingFolders.length === 0) {
                if (initialNotice) initialNotice.hide();
                await this.ensureFinalCleanup(tempDirPath);
                return;
            }

            // ERROR BOUNDARY: Processing phase
            const processingResult = await this.processMeetingsWithErrorHandling(
                meetingFolders,
                tempDirPath,
                zipFileName,
                settings
            );

            if (initialNotice) initialNotice.hide();

            // ERROR BOUNDARY: Post-processing phase
            await this.handlePostProcessingWithErrorHandling(
                processingResult,
                zipFilePath,
                zipFileName,
                settings
            );

        } catch (error) {
            // CRITICAL ERROR BOUNDARY: Last resort error handling
            await this.handleCriticalError(error, zipFileName, initialNotice, tempDirPath);
        } finally {
            // CLEANUP BOUNDARY: Ensure cleanup always happens
            await this.ensureFinalCleanup(tempDirPath);
        }
    }

    /**
     * ERROR BOUNDARY: Safe extraction with comprehensive error handling
     */
    private async extractWithErrorHandling(zipFilePath: string, tempDirName: string, zipFileName: string): Promise<string | null> {
        try {
            return await this.zipExtractor.extract(zipFilePath, tempDirName);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logAndNotifyError(`Failed to extract ZIP file: ${zipFileName}`, error, 'EXTRACT');

            // Логируем детали для диагностики
            if (this.loggingService) {
                this.loggingService.handleError('Processing', `ZIP extraction failed for ${zipFileName}`, error);
            }

            return null;
        }
    }

    /**
     * ERROR BOUNDARY: Safe meeting folders discovery
     */
    private async discoverMeetingFoldersWithErrorHandling(tempDirPath: string, zipFileName: string): Promise<Dirent[] | null> {
        try {
            const entries = await fsPromises.readdir(tempDirPath, { withFileTypes: true });
            const meetingFolders = entries.filter(entry => entry.isDirectory());

            if (meetingFolders.length === 0) {
                this.notificationService.showError(`No meeting folders found in ZIP: ${zipFileName}`);
                if (this.loggingService) {
                    this.loggingService.warn('Processing', `No meeting folders found in ${zipFileName}`);
                }
                return null;
            }

            return meetingFolders;
        } catch (error) {
            this.logAndNotifyError(`Failed to read ZIP contents: ${zipFileName}`, error, 'DISCOVER');
            return null;
        }
    }

    /**
     * ERROR BOUNDARY: Safe processing of individual meetings
     */
    private async processMeetingsWithErrorHandling(
        meetingFolders: Dirent[],
        tempDirPath: string,
        zipFileName: string,
        settings: KrispImporterSettings
    ): Promise<{ importedCount: number; errorCount: number; lastCreatedNote: { notePath?: string, audioDestPath?: string, noteFile?: TFile } | null }> {
        let importedCount = 0;
        let errorCount = 0;
        let lastCreatedNote: { notePath?: string, audioDestPath?: string, noteFile?: TFile } | null = null;

        const isMultipleMeetings = meetingFolders.length > 1;

        // Включаем batch режим для множественных встреч
        if (isMultipleMeetings) {
            this.notificationService.startBatchOperation(zipFileName);
        }

        // LOGGING: Начало обработки встреч
        if (this.loggingService) {
            this.loggingService.info('Processing', `Starting processing of ${meetingFolders.length} meeting folders from ${zipFileName}`);
        }
        console.log(`[DEBUG] Processing ${meetingFolders.length} meeting folders`);

        for (let i = 0; i < meetingFolders.length; i++) {
            const meetingFolderDirent = meetingFolders[i];
            const meetingFolderName = meetingFolderDirent.name;
            const meetingFolderPath = normalizePath(path.join(tempDirPath, meetingFolderName));

            // LOGGING: Начало обработки отдельной встречи
            if (this.loggingService) {
                this.loggingService.info('Processing', `Processing meeting ${i + 1}/${meetingFolders.length}: ${meetingFolderName}`);
            }

            try {
                // ERROR BOUNDARY: Обработка каждой встречи с полным логированием

                // Обновляем статус в StatusBar для множественных встреч
                if (isMultipleMeetings && this.statusBarService) {
                    this.statusBarService.setProcessing(`${i + 1}/${meetingFolders.length}: ${meetingFolderName.substring(0, 20)}...`);
                }

                // Показываем batch прогресс вместо отдельных уведомлений
                if (isMultipleMeetings) {
                    this.notificationService.showBatchProgress(`Обработка встречи ${i + 1}/${meetingFolders.length}: ${meetingFolderName}`, 2000);
                } else {
                    // Для одной встречи показываем обычное уведомление
                    const progressMessage = `Processing meeting: ${meetingFolderName}...`;
                    new Notice(progressMessage);
                }

                const notesTxtFilename = KRISP_FILE_NAMES.MEETING_NOTES;
                const transcriptTxtFilename = KRISP_FILE_NAMES.TRANSCRIPT;
                const recordingOriginalFilename = KRISP_FILE_NAMES.AUDIO_DEFAULT; // Это имя файла по умолчанию из Krisp

                const notesFilePath = normalizePath(path.join(meetingFolderPath, notesTxtFilename));
                const transcriptFilePath = normalizePath(path.join(meetingFolderPath, transcriptTxtFilename));

                // Ищем аудиофайл более гибко (mp3, m4a и т.д.)
                const meetingFiles = await fsPromises.readdir(meetingFolderPath);
                const audioFileDirent = meetingFiles.find(f => KRISP_FILE_NAMES.AUDIO_PATTERN.test(f));
                const actualRecordingOriginalFilename = audioFileDirent ?? recordingOriginalFilename; // Используем найденное или дефолтное
                const audioFileOriginalPath = normalizePath(path.join(meetingFolderPath, actualRecordingOriginalFilename));

                let notesContent = '';
                let transcriptContent = '';

                try {
                    const rawNotesContent = await fsPromises.readFile(notesFilePath, 'utf-8');

                    // TYPE GUARD: Валидация содержимого meeting_notes.txt
                    if (!isValidMeetingNotesContent(rawNotesContent)) {
                        this.logAndNotifyError(
                            `Invalid meeting notes format in ${meetingFolderName}`,
                            `File does not contain expected sections (Summary, Action Items, Key Points)`,
                            'VALIDATE_NOTES'
                        );
                        // Продолжаем с пустым содержимым, но предупреждаем
                        console.warn(`[ProcessingService] Invalid meeting notes format in ${meetingFolderName}, using empty content`);
                    } else {
                        notesContent = rawNotesContent;
                    }
                } catch (e) {
                    // LOGGING: Детальная ошибка чтения notes файла
                    this.logAndNotifyError(`Failed to read ${notesTxtFilename} from ${meetingFolderName} in ${zipFileName}`, e, 'READ_NOTES');

                                if (this.loggingService) {
                    this.loggingService.error('Processing', `Notes file read failed for ${meetingFolderName}`, {
                        errorMessage: e instanceof Error ? e.message : String(e),
                        notesPath: notesFilePath,
                        meetingFolder: meetingFolderName,
                        zipFile: zipFileName
                    });
                }

                const alternativeNotesFile = meetingFiles.find(f => f.toLowerCase().includes('notes') && f.toLowerCase().endsWith('.txt') && f !== notesTxtFilename);
                if (alternativeNotesFile) {
                    this.notificationService.showInfo(`Attempting to use alternative notes file: ${alternativeNotesFile}`);
                    try {
                        const altContent = await fsPromises.readFile(path.join(meetingFolderPath, alternativeNotesFile), 'utf-8');
                        if (isValidMeetingNotesContent(altContent)) {
                            notesContent = altContent;
                        } else {
                            console.warn(`[ProcessingService] Alternative notes file also has invalid format`);
                        }
                    } catch (e2) {
                        // LOGGING: Ошибка чтения альтернативного файла
                        this.logAndNotifyError(`Failed to read alternative notes file ${alternativeNotesFile} for ${meetingFolderName}`, e2, 'READ_ALT_NOTES');

                                                if (this.loggingService) {
                            this.loggingService.error('Processing', `Alternative notes file failed for ${meetingFolderName}`, {
                                errorMessage: e2 instanceof Error ? e2.message : String(e2),
                                altNotesFile: alternativeNotesFile,
                                meetingFolder: meetingFolderName,
                                zipFile: zipFileName
                            });
                        }

                        errorCount++;
                        continue; // Пропускаем эту папку встречи
                    }
                } else {
                    // LOGGING: Никаких notes файлов не найдено
                    if (this.loggingService) {
                        this.loggingService.error('Processing', `No valid notes files found for ${meetingFolderName}`, {
                            meetingFolder: meetingFolderName,
                            zipFile: zipFileName,
                            availableFiles: meetingFiles
                        });
                    }

                    errorCount++;
                    continue; // Пропускаем эту папку встречи
                }
            }

            try {
                const rawTranscriptContent = await fsPromises.readFile(transcriptFilePath, 'utf-8');

                // TYPE GUARD: Валидация содержимого transcript.txt
                if (!isValidTranscriptContent(rawTranscriptContent)) {
                    console.warn(`[ProcessingService] Invalid transcript format in ${meetingFolderName}, may not contain speaker|time pattern`);
                    // Для транскрипта можем продолжить даже с невалидным форматом
                }
                transcriptContent = rawTranscriptContent;
            } catch (e) {
                this.notificationService.showWarning(`Failed to read ${transcriptTxtFilename} for ${meetingFolderName} in ${zipFileName}. Transcript might be missing.`);
                // Не ошибка, если транскрипта нет
            }

            const parsedData = this.noteParser.parseMeetingNotes(notesContent, transcriptContent, meetingFolderName);

            // LOGGING: Результаты парсинга
            if (this.loggingService) {
                this.loggingService.info('Processing', `Parsed data for ${meetingFolderName}`, {
                    title: parsedData.meetingTitle,
                    date: parsedData.date,
                    time: parsedData.time,
                    participantsCount: parsedData.participants?.length || 0,
                    hasTranscript: !!parsedData.formattedTranscript,
                    transcriptLength: parsedData.formattedTranscript?.length || 0
                });
            }

            // ОТЛАДКА: Логируем извлеченные данные (можно удалить в продакшн)
            console.log(`[DEBUG] Parsed data for ${meetingFolderName}:`, {
                title: parsedData.meetingTitle,
                date: parsedData.date,
                time: parsedData.time,
                participants: parsedData.participants,
                hasTranscript: !!parsedData.formattedTranscript,
                transcriptLength: parsedData.formattedTranscript?.length || 0,
                summaryLength: parsedData.summary?.length || 0,
                actionItemsLength: parsedData.actionItems?.length || 0
            });

                        // Убеждаемся что noteCreator и audioFileOriginalPath инициализированы
            if (!this.noteCreator) {
                throw new Error('NoteCreator is not initialized');
            }
            if (!audioFileOriginalPath || typeof audioFileOriginalPath !== 'string') {
                throw new Error(`Invalid audio file path for ${meetingFolderName}`);
            }

            const creationResult = await this.noteCreator.createNote(parsedData, audioFileOriginalPath);

            if (!creationResult.notePath) {
                const errorMsg = `Failed to create note for ${meetingFolderName}`;
                this.notificationService.showError(errorMsg);

                // LOGGING: Ошибка создания заметки
                if (this.loggingService) {
                    this.loggingService.error('Processing', errorMsg, { meetingFolder: meetingFolderName });
                }

                errorCount++;
                continue; // Пропускаем эту папку встречи
            }

            // Сохраняем информацию о последней созданной заметке
            lastCreatedNote = creationResult;

            // LOGGING: Успешное создание заметки
            if (this.loggingService) {
                this.loggingService.info('Processing', `Note created successfully for ${meetingFolderName}`, {
                    notePath: creationResult.notePath,
                    audioDestPath: creationResult.audioDestPath
                });
            }

            console.log(`[DEBUG] Note created at: ${creationResult.notePath}, audio dest: ${creationResult.audioDestPath}`);

            // Аудиофайл теперь создается в NoteCreator.createNote()
            // Удалена дублированная логика обработки аудио

            // В batch режиме убираем индивидуальные success уведомления
            if (!isMultipleMeetings) {
                this.notificationService.showSuccess(`Successfully imported meeting ${meetingFolderName} to ${creationResult.notePath}`);
            }
            importedCount++;

            } catch (unexpectedError) {
                // LOGGING: Неожиданная ошибка в обработке встречи
                const errorMsg = `Unexpected error processing meeting ${meetingFolderName}`;
                this.logAndNotifyError(errorMsg, unexpectedError, 'UNEXPECTED_MEETING_ERROR');

                if (this.loggingService) {
                    this.loggingService.error('Processing', errorMsg, {
                        errorMessage: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError),
                        meetingFolder: meetingFolderName,
                        meetingIndex: i + 1,
                        totalMeetings: meetingFolders.length,
                        zipFile: zipFileName,
                        stack: unexpectedError instanceof Error ? unexpectedError.stack : undefined
                    });
                }

                errorCount++;
                continue; // Продолжаем обработку других встреч
            }
        } // Конец цикла по папкам встреч

        // Завершаем batch операцию и показываем итоговый результат
        if (isMultipleMeetings) {
            this.notificationService.endBatchOperation();
            this.notificationService.showBatchImportResult(importedCount, errorCount, 0, zipFileName);
            this.notificationService.logDetailedResult(importedCount, errorCount, 0, zipFileName);
        }

        return { importedCount, errorCount, lastCreatedNote };
    }

    /**
     * ERROR BOUNDARY: Safe post-processing and cleanup
     */
    private async handlePostProcessingWithErrorHandling(
        processingResult: { importedCount: number; errorCount: number; lastCreatedNote: { notePath?: string, audioDestPath?: string, noteFile?: TFile } | null },
        zipFilePath: string,
        zipFileName: string,
        settings: KrispImporterSettings
    ): Promise<void> {
        // Не устанавливаем статус здесь - это делает вызывающий код
        // Только если есть ошибки, устанавливаем статус ошибки
        if (this.statusBarService && processingResult.errorCount > 0) {
            this.statusBarService.setError(`Ошибок: ${processingResult.errorCount}`);
        }

        // Проверяем настройку удаления ZIP-файла
        console.log(`[DEBUG] deleteZipAfterImport setting: ${settings.deleteZipAfterImport}`);
        console.log(`[DEBUG] errorCount: ${processingResult.errorCount}, importedCount: ${processingResult.importedCount}`);

        if (settings.deleteZipAfterImport && processingResult.errorCount === 0 && processingResult.importedCount > 0) { // Удаляем ZIP только если все успешно
            try {
                console.log(`[DEBUG] Attempting to delete ZIP file: ${zipFilePath}`);
                await fsPromises.rm(zipFilePath);
                this.notificationService.showInfo(`Deleted original ZIP file: ${zipFileName}`);
                console.log(`[DEBUG] Successfully deleted ZIP file: ${zipFilePath}`);
            } catch (e) {
                console.error(`[DEBUG] Failed to delete ZIP file:`, e);
                this.notificationService.showError(`Failed to delete original ZIP file ${zipFileName}: ${e.message}`);
            }
        } else if (settings.deleteZipAfterImport) {
            console.log(`[DEBUG] ZIP file not deleted due to errors or no imports. errorCount: ${processingResult.errorCount}, importedCount: ${processingResult.importedCount}`);
        } else {
            console.log(`[DEBUG] ZIP file deletion disabled in settings`);
        }

        // Опционально открываем заметку после импорта
        if (settings.openNoteAfterImport && processingResult.importedCount === 1) {
            // Для одной заметки - открываем её
            if (processingResult.lastCreatedNote?.noteFile) {
                this.app.workspace.getLeaf().openFile(processingResult.lastCreatedNote!.noteFile);
                this.notificationService.showInfo(`Заметка открыта: ${processingResult.lastCreatedNote!.notePath}`);
            }
        } else if (settings.openNoteAfterImport && processingResult.importedCount > 1) {
            // Для множественного импорта - показываем уведомление
            this.notificationService.showInfo(`Импортировано ${processingResult.importedCount} заметок. Откройте нужную из папки заметок.`);
        }
    }

    /**
     * CRITICAL ERROR BOUNDARY: Handles errors that are too severe to recover from
     */
    private async handleCriticalError(error: any, zipFileName: string, initialNotice: Notice | null, tempDirPath: string | null): Promise<void> {
        if (initialNotice) initialNotice.hide(); // Просто скрываем, если существует

        // Обновляем статус при ошибке, если statusBarService доступен
        if (this.statusBarService) {
            this.statusBarService.setError(`Ошибка обработки ${zipFileName}`);
        }

        // Используем универсальный метод обработки ошибок
        if (this.loggingService) {
            this.loggingService.handleError('Processing', `Ошибка обработки ZIP-файла ${zipFileName}`, error);
        } else {
            console.error(`[Krisp Importer] Error processing ZIP file ${zipFileName}:`, error);
            this.notificationService.showError(`An unexpected error occurred while processing ${zipFileName}: ${error.message}`);
        }
    }

    /**
     * CLEANUP BOUNDARY: Ensures cleanup of temporary files
     */
    private async ensureFinalCleanup(tempDirPath: string | null): Promise<void> {
        if (tempDirPath) {
            await this.zipExtractor.cleanup(tempDirPath);
        }
        // Удаляем логику восстановления статуса из ProcessingService.
        // Вызывающий код (FileWatcherService, main.ts) теперь отвечает за это.
    }

    /**
     * Helper to log errors and show notifications
     */
    private logAndNotifyError(message: string, error: any, context: string): void {
        console.error(`[DEBUG] ${context} error:`, error);
        this.notificationService.showError(message);
        if (this.loggingService) {
            this.loggingService.handleError('Processing', message, error);
        }
    }
}
