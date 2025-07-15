import { ParsedKrispData } from '../interfaces';
import { PERFORMANCE_LIMITS, VALIDATION } from './constants';

interface ParticipantStats {
    words: number;
    segments: number;
    averageSegmentLength: number;
    firstAppearance: string;
    lastAppearance: string;
    engagementScore: number; // Комплексная метрика активности
}

interface MeetingAnalytics {
    duration: string;
    participantStats: Map<string, ParticipantStats>;
    meetingType: string; // планерка, ретро, презентация и т.д.
    sentiment: 'positive' | 'neutral' | 'negative';
    energyLevel: 'high' | 'medium' | 'low';
    decisionCount: number;
    questionCount: number;
}

/**
 * Улучшенный парсер заметок с оптимизированной производительностью
 * и расширенной аналитикой встреч
 */
export class EnhancedNoteParser {
    // Предкомпилированные регулярные выражения для лучшей производительности
    private static readonly REGEX_CACHE = {
        speakerTime: /^(.+?)\s*\|\s*(\d{2}:\d{2}(?::\d{2})?)$/,
        dateFormats: [
            /(\d{4})-(\d{2})-(\d{2})/,                    // YYYY-MM-DD
            /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/,         // Month DD, YYYY
            /(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})/ // DD.MM.YYYY
        ],
        timeFormats: [
            /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i,  // HH:MM:SS AM/PM
            /(\d{1,2})(\d{2})(?:\s*(AM|PM))?/i             // HHMM AM/PM
        ],
        uuid: /[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/,
        projects: /(?:проект|project|система|платформа|сервис|приложение|продукт)\s+([А-Яа-я\w\s]{3,30})/gi,
        actionWords: /(?:нужно|надо|должен|необходимо|план|задача|действие|сделать|выполнить|реализовать)/gi,
        decisionWords: /(?:решили|решение|принято|утверждено|согласовали|определили)/gi,
        questionWords: /(?:\?|вопрос|как\s+|почему|зачем|когда|где|что\s+если)/gi
    };

    // Кэш для результатов вычислений
    private static wordsCache = new Map<string, number>();
    private static analyticsCache = new Map<string, MeetingAnalytics>();

    constructor() {}

