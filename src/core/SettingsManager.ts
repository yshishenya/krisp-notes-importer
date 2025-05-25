import { Plugin } from 'obsidian';
import { KrispImporterSettings, DEFAULT_SETTINGS } from '../interfaces';

export class SettingsManager {
    private plugin: Plugin;
    settings: KrispImporterSettings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        // Инициализация settings здесь или в loadSettings
        // Для простоты пока оставим так, loadSettings будет вызван в main.ts
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    getSetting<K extends keyof KrispImporterSettings>(key: K): KrispImporterSettings[K] {
        if (this.settings) {
            return this.settings[key];
        }
        // Возвращаем значение по умолчанию, если настройки еще не загружены
        // Этого не должно происходить при правильной инициализации
        return DEFAULT_SETTINGS[key];
    }

    getAllSettings(): KrispImporterSettings {
        return this.settings || DEFAULT_SETTINGS; // Возвращаем DEFAULT_SETTINGS если settings еще не загружены
    }

    async updateSetting<K extends keyof KrispImporterSettings>(key: K, value: KrispImporterSettings[K]): Promise<void> {
        if (!this.settings) {
            // Если настройки не загружены, сначала загружаем их
            // Это защитный механизм, в нормальном потоке loadSettings должен быть вызван раньше
            await this.loadSettings();
        }
        this.settings[key] = value;
        await this.saveSettings();
    }

    // Валидация настроек
    /**
     * Validates the configuration settings.
     *
     * This function checks various configuration settings to ensure they are valid, including paths, templates,
     * duplicate strategies, and language settings. It collects any validation errors in an array and returns them
     * along with a boolean indicating whether the settings are valid.
     *
     * @returns An object containing a `isValid` flag and an `errors` array with validation error messages.
     */
    validateSettings(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Проверка обязательных путей
        if (!this.settings.watchedFolderPath || this.settings.watchedFolderPath.trim() === '') {
            errors.push('Путь к отслеживаемой папке не может быть пустым');
        }

        if (!this.settings.notesFolderPath || this.settings.notesFolderPath.trim() === '') {
            errors.push('Путь к папке заметок не может быть пустым');
        }

        if (!this.settings.attachmentsFolderPath || this.settings.attachmentsFolderPath.trim() === '') {
            errors.push('Путь к папке вложений не может быть пустым');
        }

        // Проверка шаблонов
        if (!this.settings.noteNameTemplate || this.settings.noteNameTemplate.trim() === '') {
            errors.push('Note name template cannot be empty');
        }

        if (!this.settings.attachmentNameTemplate || this.settings.attachmentNameTemplate.trim() === '') {
            errors.push('Audio name template cannot be empty');
        }

        // Проверка стратегии дубликатов
        const validStrategies = ['skip', 'overwrite', 'rename'];
        if (!validStrategies.includes(this.settings.duplicateStrategy)) {
            errors.push(`Недопустимая стратегия дубликатов: ${this.settings.duplicateStrategy}`);
        }

        // Проверка языка
        const validLanguages = ['en', 'ru'];
        if (!validLanguages.includes(this.settings.language)) {
            errors.push(`Недопустимый язык: ${this.settings.language}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Получение настроек с валидацией
    /**
     * Validates settings and returns them with defaults if validation fails.
     */
    getValidatedSettings(): KrispImporterSettings {
        const validation = this.validateSettings();
        if (!validation.isValid) {
            console.warn('[Krisp Importer] Settings contain errors:', validation.errors);
            // Возвращаем настройки с исправленными значениями
            return this.getSettingsWithDefaults();
        }
        return this.settings;
    }

    // Получение настроек с заполнением пустых значений по умолчанию
    /**
     * Retrieves and merges user settings with default settings, ensuring all required fields are properly set.
     *
     * This function first combines the default settings with any provided user settings. It then validates and normalizes specific fields such as folder paths, templates, and enums like `duplicateStrategy` and `language`.
     *
     * @returns Merged settings object with defaults applied where necessary.
     */
    private getSettingsWithDefaults(): KrispImporterSettings {
        return {
            ...DEFAULT_SETTINGS,
            ...this.settings,
            // Принудительно заполняем пустые обязательные поля
            watchedFolderPath: this.settings.watchedFolderPath?.trim() || DEFAULT_SETTINGS.watchedFolderPath,
            notesFolderPath: this.settings.notesFolderPath?.trim() || DEFAULT_SETTINGS.notesFolderPath,
            attachmentsFolderPath: this.settings.attachmentsFolderPath?.trim() || DEFAULT_SETTINGS.attachmentsFolderPath,
            noteNameTemplate: this.settings.noteNameTemplate?.trim() || DEFAULT_SETTINGS.noteNameTemplate,
            attachmentNameTemplate: this.settings.attachmentNameTemplate?.trim() || DEFAULT_SETTINGS.attachmentNameTemplate,
            duplicateStrategy: ['skip', 'overwrite', 'rename'].includes(this.settings.duplicateStrategy)
                ? this.settings.duplicateStrategy
                : DEFAULT_SETTINGS.duplicateStrategy,
            language: ['en', 'ru'].includes(this.settings.language)
                ? this.settings.language
                : DEFAULT_SETTINGS.language
        };
    }
}
