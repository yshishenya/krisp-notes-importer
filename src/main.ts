import { App, Plugin, Modal, Setting, Notice, TextComponent } from 'obsidian';
import { SettingsManager } from './core/SettingsManager';
import { KrispSettingsTab } from './ui/SettingsTab';
import { KrispImporterSettings, DEFAULT_SETTINGS } from './interfaces';
import { ProcessingService } from './core/ProcessingService';

export default class KrispNotesImporterPlugin extends Plugin {
	settingsManager: SettingsManager;
	processingService: ProcessingService;

	async onload() {
		console.log('Loading Krisp Notes Importer plugin...');

		this.settingsManager = new SettingsManager(this);
		await this.settingsManager.loadSettings();

		this.processingService = new ProcessingService(this.app);

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

		console.log('Krisp Notes Importer plugin loaded successfully.');
	}

	onunload() {
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
