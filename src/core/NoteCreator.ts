import { App, TFile, Vault, normalizePath } from 'obsidian';
import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import * as path from 'path'; // Для работы с путями

export class NoteCreator {
    private app: App;
    private vault: Vault;
    private settings: KrispImporterSettings;

    constructor(app: App, settings: KrispImporterSettings) {
        this.app = app;
        this.vault = app.vault;
        this.settings = settings;
    }

    // Форматирование Summary блока для лучшей читаемости
    private formatSummaryForCallout(summaryLines: string[]): string {
        if (!summaryLines || summaryLines.length === 0) {
            return '*Краткое содержание недоступно*';
        }

        const outputLines: string[] = [];
        let sectionCounter = 0;
        let inListItemContinuation = false;

        for (let i = 0; i < summaryLines.length; i++) {
            const line = summaryLines[i];
            const strippedLine = line.trim();

            // Пропустить пустые строки
            if (strippedLine === '') {
                outputLines.push('');
                inListItemContinuation = false;
                continue;
            }

            // Пропустить строку "Summary" если это первая значимая строка
            if (sectionCounter === 0 && strippedLine.toLowerCase() === 'summary') {
                continue;
            }

            // Проверка на маркер списка (- или * или •)
            const isListMarker = /^[-*•]\s+/.test(strippedLine);

            if (isListMarker) {
                // Это новый элемент списка
                const listText = strippedLine.replace(/^[-*•]\s+/, '');
                outputLines.push(`- ${listText}`);
                inListItemContinuation = true;
            } else {
                if (inListItemContinuation) {
                    // Это продолжение предыдущего элемента списка
                    outputLines.push(`  ${strippedLine}`);
                } else {
                    // Это новый заголовок секции
                    inListItemContinuation = false;
                    sectionCounter++;

                    // Добавляем пустую строку перед новым заголовком (если это не первый)
                    if (sectionCounter > 1) {
                        outputLines.push('');
                    }

                    outputLines.push(`### ${sectionCounter}. ${strippedLine}`);
                    outputLines.push(''); // Пустая строка после заголовка
                }
            }
        }

        // Добавляем префикс > ко всем строкам для callout
        return outputLines.map(line => {
            if (line === '') {
                return '>';
            }
            return `> ${line}`;
        }).join('\n');
    }

