import { Notice } from 'obsidian';
import { NOTIFICATION_DURATIONS } from './constants';

export class NotificationService {
    private batchMode: boolean = false;
    private currentOperationId: string | null = null;
    private progressNotice: Notice | null = null;

    constructor() {}

    /**
     * Enables batch mode for mass operations.
     */
    startBatchOperation(operationId: string): void {
        this.batchMode = true;
        this.currentOperationId = operationId;
        this.hidePreviousNotices();
    }

    /**
     * Disables batch mode and resets current operation ID.
     */
    endBatchOperation(): void {
        this.batchMode = false;
        this.currentOperationId = null;
        if (this.progressNotice) {
            this.progressNotice.hide();
            this.progressNotice = null;
        }
    }

    /**
     * Shows progress for batch operations.
     */
    showBatchProgress(message: string, hideAfter: number = 0): void {
        if (this.batchMode) {
            if (this.progressNotice) {
                this.progressNotice.hide();
            }
            this.progressNotice = new Notice(message, hideAfter);
        }
    }

    /**
     * Hides previous notices by invoking their hide method and setting them to null.
     */
    private hidePreviousNotices(): void {
        if (this.progressNotice) {
            this.progressNotice.hide();
            this.progressNotice = null;
        }
    }

    /**
     * Shows a success notification (considering batch mode).
     */
    showSuccess(message: string, duration: number = NOTIFICATION_DURATIONS.SUCCESS): void {
        // В batch режиме не показываем индивидуальные success уведомления
        if (this.batchMode && this.isIndividualItemMessage(message)) {
            console.log(`[Krisp Importer] SUCCESS (batch): ${message}`);
            return;
        }

        new Notice(message, duration);
        console.log(`[Krisp Importer] SUCCESS: ${message}`);
    }

    /**
     * Displays an error notification and logs it to the console.
     */
    showError(message: string, duration: number = NOTIFICATION_DURATIONS.ERROR): void {
        new Notice(`ERROR: ${message}`, duration);
        console.error(`[Krisp Importer] ERROR: ${message}`);
    }

    /**
     * Displays a warning message with a specified duration.
     */
    showWarning(message: string, duration: number = NOTIFICATION_DURATIONS.WARNING): void {
        new Notice(`WARNING: ${message}`, duration);
        console.warn(`[Krisp Importer] WARNING: ${message}`);
    }

    /**
     * Displays an informational notification (considering batch mode).
     */
    showInfo(message: string, duration: number = NOTIFICATION_DURATIONS.INFO): void {
        // В batch режиме не показываем прогресс для отдельных элементов
        if (this.batchMode && this.isIndividualProgressMessage(message)) {
            console.log(`[Krisp Importer] INFO (batch): ${message}`);
            return;
        }

        new Notice(message, duration);
        console.log(`[Krisp Importer] INFO: ${message}`);
    }

    /**
     * Forcefully displays a notification, ignoring the batch mode.
     *
     * This function creates a new Notice based on the provided message and type,
     * with an optional duration. It logs the notification details to the console.
     *
     * @param message - The message to be displayed in the notification.
     * @param type - The type of the notification, which can be 'info', 'success', 'error', or 'warning'.
     *               Defaults to 'info' if not specified.
     * @param duration - Optional duration for the notification. If not provided, a default duration based on the type is used.
     */
    forceNotification(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration?: number): void {
        switch (type) {
            case 'success':
                new Notice(message, duration || NOTIFICATION_DURATIONS.SUCCESS);
                break;
            case 'error':
                new Notice(`ERROR: ${message}`, duration || NOTIFICATION_DURATIONS.ERROR);
                break;
            case 'warning':
                new Notice(`WARNING: ${message}`, duration || NOTIFICATION_DURATIONS.WARNING);
                break;
            default:
                new Notice(message, duration || NOTIFICATION_DURATIONS.INFO);
        }
        console.log(`[Krisp Importer] FORCE ${type.toUpperCase()}: ${message}`);
    }

    /**
     * Checks if a message indicates progress for an individual element.
     */
    private isIndividualProgressMessage(message: string): boolean {
        return message.includes('Processing meeting') ||
               message.includes('Создаем заметку') ||
               message.includes('Attempting to use alternative');
    }

    /**
     * Determines if a message indicates successful processing of an individual item.
     */
    private isIndividualItemMessage(message: string): boolean {
        return message.includes('Successfully imported meeting') ||
               message.includes('Audio file created') ||
               message.includes('Audio file updated');
    }

    /**
     * Displays a summary notification of batch import results.
     *
     * This function determines the appropriate notification type based on the number
     * of imported items, errors, and skipped duplicates. It constructs a message that
     * reflects the outcome of the import operation and sets an appropriate duration for
     * the notification display. The function then forces the notification to be shown.
     */
    showBatchImportResult(imported: number, errors: number, skipped: number, operationName: string): void {
        let message: string;
        let type: 'success' | 'warning' | 'error' | 'info';
        let duration: number;

        if (errors === 0 && imported > 0) {
            // Полный успех
            type = 'success';
            message = `✅ Импорт завершен: ${imported} встреч(и) из "${operationName}"`;
            duration = NOTIFICATION_DURATIONS.SUCCESS;
        } else if (errors > 0 && imported > 0) {
            // Частичный успех
            type = 'warning';
            message = `⚠️ Импорт завершен частично: ${imported} успешно, ${errors} ошибок из "${operationName}"`;
            duration = NOTIFICATION_DURATIONS.WARNING + 2000; // Дольше для важной информации
        } else if (errors > 0 && imported === 0) {
            // Полная неудача
            type = 'error';
            message = `❌ Импорт не удался: ${errors} ошибок в "${operationName}"`;
            duration = NOTIFICATION_DURATIONS.ERROR + 3000; // Еще дольше для ошибок
        } else {
            // Нет данных
            type = 'info';
            message = `ℹ️ Нет данных для импорта в "${operationName}"`;
            duration = NOTIFICATION_DURATIONS.INFO;
        }

        if (skipped > 0) {
            message += ` (пропущено дубликатов: ${skipped})`;
        }

        // Принудительно показываем результат
        this.forceNotification(message, type, duration);
    }

    /**
     * Logs detailed import results for debugging or logging purposes.
     */
    logDetailedResult(imported: number, errors: number, skipped: number, operationName: string): void {
        console.log(`[Krisp Importer] DETAILED RESULT for "${operationName}":`, {
            imported,
            errors,
            skipped,
            total: imported + errors,
            successRate: imported + errors > 0 ? Math.round((imported / (imported + errors)) * 100) : 0
        });
    }
}
