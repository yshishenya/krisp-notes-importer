import { App, Plugin, Modal, Setting, Notice, TextComponent } from 'obsidian';
import { SettingsManager } from './core/SettingsManager';
import { KrispSettingsTab } from './ui/SettingsTab';
import { KrispImporterSettings, DEFAULT_SETTINGS } from './interfaces';
import { ProcessingService } from './core/ProcessingService';
import { FileWatcherService } from './core/FileWatcherService';
import { NotificationService } from './core/NotificationService';

export default class KrispNotesImporterPlugin extends Plugin {
	settingsManager: SettingsManager;
	processingService: ProcessingService;
	notificationService: NotificationService;
	fileWatcherService: FileWatcherService;

	async onload() {
		console.log('Loading Krisp Notes Importer plugin...');

		this.settingsManager = new SettingsManager(this);
		await this.settingsManager.loadSettings();

		this.processingService = new ProcessingService(this.app);
		this.notificationService = new NotificationService();
		this.fileWatcherService = new FileWatcherService(
			this.app,
			this.processingService,
			this.notificationService,
			() => this.settingsManager.getAllSettings()
		);

		this.addSettingTab(new KrispSettingsTab(this.app, this));

		this.addCommand({
			id: 'import-krisp-zip-manually',
			name: 'Krisp Importer: Import ZIP file manually',
			callback: () => {
				new FilePathModal(this.app, async (filePath) => {
					if (filePath && filePath.trim() !== '') {
						new Notice(`Starting import for: ${filePath}`);
						await this.processingService.processZipFile(filePath, this.settingsManager.settings);
					} else {
						new Notice('File path cannot be empty.');
					}
				}).open();
			}
		});

		// Команды для FileWatcherService
		this.addCommand({
			id: 'start-auto-watching',
			name: 'Krisp Importer: Start auto-watching folder',
			callback: async () => {
				const watchedPath = this.settingsManager.getSetting('watchedFolderPath');
				if (watchedPath && watchedPath.trim() !== '') {
					await this.fileWatcherService.startWatching(watchedPath);
				} else {
					new Notice('Please set the watched folder path in settings first.');
				}
			}
		});

		this.addCommand({
			id: 'stop-auto-watching',
			name: 'Krisp Importer: Stop auto-watching',
			callback: async () => {
				await this.fileWatcherService.stopWatching();
			}
		});

		this.addCommand({
			id: 'scan-existing-files',
			name: 'Krisp Importer: Scan existing files in folder',
			callback: async () => {
				await this.fileWatcherService.scanExistingFiles();
			}
		});

		// Автозапуск отслеживания если включено в настройках
		const autoScanEnabled = this.settingsManager.getSetting('autoScanEnabled');
		const watchedPath = this.settingsManager.getSetting('watchedFolderPath');
		if (autoScanEnabled && watchedPath && watchedPath.trim() !== '') {
			await this.fileWatcherService.startWatching(watchedPath);
		}

		console.log('Krisp Notes Importer plugin loaded successfully.');
	}

	onunload() {
		// Останавливаем отслеживание при выгрузке плагина
		if (this.fileWatcherService) {
			this.fileWatcherService.stopWatching();
		}
		console.log('Unloading Krisp Notes Importer plugin.');
	}
}

class FilePathModal extends Modal {
	filePath: string;
	onSubmitCallback: (filePath: string) => Promise<void>;

	constructor(app: App, onSubmitCallback: (filePath: string) => Promise<void>) {
		super(app);
		this.onSubmitCallback = onSubmitCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Import Krisp ZIP File' });

		new Setting(contentEl)
			.setName('Path to .zip file')
			.setDesc('Enter the full path to the Krisp .zip file you want to import.')
			.addText(text => {
				text.setPlaceholder('/path/to/your/krisp_meeting.zip');
				text.onChange(value => {
					this.filePath = value;
				});
				text.inputEl.style.width = '100%';
				text.inputEl.addEventListener('keypress', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.submitForm();
					}
				});
			});

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Import')
				.setCta()
				.onClick(() => {
					this.submitForm();
				}));
	}

	submitForm() {
		if (this.filePath && this.filePath.trim() !== '') {
			this.onSubmitCallback(this.filePath.trim());
			this.close();
		} else {
			new Notice('Please enter a file path.');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
