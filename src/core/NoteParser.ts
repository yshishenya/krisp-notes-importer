import { ParsedKrispData } from '../interfaces';

export class NoteParser {

    constructor() { }

    /**
     * Извлекает основные данные из содержимого meeting_notes.txt и имени папки встречи.
     * @param notesContent Содержимое файла meeting_notes.txt.
     * @param meetingFolderName Имя папки встречи (например, 'Название встречи_UUID').
     * @returns Объект ParsedKrispData с извлеченными данными.
     */
    public parseMeetingNotes(notesContent: string, transcriptContent: string, meetingFolderName: string): ParsedKrispData {
        const parsedData: ParsedKrispData = {};

        // Извлечение названия встречи из имени папки (удаляя UUID)
        // Пример UUID: (b6e7a8f0-50e8-4f3e-97fe-371dd5b07873)
        // или просто дата в конце типа Krisp Meeting - July 11, 2024 1105 AM
        // или современный формат: "Встреча с командой сбера по анализу софтскилов-7567e0026c7b46d49ceaed026a53089e"
        let title = meetingFolderName;

        // Сначала удалим возможный UUID в скобках
        title = title.replace(/\s*\([0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\)$/, '');

        // Удаляем UUID в конце после дефиса (32 символа hex без дефисов)
        title = title.replace(/-[0-9a-fA-F]{32}$/, '');

        // Затем удалим стандартный суффикс Krisp с датой и временем, если он есть, чтобы получить чистое название
        // Обновленный regex для случаев типа " - May, 22" или " - July 11, 2024" или " - July 11, 2024 1105 AM"
        title = title.replace(/\s*-\s*[A-Za-z]+(?:\s+|,\s*)[0-9]{1,2}(?:,\s*[0-9]{4})?(?:\s+[0-9]{1,2}[0-9]{2}(?:\s*(?:AM|PM))?)?$/, '').trim();

        parsedData.meetingTitle = title;

        const firstLineNotes = notesContent.split('\n')[0]?.trim();
        let dateStr = null;
        let timeStr = null;

        if (firstLineNotes) {
            dateStr = this.extractDateFromString(firstLineNotes);
            timeStr = this.extractTimeFromString(firstLineNotes);
        }

        if (!dateStr) {
            dateStr = this.extractDateFromString(meetingFolderName);
        }
        if (!timeStr) {
            timeStr = this.extractTimeFromString(meetingFolderName);
            if (timeStr === '00:00' && transcriptContent) {
                const firstTimestampMatch = transcriptContent.match(/(\d{2}:\d{2}(?::\d{2})?)/);
                if (firstTimestampMatch) {
                }
            }
        }

        parsedData.date = dateStr || undefined;
        parsedData.time = timeStr || undefined;

        parsedData.summary = this.extractSection(notesContent, "Summary");
        parsedData.actionItems = this.extractSection(notesContent, "Action Items", true);
        parsedData.keyPoints = this.extractSection(notesContent, "Key Points", true);

        const transcriptParsed = this.parseTranscript(transcriptContent);
        parsedData.participants = transcriptParsed.participants;
        parsedData.rawTranscript = transcriptContent;
        parsedData.formattedTranscript = transcriptParsed.formattedTranscript;
        parsedData.duration = transcriptParsed.duration;

        // Новая расширенная аналитика
        parsedData.participantsCount = transcriptParsed.participants.length;
        parsedData.transcriptWords = this.countWords(transcriptContent);
        parsedData.mostActiveSpeaker = this.findMostActiveSpeaker(transcriptContent);
        parsedData.participantsStats = this.generateParticipantsStats(transcriptContent, transcriptParsed.participants);
        parsedData.extractedEntities = this.extractEntities(notesContent, transcriptContent);
        parsedData.relatedLinks = this.generateRelatedLinks(notesContent, title);
        parsedData.importDate = new Date().toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Генерируем умные теги
        parsedData.smartTags = this.generateSmartTags(notesContent, transcriptContent, title);
        parsedData.tags = [...(parsedData.smartTags || [])];

        return parsedData;
    }

    /**
     * Извлекает участников из содержимого transcript.txt.
     * Адаптировано из krisp_automator.sh (extract_participants).
     * @param transcriptContent Содержимое файла transcript.txt.
     * @returns Объект ParsedKrispData с извлеченными участниками.
     */
    public parseTranscript(transcriptContent: string): { participants: string[], formattedTranscript: string, duration: string } {
        const lines = transcriptContent.split('\n');
        const participants = new Set<string>();
        const formattedLines: string[] = [];
        let lastTimestamp = "00:00:00";

        const speakerTimeRegex = /^(.+?)\s*\|\s*(\d{2}:\d{2}(?::\d{2})?)$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;

            const speakerTimeMatch = trimmedLine.match(speakerTimeRegex);
            if (speakerTimeMatch) {
                // Это строка с именем спикера и временем
                const speaker = speakerTimeMatch[1].trim();
                const timestamp = speakerTimeMatch[2];

                if (speaker && !speaker.toLowerCase().includes('transcription service') && !speaker.toLowerCase().includes('meeting summary')) {
                    participants.add(speaker);
                }

                const linkTimestamp = timestamp.length === 5 ? `${timestamp}:00` : timestamp;
                lastTimestamp = linkTimestamp;

                // Ищем следующие строки, которые являются текстом этого спикера
                const speakerText: string[] = [];
                let j = i + 1;

                // Читаем все следующие строки до следующего спикера или конца
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (nextLine === '') {
                        j++;
                        continue;
                    }

                    // Если следующая строка содержит другого спикера, останавливаемся
                    if (speakerTimeRegex.test(nextLine)) {
                        break;
                    }

                    // Если это "продолжение следует...", форматируем как курсив
                    if (nextLine.toLowerCase() === 'продолжение следует...') {
                        speakerText.push(`_${nextLine}_`);
                    } else {
                        speakerText.push(nextLine);
                    }
                    j++;
                }

                // Создаем отформатированную строку для этого спикера
                if (speakerText.length > 0) {
                    const formattedText = speakerText.join('\n');
                    formattedLines.push(`[[${linkTimestamp}]] **${speaker}**: ${formattedText}`);
                } else {
                    // Если нет текста, просто добавляем спикера
                    formattedLines.push(`[[${linkTimestamp}]] **${speaker}**:`);
                }

                // Пропускаем строки, которые мы уже обработали
                i = j - 1;

            } else if (trimmedLine.toLowerCase() === 'продолжение следует...') {
                // Отдельная строка "продолжение следует..."
                formattedLines.push(`_${trimmedLine}_`);
            } else {
                // Строка без спикера, возможно это продолжение предыдущего текста
                if (formattedLines.length > 0) {
                    // Добавляем к последней строке
                    formattedLines[formattedLines.length - 1] += `\n${trimmedLine}`;
                } else {
                    // Первая строка без спикера
                    formattedLines.push(trimmedLine);
                }
            }
        }

