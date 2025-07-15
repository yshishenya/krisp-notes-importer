import { Notice } from 'obsidian';
import { NOTIFICATION_DURATIONS } from './constants';

export class NotificationService {
    private batchMode: boolean = false;
    private currentOperationId: string | null = null;
    private progressNotice: Notice | null = null;

    constructor() {}

    /**
     * Включает batch режим для массовых операций
     */
    startBatchOperation(operationId: string): void {
        this.batchMode = true;
        this.currentOperationId = operationId;
        this.hidePreviousNotices();
    }

    /**
     * Выключает batch режим
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
     * Показывает прогресс для массовых операций
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
     * Скрывает предыдущие уведомления
     */
    private hidePreviousNotices(): void {
        if (this.progressNotice) {
            this.progressNotice.hide();
            this.progressNotice = null;
        }
    }

    /**
     * Показывает уведомление об успехе (с учетом batch режима)
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
     * Показывает уведомление об ошибке
     */
    showError(message: string, duration: number = NOTIFICATION_DURATIONS.ERROR): void {
        new Notice(`ERROR: ${message}`, duration);
        console.error(`[Krisp Importer] ERROR: ${message}`);
    }

    /**
     * Показывает предупреждение
     */
    showWarning(message: string, duration: number = NOTIFICATION_DURATIONS.WARNING): void {
        new Notice(`WARNING: ${message}`, duration);
        console.warn(`[Krisp Importer] WARNING: ${message}`);
    }

    /**
     * Показывает информационное уведомление (с учетом batch режима)
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
     * Принудительно показывает уведомление (игнорируя batch режим)
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
     * Проверяет, является ли сообщение прогрессом для отдельного элемента
     */
    private isIndividualProgressMessage(message: string): boolean {
        return message.includes('Processing meeting') ||
               message.includes('Создаем заметку') ||
               message.includes('Attempting to use alternative');
    }

    /**
     * Проверяет, является ли сообщение успехом для отдельного элемента
     */
    private isIndividualItemMessage(message: string): boolean {
        return message.includes('Successfully imported meeting') ||
               message.includes('Audio file created') ||
               message.includes('Audio file updated');
    }

    /**
     * Показывает сводное уведомление о результатах массового импорта
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
     * Показывает детальный результат импорта (для отладки/логов)
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
