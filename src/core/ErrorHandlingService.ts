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
     * Handles errors during ZIP file extraction.
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
     * Handles parsing errors for meetings.
     */
    handleParsingError(error: any, meetingName: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('parsing', errorMessage);

        this.logError('Parsing', `Failed to parse meeting: ${meetingName}`, error);
        this.notificationService.showWarning(`${userMessage} (встреча: ${meetingName})`);

        // Для ошибок парсинга не обновляем status bar - это recoverable ошибка
    }

    /**
     * Handles import errors by logging and displaying a user-friendly message.
     */
    handleImportError(error: any, meetingName: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = this.getUserFriendlyMessage('import', errorMessage);

        this.logError('Import', `Failed to import meeting: ${meetingName}`, error);
        this.notificationService.showError(`${userMessage} (встреча: ${meetingName})`);

        // Для ошибок импорта не обновляем status bar глобально
    }

    /**
     * Handles critical system errors by logging, displaying a user-friendly message, and updating the status bar.
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
     * Обрабатывает ошибки файловых операций и отображает соответствующее сообщение пользователю.
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
     * Handles data validation errors by logging and displaying a user-friendly message.
     */
    handleValidationError(error: any, dataType: string, context?: string): void {
        const errorMessage = this.extractErrorMessage(error);
        const userMessage = `Некорректные данные (${dataType}): ${errorMessage}`;

        this.logError('Validation', `Data validation failed for ${dataType}${context ? ` in ${context}` : ''}`, error);
        this.notificationService.showWarning(userMessage);
    }

    /**
     * Handles network errors and external resource failures by logging and displaying user-friendly messages.
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
     * Logs an error with detailed information, using a logging service if available.
     *
     * This function constructs an error details object containing the error message,
     * stack trace, type, and timestamp. It attempts to log the error through a
     * LoggingService if one is provided; otherwise, it falls back to logging to the console.
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

    /**
     * Extracts an error message from various error formats.
     *
     * This function attempts to extract a meaningful error message from different types of error objects.
     * It first checks if the error is a string, then looks for a `message` property, and finally tries
     * to call the `toString` method if available. If none of these methods are successful, it returns
     * a default message indicating an unknown error occurred.
     */
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

    /**
     * Returns a user-friendly error message based on the error type and original message.
     */
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

    /**
     * Determines if a given error is a "file not found" error.
     *
     * This function checks if the provided error object has a `code` property equal to 'ENOENT'
     * or if its `message` contains the substrings 'no such file' or 'not found'. These checks are
     * commonly used to identify file not found errors in various environments and libraries.
     *
     * @param error - The error object to be checked.
     */
    private isFileNotFoundError(error: any): boolean {
        return error?.code === 'ENOENT' ||
               error?.message?.includes('no such file') ||
               error?.message?.includes('not found');
    }

    /**
     * Determines if a given error is a permission-related error.
     *
     * This function checks if the provided error has a code of 'EACCES' or 'EPERM',
     * or if its message includes the phrase "permission denied". If any of these conditions
     * are met, it returns true, indicating that the error is related to permissions.
     *
     * @param error - The error object to check for permission-related errors.
     */
    private isPermissionError(error: any): boolean {
        return error?.code === 'EACCES' ||
               error?.code === 'EPERM' ||
               error?.message?.includes('permission denied');
    }

    /**
     * Determines if a given error is related to disk space issues.
     *
     * This function checks if the provided error object has a code of 'ENOSPC' or if its message contains
     * the phrase "no space left". It returns true if either condition is met, indicating a disk space error.
     *
     * @param error - The error object to be checked for disk space related errors.
     */
    private isDiskSpaceError(error: any): boolean {
        return error?.code === 'ENOSPC' ||
               error?.message?.includes('no space left');
    }

    /**
     * Determines if a given error is a timeout error.
     *
     * This function checks if the provided error object has a code of 'ETIMEDOUT'
     * or if its message includes the substrings 'timeout' or 'timed out'.
     *
     * @param error - The error object to be checked.
     * @returns A boolean indicating whether the error is a timeout error.
     */
    private isTimeoutError(error: any): boolean {
        return error?.code === 'ETIMEDOUT' ||
               error?.message?.includes('timeout') ||
               error?.message?.includes('timed out');
    }

    /**
     * Extracts the file name from a given file path.
     */
    private getFileName(filePath: string): string {
        return filePath.split(/[/\\]/).pop() || filePath;
    }

    /**
     * Determines if an error is recoverable, allowing the system to continue operation.
     *
     * This function checks various conditions to determine if the error can be handled and ignored,
     * or if it requires immediate attention. It evaluates file not found errors, permission issues,
     * parsing errors, timeout errors, and disk space errors specifically.
     *
     * @param error - The error object to evaluate for recoverability.
     * @returns A boolean indicating whether the error is recoverable (true) or not (false).
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
