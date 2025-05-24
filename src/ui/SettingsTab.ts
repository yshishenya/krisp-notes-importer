import { App, PluginSettingTab, Setting } from 'obsidian';
import KrispNotesImporterPlugin from '../main'; // Предполагая, что main.ts экспортирует класс плагина по умолчанию

export class KrispSettingsTab extends PluginSettingTab {
    plugin: KrispNotesImporterPlugin;

    constructor(app: App, plugin: KrispNotesImporterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Krisp Notes Importer Settings' });

        new Setting(containerEl)
            .setName('Watched Folder Path')
            .setDesc('Full path to the folder Krisp saves ZIP archives to.')
            .addText(text => text
                .setPlaceholder('/path/to/your/krisp/archives')
                .setValue(this.plugin.settingsManager.getSetting('watchedFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('watchedFolderPath', value);
                }));

        new Setting(containerEl)
            .setName('Notes Folder Path')
            .setDesc('Path within Obsidian vault to save Markdown notes (e.g., Krisp/Notes).')
            .addText(text => text
                .setPlaceholder('Krisp/Notes')
                .setValue(this.plugin.settingsManager.getSetting('notesFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('notesFolderPath', value);
                }));

        new Setting(containerEl)
            .setName('Attachments Folder Path')
            .setDesc('Path within Obsidian vault to save audio attachments (e.g., Krisp/Attachments).')
            .addText(text => text
                .setPlaceholder('Krisp/Attachments')
                .setValue(this.plugin.settingsManager.getSetting('attachmentsFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentsFolderPath', value);
                }));
    }
}
