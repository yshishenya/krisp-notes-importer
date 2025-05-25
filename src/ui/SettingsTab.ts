import { App, PluginSettingTab, Setting, Plugin, Notice, Modal } from 'obsidian';
import { DEFAULT_SETTINGS } from '../interfaces';
import { LocalizationService, SupportedLanguage } from '../core/LocalizationService';

// Определяем интерфейс для плагина
interface KrispNotesImporterPlugin extends Plugin {
    settingsManager: {
        getSetting: (key: string) => any;
        updateSetting: (key: string, value: any) => Promise<void>;
    };
    localizationService?: LocalizationService;
}

export class KrispSettingsTab extends PluginSettingTab {
    plugin: KrispNotesImporterPlugin;
    private localization: LocalizationService;

    constructor(app: App, plugin: KrispNotesImporterPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        // Инициализируем локализацию
        const currentLanguage = this.plugin.settingsManager.getSetting('language') as SupportedLanguage || 'en';
        this.localization = plugin.localizationService || new LocalizationService(currentLanguage);
    }

    private updateLanguage(newLanguage: SupportedLanguage): void {
        this.localization.setLanguage(newLanguage);
        // Перерисовываем интерфейс с новым языком
        this.display();
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: this.localization.t('settings.title') });
        containerEl.createEl('p', {
            text: this.localization.t('settings.title') + ' - ' + this.localization.t('settings.sections.basic')
        });

        // Настройка языка интерфейса (в самом верху)
        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.language.name'))
            .setDesc(this.localization.t('settings.fields.language.desc'))
            .addDropdown(dropdown => dropdown
                .addOption('en', 'English')
                .addOption('ru', 'Русский')
                .setValue(this.plugin.settingsManager.getSetting('language'))
                .onChange(async (value: SupportedLanguage) => {
                    await this.plugin.settingsManager.updateSetting('language', value);
                    this.updateLanguage(value);
                }));

        // Секция: Основные настройки
        containerEl.createEl('h2', { text: '🔧 ' + this.localization.t('settings.sections.basic') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.watchedFolder.name'))
            .setDesc(this.localization.t('settings.fields.watchedFolder.desc'))
            .addText(text => text
                .setPlaceholder('/Users/username/Downloads/Krisp')
                .setValue(this.plugin.settingsManager.getSetting('watchedFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('watchedFolderPath', value);
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.autoScan.name'))
            .setDesc(this.localization.t('settings.fields.autoScan.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('autoScanEnabled'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('autoScanEnabled', value);
                }));

        // Секция: Сохранение в Obsidian
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.storage') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.notesFolder.name'))
            .setDesc(this.localization.t('settings.fields.notesFolder.desc'))
            .addText(text => text
                .setPlaceholder('KrispNotes/Notes')
                .setValue(this.plugin.settingsManager.getSetting('notesFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('notesFolderPath', value);
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.attachmentsFolder.name'))
            .setDesc(this.localization.t('settings.fields.attachmentsFolder.desc'))
            .addText(text => text
                .setPlaceholder('KrispNotes/Attachments')
                .setValue(this.plugin.settingsManager.getSetting('attachmentsFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentsFolderPath', value);
                }));

        // Секция: Шаблоны и именование
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.templates') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.noteNameTemplate.name'))
            .setDesc(this.localization.t('settings.fields.noteNameTemplate.desc'))
            .addText(text => text
                .setPlaceholder('{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}')
                .setValue(this.plugin.settingsManager.getSetting('noteNameTemplate'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('noteNameTemplate', value);
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.attachmentNameTemplate.name'))
            .setDesc(this.localization.t('settings.fields.attachmentNameTemplate.desc'))
            .addText(text => text
                .setPlaceholder('{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio')
                .setValue(this.plugin.settingsManager.getSetting('attachmentNameTemplate'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentNameTemplate', value);
                }));

        // Секция: Обработка дубликатов
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.duplicates') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.duplicateStrategy.name'))
            .setDesc(this.localization.t('settings.fields.duplicateStrategy.desc'))
            .addDropdown(dropdown => dropdown
                .addOption('skip', this.localization.t('settings.fields.duplicateStrategy.options.skip'))
                .addOption('overwrite', this.localization.t('settings.fields.duplicateStrategy.options.overwrite'))
                .addOption('rename', this.localization.t('settings.fields.duplicateStrategy.options.rename'))
                .setValue(this.plugin.settingsManager.getSetting('duplicateStrategy'))
                .onChange(async (value: 'skip' | 'overwrite' | 'rename') => {
                    await this.plugin.settingsManager.updateSetting('duplicateStrategy', value);
                }));

        // Секция: Действия после импорта
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.postImport') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.openNoteAfterImport.name'))
            .setDesc(this.localization.t('settings.fields.openNoteAfterImport.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('openNoteAfterImport'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('openNoteAfterImport', value);
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.deleteZipAfterImport.name'))
            .setDesc(this.localization.t('settings.fields.deleteZipAfterImport.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('deleteZipAfterImport'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('deleteZipAfterImport', value);
                }));

        // Секция: Дополнительные настройки
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.advanced') });

        // Шаблон содержимого заметки
        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.noteContentTemplate.name'))
            .setDesc(this.localization.t('settings.fields.noteContentTemplate.desc'))
            .addTextArea(text => {
                text.setValue(this.plugin.settingsManager.getSetting('noteContentTemplate'))
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSetting('noteContentTemplate', value);
                    });
                text.inputEl.rows = 10;
                text.inputEl.cols = 50;
                return text;
            })
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.restoreTemplate'))
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('noteContentTemplate', DEFAULT_SETTINGS.noteContentTemplate);
                    this.display(); // Перерисовываем интерфейс
                    new Notice(this.localization.t('notifications.success.settingsReset'), 3000);
                }));

        // Кнопки действий
        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.testImport'))
            .setDesc('Выберите ZIP-файл для тестового импорта с текущими настройками')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.testImport'))
                .setClass('mod-cta')
                .onClick(async () => {
                    // Показываем модальное окно для тестового импорта
                    const localization = this.localization;
                    const plugin = this.plugin;

                    const modal = new (class extends Modal {
                        constructor(app: App) {
                            super(app);
                        }

                        onOpen() {
                            const { contentEl } = this;
                            contentEl.createEl('h2', { text: localization.t('modals.testImport.title') });

                            const inputEl = contentEl.createEl('input', {
                                type: 'text',
                                placeholder: localization.t('modals.testImport.placeholder')
                            });
                            inputEl.style.width = '100%';
                            inputEl.style.marginBottom = '10px';

                            const buttonEl = contentEl.createEl('button', {
                                text: localization.t('modals.testImport.button'),
                                cls: 'mod-cta'
                            });

                            buttonEl.onclick = async () => {
                                const zipPath = inputEl.value.trim();
                                if (zipPath) {
                                    this.close();
                                    // Вызываем команду импорта
                                    const pluginAny = plugin as any;
                                    if (pluginAny.processingService) {
                                        try {
                                            await pluginAny.processingService.processZipFile(zipPath);
                                        } catch (error) {
                                            new Notice(`Error: ${error.message}`, 5000);
                                        }
                                    }
                                }
                            };
                        }

                        onClose() {
                            const { contentEl } = this;
                            contentEl.empty();
                        }
                    })(this.app);
                    modal.open();
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.massImport'))
            .setDesc('Импортировать все ZIP-файлы из отслеживаемой папки')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.massImport'))
                .onClick(async () => {
                    // Массовый импорт
                    const plugin = this.plugin as any;
                    if (plugin.fileWatcherService && plugin.fileWatcherService.scanExistingFiles) {
                        try {
                            await plugin.fileWatcherService.scanExistingFiles();
                            new Notice(this.localization.t('notifications.info.scanningFolder'), 3000);
                        } catch (error) {
                            new Notice(`Error: ${error.message}`, 5000);
                        }
                    } else {
                        new Notice('FileWatcherService not available', 3000);
                    }
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.showLogs'))
            .setDesc('Просмотреть детальные логи работы плагина для диагностики проблем')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.showLogs'))
                .onClick(async () => {
                    const plugin = this.plugin as any;
                    if (plugin.loggingService) {
                        // Создаем модальное окно для отображения логов
                        const modal = new (class extends Modal {
                            constructor(app: App) {
                                super(app);
                            }

                            onOpen() {
                                const { contentEl } = this;
                                contentEl.createEl('h2', { text: '📋 Логи плагина Krisp Notes Importer' });

                                // Статистика логов
                                const stats = plugin.loggingService.getLogStats();
                                const statsEl = contentEl.createEl('div');
                                statsEl.style.marginBottom = '15px';
                                statsEl.style.padding = '10px';
                                statsEl.style.backgroundColor = 'var(--background-secondary)';
                                statsEl.style.borderRadius = '5px';

                                statsEl.createEl('p', { text: `📊 Всего записей: ${stats.total}` });
                                const levelStats = Object.entries(stats.byLevel)
                                    .map(([level, count]) => `${level}: ${count}`)
                                    .join(', ');
                                statsEl.createEl('p', { text: `📈 По уровням: ${levelStats}` });

                                // Кнопки управления
                                const buttonContainer = contentEl.createEl('div');
                                buttonContainer.style.display = 'flex';
                                buttonContainer.style.gap = '10px';
                                buttonContainer.style.marginBottom = '15px';

                                const copyBtn = buttonContainer.createEl('button', { text: '📋 Копировать логи' });
                                copyBtn.className = 'mod-cta';
                                copyBtn.onclick = async () => {
                                    await plugin.loggingService.copyLogsToClipboard();
                                };

                                const clearBtn = buttonContainer.createEl('button', { text: '🗑️ Очистить логи' });
                                clearBtn.className = 'mod-warning';
                                clearBtn.onclick = () => {
                                    plugin.loggingService.clearLogs();
                                    this.close();
                                    new Notice('🗑️ Logs cleared', 3000);
                                };

                                const closeBtn = buttonContainer.createEl('button', { text: 'Закрыть' });
                                closeBtn.onclick = () => this.close();

                                // Область с логами
                                const logsContainer = contentEl.createEl('div');
                                logsContainer.style.maxHeight = '400px';
                                logsContainer.style.overflow = 'auto';
                                logsContainer.style.border = '1px solid var(--background-modifier-border)';
                                logsContainer.style.borderRadius = '5px';
                                logsContainer.style.padding = '10px';
                                logsContainer.style.backgroundColor = 'var(--background-primary-alt)';
                                logsContainer.style.fontFamily = 'monospace';
                                logsContainer.style.fontSize = '0.8em';
                                logsContainer.style.whiteSpace = 'pre-wrap';

                                const recentLogs = plugin.loggingService.getRecentLogs(100);
                                if (recentLogs.length === 0) {
                                    logsContainer.textContent = 'Логи отсутствуют';
                                } else {
                                                                        const logsText = recentLogs.map((entry: any) => {
                                        const timestamp = entry.timestamp.toLocaleString();
                                        const level = entry.level === 0 ? 'DEBUG' :
                                                     entry.level === 1 ? 'INFO' :
                                                     entry.level === 2 ? 'WARN' : 'ERROR';
                                        return `[${timestamp}] [${level}] [${entry.category}] ${entry.message}`;
                                    }).join('\n');
                                    logsContainer.textContent = logsText;
                                }
                            }

                            onClose() {
                                const { contentEl } = this;
                                contentEl.empty();
                            }
                        })(this.app);

                        modal.open();
                    } else {
                        new Notice('❌ LoggingService unavailable', 5000);
                    }
                }));

        new Setting(containerEl)
            .setName('Импорт всех файлов')
            .setDesc('Обработать все ZIP-файлы в отслеживаемой папке прямо сейчас')
            .addButton(button => button
                .setButtonText('Импортировать все')
                .setClass('mod-warning')
                .onClick(async () => {
                    const plugin = this.plugin as any;
                    const watchedFolder = plugin.settingsManager.getSetting('watchedFolderPath');

                    if (!watchedFolder) {
                        new Notice(`❌ ${this.localization.t('notifications.error.watchingFailed', { error: 'No watched folder specified' })}`, 5000);
                        return;
                    }

                    new Notice(`🔄 ${this.localization.t('notifications.info.scanningFolder')}`, 3000);

                    try {
                        // Используем FileWatcherService для сканирования
                        if (plugin.fileWatcher && plugin.fileWatcher.scanExistingFiles) {
                            await plugin.fileWatcher.scanExistingFiles();
                            new Notice(`✅ Mass import completed successfully!`, 5000);
                        } else {
                            new Notice('❌ FileWatcherService unavailable', 5000);
                        }
                    } catch (error) {
                        console.error('[Krisp Importer] Mass import error:', error);
                        new Notice(`❌ Mass import error: ${error.message}`, 8000);
                    }
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.testImport'))
            .setDesc('Select ZIP file for test import with current settings')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.testImport'))
                .onClick(async () => {
                                        // Создаем модальное окно для ввода пути к файлу
                    const plugin = this.plugin;
                    const localization = this.localization;
                    const modal = new (class extends Modal {
                        result: string = '';

                        constructor(app: App) {
                            super(app);
                        }

                        onOpen() {
                            const { contentEl } = this;
                            contentEl.createEl('h2', { text: localization.t('modals.testImport.title') });

                            contentEl.createEl('p', {
                                text: localization.t('modals.testImport.placeholder')
                            });

                            const inputEl = contentEl.createEl('input', {
                                type: 'text',
                                placeholder: '/path/to/meeting.zip'
                            });
                            inputEl.style.width = '100%';
                            inputEl.style.marginBottom = '10px';

                            const buttonContainer = contentEl.createEl('div');
                            buttonContainer.style.display = 'flex';
                            buttonContainer.style.gap = '10px';
                            buttonContainer.style.justifyContent = 'flex-end';

                            const importBtn = buttonContainer.createEl('button', { text: localization.t('modals.testImport.button') });
                            importBtn.className = 'mod-cta';
                            importBtn.onclick = async () => {
                                const filePath = inputEl.value.trim();
                                if (filePath) {
                                    this.result = filePath;
                                    this.close();

                                    // Выполняем тестовый импорт через переданный плагин
                                    const pluginInstance = plugin as any;
                                    if (pluginInstance && pluginInstance.processingService) {
                                        try {
                                            new Notice(`🧪 ${localization.t('notifications.info.processing', { file: 'test file' })}`, 3000);
                                            await pluginInstance.processingService.processZipFile(filePath);
                                            new Notice(`✅ Test import completed successfully!`, 5000);
                                        } catch (error) {
                                            console.error('[Krisp Importer] Test import error:', error);
                                            new Notice(`❌ Test import error: ${error.message}`, 8000);
                                        }
                                    } else {
                                        new Notice('❌ ProcessingService unavailable', 5000);
                                    }
                                }
                            };

                            const cancelBtn = buttonContainer.createEl('button', { text: localization.t('modals.confirmReset.cancel') });
                            cancelBtn.onclick = () => this.close();

                            inputEl.focus();
                            inputEl.addEventListener('keypress', (e: KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                    importBtn.click();
                                }
                            });
                        }

                        onClose() {
                            const { contentEl } = this;
                            contentEl.empty();
                        }
                    })(this.app);

                    modal.open();
                }));

        // Секция: Шаблон содержимого
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.templates') });

        const templateDesc = containerEl.createEl('p', {
            text: this.localization.t('settings.fields.noteContentTemplate.desc')
        });
        templateDesc.style.fontSize = '0.9em';
        templateDesc.style.color = 'var(--text-muted)';

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.noteContentTemplate.name'))
            .setDesc('')
            .addTextArea(text => {
                text.inputEl.rows = 10;
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontFamily = 'monospace';
                text.inputEl.style.fontSize = '0.85em';
                return text
                    .setPlaceholder('Enter note template...')
                    .setValue(this.plugin.settingsManager.getSetting('noteContentTemplate'))
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSetting('noteContentTemplate', value);
                    });
            });

        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.restoreTemplate'))
            .setDesc('Restore default note template')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.restoreTemplate'))
                .setCta()
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('noteContentTemplate', DEFAULT_SETTINGS.noteContentTemplate);
                    this.display(); // Перерисовать настройки
                }));

        // Секция: Управление настройками
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.advanced') });

        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.resetSettings'))
            .setDesc('Reset all plugin settings to default values')
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.resetSettings'))
                .setClass('mod-warning')
                .onClick(async () => {
                    // Подтверждение сброса
                    const plugin = this.plugin;
                    const localization = this.localization;
                    const confirmModal = new (class extends Modal {
                        constructor(app: App) {
                            super(app);
                        }

                        onOpen() {
                            const { contentEl } = this;
                            contentEl.createEl('h2', { text: localization.t('modals.confirmReset.title') });

                            contentEl.createEl('p', {
                                text: localization.t('modals.confirmReset.message')
                            });

                            const buttonContainer = contentEl.createEl('div');
                            buttonContainer.style.display = 'flex';
                            buttonContainer.style.gap = '10px';
                            buttonContainer.style.justifyContent = 'flex-end';
                            buttonContainer.style.marginTop = '20px';

                            const resetBtn = buttonContainer.createEl('button', { text: localization.t('modals.confirmReset.confirm') });
                            resetBtn.className = 'mod-warning';
                            resetBtn.onclick = async () => {
                                this.close();

                                                                // Сбрасываем все настройки через переданный плагин
                                const pluginInstance = plugin as any;
                                if (pluginInstance && pluginInstance.settingsManager) {
                                    try {
                                        // Сбрасываем каждую настройку к значению по умолчанию
                                        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                                            await pluginInstance.settingsManager.updateSetting(key, value);
                                        }

                                        new Notice(`✅ ${localization.t('notifications.success.settingsReset')}`, 5000);

                                        // Перерисовываем интерфейс настроек
                                        const settingsTab = pluginInstance.settingsTab;
                                        if (settingsTab && settingsTab.display) {
                                            settingsTab.display();
                                        }
                                    } catch (error) {
                                        console.error('[Krisp Importer] Settings reset error:', error);
                                        new Notice(`❌ Settings reset error: ${error.message}`, 8000);
                                    }
                                } else {
                                    new Notice('❌ Plugin unavailable for settings reset', 5000);
                                }
                            };

                            const cancelBtn = buttonContainer.createEl('button', { text: localization.t('modals.confirmReset.cancel') });
                            cancelBtn.onclick = () => this.close();
                        }

                        onClose() {
                            const { contentEl } = this;
                            contentEl.empty();
                        }
                    })(this.app);

                    confirmModal.open();
                }));

        // Секция: Информация о версии
        containerEl.createEl('h2', { text: this.localization.t('settings.info.title') });

        const versionInfo = containerEl.createEl('div');
        // Получаем версию из manifest.json плагина
        const pluginVersion = (this.plugin as any).manifest?.version || 'unknown';
        versionInfo.createEl('p', { text: `${this.localization.t('settings.info.version')}: v${pluginVersion}` });
        versionInfo.createEl('p', { text: `${this.localization.t('settings.info.status')}: ${this.localization.t('settings.info.features.0')}` });

        // Отображаем все функции
        this.localization.getSettingsStrings().info.features.forEach(feature => {
            versionInfo.createEl('p', { text: feature });
        });

        const statusNote = containerEl.createEl('div');
        statusNote.style.padding = '15px';
        statusNote.style.backgroundColor = 'var(--background-secondary)';
        statusNote.style.borderRadius = '8px';
        statusNote.style.marginTop = '15px';
        statusNote.style.border = '1px solid var(--background-modifier-border)';

        statusNote.createEl('h4', { text: '🚀 ' + (this.localization.getCurrentLanguage() === 'ru' ? 'Доступные команды:' : 'Available commands:') });

        // Отображаем все команды
        this.localization.getSettingsStrings().info.commands.forEach(command => {
            statusNote.createEl('p', { text: `• ${command}` });
        });

        const tipNote = containerEl.createEl('div');
        tipNote.style.padding = '10px';
        tipNote.style.backgroundColor = 'var(--background-primary-alt)';
        tipNote.style.borderRadius = '5px';
        tipNote.style.marginTop = '10px';
        tipNote.style.borderLeft = '4px solid var(--interactive-accent)';
        tipNote.createEl('p', {
            text: '💡 Совет: Используйте палитру команд (Ctrl/Cmd + P) для быстрого доступа ко всем функциям плагина'
        });
    }
}
