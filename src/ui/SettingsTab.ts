import { App, PluginSettingTab, Setting, Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS } from '../interfaces';

// Определяем интерфейс для плагина
interface KrispNotesImporterPlugin extends Plugin {
    settingsManager: {
        getSetting: (key: string) => any;
        updateSetting: (key: string, value: any) => Promise<void>;
    };
}

export class KrispSettingsTab extends PluginSettingTab {
    plugin: KrispNotesImporterPlugin;

    constructor(app: App, plugin: KrispNotesImporterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Krisp Notes Importer' });
        containerEl.createEl('p', {
            text: 'Настройки плагина для автоматического импорта заметок из Krisp в Obsidian'
        });

        // Секция: Основные настройки
        containerEl.createEl('h2', { text: '📁 Основные настройки' });

        new Setting(containerEl)
            .setName('Отслеживаемая папка')
            .setDesc('Полный путь к папке, где Krisp сохраняет ZIP-архивы встреч')
            .addText(text => text
                .setPlaceholder('/Users/username/Downloads/Krisp')
                .setValue(this.plugin.settingsManager.getSetting('watchedFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('watchedFolderPath', value);
                }));

        new Setting(containerEl)
            .setName('Автоматическое отслеживание')
            .setDesc('Автоматически сканировать папку и импортировать новые встречи (требует FileWatcherService)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('autoScanEnabled'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('autoScanEnabled', value);
                }));

        // Секция: Сохранение в Obsidian
        containerEl.createEl('h2', { text: '💾 Сохранение в Obsidian' });

        new Setting(containerEl)
            .setName('Папка для заметок')
            .setDesc('Путь в хранилище Obsidian для сохранения Markdown-заметок')
            .addText(text => text
                .setPlaceholder('KrispNotes/Notes')
                .setValue(this.plugin.settingsManager.getSetting('notesFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('notesFolderPath', value);
                }));

        new Setting(containerEl)
            .setName('Папка для аудиофайлов')
            .setDesc('Путь в хранилище Obsidian для сохранения аудиозаписей')
            .addText(text => text
                .setPlaceholder('KrispNotes/Attachments')
                .setValue(this.plugin.settingsManager.getSetting('attachmentsFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentsFolderPath', value);
                }));

        // Секция: Шаблоны и именование
        containerEl.createEl('h2', { text: '🏷️ Шаблоны и именование' });

        new Setting(containerEl)
            .setName('Шаблон имени заметок')
            .setDesc('Формат имен файлов заметок. Доступные переменные: {{YYYY}}, {{MM}}, {{DD}}, {{HHMM}}, {{meetingTitle}}')
            .addText(text => text
                .setPlaceholder('{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}')
                .setValue(this.plugin.settingsManager.getSetting('noteNameTemplate'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('noteNameTemplate', value);
                }));

        new Setting(containerEl)
            .setName('Шаблон имени аудиофайлов')
            .setDesc('Формат имен аудиофайлов. Используйте те же переменные что и для заметок')
            .addText(text => text
                .setPlaceholder('{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio')
                .setValue(this.plugin.settingsManager.getSetting('attachmentNameTemplate'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentNameTemplate', value);
                }));

        // Секция: Обработка дубликатов
        containerEl.createEl('h2', { text: '🔄 Обработка дубликатов' });

        new Setting(containerEl)
            .setName('Стратегия при дубликатах')
            .setDesc('Что делать при обнаружении существующей заметки с таким же именем')
            .addDropdown(dropdown => dropdown
                .addOption('skip', 'Пропустить импорт')
                .addOption('overwrite', 'Перезаписать существующую')
                .addOption('rename', 'Создать с суффиксом (рекомендуется)')
                .setValue(this.plugin.settingsManager.getSetting('duplicateStrategy'))
                .onChange(async (value: 'skip' | 'overwrite' | 'rename') => {
                    await this.plugin.settingsManager.updateSetting('duplicateStrategy', value);
                }));

        // Секция: Действия после импорта
        containerEl.createEl('h2', { text: '⚡ Действия после импорта' });

        new Setting(containerEl)
            .setName('Открывать заметку')
            .setDesc('Автоматически открывать созданную заметку после импорта')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('openNoteAfterImport'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('openNoteAfterImport', value);
                }));

        new Setting(containerEl)
            .setName('Удалять ZIP-файл')
            .setDesc('Автоматически удалять исходный ZIP-архив после успешного импорта')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('deleteZipAfterImport'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('deleteZipAfterImport', value);
                }));

        // Секция: Дополнительные настройки
        containerEl.createEl('h2', { text: '🔧 Дополнительные настройки' });

        new Setting(containerEl)
            .setName('Язык для дат')
            .setDesc('Язык для распознавания месяцев в названиях встреч')
            .addDropdown(dropdown => dropdown
                .addOption('en', 'English')
                .addOption('ru', 'Русский')
                .setValue(this.plugin.settingsManager.getSetting('language'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('language', value);
                }));

        new Setting(containerEl)
            .setName('Проверка настроек')
            .setDesc('Проверить корректность всех настроек плагина')
            .addButton(button => button
                .setButtonText('Проверить настройки')
                .setClass('mod-cta')
                .onClick(async () => {
                    // Нужно добавить метод validateSettings в интерфейс
                    const plugin = this.plugin as any;
                    if (plugin.settingsManager.validateSettings) {
                        const validation = plugin.settingsManager.validateSettings();
                        if (validation.isValid) {
                            new Notice('✅ Все настройки корректны!', 5000);
                        } else {
                            new Notice(`❌ Найдены ошибки в настройках:\n${validation.errors.join('\n')}`, 10000);
                            console.error('[Krisp Importer] Ошибки настроек:', validation.errors);
                        }
                    } else {
                        new Notice('⚠️ Метод валидации недоступен', 3000);
                    }
                }));

        // Секция: Шаблон содержимого
        containerEl.createEl('h2', { text: '📝 Шаблон содержимого заметки' });

        const templateDesc = containerEl.createEl('p', {
            text: 'Настройте шаблон для создаваемых заметок. Доступные переменные: {{meetingTitle}}, {{date}}, {{time}}, {{participants}}, {{summary}}, {{actionItems}}, {{keyPoints}}, {{formattedTranscript}}, {{audioPathForYaml}} и другие.'
        });
        templateDesc.style.fontSize = '0.9em';
        templateDesc.style.color = 'var(--text-muted)';

        new Setting(containerEl)
            .setName('Шаблон заметки')
            .setDesc('')
            .addTextArea(text => {
                text.inputEl.rows = 10;
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontFamily = 'monospace';
                text.inputEl.style.fontSize = '0.85em';
                return text
                    .setPlaceholder('Введите шаблон заметки...')
                    .setValue(this.plugin.settingsManager.getSetting('noteContentTemplate'))
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSetting('noteContentTemplate', value);
                    });
            });

        new Setting(containerEl)
            .setName('Восстановить шаблон по умолчанию')
            .setDesc('Вернуть стандартный шаблон заметки')
            .addButton(button => button
                .setButtonText('Восстановить')
                .setCta()
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('noteContentTemplate', DEFAULT_SETTINGS.noteContentTemplate);
                    this.display(); // Перерисовать настройки
                }));

        // Секция: Информация о версии
        containerEl.createEl('h2', { text: 'ℹ️ Информация' });

        const versionInfo = containerEl.createEl('div');
        versionInfo.createEl('p', { text: '🎯 Текущий статус: v2.0.0 - Базовая функциональность' });
        versionInfo.createEl('p', { text: '✅ Ручной импорт: Полностью работает' });
        versionInfo.createEl('p', { text: '🔄 Автоматическое отслеживание: Планируется в v3.0.0' });
        versionInfo.createEl('p', { text: '📋 Все настройки: Доступны в v2.1.0' });

        const statusNote = containerEl.createEl('div');
        statusNote.style.padding = '10px';
        statusNote.style.backgroundColor = 'var(--background-secondary)';
        statusNote.style.borderRadius = '5px';
        statusNote.style.marginTop = '10px';
        statusNote.createEl('p', {
            text: '💡 Совет: Для тестирования используйте команду "Krisp Importer: Import ZIP file manually" из палитры команд (Ctrl/Cmd + P)'
        });
    }
}