        let duration = "N/A";
        if (lastTimestamp !== "00:00:00") {
            duration = lastTimestamp;
        }

        return {
            participants: Array.from(participants),
            formattedTranscript: formattedLines.join('\n\n'), // Добавляем двойные переносы между блоками спикеров
            duration: duration
        };
    }

    /**
     * Извлекает дату из строки в формате YYYY-MM-DD.
     * Адаптировано из extract_date в krisp_automator.sh
     */
    public extractDateFromString(text: string): string | null {
        if (!text) return null;

        let year, month, day;

        let match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            year = parseInt(match[1], 10);
            month = parseInt(match[2], 10);
            day = parseInt(match[3], 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }

        match = text.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
        if (match) {
            const monthName = match[1];
            day = parseInt(match[2], 10);
            year = parseInt(match[3], 10);
            month = this.monthNameToNumber(monthName);
            if (month && day >= 1 && day <= 31) {
                 return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }

        match = text.match(/([A-Za-z]+),\s*(\d{1,2})(?!\s*,\s*\d{4})/);
         if (match) {
            const monthName = match[1];
            day = parseInt(match[2], 10);
            year = new Date().getFullYear();
            month = this.monthNameToNumber(monthName);
            if (month && day >= 1 && day <= 31) {
                return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }

        match = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (match) {
            day = parseInt(match[1], 10);
            const monthName = match[2];
            year = parseInt(match[3], 10);
            month = this.monthNameToNumber(monthName);
            if (month && day >= 1 && day <= 31) {
                return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }

        return null;
    }

    /**
     * Извлекает время из строки в формате HH:MM (24-hour).
     * Адаптировано из extract_time в krisp_automator.sh
     */
    public extractTimeFromString(text: string): string | null {
        if (!text) return null;

        let match = text.match(/(\d{2}):(\d{2})(?!\s*(?:AM|PM))/);
        if (match) {
            const hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            }
        }

        match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const ampm = match[3].toUpperCase();

            if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
                if (ampm === 'PM' && hour !== 12) {
                    hour += 12;
                } else if (ampm === 'AM' && hour === 12) {
                    hour = 0;
                }
                 return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            }
        }
        return "00:00";
    }

    /**
     * Вспомогательный метод для извлечения текста секции между заголовком и следующим двойным переносом строки
     * или до конца текста, если это последняя секция.
     * Улучшенная версия для поиска заголовка и конца секции.
     */
    private extractSection(content: string, sectionTitle: string, isList: boolean = false): string[] {
        const lines = content.split('\n');
        const resultLines: string[] = [];
        let inSection = false;
        const sectionTitleRegex = new RegExp(`^${sectionTitle}\s*$`, 'i');
        const nextKnownSectionTitles = ["Summary", "Action Items", "Key Points", "Transcript", "Transcription"];
        const nextSectionRegex = new RegExp(`^(${nextKnownSectionTitles.filter(t => t.toLowerCase() !== sectionTitle.toLowerCase()).join('|')})\s*$`, 'i');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (sectionTitleRegex.test(line)) {
                inSection = true;
                continue;
            }

            if (inSection) {
                if (nextSectionRegex.test(line)) {
                    break;
                }
                const trimmedLine = line.trim();
                if (trimmedLine === '') {
                    if (isList) {
                        const nextLine = lines[i+1]?.trim();
                        if (nextLine && !nextLine.match(/^(\s*[-*]|[0-9]+\.)/) && !nextLine.match(/^\s+/)) {
                        } else if (!nextLine) {
                            break;
                        }
                    } else {
                        if (lines[i+1]?.trim() === '') break;
                    }
                }

                if (trimmedLine !== '' || (isList && resultLines.length > 0) ) {
                    if (isList) {
                        let listItem = trimmedLine;
                        if (listItem.startsWith('- ')) {
                            listItem = listItem.substring(2).trim();
                        } else if (listItem.startsWith('* ')) {
                            listItem = listItem.substring(2).trim();
                        }
                        if (sectionTitle === "Action Items" && listItem) {
                           resultLines.push(listItem);
                        } else if (listItem) {
                           resultLines.push(listItem);
                        }

                    } else {
                        resultLines.push(trimmedLine);
                    }
                } else if (resultLines.length > 0 && !isList) {
                }
            }
        }
        return resultLines;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\\\]]/g, '\\$&');
    }

    private isLikelyDateOrTime(text: string): boolean {
        if (!text) return false;
        const datePattern = /^(\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?)$/i;
        const timePattern = /^(\d{1,2}:\d{2}(\s*[APap][Mm])?)$/;
        return datePattern.test(text) || timePattern.test(text);
    }

    private isSectionHeader(text: string): boolean {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return lowerText.startsWith('summary') || lowerText.startsWith('action items') || lowerText.startsWith('key points') || lowerText.startsWith('transcript');
    }

    private monthNameToNumber(monthName: string): number | null {
        if (!monthName) return null;
        const lowerMonthName = monthName.toLowerCase().substring(0, 3);
        const monthMap: { [key: string]: number } = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
            'янв': 1, 'фев': 2, 'мар': 3, 'апр': 4, 'мая': 5, 'июн': 6,
            'июл': 7, 'авг': 8, 'сен': 9, 'окт': 10, 'ноя': 11, 'дек': 12
        };
        return monthMap[lowerMonthName] || null;
    }

    /**
     * Подсчитывает количество слов в тексте
     */
    private countWords(text: string): number {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Находит самого активного участника встречи по количеству слов
     */
    private findMostActiveSpeaker(transcriptContent: string): string {
        const lines = transcriptContent.split('\n');
        const speakerWordCount: { [speaker: string]: number } = {};
        let currentSpeaker = '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;

            const speakerMatch = trimmedLine.match(/^(.+?)\s*\|\s*(\d{2}:\d{2}(?::\d{2})?)$/);
            if (speakerMatch) {
                currentSpeaker = speakerMatch[1].trim();
                if (!speakerWordCount[currentSpeaker]) {
                    speakerWordCount[currentSpeaker] = 0;
                }
            } else if (currentSpeaker) {
                // Это текст текущего спикера
                const wordCount = this.countWords(trimmedLine);
                speakerWordCount[currentSpeaker] += wordCount;
            }
        }

        // Находим спикера с максимальным количеством слов
        let mostActive = '';
        let maxWords = 0;
        for (const [speaker, words] of Object.entries(speakerWordCount)) {
            if (words > maxWords) {
                maxWords = words;
                mostActive = speaker;
            }
        }

        return mostActive || 'N/A';
    }

    /**
     * Генерирует статистику по участникам
     */
    private generateParticipantsStats(transcriptContent: string, participants: string[]): string[] {
        const lines = transcriptContent.split('\n');
        const speakerWordCount: { [speaker: string]: number } = {};
        const speakerSegments: { [speaker: string]: number } = {};
        let currentSpeaker = '';

        // Инициализируем счетчики
        for (const participant of participants) {
            speakerWordCount[participant] = 0;
            speakerSegments[participant] = 0;
        }

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;

            const speakerMatch = trimmedLine.match(/^(.+?)\s*\|\s*(\d{2}:\d{2}(?::\d{2})?)$/);
            if (speakerMatch) {
                currentSpeaker = speakerMatch[1].trim();
                if (speakerSegments[currentSpeaker] !== undefined) {
                    speakerSegments[currentSpeaker]++;
                }
            } else if (currentSpeaker && speakerWordCount[currentSpeaker] !== undefined) {
                const wordCount = this.countWords(trimmedLine);
                speakerWordCount[currentSpeaker] += wordCount;
            }
        }

        const stats: string[] = [];
        const totalWords = Object.values(speakerWordCount).reduce((sum, count) => sum + count, 0);

        for (const participant of participants) {
            const words = speakerWordCount[participant] || 0;
            const segments = speakerSegments[participant] || 0;
            const percentage = totalWords > 0 ? ((words / totalWords) * 100).toFixed(1) : '0';

            stats.push(`- **${participant}**: ${words} слов (${percentage}%), ${segments} выступлений`);
        }

        return stats.length > 0 ? ['### 📊 Активность участников', '', ...stats] : [];
    }

    /**
     * Извлекает сущности (проекты, компании, важные термины) из текста
     */
    private extractEntities(notesContent: string, transcriptContent: string): string[] {
        const entities: string[] = [];
        const fullText = `${notesContent} ${transcriptContent}`;

        // Поиск упоминаний проектов
        const projectKeywords = /(?:проект|project|система|платформа|сервис|приложение|продукт)\s+([А-Яа-я\w\s]{3,30})/gi;
        const projectMatches = fullText.match(projectKeywords);
        if (projectMatches && projectMatches.length > 0) {
            entities.push('### 🚀 Упомянутые проекты');
            entities.push('');
            const uniqueProjects = [...new Set(projectMatches.slice(0, 5))];
            uniqueProjects.forEach(project => entities.push(`- ${project.trim()}`));
            entities.push('');
        }

        // Поиск упоминаний компаний
        const companyKeywords = /(?:компания|компании|организация|корпорация|фирма|бизнес)\s+([А-Яа-я\w\s]{3,30})|([А-Яа-я][А-Яа-я\w]*(?:нефть|банк|групп|холдинг|корп))/gi;
        const companyMatches = fullText.match(companyKeywords);
        if (companyMatches && companyMatches.length > 0) {
            entities.push('### 🏢 Упомянутые компании');
            entities.push('');
            const uniqueCompanies = [...new Set(companyMatches.slice(0, 5))];
            uniqueCompanies.forEach(company => entities.push(`- ${company.trim()}`));
            entities.push('');
        }

        // Поиск важных дат
        const dateMatches = fullText.match(/\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}|\d{4}[\.\-\/]\d{1,2}[\.\-\/]\d{1,2}/g);
        if (dateMatches && dateMatches.length > 0) {
            entities.push('### 📅 Упомянутые даты');
            entities.push('');
            const uniqueDates = [...new Set(dateMatches.slice(0, 5))];
            uniqueDates.forEach(date => entities.push(`- ${date}`));
            entities.push('');
        }

        return entities;
    }

    /**
     * Генерирует связанные ссылки на основе содержимого
     */
    private generateRelatedLinks(notesContent: string, title: string): string[] {
        const links: string[] = [];

        // Поиск упоминаний других встреч или документов
        const meetingMentions = notesContent.match(/встреча|совещание|планерка|созвон/gi);
        if (meetingMentions && meetingMentions.length > 1) {
            links.push('- 📋 **Связанные встречи:** [[Поиск встреч]]');
        }

        // Поиск упоминаний документов
        const docMentions = notesContent.match(/документ|файл|презентация|отчет|план/gi);
        if (docMentions && docMentions.length > 0) {
            links.push('- 📄 **Документы:** [[Поиск документов]]');
        }

        // Добавляем ссылку на папку с проектом, если можно определить
        if (title.toLowerCase().includes('проект')) {
            links.push('- 🚀 **Проект:** [[Проекты]]');
        }

        return links;
    }

    /**
     * Генерирует умные теги на основе содержимого
     */
    private generateSmartTags(notesContent: string, transcriptContent: string, title: string): string[] {
        const tags = new Set<string>();
        const fullText = `${notesContent} ${transcriptContent} ${title}`.toLowerCase();

        // Базовые теги
        tags.add('meeting');
        tags.add('krisp');

        // Теги на основе ключевых слов
        const keywordTags: { [key: string]: string } = {
            'проект': 'project',
            'project': 'project',
            'планирование': 'planning',
            'planning': 'planning',
            'разработка': 'development',
            'development': 'development',
            'обсуждение': 'discussion',
            'встреча': 'meeting',
            'анализ': 'analysis',
            'strategy': 'strategy',
            'стратегия': 'strategy',
            'внедрение': 'implementation',
            'тестирование': 'testing',
            'ревью': 'review',
            'review': 'review',
            'бюджет': 'budget',
            'budget': 'budget',
            'deadline': 'deadline',
            'дедлайн': 'deadline',
            'hr': 'hr',
            'рекрутинг': 'hr',
            'recruiting': 'hr',
            'интеграция': 'integration',
            'integration': 'integration',
            'api': 'technical',
            'система': 'system',
            'system': 'system',
            'безопасность': 'security',
            'security': 'security',
            'поддержка': 'support',
            'support': 'support'
        };

        for (const [keyword, tag] of Object.entries(keywordTags)) {
            if (fullText.includes(keyword)) {
                tags.add(tag);
            }
        }

        // Теги на основе участников (если есть известные роли)
        if (fullText.includes('ceo') || fullText.includes('director') || fullText.includes('директор')) {
            tags.add('management');
        }
        if (fullText.includes('developer') || fullText.includes('разработчик') || fullText.includes('программист')) {
            tags.add('technical');
        }
        if (fullText.includes('designer') || fullText.includes('дизайнер')) {
            tags.add('design');
        }

        // Теги на основе типа встречи
        if (fullText.includes('ретроспектива') || fullText.includes('retrospective')) {
            tags.add('retrospective');
        }
        if (fullText.includes('планирование') || fullText.includes('planning')) {
            tags.add('planning');
        }
        if (fullText.includes('демо') || fullText.includes('demo') || fullText.includes('презентация')) {
            tags.add('demo');
        }

        return Array.from(tags);
    }
}
