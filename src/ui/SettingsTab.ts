import { App, PluginSettingTab, Setting, Plugin, Notice, Modal, PluginManifest } from 'obsidian';
import { DEFAULT_SETTINGS } from '../interfaces';
import { LocalizationService, SupportedLanguage } from '../core/LocalizationService';

// Определяем интерфейс для плагина
interface KrispNotesImporterPlugin extends Plugin {
    settingsManager: {
        getSetting: (key: string) => any;
        updateSetting: (key: string, value: any) => Promise<void>;
    };
    localizationService?: LocalizationService;
    fileWatcherService?: {
        startWatching: (folderPath: string) => Promise<void>;
        stopWatching: () => Promise<void>;
        isCurrentlyWatching: () => boolean;
        getWatchedPath: () => string;
        scanExistingFiles?: () => Promise<void>;
    };
    processingService?: {
        processZipFile: (filePath: string, settings?: any) => Promise<void>;
    };
    loggingService?: {
        getLogStats: () => { total: number; byLevel: Record<string, number> };
        copyLogsToClipboard: () => Promise<void>;
        clearLogs: () => void;
        getRecentLogs: (count: number) => Array<{timestamp: Date, level: number, category: string, message: string}>;
    };
    settingsTab?: KrispSettingsTab;
}

export class KrispSettingsTab extends PluginSettingTab {
    plugin: KrispNotesImporterPlugin;
    private localization: LocalizationService;

    constructor(app: App, plugin: KrispNotesImporterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.plugin.settingsTab = this;

        const currentLanguage = this.plugin.settingsManager.getSetting('language') as SupportedLanguage || 'en';
        this.localization = plugin.localizationService || new LocalizationService(currentLanguage);
    }

    private updateLanguage(newLanguage: SupportedLanguage): void {
        this.localization.setLanguage(newLanguage);
        this.display();
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h1', { text: this.localization.t('settings.title', {fallback: "Krisp Notes Importer Settings"}) });

        this.renderCurrentStatus(containerEl);
        this.renderLanguageSetting(containerEl);
        this.renderCoreAutomationSettings(containerEl);
        this.renderStorageSettings(containerEl);
        this.renderNamingAndTemplateSettings(containerEl);
        this.renderImportBehaviorSettings(containerEl);
        this.renderManualOperationsAndDiagnostics(containerEl);
        this.renderAboutPlugin(containerEl);
    }

