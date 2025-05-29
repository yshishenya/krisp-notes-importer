import { App, Notice, normalizePath, TFile } from 'obsidian';
import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import { ZipExtractor } from './ZipExtractor';
import { NoteParser } from './NoteParser';
import { NoteCreator } from './NoteCreator';
import { NotificationService } from './NotificationService';
import { StatusBarService } from './StatusBarService';
import * as path from 'path';
import { promises as fsPromises, Dirent } from 'fs';

export class ProcessingService {
    private app: App;
    private zipExtractor: ZipExtractor;
    private noteParser: NoteParser;
    private noteCreator: NoteCreator | null;
    private notificationService: NotificationService;
    private statusBarService: StatusBarService | null;

    constructor(app: App, statusBarService?: StatusBarService) {
        this.app = app;
        this.zipExtractor = new ZipExtractor(this.app);
        this.noteParser = new NoteParser();
        this.noteCreator = null; // Будет создан с актуальными settings
        this.notificationService = new NotificationService();
        this.statusBarService = statusBarService || null;
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
            const tempDirName = `${zipFileName.replace('.zip', '')}_${Date.now()}`;
            tempDirPath = await this.zipExtractor.extract(zipFilePath, tempDirName);

            if (!tempDirPath) {
                this.notificationService.showError(`Failed to extract ZIP file: ${zipFileName}`);
                if (initialNotice) initialNotice.hide();
                return;
            }

            const entries = await fsPromises.readdir(tempDirPath, { withFileTypes: true });
            const meetingFolders = entries.filter(entry => entry.isDirectory());

            if (meetingFolders.length === 0) {
                this.notificationService.showError(`No meeting folders found in ZIP: ${zipFileName}`);
                if (initialNotice) initialNotice.hide();
                await this.zipExtractor.cleanup(tempDirPath);
                return;
            }

            let importedCount = 0;
            let errorCount = 0;

            for (const meetingFolderDirent of meetingFolders) {
                const meetingFolderName = meetingFolderDirent.name;
                const meetingFolderPath = normalizePath(path.join(tempDirPath, meetingFolderName));
                new Notice(`Processing meeting: ${meetingFolderName}...`);

                const notesTxtFilename = "meeting_notes.txt";
                const transcriptTxtFilename = "transcript.txt";
                const recordingOriginalFilename = "recording.mp3"; // Это имя файла по умолчанию из Krisp

                const notesFilePath = normalizePath(path.join(meetingFolderPath, notesTxtFilename));
                const transcriptFilePath = normalizePath(path.join(meetingFolderPath, transcriptTxtFilename));

                // Ищем аудиофайл более гибко (mp3, m4a и т.д.)
                const meetingFiles = await fsPromises.readdir(meetingFolderPath);
                const audioFileDirent = meetingFiles.find(f => f.toLowerCase().startsWith('recording.') && (f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.m4a')));
                const actualRecordingOriginalFilename = audioFileDirent || recordingOriginalFilename; // Используем найденное или дефолтное
                const audioFileOriginalPath = normalizePath(path.join(meetingFolderPath, actualRecordingOriginalFilename));

                let notesContent = '';
                let transcriptContent = '';

                try {
                    notesContent = await fsPromises.readFile(notesFilePath, 'utf-8');
                } catch (e) {
                    this.notificationService.showError(`Failed to read ${notesTxtFilename} from ${meetingFolderName} in ${zipFileName}`);
                    const alternativeNotesFile = meetingFiles.find(f => f.toLowerCase().includes('notes') && f.toLowerCase().endsWith('.txt') && f !== notesTxtFilename);
                    if (alternativeNotesFile) {
                        this.notificationService.showInfo(`Attempting to use alternative notes file: ${alternativeNotesFile}`);
                        try {
                            notesContent = await fsPromises.readFile(path.join(meetingFolderPath, alternativeNotesFile), 'utf-8');
                        } catch (e2) {
                            this.notificationService.showError(`Failed to read alternative notes file ${alternativeNotesFile} for ${meetingFolderName}.`);
                            errorCount++;
                            continue; // Пропускаем эту папку встречи
                        }
                    } else {
                        errorCount++;
                        continue; // Пропускаем эту папку встречи
                    }
                }

                try {
                    transcriptContent = await fsPromises.readFile(transcriptFilePath, 'utf-8');
                } catch (e) {
                    this.notificationService.showWarning(`Failed to read ${transcriptTxtFilename} for ${meetingFolderName} in ${zipFileName}. Transcript might be missing.`);
                    // Не ошибка, если транскрипта нет
                }

                const parsedData = this.noteParser.parseMeetingNotes(notesContent, transcriptContent, meetingFolderName);

                // ОТЛАДКА: Логируем извлеченные данные
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

                const creationResult = await this.noteCreator.createNote(parsedData, audioFileOriginalPath);

                if (!creationResult.notePath) {
                    this.notificationService.showError(`Failed to create note for ${meetingFolderName}`);
                    errorCount++;
                    continue; // Пропускаем эту папку встречи
                }

                console.log(`[DEBUG] Note created at: ${creationResult.notePath}, audio dest: ${creationResult.audioDestPath}`);

                try {
                    await fsPromises.access(audioFileOriginalPath); // Проверяем существование файла
                    console.log(`[DEBUG] Audio file found: ${audioFileOriginalPath}`);
                    const audioData = await fsPromises.readFile(audioFileOriginalPath);
                    console.log(`[DEBUG] Audio file read, size: ${audioData.length} bytes`);
                    if (creationResult.audioDestPath) {
                        const existingAudioFile = this.app.vault.getAbstractFileByPath(creationResult.audioDestPath);
                        if (existingAudioFile && existingAudioFile instanceof TFile) {
                            // TODO: Добавить обработку дубликатов аудиофайлов согласно настройкам (если нужно)
                            this.notificationService.showInfo(`Overwriting existing audio file: ${creationResult.audioDestPath}`);
                            await this.app.vault.modifyBinary(existingAudioFile, audioData);
                        } else {
                            await this.app.vault.createBinary(creationResult.audioDestPath, audioData);
                        }
                        console.log(`[DEBUG] Audio file saved to: ${creationResult.audioDestPath}`);
                        this.notificationService.showInfo(`Audio file for ${meetingFolderName} saved: ${creationResult.audioDestPath}`);
                    }
                } catch (audioError) {
                    // Файл не найден или ошибка чтения
                    console.log(`[DEBUG] Audio file error:`, audioError);
                    this.notificationService.showWarning(`Audio file ${actualRecordingOriginalFilename} not found in ${meetingFolderPath}. Skipped audio.`);
                }
                this.notificationService.showSuccess(`Successfully imported meeting ${meetingFolderName} to ${creationResult.notePath}`);
                importedCount++;
            } // Конец цикла по папкам встреч

            if (initialNotice) initialNotice.hide();

            // Обновляем статус после завершения
            if (this.statusBarService) {
                if (errorCount === 0 && importedCount > 0) {
                    this.statusBarService.showTemporaryMessage(`Импортировано: ${importedCount}`, 3000);
                } else if (errorCount > 0) {
                    this.statusBarService.setError(`Ошибок: ${errorCount}`);
                }
            }

            this.notificationService.showBatchImportResult(importedCount, errorCount, 0, zipFileName);

            // Проверяем настройку удаления ZIP-файла
            console.log(`[DEBUG] deleteZipAfterImport setting: ${settings.deleteZipAfterImport}`);
            console.log(`[DEBUG] errorCount: ${errorCount}, importedCount: ${importedCount}`);

            if (settings.deleteZipAfterImport && errorCount === 0 && importedCount > 0) { // Удаляем ZIP только если все успешно
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
                console.log(`[DEBUG] ZIP file not deleted due to errors or no imports. errorCount: ${errorCount}, importedCount: ${importedCount}`);
            } else {
                console.log(`[DEBUG] ZIP file deletion disabled in settings`);
            }

            // Опционально открываем последнюю созданную заметку (если импортирована одна)
            // Это поведение может потребовать доработки, если импортируется много заметок.
            // Пока что, если openNoteAfterImport=true, и была импортирована ровно одна заметка, откроем её.
            // TODO: Уточнить поведение для множественного импорта.

        } catch (error) {
            if (initialNotice) initialNotice.hide(); // Просто скрываем, если существует

            // Обновляем статус при ошибке, если statusBarService доступен
            if (this.statusBarService) {
                this.statusBarService.setError(`Ошибка обработки ${zipFileName}`);
            }

            console.error(`[Krisp Importer] Error processing ZIP file ${zipFileName}:`, error);
            this.notificationService.showError(`An unexpected error occurred while processing ${zipFileName}: ${error.message}`);
        } finally {
            if (initialNotice) { // Дополнительно проверяем и скрываем в finally, если еще не скрыто
                initialNotice.hide();
            }
            if (tempDirPath) {
                await this.zipExtractor.cleanup(tempDirPath);
            }
            // Удаляем логику восстановления статуса из ProcessingService.
            // Вызывающий код (FileWatcherService, main.ts) теперь отвечает за это.
        }
    }
}
