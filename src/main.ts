import { App, Plugin, Modal, Setting, Notice, TextComponent } from 'obsidian';
import { SettingsManager } from './core/SettingsManager';
import { KrispSettingsTab } from './ui/SettingsTab';
import { KrispImporterSettings, DEFAULT_SETTINGS } from './interfaces';
import { ProcessingService } from './core/ProcessingService';
import { FileWatcherService } from './core/FileWatcherService';
import { NotificationService } from './core/NotificationService';
import { LoggingService, LogLevel } from './core/LoggingService';
import { StatusBarService } from './core/StatusBarService';

export default class KrispNotesImporterPlugin extends Plugin {
	settingsManager: SettingsManager;
	processingService: ProcessingService;
	notificationService: NotificationService;
	fileWatcherService: FileWatcherService;
	loggingService: LoggingService;
	statusBarService: StatusBarService;

	async onload() {
		console.log('Loading Krisp Notes Importer plugin...');

		// Инициализируем LoggingService первым
		this.loggingService = new LoggingService(LogLevel.INFO);
		this.loggingService.info('Plugin', 'Начинаю загрузку плагина Krisp Notes Importer');

		this.settingsManager = new SettingsManager(this);
		await this.settingsManager.loadSettings();
		this.loggingService.info('Plugin', 'Настройки загружены');

		this.notificationService = new NotificationService();
		this.statusBarService = new StatusBarService(this);
		this.processingService = new ProcessingService(this.app, this.statusBarService);
		this.loggingService.info('Plugin', 'Основные сервисы инициализированы');
		this.fileWatcherService = new FileWatcherService(
			this.app,
			this.processingService,
			this.notificationService,
			() => this.settingsManager.getAllSettings(),
			this.statusBarService
		);

		this.addSettingTab(new KrispSettingsTab(this.app, this));

		this.addCommand({
			id: 'import-krisp-zip-manually',
			name: 'Krisp Importer: Import ZIP file manually',
			callback: () => {
				this.loggingService.info('Commands', 'Запущена команда ручного импорта ZIP-файла');
				new FilePathModal(this.app, async (filePath) => {
					if (filePath && filePath.trim() !== '') {
						this.loggingService.info('Commands', `Начинаю ручной импорт файла: ${filePath}`);
						new Notice(`Starting import for: ${filePath}`);
						await this.processingService.processZipFile(filePath, this.settingsManager.settings);
					} else {
						this.loggingService.warn('Commands', 'Попытка импорта с пустым путем к файлу');
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
					this.statusBarService.setWatching(watchedPath);
					await this.fileWatcherService.startWatching(watchedPath);
				} else {
					this.statusBarService.setError('Не указана папка для отслеживания');
					new Notice('Please set the watched folder path in settings first.');
				}
			}
		});

		this.addCommand({
			id: 'stop-auto-watching',
			name: 'Krisp Importer: Stop auto-watching',
			callback: async () => {
				this.statusBarService.setIdle('Отслеживание остановлено');
				await this.fileWatcherService.stopWatching();
			}
		});

		this.addCommand({
			id: 'scan-existing-files',
			name: 'Krisp Importer: Scan existing files in folder',
			callback: async () => {
				this.statusBarService.setProcessing('Сканирование файлов');
				await this.fileWatcherService.scanExistingFiles();
				this.statusBarService.setIdle('Сканирование завершено');
			}
		});

		// Команда для отладки настроек
		this.addCommand({
			id: 'debug-settings',
			name: 'Krisp Importer: Debug current settings',
			callback: () => {
				const settings = this.settingsManager.getAllSettings();
				console.log('[Krisp Importer] Current settings:', settings);
				new Notice(`Settings logged to console. deleteZipAfterImport: ${settings.deleteZipAfterImport}`, 5000);
			}
		});

		// Автозапуск отслеживания если включено в настройках
		const autoScanEnabled = this.settingsManager.getSetting('autoScanEnabled');
		const watchedPath = this.settingsManager.getSetting('watchedFolderPath');
		if (autoScanEnabled && watchedPath && watchedPath.trim() !== '') {
			this.loggingService.info('Plugin', `Автозапуск отслеживания папки: ${watchedPath}`);
			this.statusBarService.setWatching(watchedPath);
			await this.fileWatcherService.startWatching(watchedPath);
		} else {
			this.statusBarService.setIdle('Готов к работе');
		}

		this.loggingService.info('Plugin', 'Плагин Krisp Notes Importer загружен успешно');
		console.log('Krisp Notes Importer plugin loaded successfully.');
	}

	onunload() {
		// Останавливаем отслеживание при выгрузке плагина
		if (this.fileWatcherService) {
			this.fileWatcherService.stopWatching();
		}

		// Очищаем StatusBar
		if (this.statusBarService) {
			this.statusBarService.destroy();
		}

		if (this.loggingService) {
			this.loggingService.info('Plugin', 'Выгружаю плагин Krisp Notes Importer');
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
