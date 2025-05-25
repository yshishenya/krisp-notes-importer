import { Plugin, setIcon } from 'obsidian';

export enum PluginStatus {
    IDLE = 'idle',
    WATCHING = 'watching',
    PROCESSING = 'processing',
    ERROR = 'error'
}

export class StatusBarService {
    private plugin: Plugin;
    private statusBarItem: HTMLElement | null = null;
    private currentStatus: PluginStatus = PluginStatus.IDLE;
    private currentMessage: string = '';

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.initialize();
    }

    /**
     * Инициализация элемента в строке состояния
     */
    private initialize(): void {
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.statusBarItem.addClass('krisp-importer-status');
        this.statusBarItem.style.cursor = 'pointer';

        // Добавляем обработчик клика для открытия настроек
        this.statusBarItem.addEventListener('click', () => {
            // @ts-ignore - доступ к внутреннему API Obsidian
            this.plugin.app.setting.open();
            // @ts-ignore
            this.plugin.app.setting.openTabById('krisp-notes-importer');
        });

        this.updateDisplay();
    }

    /**
     * Обновление отображения статуса
     */
    private updateDisplay(): void {
        if (!this.statusBarItem) return;

        const { icon, text, color } = this.getStatusDisplay();

        this.statusBarItem.empty();

        // Удаляем старые CSS классы
        this.statusBarItem.removeClass('idle', 'watching', 'processing', 'error');

        // Добавляем CSS класс для текущего статуса
        const statusClass = this.currentStatus.toLowerCase();
        this.statusBarItem.addClass(statusClass);

        // Добавляем иконку
        const iconEl = this.statusBarItem.createEl('span');
        iconEl.style.marginRight = '4px';
        setIcon(iconEl, icon);

        // Добавляем текст
        const textEl = this.statusBarItem.createEl('span');
        textEl.textContent = text;

        // Устанавливаем цвет (fallback если CSS не работает)
        this.statusBarItem.style.color = color;

        // Устанавливаем tooltip
        this.statusBarItem.setAttribute('aria-label', this.getTooltipText());
    }

    /**
     * Получение параметров отображения для текущего статуса
     */
    private getStatusDisplay(): { icon: string; text: string; color: string } {
        switch (this.currentStatus) {
            case PluginStatus.IDLE:
                return {
                    icon: 'pause-circle',
                    text: 'Krisp',
                    color: 'var(--text-muted)'
                };
            case PluginStatus.WATCHING:
                return {
                    icon: 'eye',
                    text: 'Krisp',
                    color: 'var(--color-green)'
                };
            case PluginStatus.PROCESSING:
                return {
                    icon: 'loader-2',
                    text: 'Krisp',
                    color: 'var(--color-blue)'
                };
            case PluginStatus.ERROR:
                return {
                    icon: 'alert-circle',
                    text: 'Krisp',
                    color: 'var(--color-red)'
                };
            default:
                return {
                    icon: 'help-circle',
                    text: 'Krisp',
                    color: 'var(--text-muted)'
                };
        }
    }

    /**
     * Получение текста для tooltip
     */
    private getTooltipText(): string {
        const baseText = 'Krisp Notes Importer';

        switch (this.currentStatus) {
            case PluginStatus.IDLE:
                return `${baseText}: Неактивен`;
            case PluginStatus.WATCHING:
                return `${baseText}: Отслеживание активно${this.currentMessage ? ` - ${this.currentMessage}` : ''}`;
            case PluginStatus.PROCESSING:
                return `${baseText}: Обработка файла${this.currentMessage ? ` - ${this.currentMessage}` : ''}`;
            case PluginStatus.ERROR:
                return `${baseText}: Ошибка${this.currentMessage ? ` - ${this.currentMessage}` : ''}`;
            default:
                return baseText;
        }
    }

    /**
     * Установка статуса "Неактивен"
     */
    setIdle(message?: string): void {
        this.currentStatus = PluginStatus.IDLE;
        this.currentMessage = message || '';
        this.updateDisplay();
    }

    /**
     * Установка статуса "Отслеживание"
     */
    setWatching(folderPath?: string): void {
        this.currentStatus = PluginStatus.WATCHING;
        this.currentMessage = folderPath ? `Папка: ${folderPath}` : '';
        this.updateDisplay();
    }

    /**
     * Установка статуса "Обработка"
     */
    setProcessing(fileName?: string): void {
        this.currentStatus = PluginStatus.PROCESSING;
        this.currentMessage = fileName ? `Файл: ${fileName}` : '';
        this.updateDisplay();
    }

    /**
     * Установка статуса "Ошибка"
     */
    setError(errorMessage?: string): void {
        this.currentStatus = PluginStatus.ERROR;
        this.currentMessage = errorMessage || '';
        this.updateDisplay();

        // Автоматически сбрасываем статус ошибки через 10 секунд
        setTimeout(() => {
            if (this.currentStatus === PluginStatus.ERROR) {
                this.setIdle();
            }
        }, 10000);
    }

    /**
     * Временное отображение сообщения
     */
    showTemporaryMessage(message: string, duration: number = 3000): void {
        const originalStatus = this.currentStatus;
        const originalMessage = this.currentMessage;

        this.currentMessage = message;
        this.updateDisplay();

        setTimeout(() => {
            this.currentStatus = originalStatus;
            this.currentMessage = originalMessage;
            this.updateDisplay();
        }, duration);
    }

    /**
     * Получение текущего статуса
     */
    getCurrentStatus(): PluginStatus {
        return this.currentStatus;
    }

    /**
     * Проверка, активен ли статус
     */
    isActive(): boolean {
        return this.currentStatus === PluginStatus.WATCHING ||
               this.currentStatus === PluginStatus.PROCESSING;
    }

    /**
     * Очистка ресурсов
     */
    destroy(): void {
        if (this.statusBarItem) {
            this.statusBarItem.remove();
            this.statusBarItem = null;
        }
    }

        /**
     * Анимация иконки для статуса "Обработка"
     */
    private startProcessingAnimation(): void {
        if (!this.statusBarItem || this.currentStatus !== PluginStatus.PROCESSING) return;

        const iconEl = this.statusBarItem.querySelector('span:first-child') as HTMLElement;
        if (iconEl) {
            iconEl.style.animation = 'spin 1s linear infinite';
        }
    }

    /**
     * Остановка анимации
     */
    private stopAnimation(): void {
        if (!this.statusBarItem) return;

        const iconEl = this.statusBarItem.querySelector('span:first-child') as HTMLElement;
        if (iconEl) {
            iconEl.style.animation = '';
        }
    }

    /**
     * Обновление с анимацией для статуса обработки
     */
    private updateDisplayWithAnimation(): void {
        this.updateDisplay();

        if (this.currentStatus === PluginStatus.PROCESSING) {
            this.startProcessingAnimation();
        } else {
            this.stopAnimation();
        }
    }
}
