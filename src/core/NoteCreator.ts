import { App, TFile, Vault, normalizePath } from 'obsidian';
import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import { FILE_UTILS, VALIDATION } from './constants';
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
        let currentSectionHasBullets = false;

        for (let i = 0; i < summaryLines.length; i++) {
            const line = summaryLines[i];
            const strippedLine = line.trim();

            // Пропустить пустые строки
            if (strippedLine === '') {
                outputLines.push('');
                continue;
            }

            // Пропустить строку "Summary" если это первая значимая строка
            if (sectionCounter === 0 && strippedLine.toLowerCase() === 'summary') {
                continue;
            }

            // Проверка на маркер списка (- или * или •)
            const isListMarker = /^[-*•]\s+/.test(strippedLine);

            if (isListMarker) {
                // Это элемент списка - преобразуем в буллет
                const listText = strippedLine.replace(/^[-*•]\s+/, '');
                outputLines.push(`- ${listText}`);
                currentSectionHasBullets = true;
            } else {
                // Проверяем: это продолжение предыдущего пункта или новая тема?
                const looksLikeHeader = this.isLikelyHeader(strippedLine, i, summaryLines);

                if (looksLikeHeader) {
                    // Это новый заголовок секции
                    sectionCounter++;
                    currentSectionHasBullets = false;

                    // Добавляем пустую строку перед новым заголовком (если это не первый)
                    if (sectionCounter > 1) {
                        outputLines.push('');
                    }

                    outputLines.push(`## ${sectionCounter}. ${strippedLine}`);
                } else {
                    // Это предложение - делаем буллетом
                    outputLines.push(`- ${strippedLine}`);
                    currentSectionHasBullets = true;
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

    // Помогает определить является ли строка заголовком секции
    private isLikelyHeader(line: string, currentIndex: number, allLines: string[]): boolean {
        // Если это очень длинная строка (>100 символов), вероятно это не заголовок
        if (line.length > 100) {
            return false;
        }

        // Если в строке есть точка в конце, это скорее предложение
        if (line.endsWith('.') || line.endsWith('!') || line.endsWith('?')) {
            return false;
        }

        // Если следующая строка начинается с дефиса, то текущая - заголовок
        if (currentIndex + 1 < allLines.length) {
            const nextLine = allLines[currentIndex + 1].trim();
            if (/^[-*•]\s+/.test(nextLine)) {
                return true;
            }
        }

        // Если строка короткая и не содержит точки/запятые в середине, вероятно заголовок
        if (line.length < 80 && !line.includes(',') && !line.includes('.')) {
            return true;
        }

        return false;
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
        // Безопасное извлечение компонентов даты для шаблонов
        if (data.date && data.date.length >= VALIDATION.MIN_DATE_LENGTH) {
            content = content.replace(/{{YYYY}}/g, FILE_UTILS.safeSubstring(data.date, 0, 4, 'YYYY'));
            content = content.replace(/{{MM}}/g, FILE_UTILS.safeSubstring(data.date, 5, 7, 'MM'));
            content = content.replace(/{{DD}}/g, FILE_UTILS.safeSubstring(data.date, 8, 10, 'DD'));
        } else {
            content = content.replace(/{{YYYY}}/g, 'YYYY');
            content = content.replace(/{{MM}}/g, 'MM');
            content = content.replace(/{{DD}}/g, 'DD');
        }

        // Безопасное извлечение компонентов времени для шаблонов
        if (data.time && data.time.length >= VALIDATION.MIN_TIME_LENGTH) {
            content = content.replace(/{{HH}}/g, FILE_UTILS.safeSubstring(data.time, 0, 2, 'HH'));
            content = content.replace(/{{mm}}/g, FILE_UTILS.safeSubstring(data.time, 3, 5, 'MM'));
        } else {
            content = content.replace(/{{HH}}/g, 'HH');
            content = content.replace(/{{mm}}/g, 'MM');
        }

        return content;
    }

    // Генерирует имя файла на основе шаблона и данных
    private generateFileName(template: string, parsedData: ParsedKrispData, extension: string): string {
        let fileName = template;

        // Безопасное извлечение компонентов даты
        if (parsedData.date && parsedData.date.length >= VALIDATION.MIN_DATE_LENGTH) {
            fileName = fileName.replace(/{{YYYY}}/g, FILE_UTILS.safeSubstring(parsedData.date, 0, 4, 'YYYY'));
            fileName = fileName.replace(/{{MM}}/g, FILE_UTILS.safeSubstring(parsedData.date, 5, 7, 'MM'));
            fileName = fileName.replace(/{{DD}}/g, FILE_UTILS.safeSubstring(parsedData.date, 8, 10, 'DD'));
        } else {
            fileName = fileName.replace(/{{YYYY}}/g, 'YYYY');
            fileName = fileName.replace(/{{MM}}/g, 'MM');
            fileName = fileName.replace(/{{DD}}/g, 'DD');
        }

        // Безопасное извлечение компонентов времени
        if (parsedData.time && parsedData.time.length >= VALIDATION.MIN_TIME_LENGTH) {
            fileName = fileName.replace(/{{HHMM}}/g, FILE_UTILS.safeSubstring(parsedData.time, 0, 2, 'HH') + FILE_UTILS.safeSubstring(parsedData.time, 3, 5, 'MM'));
            fileName = fileName.replace(/{{HH}}/g, FILE_UTILS.safeSubstring(parsedData.time, 0, 2, 'HH'));
            fileName = fileName.replace(/{{mm}}/g, FILE_UTILS.safeSubstring(parsedData.time, 3, 5, 'MM'));
        } else {
            fileName = fileName.replace(/{{HHMM}}/g, 'HHMM');
            fileName = fileName.replace(/{{HH}}/g, 'HH');
            fileName = fileName.replace(/{{mm}}/g, 'MM');
        }

        fileName = fileName.replace(/{{meetingTitle}}/g, parsedData.meetingTitle || 'Untitled Meeting');

        // Очистка имени файла от недопустимых символов - используем централизованную функцию
        const cleanFileName = FILE_UTILS.sanitizeFileName(fileName);
        return `${cleanFileName}.${extension}`;
    }

    /**
     * Creates a note based on parsed data and optionally copies an audio file.
     *
     * The function generates a filename for the note, determines the folder path including subdirectories for year/month,
     * checks for duplicates and handles them according to the duplicate strategy. If an original audio file is provided,
     * it defines a path for the audio file, creates the necessary directory structure, and copies the audio file with
     * handling for duplicates. It then fills in a note template with the parsed data and creates the note file.
     *
     * @param parsedData - Parsed data about the meeting.
     * @param originalAudioPath - Full path to the original audio file (if any).
     * @returns An object containing the path to the created note, the path to the audio file, and the file object.
     */
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

        // 4. Определить путь и имя для аудиофайла (если есть) + создать физический файл
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

            // Создаем физический аудиофайл с обработкой дубликатов
            audioDestPath = await this.createAudioFile(originalAudioPath, audioDestPath, attachmentsFinalPath, audioFileName);
        }

        // 5. Заполнить шаблон заметки
        const noteContent = this.applyTemplate(this.settings.noteContentTemplate, parsedData, this.settings, noteFilePath.split('/').pop(), audioDestPath);

        // 6. Создать файл заметки
        const noteFile = await this.vault.create(noteFilePath, noteContent);
        console.log(`Note created: ${noteFilePath}`);

        return { notePath: noteFilePath, audioDestPath, noteFile };
    }

    /**
     * Обрабатывает дубликаты аудиофайлов согласно настройкам duplicateStrategy
     * @param originalPath Оригинальный путь к аудиофайлу
     * @param folderPath Путь к папке для аудиофайлов
     * @param fileName Имя аудиофайла
     * @returns Финальный путь для сохранения аудиофайла
     */
    private async handleAudioDuplicate(originalPath: string, folderPath: string, fileName: string): Promise<string> {
        const strategy = this.settings.duplicateStrategy;

        switch (strategy) {
            case 'skip':
                // Используем существующий файл
                console.log(`[NoteCreator] Audio duplicate detected, skipping: ${fileName}`);
                return originalPath;

            case 'overwrite':
                // Перезаписываем существующий файл
                console.log(`[NoteCreator] Audio duplicate detected, will overwrite: ${fileName}`);
                return originalPath;

            case 'rename':
                // Создаем уникальное имя
                console.log(`[NoteCreator] Audio duplicate detected, creating unique name: ${fileName}`);
                return this.generateUniqueAudioPath(folderPath, fileName);

            default:
                // Fallback на rename для безопасности
                console.warn(`[NoteCreator] Unknown duplicate strategy: ${strategy}, falling back to rename`);
                return this.generateUniqueAudioPath(folderPath, fileName);
        }
    }

    /**
     * Creates a physical audio file with duplicate handling.
     *
     * This function checks if the original audio file exists, reads its data,
     * and handles duplicates according to the configured strategy ('skip', 'overwrite', or 'rename').
     * It logs various steps and returns the final path of the created or existing audio file.
     *
     * @param originalAudioPath - Path to the original audio file in ZIP.
     * @param destPath - Desired path for saving the audio file.
     * @param folderPath - Path to the folder containing audio files.
     * @param fileName - Name of the audio file.
     * @returns The final path to the created or existing audio file.
     */
    private async createAudioFile(originalAudioPath: string, destPath: string, folderPath: string, fileName: string): Promise<string> {
        try {
            // Проверяем существование оригинального файла
            const fs = require('fs').promises;
            await fs.access(originalAudioPath);

            // Читаем аудиоданные
            const audioData = await fs.readFile(originalAudioPath);
            console.log(`[NoteCreator] Audio file read, size: ${audioData.length} bytes`);

            // Проверяем существование целевого файла
            const existingAudio = this.vault.getAbstractFileByPath(destPath);
            let finalDestPath = destPath;

            if (existingAudio) {
                // Обрабатываем дубликат согласно стратегии
                finalDestPath = await this.handleAudioDuplicate(destPath, folderPath, fileName);

                // Проверяем стратегию для принятия решения о создании
                if (this.settings.duplicateStrategy === 'skip') {
                    console.log(`[NoteCreator] Audio file skipped (strategy: skip): ${fileName}`);
                    return finalDestPath; // Возвращаем путь к существующему файлу
                }

                if (this.settings.duplicateStrategy === 'overwrite') {
                    // Перезаписываем существующий файл
                    const existingFile = this.vault.getAbstractFileByPath(finalDestPath);
                    if (existingFile instanceof TFile) {
                        await this.vault.modifyBinary(existingFile, audioData);
                        console.log(`[NoteCreator] Audio file updated: ${finalDestPath}`);
                        return finalDestPath;
                    }
                }
            }

            // Создаем новый файл (для 'rename' или если файл не существует)
            await this.vault.createBinary(finalDestPath, audioData);
            console.log(`[NoteCreator] Audio file created: ${finalDestPath}`);
            return finalDestPath;

        } catch (error) {
            console.warn(`[NoteCreator] Error creating audio file ${fileName}:`, error);
            // Возвращаем первоначальный путь для заметки, даже если аудио не создался
            return destPath;
        }
    }

    /**
     * Генерирует уникальный путь для аудиофайла при дубликатах
     * @param folderPath Путь к папке
     * @param fileName Имя файла
     * @returns Уникальный путь
     */
    private generateUniqueAudioPath(folderPath: string, fileName: string): string {
        let counter = 1;
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const ext = fileName.substring(fileName.lastIndexOf('.') + 1);

        let uniquePath: string;
        let existingFile: any;

        do {
            const uniqueFileName = `${nameWithoutExt}_${counter}.${ext}`;
            uniquePath = normalizePath(path.join(folderPath, uniqueFileName));
            existingFile = this.vault.getAbstractFileByPath(uniquePath);
            counter++;
        } while (existingFile);

        return uniquePath;
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