    private renderCurrentStatus(containerEl: HTMLElement): void {
        const statusSectionEl = containerEl.createDiv({ cls: 'krisp-importer-status-section' });
        statusSectionEl.createEl('h2', { text: this.localization.t('settings.status.title', {fallback: "📊 Current Status"}) });

        const statusMessagesEl = statusSectionEl.createEl('div', {cls: 'krisp-status-messages'});
        statusMessagesEl.style.padding = '10px';
        statusMessagesEl.style.backgroundColor = 'var(--background-secondary)';
        statusMessagesEl.style.borderRadius = '5px';
        statusMessagesEl.style.marginBottom = '15px';
        statusMessagesEl.style.borderLeft = `4px solid var(--text-muted)`; // Default border

        const statusMessages: string[] = [];
        let statusColor = 'var(--color-grey)'; // Default color for border

        if (this.plugin.fileWatcherService && this.plugin.settingsManager) {
            const isWatching = this.plugin.fileWatcherService.isCurrentlyWatching();
            const watchedPath = this.plugin.fileWatcherService.getWatchedPath();
            const autoScanEnabled = this.plugin.settingsManager.getSetting('autoScanEnabled');

            if (isWatching && watchedPath) {
                statusMessages.push(this.localization.t('settings.status.watchingActive', { path: watchedPath }));
                statusColor = 'var(--color-green)';
            } else if (autoScanEnabled && (!watchedPath || watchedPath.trim() === '')) {
                statusMessages.push(this.localization.t('settings.status.watchingWarningFolderMissing'));
                statusColor = 'var(--color-yellow)';
            } else if (autoScanEnabled && watchedPath && !isWatching) {
                statusMessages.push(this.localization.t('settings.status.watchingStarting'));
                statusColor = 'var(--color-blue)';
            } else {
                statusMessages.push(this.localization.t('settings.status.watchingInactive'));
                statusColor = 'var(--color-red)';
                if (!autoScanEnabled) {
                    statusMessages.push(`- ${this.localization.t('settings.status.inactiveDetailEnableAutoScan')}`);
                }
                if (!watchedPath || watchedPath.trim() === '') {
                     statusMessages.push(`- ${this.localization.t('settings.status.inactiveDetailSetPath')}`);
                }
            }
        } else {
            statusMessages.push(this.localization.t('settings.status.serviceUnavailable'));
            statusColor = 'var(--color-orange)';
        }

        statusMessagesEl.empty(); // Очищаем предыдущие сообщения
        statusMessages.forEach(msg => {
            statusMessagesEl.createEl('p', { text: msg, cls: 'krisp-status-message-line' })
                           .style.margin = '3px 0';
        });
        statusMessagesEl.style.borderLeftColor = statusColor;

        // CSS стили (только если еще не добавлены)
        const styleId = 'krisp-importer-status-styles';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .krisp-importer-status-section { margin-bottom: 20px; }
                .krisp-importer-status-section h2 { margin-bottom: 8px; }
            `;
            containerEl.appendChild(styleEl);
        }
    }

    private renderLanguageSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.language.name', {fallback: "Interface Language"}))
            .setDesc(this.localization.t('settings.fields.language.desc', {fallback: "Choose the language for the plugin interface"}))
            .addDropdown(dropdown => dropdown
                .addOption('en', 'English')
                .addOption('ru', 'Русский')
                .setValue(this.plugin.settingsManager.getSetting('language'))
                .onChange(async (value: SupportedLanguage) => {
                    await this.plugin.settingsManager.updateSetting('language', value);
                    this.updateLanguage(value);
                }));
    }

    private renderCoreAutomationSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.coreAutomation', {fallback: "📂 Core: Watching & Automation"}) });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.watchedFolder.name', {fallback: "Watched Folder Path"}))
            .setDesc(this.localization.t('settings.fields.watchedFolder.desc', {fallback: "Full path to the folder where Krisp saves ZIP archives"}))
            .addText(text => text
                .setPlaceholder('/Users/username/Downloads/Krisp')
                .setValue(this.plugin.settingsManager.getSetting('watchedFolderPath'))
                .onChange(async (value) => {
                    const oldPath = this.plugin.settingsManager.getSetting('watchedFolderPath');
                    const newPath = value.trim();
                    await this.plugin.settingsManager.updateSetting('watchedFolderPath', newPath);

                    if (this.plugin.settingsManager.getSetting('autoScanEnabled') && this.plugin.fileWatcherService) {
                        if (newPath && newPath !== '') {
                            if (oldPath && oldPath.trim() !== '' && oldPath.trim() !== newPath && this.plugin.fileWatcherService.isCurrentlyWatching() && this.plugin.fileWatcherService.getWatchedPath() === oldPath.trim()) {
                                 await this.plugin.fileWatcherService.stopWatching();
                            }
                            await this.plugin.fileWatcherService.startWatching(newPath);
                        } else {
                            if (this.plugin.fileWatcherService.isCurrentlyWatching()) {
                                await this.plugin.fileWatcherService.stopWatching();
                            }
                            // Уведомление об ошибке (пустой путь) уже будет в статусе
                        }
                    }
                    this.display(); // Перерисовка для обновления UI, включая блок статуса
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.autoScan.name'))
            .setDesc(this.localization.t('settings.fields.autoScan.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSetting('autoScanEnabled'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('autoScanEnabled', value);
                    if (this.plugin.fileWatcherService) {
                        if (value) {
                            const watchedPath = this.plugin.settingsManager.getSetting('watchedFolderPath');
                            if (watchedPath && watchedPath.trim() !== '') {
                                await this.plugin.fileWatcherService.startWatching(watchedPath.trim());
                            }
                            // Если путь не указан, блок статуса это покажет
                        } else {
                            await this.plugin.fileWatcherService.stopWatching();
                        }
                    }
                    this.display(); // Перерисовка для обновления UI, включая блок статуса
                }));
    }

    private renderStorageSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.storage', {fallback: "🗄️ Obsidian Storage"}) });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.notesFolder.name', {fallback: "Notes Folder"}))
            .setDesc(this.localization.t('settings.fields.notesFolder.desc', {fallback: "Folder in your Obsidian vault for saving meeting notes"}))
            .addText(text => text
                .setPlaceholder('KrispNotes/Notes')
                .setValue(this.plugin.settingsManager.getSetting('notesFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('notesFolderPath', value.trim());
                }));

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.attachmentsFolder.name'))
            .setDesc(this.localization.t('settings.fields.attachmentsFolder.desc'))
            .addText(text => text
                .setPlaceholder('KrispNotes/Attachments')
                .setValue(this.plugin.settingsManager.getSetting('attachmentsFolderPath'))
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSetting('attachmentsFolderPath', value.trim());
                }));
    }

    private renderNamingAndTemplateSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.namingAndTemplates', {fallback: "🎨 Appearance & Naming"}) });

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.noteNameTemplate.name', {fallback: "Note Name Template"}))
            .setDesc(this.localization.t('settings.fields.noteNameTemplate.desc', {fallback: "Template for naming note files. Available variables: {{YYYY}}, {{MM}}, {{DD}}, {{HHMM}}, {{meetingTitle}}"}))
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

        new Setting(containerEl)
            .setName(this.localization.t('settings.fields.noteContentTemplate.name'))
            .setDesc(this.localization.t('settings.fields.noteContentTemplate.desc'))
            .addTextArea(text => {
                text.setValue(this.plugin.settingsManager.getSetting('noteContentTemplate'))
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSetting('noteContentTemplate', value);
                    });
                text.inputEl.rows = 10;
                text.inputEl.style.width = '100%';
                text.inputEl.style.minHeight = '150px';
            })
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.restoreTemplate'))
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('noteContentTemplate', DEFAULT_SETTINGS.noteContentTemplate);
                    this.display();
                    new Notice(this.localization.t('notifications.success.templateRestored', {fallback: "Default template restored."}));
                }));
    }

    private renderImportBehaviorSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.importBehavior', {fallback: "⚙️ Import Behavior"}) });

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
    }

    private renderManualOperationsAndDiagnostics(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.manualOperations', {fallback: "🛠️ Manual Operations & Diagnostics"}) });

        // Кнопка Test Import
        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.testImport', {fallback: "Test Manual Import"}))
            .setDesc(this.localization.t('modals.testImport.description', {fallback: "Manually select a ZIP file to test the import process."}))
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.testImport', {fallback: "Select & Import File"}))
                .onClick(() => {
                    new TestImportModal(this.app, this.plugin, this.localization).open();
                }));

        // Кнопка Process All Existing ZIP files (Scan existing files)
        if (this.plugin.fileWatcherService?.scanExistingFiles) {
            new Setting(containerEl)
                .setName(this.localization.t('commands.scanExisting', {fallback: "Process All Existing Files"}))
                .setDesc(this.localization.t('commands.scanExistingDesc', {fallback: "Scan the watched folder and import all existing ZIP files that haven't been processed yet."}))
                .addButton(button => button
                    .setButtonText(this.localization.t('settings.buttons.massImport', {fallback: "Scan and Import All"}))
                    .onClick(async () => {
                        if (this.plugin.fileWatcherService?.scanExistingFiles) {
                            const watchedPath = this.plugin.settingsManager.getSetting('watchedFolderPath');
                            if (!watchedPath || watchedPath.trim() === '') {
                                new Notice(this.localization.t('settings.errors.watchedFolderMissing', {fallback: 'Watched folder path is not specified.'}));
                                return;
                            }
                            try {
                                await this.plugin.fileWatcherService.scanExistingFiles();
                                new Notice(this.localization.t('notifications.info.scanningFolderComplete', {fallback: 'Folder scan and import complete!'}));
                            } catch (error) {
                                console.error('Error during mass import:', error);
                                new Notice(this.localization.t('notifications.error.massImportFailed', {fallback: 'Mass import failed. Check logs.'}));
                            }
                        } else {
                            new Notice(this.localization.t('settings.status.serviceUnavailable', {fallback: 'File Watcher service is not available.'}));
                        }
                    }));
        }

        // Кнопка Show Logs
        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.showLogs', {fallback: "Show Logs"}))
            .setDesc(this.localization.t('modals.logs.description', {fallback: "View recent activity logs for troubleshooting."}))
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.showLogs', {fallback: "Open Logs"}))
                .onClick(() => {
                     if (this.plugin.loggingService) {
                        new LogsModal(this.app, this.plugin, this.localization).open();
                    } else {
                        new Notice(this.localization.t('settings.status.serviceUnavailable', {fallback: "Logging service not available."}))
                    }
                }));

        // Кнопка Reset Settings
        new Setting(containerEl)
            .setName(this.localization.t('settings.buttons.resetSettings', {fallback: "Reset Settings"}))
            .setDesc(this.localization.t('settingsInfoTooltips.resetSettingsDesc', {fallback: "Reset all plugin settings to their default values."}))
            .addButton(button => button
                .setButtonText(this.localization.t('settings.buttons.resetSettings', {fallback: "Reset to Defaults"}))
                .setClass('mod-warning')
                .onClick(() => {
                    new ConfirmResetModal(this.app, this.plugin, this.localization).open();
                }));
    }

    private renderAboutPlugin(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: this.localization.t('settings.sections.aboutPlugin', {fallback: "ℹ️ About Plugin"}) });

        const pluginManifest = this.plugin.manifest as PluginManifest;
        const author = pluginManifest.author || "Unknown Author";
        const repoName = pluginManifest.id || "plugin-repo"; // Use plugin id as a fallback for repo name
        const authorId = pluginManifest.authorUrl?.split('/').pop() || author.toLowerCase().replace(/\s+/g, '-');
        const githubRepoUrl = `https://github.com/${authorId}/${repoName}`;
        const issuesUrl = `${githubRepoUrl}/issues`;
        // const fundingUrl = pluginManifest.fundingUrl; // This field does not exist in PluginManifest

        new Setting(containerEl)
            .setName(this.localization.t('settings.info.version', {fallback: "Plugin Version"}))
            .setDesc(pluginManifest.version)
            .addExtraButton(button => button
                .setIcon("github")
                .setTooltip(this.localization.t('settingsInfoTooltips.githubRepoTooltip', {fallback: "Visit GitHub Repository"}))
                .onClick(() => {
                    window.open(githubRepoUrl, '_blank');
                })
            )
            .addExtraButton(button => button
                .setIcon("bug")
                .setTooltip(this.localization.t('settingsInfoTooltips.reportIssueTooltip', {fallback: "Report an Issue"}))
                .onClick(() => {
                     window.open(issuesUrl, '_blank');
                })
            );

        containerEl.createEl('p', { text: this.localization.t('settingsInfoTooltips.developer', {fallback: `Developed by: ${author}`, author: author })});

        // Simplified support section
        const supportP = containerEl.createEl('p');
        supportP.appendText(this.localization.t('settingsInfoTooltips.supportDevelopment', {fallback: 'If you find this plugin useful, consider supporting its development. More information can be found on the plugin\'s GitHub page: '}));
        supportP.createEl('a', {
            text: this.localization.t('settingsInfoTooltips.githubRepoTooltip', {fallback: 'Visit GitHub Repository'}),
            href: githubRepoUrl,
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });

        if (pluginManifest.description) {
            containerEl.createEl('p', { text: this.localization.t('settingsInfoTooltips.pluginDescription', {fallback: `Description: ${pluginManifest.description}`, description: pluginManifest.description}) });
        }
    }
}