    // Заполняет шаблон заметки данными
    private applyTemplate(template: string, data: ParsedKrispData, settings: KrispImporterSettings, noteFileName?: string, audioFilePath?: string): string {
        let content = template;

        // Основные данные
        content = content.replace(/{{meetingTitle}}/g, data.meetingTitle || 'Untitled Meeting');
        content = content.replace(/{{title}}/g, data.meetingTitle || 'Untitled Meeting'); // Совместимость со старыми шаблонами
        content = content.replace(/{{date}}/g, data.date || 'YYYY-MM-DD');
        content = content.replace(/{{time}}/g, data.time || 'HH:MM');
        content = content.replace(/{{duration}}/g, data.duration || 'N/A');

        // Участники
        const participantsList = data.participants?.map(p => `- **${p}**`).join('\n') || '- *Информация о участниках недоступна*';
        content = content.replace(/{{participantsList}}/g, participantsList);
        content = content.replace(/{{participants}}/g, data.participants?.join(', ') || 'N/A');

        // Расширенная аналитика
        content = content.replace(/{{participantsCount}}/g, String(data.participantsCount || 0));
        content = content.replace(/{{transcriptWords}}/g, String(data.transcriptWords || 0));
        content = content.replace(/{{mostActiveSpeaker}}/g, data.mostActiveSpeaker || 'N/A');
        content = content.replace(/{{importDate}}/g, data.importDate || new Date().toLocaleDateString('ru-RU'));

        // Статистика участников
        const participantsStats = data.participantsStats?.join('\n') || '*Статистика недоступна*';
        content = content.replace(/{{participantsStats}}/g, participantsStats);

        // Извлеченные сущности
        const extractedEntities = data.extractedEntities?.length
            ? data.extractedEntities.join('\n\n')
            : '*Дополнительная информация не найдена*';
        content = content.replace(/{{extractedEntities}}/g, extractedEntities);

        // Связанные ссылки
        const relatedLinks = data.relatedLinks?.length
            ? '\n' + data.relatedLinks.join('\n')
            : '';
        content = content.replace(/{{relatedLinks}}/g, relatedLinks);

        // Секции Krisp - правильное форматирование для callout блоков
        const summaryText = data.summary?.length
            ? this.formatSummaryForCallout(data.summary)
            : '*Краткое содержание недоступно*';
        content = content.replace(/{{summary}}/g, summaryText);

        const actionItemsList = data.actionItems?.map(item => `- [ ] ${item}`).join('\n> \n> ') || '*Нет задач для выполнения*';
        content = content.replace(/{{actionItemsList}}/g, actionItemsList);
        content = content.replace(/{{actionItems}}/g, actionItemsList); // Совместимость со старыми шаблонами

        const keyPointsList = data.keyPoints?.map(item => `- ${item}`).join('\n> \n> ') || '*Ключевые моменты не выделены*';
        content = content.replace(/{{keyPointsList}}/g, keyPointsList);
        content = content.replace(/{{keyPoints}}/g, keyPointsList); // Совместимость со старыми шаблонами

        // Транскрипт
        const formattedTranscriptForCallout = data.formattedTranscript
            ? data.formattedTranscript.split('\n').map(line => `> ${line}`).join('\n')
            : '> *Транскрипт недоступен*';
        content = content.replace(/{{formattedTranscript}}/g, formattedTranscriptForCallout);
        content = content.replace(/{{transcript}}/g, formattedTranscriptForCallout); // Совместимость со старыми шаблонами
        content = content.replace(/{{rawTranscript}}/g, data.rawTranscript || 'Сырой транскрипт недоступен');

        // Теги для YAML (включая умные теги)
        const allTags = [...(data.tags || []), ...(data.smartTags || [])];
        const uniqueTags = [...new Set(allTags)]; // Убираем дубликаты
        const yamlTags = uniqueTags.length > 0
            ? uniqueTags.map(tag => `  - ${tag}`).join('\n') + '\n'
            : '';
        content = content.replace(/{{yamlTags}}/g, yamlTags);

        // Аудио (ссылка для YAML и embed)
        if (audioFilePath) {
            const audioObsidianPath = normalizePath(audioFilePath); // Нормализуем путь для Obsidian
            content = content.replace(/{{audioPathForYaml}}/g, audioObsidianPath);
            content = content.replace(/{{audioLink}}/g, audioObsidianPath); // Совместимость со старыми шаблонами
            // Для embed используем Obsidian-совместимый способ
            content = content.replace(/{{audioEmbed}}/g, `![[${audioObsidianPath}]]`);
        } else {
            content = content.replace(/{{audioPathForYaml}}/g, '');
            content = content.replace(/{{audioLink}}/g, 'N/A'); // Совместимость со старыми шаблонами
            content = content.replace(/{{audioEmbed}}/g, '> [!warning] Аудиофайл не найден\n> Аудиофайл не был импортирован или не найден в архиве.');
        }

        // Имя файла заметки (если нужно в теле заметки)
        if (noteFileName) {
            content = content.replace(/{{noteFileName}}/g, noteFileName.replace(/\.md$/, ''));
        } else {
            content = content.replace(/{{noteFileName}}/g, data.meetingTitle || 'Untitled Meeting');
        }

        // Оставшиеся плейсхолдеры из настроек (пользовательские шаблоны имен)
        content = content.replace(/{{YYYY}}/g, data.date ? data.date.substring(0, 4) : 'YYYY');
        content = content.replace(/{{MM}}/g, data.date ? data.date.substring(5, 7) : 'MM');
        content = content.replace(/{{DD}}/g, data.date ? data.date.substring(8, 10) : 'DD');
        content = content.replace(/{{HH}}/g, data.time ? data.time.substring(0, 2) : 'HH');
        content = content.replace(/{{mm}}/g, data.time ? data.time.substring(3, 5) : 'mm');
        // Для {{HHMM}} и других составных, если они есть в шаблоне имени, но не в данных ParsedKrispData
        content = content.replace(/{{HHMM}}/g, data.time ? data.time.replace(':','') : 'HHMM');

        return content;
    }

