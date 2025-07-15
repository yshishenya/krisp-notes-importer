import { App, TFile } from 'obsidian';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import {
    IMeetingImportService,
    INoteCreator,
    INotificationService,
    IErrorHandlingService,
    ParsingResult,
    ImportResult,
    ProcessingResult
} from './serviceInterfaces';
import { KrispImporterSettings } from '../interfaces';

/**
 * Сервис для импорта заметок и post-processing действий
 *
 * Ответственности:
 * - Создание заметок из парсенных данных
 * - Координация импорта множественных встреч
 * - Post-import действия (удаление ZIP, открытие заметок)
 * - Статистика импорта
 */
export class MeetingImportService implements IMeetingImportService {
    constructor(
        private app: App,
        private noteCreator: INoteCreator,
        private notificationService: INotificationService,
        private errorHandlingService: IErrorHandlingService
    ) {}

    /**
     * Импортирует все парсенные встречи
     */
    async importParsedMeetings(parsingResults: ParsingResult[], settings: KrispImporterSettings): Promise<ProcessingResult> {
        let importedCount = 0;
        let errorCount = 0;
        let lastCreatedNote: ImportResult | null = null;

        for (let i = 0; i < parsingResults.length; i++) {
            const result = parsingResults[i];

            try {
                // Показываем прогресс для множественных встреч
                if (parsingResults.length > 1) {
                    this.notificationService.showInfo(
                        `Создаем заметку ${i + 1}/${parsingResults.length}: ${result.meetingFolderName}...`
                    );
                }

                const importResult = await this.importSingleMeeting(result, settings);

                if (importResult.notePath) {
                    importedCount++;
                    lastCreatedNote = importResult;
                } else {
                    errorCount++;
                }
            } catch (error) {
                this.errorHandlingService.handleImportError(error, result.meetingFolderName);
                errorCount++;
            }
        }

        return {
            importedCount,
            errorCount,
            lastCreatedNote
        };
    }

    /**
     * Импортирует одну встречу
     */
    async importSingleMeeting(parsingResult: ParsingResult, settings: KrispImporterSettings): Promise<ImportResult> {
        try {
            // Создаем заметку
            const result = await this.noteCreator.createNote(parsingResult.parsedData, parsingResult.audioFilePath);

            if (!result.notePath) {
                throw new Error(`Failed to create note for ${parsingResult.meetingFolderName}`);
            }

            return result;
        } catch (error) {
            this.errorHandlingService.handleImportError(error, parsingResult.meetingFolderName);
            throw error;
        }
    }

    /**
     * Выполняет post-import действия
     */
    async handlePostImportActions(
        result: ProcessingResult,
        zipFilePath: string,
        settings: KrispImporterSettings
    ): Promise<void> {
        const zipFileName = path.basename(zipFilePath);

        try {
            // Показываем результаты импорта
            this.notificationService.showBatchImportResult(
                result.importedCount,
                result.errorCount,
                0, // skipped count
                zipFileName
            );

            // Удаляем ZIP файл, если настройка включена и нет ошибок
            if (settings.deleteZipAfterImport && result.errorCount === 0 && result.importedCount > 0) {
                await this.deleteZipFile(zipFilePath, zipFileName);
            }

            // Открываем заметку, если настройка включена
            if (settings.openNoteAfterImport) {
                await this.openNoteAfterImport(result);
            }
        } catch (error) {
            this.errorHandlingService.handleCriticalError(error, `Post-import actions for ${zipFileName}`);
        }
    }

    /**
     * Удаляет ZIP файл после успешного импорта
     */
    private async deleteZipFile(zipFilePath: string, zipFileName: string): Promise<void> {
        try {
            await fsPromises.rm(zipFilePath);
            this.notificationService.showInfo(`Удален исходный ZIP файл: ${zipFileName}`);
            console.log(`[MeetingImportService] Successfully deleted ZIP file: ${zipFilePath}`);
        } catch (error) {
            console.error(`[MeetingImportService] Failed to delete ZIP file:`, error);
            this.notificationService.showError(`Не удалось удалить ZIP файл ${zipFileName}: ${error.message}`);
        }
    }

    /**
     * Открывает заметку после импорта согласно настройкам
     */
    private async openNoteAfterImport(result: ProcessingResult): Promise<void> {
        try {
            if (result.importedCount === 1 && result.lastCreatedNote?.noteFile) {
                // Для одной заметки - открываем её
                await this.app.workspace.getLeaf().openFile(result.lastCreatedNote.noteFile);
                this.notificationService.showInfo(`Заметка открыта: ${result.lastCreatedNote.notePath}`);
            } else if (result.importedCount > 1) {
                // Для множественного импорта - показываем уведомление
                this.notificationService.showInfo(
                    `Импортировано ${result.importedCount} заметок. Откройте нужную из папки заметок.`
                );
            }
        } catch (error) {
            console.warn(`[MeetingImportService] Failed to open note after import:`, error);
            this.notificationService.showWarning('Не удалось автоматически открыть заметку');
        }
    }

    /**
     * Получает статистику импорта в удобочитаемом виде
     */
    getImportSummary(result: ProcessingResult, zipFileName: string): string {
        const parts: string[] = [];

        if (result.importedCount > 0) {
            parts.push(`Импортировано: ${result.importedCount} заметок`);
        }

        if (result.errorCount > 0) {
            parts.push(`Ошибок: ${result.errorCount}`);
        }

        const summary = parts.join(', ');
        return `${zipFileName}: ${summary}`;
    }

    /**
     * Проверяет можно ли безопасно удалить ZIP файл
     */
    canSafelyDeleteZip(result: ProcessingResult, settings: KrispImporterSettings): boolean {
        return settings.deleteZipAfterImport &&
               result.errorCount === 0 &&
               result.importedCount > 0;
    }

    /**
     * Проверяет нужно ли открывать заметку после импорта
     */
    shouldOpenNoteAfterImport(result: ProcessingResult, settings: KrispImporterSettings): boolean {
        return settings.openNoteAfterImport && result.importedCount > 0;
    }

    /**
     * Создает детальный отчет о результатах импорта
     */
    createDetailedImportReport(result: ProcessingResult, zipFileName: string): {
        success: boolean;
        summary: string;
        details: {
            imported: number;
            errors: number;
            lastNotePath?: string;
            hasAudio: boolean;
        };
    } {
        const success = result.importedCount > 0 && result.errorCount === 0;

        return {
            success,
            summary: this.getImportSummary(result, zipFileName),
            details: {
                imported: result.importedCount,
                errors: result.errorCount,
                lastNotePath: result.lastCreatedNote?.notePath,
                hasAudio: !!result.lastCreatedNote?.audioDestPath
            }
        };
    }

    /**
     * Проверяет доступность файла заметки
     */
    async verifyNoteFile(notePath: string): Promise<boolean> {
        try {
            const file = this.app.vault.getAbstractFileByPath(notePath);
            return file instanceof TFile;
        } catch {
            return false;
        }
    }

    /**
     * Получает TFile объект по пути заметки
     */
    async getNoteFile(notePath: string): Promise<TFile | null> {
        try {
            const file = this.app.vault.getAbstractFileByPath(notePath);
            return file instanceof TFile ? file : null;
        } catch {
            return null;
        }
    }
}
