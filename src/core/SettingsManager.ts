import { Plugin } from 'obsidian';
import { KrispImporterSettings, DEFAULT_SETTINGS } from '../interfaces';
import { VALIDATION } from './constants';

export class SettingsManager {
    private plugin: Plugin;
    private settings: KrispImporterSettings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = { ...DEFAULT_SETTINGS };
    }

    async loadSettings(): Promise<void> {
        const data = await this.plugin.loadData();
        this.settings = { ...DEFAULT_SETTINGS, ...data };
    }

    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    getAllSettings(): KrispImporterSettings {
        return this.getSettingsWithDefaults();
    }

    getSetting<K extends keyof KrispImporterSettings>(key: K): KrispImporterSettings[K] {
        const settings = this.getSettingsWithDefaults();
        return settings[key];
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

    // Централизованные методы валидации
    private isValidPath(path: string | undefined): boolean {
        return !!path && typeof path === 'string' && path.trim() !== '';
    }

    private isValidTemplate(template: string | undefined): boolean {
        return !!template && typeof template === 'string' && template.trim() !== '';
    }

    private isValidStrategy(strategy: string | undefined): strategy is 'skip' | 'overwrite' | 'rename' {
        return !!strategy && typeof strategy === 'string' && (VALIDATION.VALID_STRATEGIES as readonly string[]).includes(strategy);
    }

    private isValidLanguage(language: string | undefined): language is 'en' | 'ru' {
        return !!language && typeof language === 'string' && (VALIDATION.VALID_LANGUAGES as readonly string[]).includes(language);
    }

    // Валидация настроек
    validateSettings(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Проверка обязательных путей
        if (!this.isValidPath(this.settings.watchedFolderPath)) {
            errors.push('Путь к отслеживаемой папке не может быть пустым');
        }

        if (!this.isValidPath(this.settings.notesFolderPath)) {
            errors.push('Путь к папке заметок не может быть пустым');
        }

        if (!this.isValidPath(this.settings.attachmentsFolderPath)) {
            errors.push('Путь к папке вложений не может быть пустым');
        }

        // Проверка шаблонов
        if (!this.isValidTemplate(this.settings.noteNameTemplate)) {
            errors.push('Note name template cannot be empty');
        }

        if (!this.isValidTemplate(this.settings.attachmentNameTemplate)) {
            errors.push('Audio name template cannot be empty');
        }

        // Проверка стратегии дубликатов
        if (!this.isValidStrategy(this.settings.duplicateStrategy)) {
            errors.push(`Недопустимая стратегия дубликатов: ${this.settings.duplicateStrategy}`);
        }

        // Проверка языка
        if (!this.isValidLanguage(this.settings.language)) {
            errors.push(`Недопустимый язык: ${this.settings.language}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Получение настроек с заполнением пустых значений по умолчанию
    private getSettingsWithDefaults(): KrispImporterSettings {
        return {
            ...DEFAULT_SETTINGS,
            ...this.settings,
            // Принудительно заполняем пустые обязательные поля
            watchedFolderPath: this.isValidPath(this.settings.watchedFolderPath)
                ? this.settings.watchedFolderPath.trim()
                : DEFAULT_SETTINGS.watchedFolderPath,
            notesFolderPath: this.isValidPath(this.settings.notesFolderPath)
                ? this.settings.notesFolderPath.trim()
                : DEFAULT_SETTINGS.notesFolderPath,
            attachmentsFolderPath: this.isValidPath(this.settings.attachmentsFolderPath)
                ? this.settings.attachmentsFolderPath.trim()
                : DEFAULT_SETTINGS.attachmentsFolderPath,
            noteNameTemplate: this.isValidTemplate(this.settings.noteNameTemplate)
                ? this.settings.noteNameTemplate.trim()
                : DEFAULT_SETTINGS.noteNameTemplate,
            attachmentNameTemplate: this.isValidTemplate(this.settings.attachmentNameTemplate)
                ? this.settings.attachmentNameTemplate.trim()
                : DEFAULT_SETTINGS.attachmentNameTemplate,
            duplicateStrategy: this.isValidStrategy(this.settings.duplicateStrategy)
                ? this.settings.duplicateStrategy
                : DEFAULT_SETTINGS.duplicateStrategy,
            language: this.isValidLanguage(this.settings.language)
                ? this.settings.language
                : DEFAULT_SETTINGS.language
        };
    }
}