    // Генерирует имя файла на основе шаблона и данных
    private generateFileName(template: string, parsedData: ParsedKrispData, extension: string): string {
        let fileName = template;
        fileName = fileName.replace(/{{YYYY}}/g, parsedData.date?.substring(0, 4) || 'YYYY');
        fileName = fileName.replace(/{{MM}}/g, parsedData.date?.substring(5, 7) || 'MM');
        fileName = fileName.replace(/{{DD}}/g, parsedData.date?.substring(8, 10) || 'DD');
        fileName = fileName.replace(/{{HHMM}}/g, parsedData.time?.replace(':', '') || 'HHMM');
        fileName = fileName.replace(/{{HH}}/g, parsedData.time?.substring(0,2) || 'HH');
        fileName = fileName.replace(/{{mm}}/g, parsedData.time?.substring(3,5) || 'mm');
        fileName = fileName.replace(/{{meetingTitle}}/g, parsedData.meetingTitle || 'Untitled Meeting');

        // Очистка имени файла от недопустимых символов
        // eslint-disable-next-line no-useless-escape
        fileName = fileName.replace(/[\/:\[\]\*\?"<>\|#^]/g, '_').replace(/\s+/g, '_');
        return `${fileName}.${extension}`;
    }

    // Создает заметку и возвращает путь к ней и путь для аудио
    public async createNote(parsedData: ParsedKrispData, originalAudioPath?: string): Promise<{ notePath?: string, audioDestPath?: string, noteFile?: TFile }> {
        // 1. Сгенерировать имя файла для заметки
        const noteFileName = this.generateFileName(this.settings.noteNameTemplate, parsedData, 'md');

        // 2. Определить путь для заметки (включая подпапки год/месяц)
        const year = parsedData.date?.substring(0, 4) || 'YYYY';
        const month = parsedData.date?.substring(5, 7) || 'MM';
        const noteFolderPath = normalizePath(path.join(this.settings.notesFolderPath, year, month));
        await this.ensureFolderExists(noteFolderPath);
        let noteFilePath = normalizePath(path.join(noteFolderPath, noteFileName));

        // 3. Проверить дубликаты и обработать согласно стратегии
        let existingFile = this.vault.getAbstractFileByPath(noteFilePath);
        if (existingFile && existingFile instanceof TFile) {
            switch (this.settings.duplicateStrategy) {
                case 'skip':
                    console.log(`Note ${noteFilePath} already exists. Skipping.`);
                    new Notification('Krisp Importer', { body: `Заметка ${noteFileName} уже существует. Импорт пропущен.` });
                    return { notePath: noteFilePath, noteFile: existingFile }; // Возвращаем существующий путь
                case 'overwrite':
                    console.log(`Note ${noteFilePath} already exists. Overwriting.`);
                    await this.vault.delete(existingFile);
                    break;
                case 'rename':
                    let counter = 1;
                    const nameWithoutExt = noteFileName.substring(0, noteFileName.lastIndexOf('.'));
                    const ext = noteFileName.substring(noteFileName.lastIndexOf('.') + 1);
                    while (existingFile) {
                        noteFilePath = normalizePath(path.join(noteFolderPath, `${nameWithoutExt}_${counter}.${ext}`));
                        existingFile = this.vault.getAbstractFileByPath(noteFilePath);
                        counter++;
                    }
                    console.log(`Note ${noteFilePath} will be created with a new name.`);
                    break;
            }
        }

        // 4. Определить путь и имя для аудиофайла (если есть)
        let audioDestPath: string | undefined = undefined;
        if (originalAudioPath && parsedData.meetingTitle) {
            const audioExtension = path.extname(originalAudioPath) || '.mp3'; // Берем расширение из оригинала
            const audioFileName = this.generateFileName(this.settings.attachmentNameTemplate, parsedData, audioExtension.substring(1));

            // Используем те же подпапки год/месяц для вложений, если attachmentsFolderPath не содержит явных плейсхолдеров
            let attachmentsFinalPath = this.settings.attachmentsFolderPath;
            if (!attachmentsFinalPath.includes('{{YYYY}}') && !attachmentsFinalPath.includes('{{MM}}')) {
                attachmentsFinalPath = path.join(attachmentsFinalPath, year, month);
            }
             // Заменяем плейсхолдеры YYYY, MM, DD в пути к папке вложений, если они есть
            attachmentsFinalPath = attachmentsFinalPath
                .replace(/{{YYYY}}/g, year)
                .replace(/{{MM}}/g, month)
                .replace(/{{DD}}/g, parsedData.date?.substring(8, 10) || 'DD');

            await this.ensureFolderExists(normalizePath(attachmentsFinalPath));
            audioDestPath = normalizePath(path.join(attachmentsFinalPath, audioFileName));

            // Проверка на дубликат аудио (можно добавить стратегию, пока просто перезапись или уникальное имя)
            let existingAudio = this.vault.getAbstractFileByPath(audioDestPath);
            if (existingAudio) {
                // TODO: Добавить стратегию для аудио дубликатов, пока просто добавляем суффикс
                let audioCounter = 1;
                const audioNameWithoutExt = audioFileName.substring(0, audioFileName.lastIndexOf('.'));
                const audioExt = audioFileName.substring(audioFileName.lastIndexOf('.') + 1);
                while(existingAudio) {
                    audioDestPath = normalizePath(path.join(attachmentsFinalPath, `${audioNameWithoutExt}_${audioCounter}.${audioExt}`));
                    existingAudio = this.vault.getAbstractFileByPath(audioDestPath);
                    audioCounter++;
                }
            }
        }

        // 5. Заполнить шаблон заметки
        const noteContent = this.applyTemplate(this.settings.noteContentTemplate, parsedData, this.settings, noteFilePath.split('/').pop(), audioDestPath);

        // 6. Создать файл заметки
        const noteFile = await this.vault.create(noteFilePath, noteContent);
        console.log(`Note created: ${noteFilePath}`);

        return { notePath: noteFilePath, audioDestPath, noteFile };
    }

    // Вспомогательная функция для создания папок, если их нет
    private async ensureFolderExists(folderPath: string): Promise<void> {
        const normalizedPath = normalizePath(folderPath);
        if (normalizedPath === '/' || normalizedPath === '') return; // Не создаем корень

        const folder = this.vault.getAbstractFileByPath(normalizedPath);
        if (!folder) {
            // Разделяем путь на компоненты и создаем каждую папку последовательно
            const parts = normalizedPath.split('/');
            let currentPath = '';
            for (const part of parts) {
                if (!part) continue;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const currentFolder = this.vault.getAbstractFileByPath(currentPath);
                if (!currentFolder) {
                    try {
                        await this.vault.createFolder(currentPath);
                    } catch (e) {
                        // Игнорируем ошибку, если папка уже создана (например, в параллельном выполнении)
                        // Проверяем еще раз, чтобы убедиться, что папка действительно существует
                        if (!this.vault.getAbstractFileByPath(currentPath)) {
                            console.error(`Failed to create folder ${currentPath}:`, e);
                            throw e; // Перебрасываем ошибку, если папка все еще не существует
                        }
                    }
                }
            }
        }
    }
}
