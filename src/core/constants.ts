// Константы для производительности и лимитов
export const PERFORMANCE_LIMITS = {
    // Размеры текста для анализа
    ENTITIES_TEXT_LIMIT: 5000,
    SMART_TAGS_TEXT_LIMIT: 3000,

    // Лимиты извлечения данных
    MAX_PROJECTS_ENTITIES: 5,
    MAX_COMPANIES_ENTITIES: 5,
    MAX_DATES_ENTITIES: 5,

    // Файловая стабильность
    FILE_STABILITY_CHECK_INTERVAL: 500,
    FILE_STABILITY_MAX_WAIT: 5000,
    FILE_STABILITY_REQUIRED_CHECKS: 3,

    // Оптимизация больших файлов
    MAX_TRANSCRIPT_MEMORY_MB: 50,
    LARGE_FILE_CHUNK_SIZE: 64 * 1024,
    STREAMING_BUFFER_SIZE: 1024 * 1024,
} as const;

// Длительности уведомлений
export const NOTIFICATION_DURATIONS = {
    SUCCESS: 5000,
    ERROR: 8000,
    INFO: 5000,
    WARNING: 5000,
    TEMPORARY_STATUS: 3000,
} as const;

// Имена файлов Krisp
export const KRISP_FILE_NAMES = {
    MEETING_NOTES: 'meeting_notes.txt',
    TRANSCRIPT: 'transcript.txt',
    AUDIO_DEFAULT: 'recording.mp3',

    // Основной паттерн для обратной совместимости (стандартный Krisp)
    AUDIO_PATTERN: /^recording\.(mp3|m4a|wav|aac|flac|ogg)$/i,

    // Дополнительные паттерны для расширенного поиска медиафайлов
    RECORDING_PATTERNS: [
        /^recording\./i,           // Стандартный Krisp: recording.mp3
        /^audio\./i,               // Альтернативный: audio.mp3
        /^video\./i,               // Видео: video.mp4
        /^meeting_recording\./i,   // Полное имя: meeting_recording.mp3
        /^krisp_.*\.(mp3|m4a|wav|aac|flac|ogg|mp4|mov|avi|webm|mkv)$/i // krisp_timestamp.mp3
    ]
} as const;

// Утилитарные функции для работы с медиафайлами
export const MEDIA_UTILS = {
    // Общий паттерн медиафайлов (аудио + видео)
    MEDIA_EXTENSIONS: /\.(mp3|m4a|wav|aac|flac|ogg|mp4|mov|avi|webm|mkv)$/i,

    /**
     * Проверяет является ли файл медиафайлом (аудио или видео)
     */
    isMediaFile(fileName: string): boolean {
        return MEDIA_UTILS.MEDIA_EXTENSIONS.test(fileName);
    },

    /**
     * Определяет тип медиафайла
     */
    getMediaType(fileName: string): 'audio' | 'video' | 'unknown' {
        const audioExtensions = /\.(mp3|m4a|wav|aac|flac|ogg)$/i;
        const videoExtensions = /\.(mp4|mov|avi|webm|mkv)$/i;

        if (audioExtensions.test(fileName)) return 'audio';
        if (videoExtensions.test(fileName)) return 'video';
        return 'unknown';
    },

    /**
     * Ищет медиафайлы в списке файлов с приоритетом
     * @param files Список файлов
     * @returns Найденный медиафайл или null
     */
    findBestMediaFile(files: string[]): string | null {
        // Приоритет 1: Стандартный Krisp паттерн
        let found = files.find(f => KRISP_FILE_NAMES.AUDIO_PATTERN.test(f));
        if (found) return found;

        // Приоритет 2: Расширенные паттерны
        for (const pattern of KRISP_FILE_NAMES.RECORDING_PATTERNS) {
            found = files.find(f => pattern.test(f));
            if (found) return found;
        }

        // Приоритет 3: Любой медиафайл
        found = files.find(f => MEDIA_UTILS.isMediaFile(f));
        return found || null;
    }
} as const;

// Логирование
export const LOGGING = {
    MAX_LOG_ENTRIES: 1000,
    LOG_TTL_HOURS: 24,
    CLEANUP_INTERVAL_MINUTES: 30,
} as const;

// Валидация
export const VALIDATION = {
    VALID_STRATEGIES: ['skip', 'overwrite', 'rename'] as const,
    VALID_LANGUAGES: ['en', 'ru'] as const,
    MIN_UUID_LENGTH: 32,
    MIN_DATE_LENGTH: 10,
    MIN_TIME_LENGTH: 5,
} as const;

// Утилитарные функции для работы с файлами
export const FILE_UTILS = {
    /**
     * Очищает имя файла от недопустимых символов
     * @param fileName Имя файла для очистки
     * @returns Очищенное имя файла
     */
    sanitizeFileName: (fileName: string): string => {
        if (!fileName || typeof fileName !== 'string') {
            return 'untitled';
        }

        return fileName
            // Заменяем недопустимые символы для файловых систем
            .replace(/[\/:\[\]\*\?"<>\|#\^]/g, '_')
            // Заменяем множественные пробелы на одиночные подчеркивания
            .replace(/\s+/g, '_')
            // Убираем начальные и конечные подчеркивания
            .replace(/^_+|_+$/g, '')
            // Ограничиваем длину имени файла (без расширения)
            .substring(0, 200) || 'untitled';
    },

    /**
     * Безопасно извлекает подстроку с проверкой длины
     * @param str Исходная строка
     * @param start Начальная позиция
     * @param end Конечная позиция
     * @param fallback Значение по умолчанию
     * @returns Подстрока или fallback
     */
    safeSubstring: (str: string, start: number, end: number, fallback: string = ''): string => {
        if (!str || typeof str !== 'string' || str.length < end) {
            return fallback;
        }
        return str.substring(start, end);
    },

    /**
     * Проверяет является ли строка валидным именем файла
     * @param fileName Имя файла для проверки
     * @returns true если имя валидно
     */
    isValidFileName: (fileName: string): boolean => {
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }

        // Проверяем на недопустимые символы
        const invalidChars = /[\/:\[\]\*\?"<>\|#\^]/;
        return !invalidChars.test(fileName) && fileName.length > 0 && fileName.length <= 255;
    }
} as const;
