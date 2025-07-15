import { normalizePath } from 'obsidian';
import { promises as fsPromises, Dirent } from 'fs';
import * as path from 'path';
import {
    IMeetingExtractionService,
    IZipExtractor,
    IErrorHandlingService,
    ExtractionResult,
    MeetingFolder
} from './serviceInterfaces';
import { KRISP_FILE_NAMES } from './constants';
import { isValidZipFile, isValidFilePath } from './typeGuards';

/**
 * Сервис для извлечения ZIP файлов и поиска папок встреч
 *
 * Ответственности:
 * - Извлечение ZIP архивов Krisp
 * - Поиск и валидация папок встреч
 * - Обнаружение аудиофайлов
 * - Валидация структуры директорий
 */
export class MeetingExtractionService implements IMeetingExtractionService {
    constructor(
        private zipExtractor: IZipExtractor,
        private errorHandlingService: IErrorHandlingService
    ) {}

    /**
     * Извлекает ZIP файл и ищет папки встреч
     */
    async extractZipFile(zipFilePath: string): Promise<ExtractionResult> {
        // Валидация входных данных
        if (!isValidFilePath(zipFilePath)) {
            throw new Error(`Invalid ZIP file path: ${zipFilePath}`);
        }

        if (!isValidZipFile(zipFilePath)) {
            throw new Error(`File is not a valid ZIP archive: ${zipFilePath}`);
        }

        try {
            // Извлекаем ZIP файл
            const zipFileName = path.basename(zipFilePath).replace('.zip', '');
            const tempDirName = `${zipFileName}_${Date.now()}`;
            const tempDirPath = await this.zipExtractor.extract(zipFilePath, tempDirName);

            if (!tempDirPath) {
                throw new Error(`Failed to extract ZIP file: ${zipFilePath}`);
            }

            // Ищем папки встреч
            const meetingFolders = await this.discoverMeetingFolders(tempDirPath);

            return {
                tempDirPath,
                meetingFolders
            };
        } catch (error) {
            this.errorHandlingService.handleExtractionError(error, `ZIP extraction: ${zipFilePath}`);
            throw error;
        }
    }

    /**
     * Обнаруживает папки встреч в извлеченной директории
     */
    async discoverMeetingFolders(tempDirPath: string): Promise<MeetingFolder[]> {
        try {
            const entries = await fsPromises.readdir(tempDirPath, { withFileTypes: true });
            const meetingFolders: MeetingFolder[] = [];

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const folderPath = normalizePath(path.join(tempDirPath, entry.name));

                    try {
                        const isValid = await this.validateMeetingFolder(folderPath);
                        if (isValid) {
                            const files = await fsPromises.readdir(folderPath);
                            meetingFolders.push({
                                name: entry.name,
                                path: folderPath,
                                files: files
                            });
                        }
                    } catch (folderError) {
                        console.warn(`[MeetingExtractionService] Skipping invalid meeting folder ${entry.name}:`, folderError);
                        // Продолжаем обработку других папок
                    }
                }
            }

            if (meetingFolders.length === 0) {
                throw new Error('No valid meeting folders found in ZIP archive');
            }

            return meetingFolders;
        } catch (error) {
            this.errorHandlingService.handleExtractionError(error, `Meeting folder discovery: ${tempDirPath}`);
            throw error;
        }
    }

    /**
     * Валидирует папку встречи на наличие обязательных файлов
     */
    async validateMeetingFolder(folderPath: string): Promise<boolean> {
        try {
            const files = await fsPromises.readdir(folderPath);

            // Проверяем наличие обязательного файла meeting_notes.txt
            const hasNotesFile = files.includes(KRISP_FILE_NAMES.MEETING_NOTES);
            if (!hasNotesFile) {
                return false;
            }

            // Проверяем что meeting_notes.txt не пустой
            const notesPath = path.join(folderPath, KRISP_FILE_NAMES.MEETING_NOTES);
            const notesStats = await fsPromises.stat(notesPath);
            if (notesStats.size === 0) {
                return false;
            }

            // Проверяем наличие хотя бы одного аудиофайла (не обязательный, но желательный)
            const audioFiles = await this.findAudioFiles(folderPath);

            // Папка считается валидной, если есть meeting_notes.txt (с содержимым)
            // Аудиофайлы и транскрипт опциональны
            return true;
        } catch (error) {
            console.warn(`[MeetingExtractionService] Error validating folder ${folderPath}:`, error);
            return false;
        }
    }

    /**
     * Находит аудиофайлы в папке встречи
     */
    async findAudioFiles(folderPath: string): Promise<string[]> {
        try {
            const files = await fsPromises.readdir(folderPath);
            return files.filter(file => KRISP_FILE_NAMES.AUDIO_PATTERN.test(file));
        } catch (error) {
            console.warn(`[MeetingExtractionService] Error finding audio files in ${folderPath}:`, error);
            return [];
        }
    }

    /**
     * Получает размер извлеченной директории для мониторинга
     */
    async getDirectorySize(dirPath: string): Promise<number> {
        try {
            let totalSize = 0;
            const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    totalSize += await this.getDirectorySize(fullPath);
                } else {
                    const stats = await fsPromises.stat(fullPath);
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            console.warn(`[MeetingExtractionService] Error calculating directory size for ${dirPath}:`, error);
            return 0;
        }
    }

    /**
     * Проверяет доступность файла для чтения
     */
    async isFileReadable(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath, fsPromises.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Получает метаданные файла безопасно
     */
    async getFileMetadata(filePath: string): Promise<{ size: number; modified: Date } | null> {
        try {
            const stats = await fsPromises.stat(filePath);
            return {
                size: stats.size,
                modified: stats.mtime
            };
        } catch (error) {
            console.warn(`[MeetingExtractionService] Error getting metadata for ${filePath}:`, error);
            return null;
        }
    }
}
