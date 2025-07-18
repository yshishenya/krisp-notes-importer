import { App, Plugin, Modal, Setting, Notice, TextComponent } from 'obsidian';
import { SettingsManager } from './core/SettingsManager';
import { KrispSettingsTab } from './ui/SettingsTab';
import { KrispImporterSettings, DEFAULT_SETTINGS } from './interfaces';
import { ProcessingService } from './core/ProcessingService';
import { FileWatcherService } from './core/FileWatcherService';
import { NotificationService } from './core/NotificationService';
import { LoggingService, LogLevel } from './core/LoggingService';
import { StatusBarService } from './core/StatusBarService';
import { LocalizationService, SupportedLanguage } from './core/LocalizationService';

export default class KrispNotesImporterPlugin extends Plugin {
	settingsManager: SettingsManager;
	processingService: ProcessingService;
	notificationService: NotificationService;
	fileWatcherService: FileWatcherService;
	loggingService: LoggingService;
	statusBarService: StatusBarService;
	localizationService: LocalizationService;

	async onload() {
		console.log('Loading Krisp Notes Importer plugin...');

		// Инициализируем LoggingService первым
		this.loggingService = new LoggingService(LogLevel.INFO);
		this.loggingService.info('Plugin', 'Начинаю загрузку плагина Krisp Notes Importer');

		this.settingsManager = new SettingsManager(this);
		await this.settingsManager.loadSettings();
		        this.loggingService.info('Plugin', 'Settings loaded');

		// Инициализируем LocalizationService
		const currentLanguage = this.settingsManager.getSetting('language') as SupportedLanguage || 'en';
		this.localizationService = new LocalizationService(currentLanguage);
		this.loggingService.info('Plugin', `Локализация инициализирована: ${currentLanguage}`);

		this.notificationService = new NotificationService();
		this.statusBarService = new StatusBarService(this);
		this.processingService = new ProcessingService(this.app, this.statusBarService, this.loggingService);
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
			name: this.localizationService.t('commands.importZip'),
			callback: () => {
				this.loggingService.info('Commands', 'Запущена команда ручного импорта ZIP-файла');
				new FilePathModal(this.app, async (filePath) => {
					if (filePath && filePath.trim() !== '') {
						const trimmedPath = filePath.trim();
						this.loggingService.info('Commands', `Начинаю ручной импорт файла: ${trimmedPath}`);

						// Устанавливаем статус Processing перед началом импорта
						if (this.statusBarService) {
							this.statusBarService.setProcessing(trimmedPath.split('/').pop() || trimmedPath);
						}

						try {
							await this.processingService.processZipFile(trimmedPath, this.settingsManager.getAllSettings());
						} catch (error) {
							// Ошибки из processZipFile уже должны логироваться и выводить Notice
							// Дополнительно можно убедиться, что статус Error установлен, если ProcessingService это не сделал
							if (this.statusBarService && this.statusBarService.getCurrentStatus() !== 'error') {
								this.statusBarService.setError("Ошибка ручного импорта");
							}
						} finally {
							// Восстанавливаем статус StatusBar
							if (this.statusBarService) {
								if (this.settingsManager.getSetting('autoScanEnabled') && this.fileWatcherService.isCurrentlyWatching()) {
									this.statusBarService.setWatching(this.fileWatcherService.getWatchedPath());
								} else {
									this.statusBarService.setIdle('Ручной импорт завершен');
								}
							}
						}
					} else {
						this.loggingService.warn('Commands', 'Попытка импорта с пустым путем к файлу');
						new Notice('File path cannot be empty.');
					}
				}, this.localizationService).open();
			}
		});

		// Команды для FileWatcherService
		this.addCommand({
			id: 'start-auto-watching',
			name: this.localizationService.t('commands.startWatching'),
			callback: async () => {
				const watchedPath = this.settingsManager.getSetting('watchedFolderPath');
				if (watchedPath && watchedPath.trim() !== '') {
					this.statusBarService.setWatching(watchedPath);
					await this.fileWatcherService.startWatching(watchedPath);
				} else {
					            this.statusBarService.setError('No watched folder specified');
					new Notice('Please set the watched folder path in settings first.');
				}
			}
		});

		this.addCommand({
			id: 'stop-auto-watching',
			name: this.localizationService.t('commands.stopWatching'),
			callback: async () => {
				this.statusBarService.setIdle('Отслеживание остановлено');
				await this.fileWatcherService.stopWatching();
			}
		});

		this.addCommand({
			id: 'scan-existing-files',
			name: this.localizationService.t('commands.scanExisting'),
			callback: async () => {
				// Логика установки статуса Processing и его сброса теперь полностью внутри fileWatcherService.scanExistingFiles()
				await this.fileWatcherService.scanExistingFiles();
				// Нет необходимости устанавливать здесь setIdle, так как scanExistingFiles это сделает корректно
			}
		});

		// Команда для отладки настроек
		this.addCommand({
			id: 'debug-settings',
			name: this.localizationService.t('commands.debugSettings'),
			callback: () => {
				const settings = this.settingsManager.getAllSettings();
				console.log('[Krisp Importer] Current settings:', settings);
				new Notice(`Settings logged to console. deleteZipAfterImport: ${settings.deleteZipAfterImport}`, 5000);
			}
		});

		// Команда для проверки статуса отслеживания
		this.addCommand({
			id: 'check-watching-status',
			name: this.localizationService.t('commands.checkStatus'),
			callback: () => {
				const isWatching = this.fileWatcherService.isCurrentlyWatching();
				const watchedPath = this.fileWatcherService.getWatchedPath();
				const autoScanEnabled = this.settingsManager.getSetting('autoScanEnabled');

				console.log('[Krisp Importer] Watching status:', {
					isWatching,
					watchedPath,
					autoScanEnabled
				});

				const statusMessage = isWatching
					? `✅ Отслеживание активно: ${watchedPath}`
					: `❌ Отслеживание неактивно. AutoScan в настройках: ${autoScanEnabled ? 'включен' : 'выключен'}`;

				new Notice(statusMessage, 7000);
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
			this.loggingService.destroy();
		}

		console.log('Unloading Krisp Notes Importer plugin.');
	}
}

class FilePathModal extends Modal {
	filePath: string;
	onSubmitCallback: (filePath: string) => Promise<void>;
	localization: LocalizationService;
	private inputEl: HTMLInputElement | null = null; // Сохраняем ссылку для cleanup
	private keypressHandler: ((e: KeyboardEvent) => void) | null = null; // Сохраняем обработчик

	constructor(app: App, onSubmitCallback: (filePath: string) => Promise<void>, localization: LocalizationService) {
		super(app);
		this.onSubmitCallback = onSubmitCallback;
		this.localization = localization;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.localization.t('modal.importZip.title') });

		new Setting(contentEl)
			.setName(this.localization.t('modal.importZip.pathLabel'))
			.setDesc(this.localization.t('modal.importZip.pathDesc'))
			.addText(text => {
				text.setPlaceholder('/path/to/your/krisp_meeting.zip');
				text.onChange(value => {
					this.filePath = value;
				});
				text.inputEl.style.width = '100%';
				this.keypressHandler = (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.submitForm();
					}
				};
				text.inputEl.addEventListener('keypress', this.keypressHandler);
				this.inputEl = text.inputEl; // Сохраняем ссылку на input элемент
			});

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText(this.localization.t('modal.importZip.importButton'))
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
			new Notice(this.localization.t('modal.importZip.emptyPathError'));
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		if (this.inputEl) {
			this.inputEl.removeEventListener('keypress', this.keypressHandler!);
		}
	}
}
