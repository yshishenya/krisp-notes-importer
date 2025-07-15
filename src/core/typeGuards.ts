import { KrispImporterSettings, ParsedKrispData } from '../interfaces';
import { VALIDATION, FILE_UTILS } from './constants';

/**
 * Type Guards для валидации внешних данных
 */

// ===========================================
// KRISP FILE VALIDATION
// ===========================================

/**
 * Проверяет является ли строка валидным содержимым meeting_notes.txt
 */
export function isValidMeetingNotesContent(content: unknown): content is string {
    if (typeof content !== 'string') {
        return false;
    }

    // Базовая проверка - содержимое должно быть не пустым и содержать хотя бы одну из ключевых секций
    const hasValidSections = content.includes('Summary') ||
                           content.includes('Action Items') ||
                           content.includes('Key Points') ||
                           content.length > 10; // Минимальное содержимое

    return hasValidSections;
}

/**
 * Проверяет является ли строка валидным содержимым transcript.txt
 */
export function isValidTranscriptContent(content: unknown): content is string {
    if (typeof content !== 'string') {
        return false;
    }

    // Транскрипт может быть пустым, но если есть содержимое, должно содержать паттерн спикер|время
    if (content.length === 0) {
        return true; // Пустой транскрипт допустим
    }

    // Ищем паттерн: "Имя спикера | ЧЧ:ММ"
    const speakerTimePattern = /^.+\s*\|\s*\d{2}:\d{2}/m;
    return speakerTimePattern.test(content);
}

/**
 * Проверяет валидность структуры ParsedKrispData
 */
export function isValidParsedKrispData(data: unknown): data is ParsedKrispData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const obj = data as any;

    // Проверяем обязательные поля и их типы
    return (
        // meetingTitle может быть undefined или string
        (obj.meetingTitle === undefined || typeof obj.meetingTitle === 'string') &&

        // date должна быть undefined или валидная дата
        (obj.date === undefined || isValidDateString(obj.date)) &&

        // time должно быть undefined или валидное время
        (obj.time === undefined || isValidTimeString(obj.time)) &&

        // participants должен быть undefined или массив строк
        (obj.participants === undefined || (Array.isArray(obj.participants) && obj.participants.every((p: any) => typeof p === 'string')))
    );
}

// ===========================================
// SETTINGS VALIDATION
// ===========================================

/**
 * Проверяет валидность настроек пользователя
 */
export function isValidKrispImporterSettings(settings: unknown): settings is KrispImporterSettings {
    if (!settings || typeof settings !== 'object') {
        return false;
    }

    const obj = settings as any;

    return (
        // Проверяем все обязательные строковые поля
        typeof obj.watchedFolderPath === 'string' &&
        typeof obj.notesFolderPath === 'string' &&
        typeof obj.attachmentsFolderPath === 'string' &&
        typeof obj.noteNameTemplate === 'string' &&
        typeof obj.attachmentNameTemplate === 'string' &&
        typeof obj.noteContentTemplate === 'string' &&

        // Проверяем enum поля
        VALIDATION.VALID_STRATEGIES.includes(obj.duplicateStrategy) &&
        VALIDATION.VALID_LANGUAGES.includes(obj.language) &&

        // Проверяем boolean поля
        typeof obj.deleteZipAfterImport === 'boolean' &&
        typeof obj.openNoteAfterImport === 'boolean' &&
        typeof obj.autoScanEnabled === 'boolean'
    );
}

// ===========================================
// FILE SYSTEM VALIDATION
// ===========================================

/**
 * Проверяет является ли путь валидным для файла
 */
export function isValidFilePath(path: unknown): path is string {
    if (typeof path !== 'string' || path.length === 0) {
        return false;
    }

    // Базовая проверка на недопустимые символы
    const invalidChars = /[\0<>:"|?*]/; // Запрещенные символы в путях
    return !invalidChars.test(path) && path.length < 1000; // Разумная максимальная длина
}

/**
 * Проверяет является ли имя файла валидным
 */
export function isValidFileName(fileName: unknown): fileName is string {
    if (typeof fileName !== 'string') {
        return false;
    }

    return FILE_UTILS.isValidFileName(fileName);
}

/**
 * Проверяет является ли содержимое валидным ZIP архивом (по расширению)
 */
export function isValidZipFile(filePath: unknown): filePath is string {
    if (!isValidFilePath(filePath)) {
        return false;
    }

    return filePath.toLowerCase().endsWith('.zip');
}

// ===========================================
// UTILITY VALIDATION FUNCTIONS
// ===========================================

/**
 * Проверяет является ли строка валидной датой в формате YYYY-MM-DD
 */
export function isValidDateString(date: unknown): date is string {
    if (typeof date !== 'string') {
        return false;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
        return false;
    }

    // Проверяем что дата может быть парсирована
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date);
}

/**
 * Проверяет является ли строка валидным временем в формате HH:MM
 */
export function isValidTimeString(time: unknown): time is string {
    if (typeof time !== 'string') {
        return false;
    }

    const timePattern = /^\d{2}:\d{2}$/;
    if (!timePattern.test(time)) {
        return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Проверяет является ли объект ошибкой
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error ||
           (typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as any).message === 'string');
}

/**
 * Безопасно приводит unknown к string с fallback
 */
export function safeStringify(value: unknown, fallback: string = 'Unknown'): string {
    if (typeof value === 'string') {
        return value;
    }

    if (value === null || value === undefined) {
        return fallback;
    }

    try {
        return String(value);
    } catch {
        return fallback;
    }
}

/**
 * Безопасно приводит unknown к number с fallback
 */
export function safeNumberify(value: unknown, fallback: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }

    return fallback;
}
