import { Notice } from 'obsidian';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    category: string;
    message: string;
    details?: any;
}

export class LoggingService {
    private logs: LogEntry[] = [];
    private maxLogEntries: number = 1000;
    private currentLogLevel: LogLevel = LogLevel.INFO;

    constructor(logLevel: LogLevel = LogLevel.INFO) {
        this.currentLogLevel = logLevel;
        this.log(LogLevel.INFO, 'System', 'LoggingService initialized');
    }

    /**
     * Основной метод логирования
     */
    private log(level: LogLevel, category: string, message: string, details?: any): void {
        if (level < this.currentLogLevel) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            category,
            message,
            details
        };

        this.logs.push(entry);

        // Ограничиваем количество записей в памяти
        if (this.logs.length > this.maxLogEntries) {
            this.logs = this.logs.slice(-this.maxLogEntries);
        }

        // Выводим в консоль для разработки
        const levelName = LogLevel[level];
        const timestamp = entry.timestamp.toISOString();
        const logMessage = `[${timestamp}] [${levelName}] [${category}] ${message}`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(logMessage, details);
                break;
            case LogLevel.INFO:
                console.info(logMessage, details);
                break;
            case LogLevel.WARN:
                console.warn(logMessage, details);
                break;
            case LogLevel.ERROR:
                console.error(logMessage, details);
                break;
        }
    }

    /**
     * Логирование отладочной информации
     */
    debug(category: string, message: string, details?: any): void {
        this.log(LogLevel.DEBUG, category, message, details);
    }

    /**
     * Логирование информационных сообщений
     */
    info(category: string, message: string, details?: any): void {
        this.log(LogLevel.INFO, category, message, details);
    }

    /**
     * Логирование предупреждений
     */
    warn(category: string, message: string, details?: any): void {
        this.log(LogLevel.WARN, category, message, details);
    }

    /**
     * Логирование ошибок
     */
    error(category: string, message: string, details?: any): void {
        this.log(LogLevel.ERROR, category, message, details);
    }

    /**
     * Специализированные методы для основных операций плагина
     */

    logZipProcessingStart(zipPath: string): void {
        this.info('Processing', `Начинаю обработку ZIP-файла: ${zipPath}`);
    }

    logZipProcessingSuccess(zipPath: string, noteName: string): void {
        this.info('Processing', `Успешно обработан ZIP-файл: ${zipPath}`, { noteName });
    }

    logZipProcessingError(zipPath: string, error: Error): void {
        this.error('Processing', `Ошибка обработки ZIP-файла: ${zipPath}`, {
            error: error.message,
            stack: error.stack
        });
    }

    logFileWatcherStart(folderPath: string): void {
        this.info('FileWatcher', `Запущено отслеживание папки: ${folderPath}`);
    }

    logFileWatcherStop(): void {
        this.info('FileWatcher', 'Отслеживание папки остановлено');
    }

    logFileWatcherError(error: Error): void {
        this.error('FileWatcher', 'Ошибка в FileWatcher', {
            error: error.message,
            stack: error.stack
        });
    }

    logDuplicateHandling(strategy: string, fileName: string, action: string): void {
        this.info('Duplicates', `Обработка дубликата: ${fileName}`, { strategy, action });
    }

    logSettingsChange(settingKey: string, oldValue: any, newValue: any): void {
        this.info('Settings', `Изменена настройка: ${settingKey}`, { oldValue, newValue });
    }

    logNoteCreation(notePath: string, templateUsed: string): void {
        this.info('NoteCreator', `Создана заметка: ${notePath}`, { templateUsed });
    }

    logAudioFileCopy(sourcePath: string, targetPath: string): void {
        this.info('AudioCopy', `Скопирован аудиофайл: ${sourcePath} -> ${targetPath}`);
    }

    /**
     * Получить все логи
     */
    getAllLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Получить логи по уровню
     */
    getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level >= level);
    }

    /**
     * Получить логи по категории
     */
    getLogsByCategory(category: string): LogEntry[] {
        return this.logs.filter(log => log.category === category);
    }

    /**
     * Получить последние N записей
     */
    getRecentLogs(count: number = 50): LogEntry[] {
        return this.logs.slice(-count);
    }

    /**
     * Экспорт логов в текстовый формат
     */
    exportLogsAsText(): string {
        const lines = this.logs.map(entry => {
            const timestamp = entry.timestamp.toISOString();
            const level = LogLevel[entry.level].padEnd(5);
            const category = entry.category.padEnd(12);
            let line = `[${timestamp}] [${level}] [${category}] ${entry.message}`;

            if (entry.details) {
                line += `\n    Details: ${JSON.stringify(entry.details, null, 2)}`;
            }

            return line;
        });

        return lines.join('\n');
    }

    /**
     * Экспорт логов в JSON формат
     */
    exportLogsAsJSON(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Очистить все логи
     */
    clearLogs(): void {
        const oldCount = this.logs.length;
        this.logs = [];
        this.info('System', `Очищены логи (было записей: ${oldCount})`);
    }

    /**
     * Установить уровень логирования
     */
    setLogLevel(level: LogLevel): void {
        const oldLevel = this.currentLogLevel;
        this.currentLogLevel = level;
        this.info('System', `Изменен уровень логирования: ${LogLevel[oldLevel]} -> ${LogLevel[level]}`);
    }

    /**
     * Получить статистику логов
     */
    getLogStats(): { total: number; byLevel: Record<string, number>; byCategory: Record<string, number> } {
        const byLevel: Record<string, number> = {};
        const byCategory: Record<string, number> = {};

        this.logs.forEach(log => {
            const levelName = LogLevel[log.level];
            byLevel[levelName] = (byLevel[levelName] || 0) + 1;
            byCategory[log.category] = (byCategory[log.category] || 0) + 1;
        });

        return {
            total: this.logs.length,
            byLevel,
            byCategory
        };
    }

    /**
     * Копировать логи в буфер обмена (для UI)
     */
    async copyLogsToClipboard(): Promise<void> {
        try {
            const logsText = this.exportLogsAsText();
            await navigator.clipboard.writeText(logsText);
            new Notice('📋 Logs copied to clipboard', 3000);
            this.info('System', 'Логи скопированы в буфер обмена');
        } catch (error) {
            this.error('System', 'Ошибка копирования логов в буфер обмена', error);
            new Notice('❌ Error copying logs', 5000);
        }
    }
}
