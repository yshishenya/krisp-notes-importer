import { normalizePath } from 'obsidian';
import { promises as fsPromises, createReadStream } from 'fs';
import { createInterface } from 'readline';
import * as path from 'path';
import {
    IMeetingParsingService,
    INoteParser,
    IErrorHandlingService,
    MeetingFolder,
    ParsingResult,
    StreamingOptions
} from './serviceInterfaces';
import { ParsedKrispData } from '../interfaces';
import { KRISP_FILE_NAMES, PERFORMANCE_LIMITS } from './constants';
import {
    isValidMeetingNotesContent,
    isValidTranscriptContent
} from './typeGuards';

/**
 * Сервис для парсинга данных встреч с оптимизацией для больших файлов
 *
 * Ответственности:
 * - Парсинг meeting_notes.txt и transcript.txt
 * - Стриминг больших транскриптов (>100MB)
 * - Валидация парсенных данных
 * - Координация парсинга множественных встреч
 * - Оптимизированная обработка памяти
 */
export class MeetingParsingService implements IMeetingParsingService {
    // Лимит размера файла для загрузки в память (100MB)
    private readonly LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

    constructor(
        private noteParser: INoteParser,
        private errorHandlingService: IErrorHandlingService
    ) {}

    /**
     * Парсит все встречи из списка папок
     */
    async parseAllMeetings(meetingFolders: MeetingFolder[], tempDirPath: string): Promise<ParsingResult[]> {
        const results: ParsingResult[] = [];

        for (let i = 0; i < meetingFolders.length; i++) {
            const meetingFolder = meetingFolders[i];

            try {
                const result = await this.parseSingleMeeting(meetingFolder, tempDirPath);
                results.push(result);
            } catch (error) {
                this.errorHandlingService.handleParsingError(error, meetingFolder.name);
                // Продолжаем обработку других встреч
            }
        }

        return results;
    }

    /**
     * Парсит одну встречу с оптимизацией для больших файлов
     */
    async parseSingleMeeting(meetingFolder: MeetingFolder, tempDirPath: string): Promise<ParsingResult> {
        const meetingFolderPath = meetingFolder.path;
        const meetingFolderName = meetingFolder.name;

        try {
            // Читаем meeting_notes.txt
            const notesContent = await this.readMeetingNotesFile(meetingFolderPath);

            // Читаем transcript.txt с оптимизацией для больших файлов
            const transcriptContent = await this.readTranscriptFile(meetingFolderPath);

            // Парсим данные
            const parsedData = this.noteParser.parseMeetingNotes(notesContent, transcriptContent, meetingFolderName);

            // Валидируем парсенные данные
            if (!this.validateParsedData(parsedData)) {
                throw new Error(`Invalid parsed data for meeting: ${meetingFolderName}`);
            }

            // Находим аудиофайл
            const audioFilePath = await this.findAudioFile(meetingFolderPath, meetingFolder.files);

            return {
                parsedData,
                audioFilePath,
                meetingFolderName
            };
        } catch (error) {
            this.errorHandlingService.handleParsingError(error, meetingFolderName);
            throw error;
        }
    }

    /**
     * Читает файл meeting_notes.txt с валидацией
     */
    private async readMeetingNotesFile(meetingFolderPath: string): Promise<string> {
        const notesFilePath = normalizePath(path.join(meetingFolderPath, KRISP_FILE_NAMES.MEETING_NOTES));

        try {
            const rawContent = await fsPromises.readFile(notesFilePath, 'utf-8');

            // Валидируем содержимое
            if (!isValidMeetingNotesContent(rawContent)) {
                console.warn(`[MeetingParsingService] Invalid meeting notes format in ${meetingFolderPath}`);
                // Возвращаем содержимое даже если оно не валидно - NoteParser справится
            }

            return rawContent;
        } catch (error) {
            throw new Error(`Failed to read meeting_notes.txt: ${error.message}`);
        }
    }

    /**
     * Читает файл transcript.txt с оптимизацией для больших файлов
     */
    private async readTranscriptFile(meetingFolderPath: string): Promise<string> {
        const transcriptFilePath = normalizePath(path.join(meetingFolderPath, KRISP_FILE_NAMES.TRANSCRIPT));

        try {
            // Проверяем размер файла
            const stats = await fsPromises.stat(transcriptFilePath);

            if (stats.size > this.LARGE_FILE_THRESHOLD) {
                console.log(`[MeetingParsingService] Large transcript detected (${Math.round(stats.size / 1024 / 1024)}MB), using streaming`);
                return await this.readLargeTranscriptFile(transcriptFilePath);
            } else {
                // Обычное чтение для небольших файлов
                const rawContent = await fsPromises.readFile(transcriptFilePath, 'utf-8');

                // Валидируем содержимое
                if (!isValidTranscriptContent(rawContent)) {
                    console.warn(`[MeetingParsingService] Invalid transcript format in ${meetingFolderPath}`);
                }

                return rawContent;
            }
        } catch (error) {
            // Транскрипт может отсутствовать - это не критично
            if (error.code === 'ENOENT') {
                console.warn(`[MeetingParsingService] Transcript file not found: ${transcriptFilePath}`);
                return '';
            }
            throw new Error(`Failed to read transcript.txt: ${error.message}`);
        }
    }