// --- Вспомогательные классы для модальных окон ---
class TestImportModal extends Modal {
    plugin: KrispNotesImporterPlugin;
    localization: LocalizationService;
    filePath: string = '';

    constructor(app: App, plugin: KrispNotesImporterPlugin, localization: LocalizationService) {
        super(app);
        this.plugin = plugin;
        this.localization = localization;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.localization.t('modals.manualImport.title', {fallback: "Manual ZIP Import"}) });
        contentEl.createEl('p', { text: this.localization.t('modals.manualImport.desc', {fallback: "Enter the full path to the .zip file you want to import."}) });

        const inputEl = contentEl.createEl('input', { type: 'text', placeholder: '/path/to/your-meeting.zip' });
        inputEl.style.width = '100%';
        inputEl.style.marginBottom = '10px';
        inputEl.addEventListener('change', (e) => this.filePath = (e.target as HTMLInputElement).value.trim());

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        const importBtn = buttonContainer.createEl('button', { text: this.localization.t('modals.manualImport.buttonImport', {fallback: "Import"}), cls: 'mod-cta' });
        importBtn.onclick = async () => {
            if (this.filePath) {
                if (this.plugin.processingService && this.plugin.settingsManager) { // Добавил проверку settingsManager
                    try {
                        new Notice(this.localization.t('notifications.info.processing', { file: this.filePath.split('/').pop() || this.filePath }), 5000);
                        // Получаем все настройки для передачи в processZipFile
                        const currentSettings = this.plugin.settingsManager.getSetting('all'); // Убедиться, что getSetting('all') работает
                        await this.plugin.processingService.processZipFile(this.filePath, currentSettings);
                        new Notice(this.localization.t('notifications.success.manualImportComplete', {fallback: 'Manual import complete.'}), 5000);
                    } catch (error: any) {
                        new Notice(`${this.localization.t('notifications.error.manualImportFailed', {fallback: 'Manual import failed.'})}: ${error.message}`, 7000);
                        console.error('[Krisp Importer] Manual import error:', error);
                    }
                } else {
                     new Notice(this.localization.t('settings.errors.serviceUnavailableGeneric', { service: 'Processing or Settings Service', fallback: 'Required service not available.' }), 5000);
                }
                this.close();
            } else {
                new Notice(this.localization.t('modals.manualImport.errorNoPath', {fallback: 'File path cannot be empty.'}), 5000);
            }
        };
        buttonContainer.createEl('button', { text: this.localization.t('modals.confirmReset.cancel', {fallback: "Cancel"}) })
            .onclick = () => this.close();

        inputEl.focus();
         inputEl.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                importBtn.click();
            }
        });
        // Стили для модального окна
        const styleId = 'krisp-modal-styles'; // Общий ID для стилей модалок
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .modal-button-container { display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end; }
            `;
            contentEl.appendChild(styleEl);
        }
    }
    onClose() { this.contentEl.empty(); }
}

class LogsModal extends Modal {
    plugin: KrispNotesImporterPlugin;
    localization: LocalizationService;

    constructor(app: App, plugin: KrispNotesImporterPlugin, localization: LocalizationService) {
        super(app);
        this.plugin = plugin;
        this.localization = localization;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.localization.t('modals.logs.title', {fallback: "Plugin Logs"}) });

        if (!this.plugin.loggingService) {
            contentEl.createEl('p', {text: this.localization.t('settings.errors.serviceUnavailableGeneric', {service: 'LoggingService', fallback: 'Logging service is not available.'}) });
            return;
        }

        const stats = this.plugin.loggingService.getLogStats();
        const statsEl = contentEl.createDiv({cls: 'krisp-log-stats'});
        statsEl.createEl('p', { text: `${this.localization.t('modals.logs.totalEntries', {fallback: 'Total entries'})}: ${stats.total}` });
        const levelStats = Object.entries(stats.byLevel).map(([level, count]) => `${level.toUpperCase()}: ${count}`).join(', ');
        statsEl.createEl('p', { text: `${this.localization.t('modals.logs.byLevel', {fallback: 'By level'})}: ${levelStats || this.localization.t('modals.logs.noEntries', {fallback: 'No entries'})}` });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.justifyContent = 'flex-start'; // Для лог модалки кнопки слева

        buttonContainer.createEl('button', { text: this.localization.t('modals.logs.copy', {fallback: "Copy"}), cls: 'mod-cta' })
            .onclick = async () => {
                if (!this.plugin.loggingService) return;
                await this.plugin.loggingService.copyLogsToClipboard();
                new Notice(this.localization.t('modals.logs.copiedNotice', {fallback: 'Logs copied to clipboard.'}), 3000);
            };
        buttonContainer.createEl('button', { text: this.localization.t('modals.logs.clear', {fallback: "Clear"}), cls: 'mod-warning' })
            .onclick = () => {
                if (!this.plugin.loggingService) return;
                this.plugin.loggingService.clearLogs();
                this.close();
                new Notice(this.localization.t('modals.logs.clearedNotice', {fallback: 'Logs cleared.'}), 3000);
            };
        buttonContainer.createEl('button', { text: this.localization.t('modals.logs.close', {fallback: "Close"}) })
            .onclick = () => this.close();

        const logsContainer = contentEl.createDiv({cls: 'krisp-logs-display'});
        const recentLogs = this.plugin.loggingService.getRecentLogs(100);
        if (recentLogs.length === 0) {
            logsContainer.textContent = this.localization.t('modals.logs.noEntries', {fallback: 'No log entries.'});
        } else {
            const logsText = recentLogs.map(entry => {
                const timestamp = entry.timestamp.toLocaleString();
                const level = entry.level === 0 ? 'DEBUG' : entry.level === 1 ? 'INFO' : entry.level === 2 ? 'WARN' : 'ERROR';
                return `[${timestamp}] [${level}] [${entry.category}] ${entry.message}`;
            }).join('\n');
            logsContainer.textContent = logsText;
        }

        const styleId = 'krisp-logs-modal-styles'; // Общий ID для стилей модалок
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .modal-button-container { display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end; } /* Default: flex-end */
                .krisp-log-stats { margin-bottom: 15px; padding: 10px; background-color: var(--background-secondary); border-radius: 5px; }
                .krisp-logs-display { max-height: 400px; overflow: auto; border: 1px solid var(--background-modifier-border); border-radius: 5px; padding: 10px; background-color: var(--background-primary-alt); font-family: monospace; font-size: 0.8em; white-space: pre-wrap; margin-top:15px; }
            `;
            contentEl.appendChild(styleEl);
        }
    }
    onClose() { this.contentEl.empty(); }
}

