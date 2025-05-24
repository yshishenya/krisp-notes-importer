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

    // Можно добавить метод для валидации настроек, если потребуется в будущем
    // validateSettings(): boolean { ... }
}
