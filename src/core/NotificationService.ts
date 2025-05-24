import { Notice } from 'obsidian';

export class NotificationService {
    constructor() {}

    /**
     * Показывает уведомление об успехе
     * @param message Текст сообщения
     * @param duration Длительность в миллисекундах (по умолчанию 5000)
     */
    showSuccess(message: string, duration: number = 5000): void {
        new Notice(message, duration);
        console.log(`[Krisp Importer] SUCCESS: ${message}`);
    }

    /**
     * Показывает уведомление об ошибке
     * @param message Текст сообщения об ошибке
     * @param duration Длительность в миллисекундах (по умолчанию 8000)
     */
    showError(message: string, duration: number = 8000): void {
        new Notice(`ERROR: ${message}`, duration);
        console.error(`[Krisp Importer] ERROR: ${message}`);
    }

    /**
     * Показывает предупреждение
     * @param message Текст предупреждения
     * @param duration Длительность в миллисекундах (по умолчанию 6000)
     */
    showWarning(message: string, duration: number = 6000): void {
        new Notice(`WARNING: ${message}`, duration);
        console.warn(`[Krisp Importer] WARNING: ${message}`);
    }

    /**
     * Показывает информационное уведомление
     * @param message Информационное сообщение
     * @param duration Длительность в миллисекундах (по умолчанию 4000)
     */
    showInfo(message: string, duration: number = 4000): void {
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
            this.showSuccess(`Импорт завершен: ${imported} встреч(и) из "${zipFileName}"`, 8000);
        } else if (imported > 0 && errors > 0) {
            this.showWarning(`Импорт завершен частично: ${imported} успешно, ${errors} ошибок из "${zipFileName}"`, 10000);
        } else if (errors > 0) {
            this.showError(`Импорт не удался: ${errors} ошибок в "${zipFileName}"`, 10000);
        } else {
            this.showInfo(`Нет данных для импорта в "${zipFileName}"`, 6000);
        }

        if (skipped > 0) {
            this.showInfo(`Пропущено дубликатов: ${skipped}`, 4000);
        }
    }

    // Можно добавить больше методов по мере необходимости,
    // например, для интерактивных уведомлений или различных уровней детализации.
}
