import { Notice } from 'obsidian';
import { NOTIFICATION_DURATIONS } from './constants';

export class NotificationService {
    constructor() {}

    /**
     * Показывает уведомление об успехе
     * @param message Сообщение для отображения
     * @param duration Длительность в миллисекундах
     */
    showSuccess(message: string, duration: number = NOTIFICATION_DURATIONS.SUCCESS): void {
        new Notice(message, duration);
        console.log(`[Krisp Importer] SUCCESS: ${message}`);
    }

    /**
     * Показывает уведомление об ошибке
     * @param message Сообщение для отображения
     * @param duration Длительность в миллисекундах
     */
    showError(message: string, duration: number = NOTIFICATION_DURATIONS.ERROR): void {
        new Notice(`ERROR: ${message}`, duration);
        console.error(`[Krisp Importer] ERROR: ${message}`);
    }

    /**
     * Показывает предупреждение
     * @param message Сообщение для отображения
     * @param duration Длительность в миллисекундах
     */
    showWarning(message: string, duration: number = NOTIFICATION_DURATIONS.WARNING): void {
        new Notice(`WARNING: ${message}`, duration);
        console.warn(`[Krisp Importer] WARNING: ${message}`);
    }

    /**
     * Показывает информационное уведомление
     * @param message Сообщение для отображения
     * @param duration Длительность в миллисекундах
     */
    showInfo(message: string, duration: number = NOTIFICATION_DURATIONS.INFO): void {
        new Notice(message, duration);
        console.log(`[Krisp Importer] INFO: ${message}`);
    }

    /**
     * Показывает уведомление о дубликате с действием
     * @param fileName Имя файла дубликата
     * @param strategy Примененная стратегия
     * @param action Выполненное действие
     */
    showDuplicateFound(fileName: string, strategy: string, action: string): void {
        const message = `Дубликат "${fileName}": ${action} (стратегия: ${strategy})`;
        this.showWarning(message);
    }

    /**
     * Показывает уведомление о статусе массового импорта
     * @param imported Количество импортированных встреч
     * @param errors Количество ошибок
     * @param skipped Количество пропущенных дубликатов
     * @param zipFileName Имя ZIP-файла
     */
    showBatchImportResult(imported: number, errors: number, skipped: number, zipFileName: string): void {
        if (imported > 0 && errors === 0) {
            this.showSuccess(`Импорт завершен: ${imported} встреч(и) из "${zipFileName}"`, NOTIFICATION_DURATIONS.SUCCESS);
        } else if (imported > 0 && errors > 0) {
            this.showWarning(`Импорт завершен частично: ${imported} успешно, ${errors} ошибок из "${zipFileName}"`, NOTIFICATION_DURATIONS.WARNING);
        } else if (errors > 0) {
            this.showError(`Импорт не удался: ${errors} ошибок в "${zipFileName}"`, NOTIFICATION_DURATIONS.ERROR);
        } else {
            this.showInfo(`Нет данных для импорта в "${zipFileName}"`, NOTIFICATION_DURATIONS.INFO);
        }

        if (skipped > 0) {
            this.showInfo(`Пропущено дубликатов: ${skipped}`, NOTIFICATION_DURATIONS.INFO);
        }
    }

    // Можно добавить больше методов по мере необходимости,
    // например, для интерактивных уведомлений или различных уровней детализации.
}