    /**
     * Основной метод парсинга с оптимизированной производительностью
     * Выполняет все вычисления за один проход по данным
     */
    public parseWithAnalytics(
        notesContent: string,
        transcriptContent: string,
        meetingFolderName: string
    ): ParsedKrispData {
        console.time('[EnhancedParser] Total parsing time');

        // Валидация и нормализация входных данных
        const normalizedData = this.normalizeInputData(notesContent, transcriptContent, meetingFolderName);

        // Единый проход по транскрипту для всех вычислений
        const analytics = this.performSinglePassAnalysis(normalizedData.transcriptContent);

        // Парсинг заметок встречи
        const notesData = this.parseNotesContent(normalizedData.notesContent);

        // Извлечение названия, даты и времени
        const metadata = this.extractMetadata(normalizedData.notesContent, normalizedData.meetingFolderName);

        // Генерация расширенной аналитики
        const enhancedAnalytics = this.generateEnhancedAnalytics(analytics, normalizedData);

        console.timeEnd('[EnhancedParser] Total parsing time');

        return {
            // Основные данные
            meetingTitle: metadata.title,
            date: metadata.date,
            time: metadata.time,
            duration: analytics.duration,

            // Участники и статистика
            participants: Array.from(analytics.participantStats.keys()),
            participantsCount: analytics.participantStats.size,
            mostActiveSpeaker: this.findMostEngagedSpeaker(analytics.participantStats),
            participantsStats: this.formatParticipantStats(analytics.participantStats),

            // Содержимое встречи
            summary: notesData.summary,
            actionItems: notesData.actionItems,
            keyPoints: notesData.keyPoints,

            // Транскрипт
            rawTranscript: normalizedData.transcriptContent,
            formattedTranscript: this.formatTranscript(normalizedData.transcriptContent, analytics.participantStats),
            transcriptWords: this.getCachedWordCount(normalizedData.transcriptContent),

            // Расширенная аналитика
            extractedEntities: enhancedAnalytics.entities,
            smartTags: enhancedAnalytics.tags,
            tags: enhancedAnalytics.tags,
            relatedLinks: enhancedAnalytics.links,

            // Метаданные
            importDate: new Date().toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    }

    /**
     * Нормализация и валидация входных данных
     */
    private normalizeInputData(notesContent: string, transcriptContent: string, meetingFolderName: string) {
        return {
            notesContent: typeof notesContent === 'string' ? notesContent.trim() : '',
            transcriptContent: typeof transcriptContent === 'string' ? transcriptContent.trim() : '',
            meetingFolderName: typeof meetingFolderName === 'string' ? meetingFolderName.trim() : 'Unknown Meeting'
        };
    }

    /**
     * Единый проход по транскрипту для всех вычислений
     * Это главная оптимизация - вместо 3-4 проходов делаем только один
     */
    private performSinglePassAnalysis(transcriptContent: string): MeetingAnalytics {
        const cacheKey = this.getCacheKey(transcriptContent);
        if (EnhancedNoteParser.analyticsCache.has(cacheKey)) {
            return EnhancedNoteParser.analyticsCache.get(cacheKey)!;
        }

        const lines = transcriptContent.split('\n');
        const participantStats = new Map<string, ParticipantStats>();

        let currentSpeaker = '';
        let lastTimestamp = '00:00:00';
        let totalSegments = 0;
        let questionCount = 0;
        let decisionCount = 0;
        let totalSentimentScore = 0;
        let sentimentSamples = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const speakerMatch = line.match(EnhancedNoteParser.REGEX_CACHE.speakerTime);

            if (speakerMatch) {
                // Новый спикер
                const speaker = speakerMatch[1].trim();
                const timestamp = speakerMatch[2];

                if (this.isValidSpeaker(speaker)) {
                    currentSpeaker = speaker;
                    lastTimestamp = timestamp.length === 5 ? `${timestamp}:00` : timestamp;

                    // Инициализируем статистику участника если нужно
                    if (!participantStats.has(speaker)) {
                        participantStats.set(speaker, {
                            words: 0,
                            segments: 0,
                            averageSegmentLength: 0,
                            firstAppearance: timestamp,
                            lastAppearance: timestamp,
                            engagementScore: 0
                        });
                    }

                    const stats = participantStats.get(speaker)!;
                    stats.segments++;
                    stats.lastAppearance = timestamp;
                    totalSegments++;
                }
            } else if (currentSpeaker && line.toLowerCase() !== 'продолжение следует...') {
                // Текст спикера
                const stats = participantStats.get(currentSpeaker);
                if (stats) {
                    const wordCount = this.getCachedWordCount(line);
                    stats.words += wordCount;

                    // Анализ содержимого для дополнительных метрик
                    questionCount += (line.match(EnhancedNoteParser.REGEX_CACHE.questionWords) || []).length;
                    decisionCount += (line.match(EnhancedNoteParser.REGEX_CACHE.decisionWords) || []).length;

                    // Простой анализ тональности (0-10)
                    const sentimentScore = this.calculateSentiment(line);
                    totalSentimentScore += sentimentScore;
                    sentimentSamples++;
                }
            }
        }

        // Вычисляем финальные метрики
        this.calculateFinalStats(participantStats);

        const analytics: MeetingAnalytics = {
            duration: lastTimestamp,
            participantStats,
            meetingType: this.determineMeetingType(transcriptContent, questionCount, decisionCount),
            sentiment: this.categorizeSentiment(totalSentimentScore / Math.max(sentimentSamples, 1)),
            energyLevel: this.calculateEnergyLevel(participantStats, totalSegments),
            decisionCount,
            questionCount
        };

        // Кэшируем результат
        EnhancedNoteParser.analyticsCache.set(cacheKey, analytics);
        return analytics;
    }

