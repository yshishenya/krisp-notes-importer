import {
    IErrorHandlingService,
    INotificationService,
    ILoggingService,
    IStatusBarService
} from './serviceInterfaces';

export interface ErrorContext {
    operation: string;
    fileName?: string;
    meetingName?: string;
    stage?: string;
    additionalInfo?: any;
}

/**
 * Централизованный сервис для обработки ошибок в плагине Krisp Notes Importer
 *
 * Ответственности:
 * - Классификация ошибок по типам и важности
 * - Логирование ошибок с контекстом
 * - Отображение пользовательских уведомлений
 * - Обновление статуса в status bar
 * - Graceful degradation для recoverable ошибок
 */
export class ErrorHandlingService implements IErrorHandlingService {
    constructor(
        private notificationService: INotificationService,
        private loggingService?: ILoggingService,
        private statusBarService?: IStatusBarService
    ) {}

    /**
     * Обрабатывает ошибки извлечения ZIP файлов
     */
    handleExtractionError(error: any, context: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('extraction', errorMessage);

        this.logError('Extraction', `ZIP extraction failed: ${context}`, error);
        this.notificationService.showError(userMessage);

        if (this.statusBarService) {
            this.statusBarService.setError('Ошибка извлечения ZIP');
        }
    }

    /**
     * Обрабатывает ошибки парсинга встреч
     */
    handleParsingError(error: any, meetingName: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('parsing', errorMessage);

        this.logError('Parsing', `Failed to parse meeting: ${meetingName}`, error);
        this.notificationService.showWarning(`${userMessage} (встреча: ${meetingName})`);

        // Для ошибок парсинга не обновляем status bar - это recoverable ошибка
    }

    /**
     * Обрабатывает ошибки импорта заметок
     */
    handleImportError(error: any, meetingName: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('import', errorMessage);

        this.logError('Import', `Failed to import meeting: ${meetingName}`, error);
        this.notificationService.showError(`${userMessage} (встреча: ${meetingName})`);

        // Для ошибок импорта не обновляем status bar глобально
    }

    /**
     * Обрабатывает критические системные ошибки
     */
    handleCriticalError(error: any, context: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('critical', errorMessage);

        this.logError('Critical', `Critical system error: ${context}`, error);
        this.notificationService.showError(`Критическая ошибка: ${userMessage}`);

        if (this.statusBarService) {
            this.statusBarService.setError('Критическая ошибка системы');
        }
    }

    /**
     * Обрабатывает ошибки файловых операций
     */
    handleFileSystemError(error: any, operation: string, filePath: string): void {
        const errorMessage = this.extractErrorMessage(error);
        let userMessage = '';

        if (this.isFileNotFoundError(error)) {
            userMessage = `Файл не найден: ${this.getFileName(filePath)}`;
        } else if (this.isPermissionError(error)) {
            userMessage = `Нет доступа к файлу: ${this.getFileName(filePath)}`;
        } else if (this.isDiskSpaceError(error)) {
            userMessage = 'Недостаточно места на диске';
        } else {
            userMessage = `Ошибка файловой операции: ${errorMessage}`;
        }

        this.logError('FileSystem', `${operation} failed for ${filePath}`, error);
        this.notificationService.showError(userMessage);
    }

    /**
     * Обрабатывает ошибки валидации данных
     */
    handleValidationError(error: any, dataType: string, context?: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = `Некорректные данные (${dataType}): ${errorMessage}`;

        this.logError('Validation', `Data validation failed for ${dataType}${context ? ` in ${context}` : ''}`, error);
        this.notificationService.showWarning(userMessage);
    }

    /**
     * Обрабатывает ошибки сети и внешних ресурсов
     */
    handleNetworkError(error: any, operation: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.isTimeoutError(error)
            ? `Операция превысила время ожидания: ${operation}`
            : `Ошибка сети: ${errorMessage}`;

        this.logError('Network', `Network operation failed: ${operation}`, error);
        this.notificationService.showError(userMessage);
    }

    /**
     * Общий метод логирования ошибок
     */
    logError(category: string, message: string, error: any): void {
        const errorDetails = {
            message: this.extractErrorMessage(error),
            stack: error?.stack,
            type: error?.constructor?.name || 'UnknownError',
            timestamp: new Date().toISOString()
        };

        if (this.loggingService) {
            this.loggingService.handleError(category, message, errorDetails);
        } else {
            // Fallback к консоли, если LoggingService недоступен
            console.error(`[${category}] ${message}:`, errorDetails);
        }
    }

    // ========================================================================================
    // ПРИВАТНЫЕ МЕТОДЫ ДЛЯ АНАЛИЗА И КЛАССИФИКАЦИИ ОШИБОК
    // ========================================================================================

    private extractErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error;
        }

        if (error && typeof error.message === 'string') {
            return error.message;
        }

        if (error && typeof error.toString === 'function') {
            return error.toString();
        }

        return 'Unknown error occurred';
    }

    private getUserFriendlyMessage(errorType: string, originalMessage: string): string {
        // Словарь пользовательских сообщений для разных типов ошибок
        const friendlyMessages: Record<string, string> = {
            'extraction': 'Не удалось распаковать ZIP архив',
            'parsing': 'Ошибка обработки данных встречи',
            'import': 'Не удалось создать заметку',
            'critical': 'Произошла критическая ошибка системы'
        };

        const baseMessage = friendlyMessages[errorType] || 'Произошла ошибка';

        // Добавляем техническую информацию только для разработки
        if (process.env.NODE_ENV === 'development') {
            return `${baseMessage}: ${originalMessage}`;
        }

        return baseMessage;
    }

    private isFileNotFoundError(error: any): boolean {
        return error?.code === 'ENOENT' ||
               error?.message?.includes('no such file') ||
               error?.message?.includes('not found');
    }

    private isPermissionError(error: any): boolean {
        return error?.code === 'EACCES' ||
               error?.code === 'EPERM' ||
               error?.message?.includes('permission denied');
    }

    private isDiskSpaceError(error: any): boolean {
        return error?.code === 'ENOSPC' ||
               error?.message?.includes('no space left');
    }

    private isTimeoutError(error: any): boolean {
        return error?.code === 'ETIMEDOUT' ||
               error?.message?.includes('timeout') ||
               error?.message?.includes('timed out');
    }

    private getFileName(filePath: string): string {
        return filePath.split(/[/\\]/).pop() || filePath;
    }

    /**
     * Проверяет, является ли ошибка recoverable (система может продолжить работу)
     */
    isRecoverableError(error: any): boolean {
        // Файл не найден, проблемы с правами - recoverable
        if (this.isFileNotFoundError(error) || this.isPermissionError(error)) {
            return true;
        }

        // Ошибки парсинга часто recoverable (можно пропустить файл)
        if (error?.message?.includes('parse') || error?.message?.includes('invalid format')) {
            return true;
        }

        // Timeout'ы обычно recoverable
        if (this.isTimeoutError(error)) {
            return true;
        }

        // Недостаток места на диске - не recoverable
        if (this.isDiskSpaceError(error)) {
            return false;
        }

        // По умолчанию считаем ошибку не recoverable
        return false;
    }
}