    /**
     * Читает большой файл транскрипта частями для экономии памяти
     */
    private async readLargeTranscriptFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: string[] = [];
            let totalSize = 0;
            const maxMemoryUsage = PERFORMANCE_LIMITS.MAX_TRANSCRIPT_MEMORY_MB * 1024 * 1024;

            const fileStream = createReadStream(filePath, { encoding: 'utf8' });
            const rl = createInterface({
                input: fileStream,
                crlfDelay: Infinity // Обрабатываем \r\n как один разрыв строки
            });

            rl.on('line', (line) => {
                // Проверяем лимит памяти
                const lineSize = Buffer.byteLength(line, 'utf8');
                if (totalSize + lineSize > maxMemoryUsage) {
                    console.warn(`[MeetingParsingService] Transcript file too large, truncating at ${Math.round(totalSize / 1024 / 1024)}MB`);
                    rl.close();
                    return;
                }

                chunks.push(line);
                totalSize += lineSize;
            });

            rl.on('close', () => {
                const content = chunks.join('\n');

                // Валидируем содержимое
                if (!isValidTranscriptContent(content)) {
                    console.warn(`[MeetingParsingService] Large transcript has invalid format`);
                }

                resolve(content);
            });

            rl.on('error', (error) => {
                reject(new Error(`Failed to stream large transcript: ${error.message}`));
            });

            fileStream.on('error', (error) => {
                reject(new Error(`Failed to read large transcript file: ${error.message}`));
            });
        });
    }

    /**
     * Находит аудиофайл в папке встречи
     */
    private async findAudioFile(meetingFolderPath: string, files: string[]): Promise<string> {
        // Ищем аудиофайл по паттерну
        const audioFile = files.find(file => KRISP_FILE_NAMES.AUDIO_PATTERN.test(file));

        if (audioFile) {
            return normalizePath(path.join(meetingFolderPath, audioFile));
        }

        // Если не найден, возвращаем путь к дефолтному файлу
        return normalizePath(path.join(meetingFolderPath, KRISP_FILE_NAMES.AUDIO_DEFAULT));
    }

    /**
     * Валидирует парсенные данные встречи
     */
    validateParsedData(parsedData: ParsedKrispData): boolean {
        // Проверяем обязательные поля
        if (!parsedData.meetingTitle || typeof parsedData.meetingTitle !== 'string') {
            return false;
        }

        // Проверяем что есть хотя бы что-то содержательное
        const hasContent =
            (parsedData.summary && parsedData.summary.length > 0) ||
            (parsedData.actionItems && parsedData.actionItems.length > 0) ||
            (parsedData.keyPoints && parsedData.keyPoints.length > 0) ||
            (parsedData.formattedTranscript && parsedData.formattedTranscript.length > 0);

        if (!hasContent) {
            console.warn(`[MeetingParsingService] Parsed data has no meaningful content for: ${parsedData.meetingTitle}`);
            // Не блокируем, но предупреждаем
        }

        return true;
    }

    /**
     * Получает размер файла безопасно
     */
    async getFileSize(filePath: string): Promise<number> {
        try {
            const stats = await fsPromises.stat(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    /**
     * Проверяет нужно ли использовать стриминг для файла
     */
    async shouldUseStreaming(filePath: string): Promise<boolean> {
        const size = await this.getFileSize(filePath);
        return size > this.LARGE_FILE_THRESHOLD;
    }

    /**
     * Получает статистику по файлам встречи
     */
    async getMeetingFilesStats(meetingFolder: MeetingFolder): Promise<{
        notesSize: number;
        transcriptSize: number;
        audioSize: number;
        totalSize: number;
        needsStreaming: boolean;
    }> {
        const folderPath = meetingFolder.path;

        const notesPath = path.join(folderPath, KRISP_FILE_NAMES.MEETING_NOTES);
        const transcriptPath = path.join(folderPath, KRISP_FILE_NAMES.TRANSCRIPT);

        const notesSize = await this.getFileSize(notesPath);
        const transcriptSize = await this.getFileSize(transcriptPath);

        // Ищем аудиофайл
        const audioFile = meetingFolder.files.find(file => KRISP_FILE_NAMES.AUDIO_PATTERN.test(file));
        const audioSize = audioFile ? await this.getFileSize(path.join(folderPath, audioFile)) : 0;

        const totalSize = notesSize + transcriptSize + audioSize;
        const needsStreaming = transcriptSize > this.LARGE_FILE_THRESHOLD;

        return {
            notesSize,
            transcriptSize,
            audioSize,
            totalSize,
            needsStreaming
        };
    }
}

// Дополнительные константы для оптимизации больших файлов
const LARGE_FILE_CONSTANTS = {
    MAX_TRANSCRIPT_MEMORY_MB: 50, // Максимум 50MB в памяти для транскрипта
    CHUNK_SIZE: 64 * 1024, // 64KB чанки для чтения
    STREAMING_BUFFER_SIZE: 1024 * 1024 // 1MB буфер для стриминга
} as const;

// Добавляем константы в основной файл констант
declare module './constants' {
    interface PerformanceLimits {
        MAX_TRANSCRIPT_MEMORY_MB: number;
        LARGE_FILE_CHUNK_SIZE: number;
        STREAMING_BUFFER_SIZE: number;
    }
}