    /**
     * Кэшированный подсчет слов с оптимизацией
     */
    private getCachedWordCount(text: string): number {
        const cacheKey = this.getCacheKey(text);
        if (EnhancedNoteParser.wordsCache.has(cacheKey)) {
            return EnhancedNoteParser.wordsCache.get(cacheKey)!;
        }

        // Оптимизированный подсчет слов
        const wordCount = text
            .replace(/[^\w\s\u0400-\u04FF]/g, ' ') // Убираем пунктуацию, оставляем кириллицу
            .split(/\s+/)
            .filter(word => word.length > 0).length;

        EnhancedNoteParser.wordsCache.set(cacheKey, wordCount);
        return wordCount;
    }

    /**
     * Умное определение самого вовлеченного участника
     * Учитывает не только количество слов, но и частоту выступлений
     */
    private findMostEngagedSpeaker(participantStats: Map<string, ParticipantStats>): string {
        let maxEngagement = 0;
        let mostEngaged = 'N/A';

        for (const [speaker, stats] of participantStats) {
            if (stats.engagementScore > maxEngagement) {
                maxEngagement = stats.engagementScore;
                mostEngaged = speaker;
            }
        }

        return mostEngaged;
    }

    /**
     * Вычисление финальной статистики участников
     */
    private calculateFinalStats(participantStats: Map<string, ParticipantStats>): void {
        const totalWords = Array.from(participantStats.values())
            .reduce((sum, stats) => sum + stats.words, 0);

        for (const stats of participantStats.values()) {
            // Средняя длина сегмента
            stats.averageSegmentLength = stats.segments > 0 ?
                Math.round(stats.words / stats.segments) : 0;

            // Комплексная оценка вовлеченности (0-100)
            const wordRatio = totalWords > 0 ? stats.words / totalWords : 0;
            const segmentConsistency = stats.averageSegmentLength / Math.max(stats.words, 1);
            stats.engagementScore = Math.round(
                (wordRatio * 60) + (segmentConsistency * 30) + (Math.min(stats.segments / 10, 1) * 10)
            );
        }
    }

    /**
     * Простой анализ тональности текста (0-10 шкала)
     */
    private calculateSentiment(text: string): number {
        const positiveWords = /(?:хорошо|отлично|согласен|правильно|успешно|получилось|классно|супер)/gi;
        const negativeWords = /(?:плохо|неправильно|проблема|ошибка|не\s+получилось|сложно|невозможно)/gi;

        const positiveCount = (text.match(positiveWords) || []).length;
        const negativeCount = (text.match(negativeWords) || []).length;

        return 5 + (positiveCount - negativeCount); // Базовая нейтральная оценка 5
    }

    /**
     * Определение типа встречи на основе содержимого
     */
    private determineMeetingType(content: string, questionCount: number, decisionCount: number): string {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('ретро') || lowerContent.includes('retrospective')) {
            return 'ретроспектива';
        }
        if (lowerContent.includes('планерка') || lowerContent.includes('standup')) {
            return 'планерка';
        }
        if (lowerContent.includes('презентация') || lowerContent.includes('демо')) {
            return 'презентация';
        }
        if (decisionCount > questionCount && decisionCount > 3) {
            return 'принятие решений';
        }
        if (questionCount > decisionCount && questionCount > 5) {
            return 'обсуждение';
        }

