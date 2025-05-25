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

        new Setting(containerEl)
            .setName('Показать логи плагина')
            .setDesc('Просмотреть детальные логи работы плагина для диагностики проблем')
            .addButton(button => button
                .setButtonText('Показать логи')
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
                                    new Notice('🗑️ Логи очищены', 3000);
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
                        new Notice('❌ LoggingService недоступен', 5000);
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
                        new Notice('❌ Не указана отслеживаемая папка', 5000);
                        return;
                    }

                    new Notice('🔄 Начинаю массовый импорт...', 3000);

                    try {
                        // Используем FileWatcherService для сканирования
                        if (plugin.fileWatcher && plugin.fileWatcher.scanExistingFiles) {
                            await plugin.fileWatcher.scanExistingFiles();
                            new Notice('✅ Массовый импорт завершен!', 5000);
                        } else {
                            new Notice('❌ FileWatcherService недоступен', 5000);
                        }
                    } catch (error) {
                        console.error('[Krisp Importer] Ошибка массового импорта:', error);
                        new Notice(`❌ Ошибка массового импорта: ${error.message}`, 8000);
                    }
                }));

        new Setting(containerEl)
            .setName('Тестовый импорт')
            .setDesc('Выбрать ZIP-файл для тестового импорта с текущими настройками')
            .addButton(button => button
                .setButtonText('Тестовый импорт')
                .onClick(async () => {
                                        // Создаем модальное окно для ввода пути к файлу
                    const plugin = this.plugin;
                    const modal = new (class extends Modal {
                        result: string = '';

                        constructor(app: App) {
                            super(app);
                        }

                        onOpen() {
                            const { contentEl } = this;
                            contentEl.createEl('h2', { text: 'Тестовый импорт ZIP-файла' });

                            contentEl.createEl('p', {
                                text: 'Введите полный путь к ZIP-файлу Krisp для тестового импорта:'
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

                            const importBtn = buttonContainer.createEl('button', { text: 'Импортировать' });
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
                                            new Notice('🧪 Выполняю тестовый импорт...', 3000);
                                            await pluginInstance.processingService.processZipFile(filePath);
                                            new Notice('✅ Тестовый импорт завершен успешно!', 5000);
                                        } catch (error) {
                                            console.error('[Krisp Importer] Ошибка тестового импорта:', error);
                                            new Notice(`❌ Ошибка тестового импорта: ${error.message}`, 8000);
                                        }
                                    } else {
                                        new Notice('❌ ProcessingService недоступен', 5000);
                                    }
                                }
                            };

                            const cancelBtn = buttonContainer.createEl('button', { text: 'Отмена' });
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

        // Секция: Управление настройками
        containerEl.createEl('h2', { text: '🔧 Управление настройками' });

        new Setting(containerEl)
            .setName('Сбросить все настройки')
            .setDesc('Вернуть все настройки плагина к значениям по умолчанию')
            .addButton(button => button
                .setButtonText('Сбросить настройки')
                .setClass('mod-warning')
                .onClick(async () => {
                    // Подтверждение сброса
                    const plugin = this.plugin;
                    const confirmModal = new (class extends Modal {
                        constructor(app: App) {
                            super(app);
                        }

                        onOpen() {
                            const { contentEl } = this;
                            contentEl.createEl('h2', { text: '⚠️ Подтверждение сброса' });

                            contentEl.createEl('p', {
                                text: 'Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.'
                            });

                            const buttonContainer = contentEl.createEl('div');
                            buttonContainer.style.display = 'flex';
                            buttonContainer.style.gap = '10px';
                            buttonContainer.style.justifyContent = 'flex-end';
                            buttonContainer.style.marginTop = '20px';

                            const resetBtn = buttonContainer.createEl('button', { text: 'Сбросить' });
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

                                        new Notice('✅ Все настройки сброшены к значениям по умолчанию', 5000);

                                        // Перерисовываем интерфейс настроек
                                        const settingsTab = pluginInstance.settingsTab;
                                        if (settingsTab && settingsTab.display) {
                                            settingsTab.display();
                                        }
                                    } catch (error) {
                                        console.error('[Krisp Importer] Ошибка сброса настроек:', error);
                                        new Notice(`❌ Ошибка сброса настроек: ${error.message}`, 8000);
                                    }
                                } else {
                                    new Notice('❌ Плагин недоступен для сброса настроек', 5000);
                                }
                            };

                            const cancelBtn = buttonContainer.createEl('button', { text: 'Отмена' });
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
        containerEl.createEl('h2', { text: 'ℹ️ Информация о плагине' });

        const versionInfo = containerEl.createEl('div');
        versionInfo.createEl('p', { text: '🎯 Текущий статус: v3.0.1 - Полная функциональность' });
        versionInfo.createEl('p', { text: '✅ Ручной импорт: Полностью работает' });
        versionInfo.createEl('p', { text: '✅ Автоматическое отслеживание: Реализовано' });
        versionInfo.createEl('p', { text: '✅ Все настройки: Доступны через UI' });
        versionInfo.createEl('p', { text: '✅ Расширенная аналитика: Включена' });

        const statusNote = containerEl.createEl('div');
        statusNote.style.padding = '15px';
        statusNote.style.backgroundColor = 'var(--background-secondary)';
        statusNote.style.borderRadius = '8px';
        statusNote.style.marginTop = '15px';
        statusNote.style.border = '1px solid var(--background-modifier-border)';

        statusNote.createEl('h4', { text: '🚀 Доступные команды:' });
        statusNote.createEl('p', { text: '• "Import ZIP file manually" - ручной импорт файла' });
        statusNote.createEl('p', { text: '• "Start auto-watching folder" - запуск автоматического отслеживания' });
        statusNote.createEl('p', { text: '• "Stop auto-watching" - остановка отслеживания' });
        statusNote.createEl('p', { text: '• "Scan existing files in folder" - массовое сканирование' });

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