class ConfirmResetModal extends Modal {
    plugin: KrispNotesImporterPlugin;
    localization: LocalizationService;
    constructor(app: App, plugin: KrispNotesImporterPlugin, localization: LocalizationService) {
        super(app);
        this.plugin = plugin;
        this.localization = localization;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.localization.t('modals.confirmReset.title') });
        contentEl.createEl('p', { text: this.localization.t('modals.confirmReset.message') });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container'}); // attr style убран, будет через CSS
        buttonContainer.createEl('button', { text: this.localization.t('modals.confirmReset.confirm'), cls: 'mod-warning' })
            .onclick = async () => {
                if (this.plugin.settingsManager && this.plugin.settingsTab) {
                    try {
                        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                            await this.plugin.settingsManager.updateSetting(key, value);
                        }
                        new Notice(this.localization.t('notifications.success.settingsReset'), 5000);
                        this.plugin.settingsTab.display();
                    } catch (error: any) {
                        new Notice(`${this.localization.t('notifications.error.settingsResetFailed', {fallback: 'Failed to reset settings.'})}: ${error.message}`, 7000);
                        console.error('[Krisp Importer] Settings reset error:', error);
                    }
                } else {
                     new Notice(this.localization.t('settings.errors.serviceUnavailableGeneric', { service: 'SettingsManager or SettingsTab', fallback: 'Required services not available for reset.' }), 5000);
                }
                this.close();
            };
        buttonContainer.createEl('button', { text: this.localization.t('modals.confirmReset.cancel', {fallback: "Cancel"}) })
            .onclick = () => this.close();

        // Стили для модального окна (если еще не добавлены)
        const styleId = 'krisp-modal-styles';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .modal-button-container { display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end; }
            `;
            contentEl.appendChild(styleEl);
        }
    }
    onClose() { this.contentEl.empty(); }
}