        return 'рабочая встреча';
    }

    /**
     * Категоризация тональности
     */
    private categorizeSentiment(score: number): 'positive' | 'neutral' | 'negative' {
        if (score > 6) return 'positive';
        if (score < 4) return 'negative';
        return 'neutral';
    }

    /**
     * Расчет уровня энергии встречи
     */
    private calculateEnergyLevel(
        participantStats: Map<string, ParticipantStats>,
        totalSegments: number
    ): 'high' | 'medium' | 'low' {
        const avgSegmentsPerParticipant = totalSegments / participantStats.size;

        if (avgSegmentsPerParticipant > 15) return 'high';
        if (avgSegmentsPerParticipant > 8) return 'medium';
        return 'low';
    }

    /**
     * Проверка валидности спикера
     */
    private isValidSpeaker(speaker: string): boolean {
        const invalidPatterns = [
            /transcription service/i,
            /meeting summary/i,
            /^recording/i,
            /^system/i
        ];

        return speaker.length > 0 &&
               speaker.length < 50 &&
               !invalidPatterns.some(pattern => pattern.test(speaker));
    }

    /**
     * Генерация ключа для кэширования
     */
    private getCacheKey(text: string): string {
        // Простой хэш для ключа кэша
        return text.length + '_' + text.substring(0, 50).replace(/\s/g, '');
    }

    /**
     * Форматирование статистики участников
     */
    private formatParticipantStats(participantStats: Map<string, ParticipantStats>): string[] {
        const stats: string[] = [];
        const sortedParticipants = Array.from(participantStats.entries())
            .sort(([,a], [,b]) => b.engagementScore - a.engagementScore);

        for (const [speaker, data] of sortedParticipants) {
            const totalWords = Array.from(participantStats.values())
                .reduce((sum, s) => sum + s.words, 0);
            const percentage = totalWords > 0 ? ((data.words / totalWords) * 100).toFixed(1) : '0';

            stats.push(
                `- **${speaker}**: ${data.words} слов (${percentage}%), ` +
                `${data.segments} выступлений, ` +
                `вовлеченность: ${data.engagementScore}/100`
            );
        }

        return stats;
    }

    /**
     * Парсинг содержимого заметок встречи
     */
    private parseNotesContent(notesContent: string) {
        return {
            summary: this.extractSection(notesContent, "Summary"),
            actionItems: this.extractSection(notesContent, "Action Items", true),
            keyPoints: this.extractSection(notesContent, "Key Points", true)
        };
    }

    /**
     * Извлечение метаданных встречи
     */
    private extractMetadata(notesContent: string, meetingFolderName: string) {
        // Очистка названия от UUID и временных меток
        let title = meetingFolderName
            .replace(EnhancedNoteParser.REGEX_CACHE.uuid, '')
            .replace(/\s*-\s*[A-Za-z]+(?:\s+|,\s*)[0-9]{1,2}(?:,\s*[0-9]{4})?(?:\s+[0-9]{1,2}[0-9]{2}(?:\s*(?:AM|PM))?)?$/, '')
            .trim();

        // Умное извлечение даты и времени
        const firstLine = notesContent.split('\n')[0]?.trim() || '';
        const date = this.extractDateSmart(firstLine) || this.extractDateSmart(meetingFolderName) || undefined;
        const time = this.extractTimeSmart(firstLine) || this.extractTimeSmart(meetingFolderName) || undefined;

        return { title, date, time };
    }

    /**
     * Улучшенное извлечение даты с поддержкой множественных форматов
     */
    private extractDateSmart(text: string): string | null {
        for (const regex of EnhancedNoteParser.REGEX_CACHE.dateFormats) {
            const match = text.match(regex);
            if (match) {
                // Обработка разных форматов...
                // Реализация зависит от конкретного формата
                return this.normalizeDate(match);
            }
        }
        return null;
    }

    /**
     * Улучшенное извлечение времени
     */
    private extractTimeSmart(text: string): string | null {
        for (const regex of EnhancedNoteParser.REGEX_CACHE.timeFormats) {
            const match = text.match(regex);
            if (match) {
                return this.normalizeTime(match);
            }
        }
        return null;
    }

    /**
     * Генерация расширенной аналитики
     */
    private generateEnhancedAnalytics(analytics: MeetingAnalytics, data: any) {
        return {
            entities: this.extractEntitiesEnhanced(data.notesContent, data.transcriptContent),
            tags: this.generateSmartTagsEnhanced(analytics, data),
            links: this.generateRelatedLinksEnhanced(data.notesContent, analytics)
        };
    }

    // Заглушки для методов, которые нужно будет реализовать
    private extractSection(content: string, section: string, asList?: boolean): string[] {
        if (!content || typeof content !== 'string') return [];

        const lines = content.split('\n');
        const sectionStart = new RegExp(`^${section}\\s*$`, 'i');
        let capturing = false;
        const result: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (sectionStart.test(trimmedLine)) {
                capturing = true;
                continue;
            }

            // Stop if we hit another section (starts with capital letter and ends with colon or is all caps)
            if (capturing && (
                /^[A-Z][A-Za-z\s]+:?\s*$/.test(trimmedLine) ||
                /^[A-Z\s]+$/.test(trimmedLine)
            ) && trimmedLine.length > 3) {
                break;
            }

            if (capturing && trimmedLine) {
                if (asList) {
                    // Clean up list items
                    const cleanItem = trimmedLine.replace(/^[-•*]\s*/, '').trim();
                    if (cleanItem) result.push(cleanItem);
                } else {
                    result.push(trimmedLine);
                }
            }
        }

        return result;
    }

    private normalizeDate(match: RegExpMatchArray): string | null {
        if (!match) return null;

        // Handle different date formats
        if (match[0].includes('-') && match[1] && match[2] && match[3]) {
            // YYYY-MM-DD format
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const day = parseInt(match[3], 10);

            if (year >= 2000 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            }
        } else if (match[1] && match[2] && match[3]) {
            // Month DD, YYYY format
            const monthName = match[1];
            const day = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            const month = this.monthNameToNumber(monthName);

            if (month > 0 && day >= 1 && day <= 31 && year >= 2000 && year <= 2030) {
                return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            }
        }

        return null;
    }

    private normalizeTime(match: RegExpMatchArray): string | null {
        if (!match) return null;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10) || 0;
        const ampm = match[4]?.toUpperCase();

        // Handle AM/PM
        if (ampm === 'PM' && hours !== 12) {
            hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
            hours = 0;
        }

        // Handle HHMM format (like 1105)
        if (match[0].length === 4 && !match[0].includes(':')) {
            hours = Math.floor(parseInt(match[0], 10) / 100);
            const mins = parseInt(match[0], 10) % 100;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        return null;
    }

    private monthNameToNumber(monthName: string): number {
        const months: { [key: string]: number } = {
            'january': 1, 'jan': 1, 'января': 1, 'янв': 1,
            'february': 2, 'feb': 2, 'февраля': 2, 'фев': 2,
            'march': 3, 'mar': 3, 'марта': 3, 'мар': 3,
            'april': 4, 'apr': 4, 'апреля': 4, 'апр': 4,
            'may': 5, 'мая': 5, 'май': 5,
            'june': 6, 'jun': 6, 'июня': 6, 'июн': 6,
            'july': 7, 'jul': 7, 'июля': 7, 'июл': 7,
            'august': 8, 'aug': 8, 'августа': 8, 'авг': 8,
            'september': 9, 'sep': 9, 'сентября': 9, 'сен': 9,
            'october': 10, 'oct': 10, 'октября': 10, 'окт': 10,
            'november': 11, 'nov': 11, 'ноября': 11, 'ноя': 11,
            'december': 12, 'dec': 12, 'декабря': 12, 'дек': 12
        };

        return months[monthName.toLowerCase()] || 0;
    }

    private formatTranscript(content: string, stats: Map<string, ParticipantStats>): string {
        const lines = content.split('\n');
        const formattedLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const speakerMatch = line.match(EnhancedNoteParser.REGEX_CACHE.speakerTime);

            if (speakerMatch) {
                const speaker = speakerMatch[1].trim();
                const timestamp = speakerMatch[2];
                const linkTimestamp = timestamp.length === 5 ? `${timestamp}:00` : timestamp;

                // Get engagement score for speaker
                const participantStat = stats.get(speaker);
                const engagementEmoji = participantStat ? this.getEngagementEmoji(participantStat.engagementScore) : '';

                // Read speaker's text
                const speakerText: string[] = [];
                let j = i + 1;

                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (!nextLine) {
                        j++;
                        continue;
                    }

                    if (EnhancedNoteParser.REGEX_CACHE.speakerTime.test(nextLine)) {
                        break;
                    }

                    if (nextLine.toLowerCase() === 'продолжение следует...') {
                        speakerText.push(`_${nextLine}_`);
                    } else {
                        speakerText.push(nextLine);
                    }
                    j++;
                }

                if (speakerText.length > 0) {
                    const formattedText = speakerText.join('\n');
                    formattedLines.push(`[[${linkTimestamp}]] **${speaker}**${engagementEmoji}: ${formattedText}`);
                }

                i = j - 1;
            }
        }

        return formattedLines.join('\n\n');
    }

    private getEngagementEmoji(score: number): string {
        if (score >= 80) return ' 🔥';
        if (score >= 60) return ' ⭐';
        if (score >= 40) return ' 💬';
        return '';
    }

    private extractEntitiesEnhanced(notesContent: string, transcriptContent: string): string[] {
        const entities: string[] = [];
        const fullText = `${notesContent} ${transcriptContent}`.substring(0, PERFORMANCE_LIMITS.ENTITIES_TEXT_LIMIT || 10000);

        // Поиск проектов и продуктов
        const projectMatches = fullText.match(EnhancedNoteParser.REGEX_CACHE.projects);
        if (projectMatches && projectMatches.length > 0) {
            entities.push('### 🚀 Упомянутые проекты', '');
            const uniqueProjects = [...new Set(projectMatches.slice(0, 5))];
            uniqueProjects.forEach(project => entities.push(`- ${project.trim()}`));
            entities.push('');
        }

        // Поиск компаний
        const companyPattern = /(?:компания|компании|организация|корпорация)\s+([А-Яа-я\w\s]{3,30})|([А-Яа-я][А-Яа-я\w]*(?:нефть|банк|групп|холдинг|корп))/gi;
        const companyMatches = fullText.match(companyPattern);
        if (companyMatches && companyMatches.length > 0) {
            entities.push('### 🏢 Упомянутые компании', '');
            const uniqueCompanies = [...new Set(companyMatches.slice(0, 5))];
            uniqueCompanies.forEach(company => entities.push(`- ${company.trim()}`));
            entities.push('');
        }

        return entities;
    }

    private generateSmartTagsEnhanced(analytics: MeetingAnalytics, data: any): string[] {
        const tags = ['meeting', 'krisp'];

        // Добавляем тип встречи
        tags.push(analytics.meetingType.replace(/\s+/g, '-'));

        // Добавляем тональность
        tags.push(analytics.sentiment);

        // Добавляем уровень энергии
        tags.push(`${analytics.energyLevel}-energy`);

        // Добавляем теги по количеству участников
        if (analytics.participantStats.size <= 2) {
            tags.push('малая-группа');
        } else if (analytics.participantStats.size <= 5) {
            tags.push('средняя-группа');
        } else {
            tags.push('большая-группа');
        }

        // Добавляем теги по активности
        if (analytics.decisionCount > 5) {
            tags.push('принятие-решений');
        }
        if (analytics.questionCount > 10) {
            tags.push('много-вопросов');
        }

        return tags;
    }

    private generateRelatedLinksEnhanced(notesContent: string, analytics: MeetingAnalytics): string[] {
        const links: string[] = [];

        // Базовые ссылки
        links.push('- 📋 **Связанные встречи:** [[Поиск встреч]]');
        links.push('- 📄 **Документы:** [[Поиск документов]]');

        // Ссылки в зависимости от типа встречи
        if (analytics.meetingType === 'планерка') {
            links.push('- 🏃 **Предыдущие планерки:** [[Планерки]]');
        } else if (analytics.meetingType === 'ретроспектива') {
            links.push('- 🔄 **Ретроспективы:** [[Ретроспективы]]');
        } else if (analytics.meetingType === 'принятие решений') {
            links.push('- ⚖️ **Принятые решения:** [[Решения]]');
        }

        return links;
    }
}
