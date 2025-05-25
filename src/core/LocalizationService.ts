export type SupportedLanguage = 'en' | 'ru';

export interface LocalizedStrings {
    // Settings UI
    settings: {
        title: string;
        sections: {
            basic: string;
            storage: string;
            templates: string;
            duplicates: string;
            postImport: string;
            advanced: string;
        };
        fields: {
            watchedFolder: {
                name: string;
                desc: string;
            };
            autoScan: {
                name: string;
                desc: string;
            };
            notesFolder: {
                name: string;
                desc: string;
            };
            attachmentsFolder: {
                name: string;
                desc: string;
            };
            noteNameTemplate: {
                name: string;
                desc: string;
            };
            attachmentNameTemplate: {
                name: string;
                desc: string;
            };
            noteContentTemplate: {
                name: string;
                desc: string;
            };
            duplicateStrategy: {
                name: string;
                desc: string;
                options: {
                    skip: string;
                    overwrite: string;
                    rename: string;
                };
            };
            deleteZipAfterImport: {
                name: string;
                desc: string;
            };
            openNoteAfterImport: {
                name: string;
                desc: string;
            };
            language: {
                name: string;
                desc: string;
            };
        };
        buttons: {
            testImport: string;
            massImport: string;
            resetSettings: string;
            showLogs: string;
            restoreTemplate: string;
        };
        info: {
            title: string;
            version: string;
            status: string;
            features: string[];
            commands: string[];
        };
    };

    // Commands
    commands: {
        importZip: string;
        startWatching: string;
        stopWatching: string;
        scanExisting: string;
        checkStatus: string;
        debugSettings: string;
    };

    // Notifications
    notifications: {
        success: {
            imported: string;
            watchingStarted: string;
            watchingStopped: string;
            settingsReset: string;
        };
        error: {
            invalidZip: string;
            missingFiles: string;
            createNote: string;
            copyAudio: string;
            watchingFailed: string;
        };
        warning: {
            duplicateSkipped: string;
            duplicateRenamed: string;
            duplicateOverwritten: string;
        };
        info: {
            processing: string;
            scanningFolder: string;
        };
    };

    // Status bar
    statusBar: {
        idle: string;
        watching: string;
        processing: string;
        error: string;
    };

    // Modals
    modals: {
        testImport: {
            title: string;
            placeholder: string;
            button: string;
        };
        confirmReset: {
            title: string;
            message: string;
            confirm: string;
            cancel: string;
        };
        logs: {
            title: string;
            export: string;
            clear: string;
            close: string;
        };
    };
}

const EN_STRINGS: LocalizedStrings = {
    settings: {
        title: "Krisp Notes Importer Settings",
        sections: {
            basic: "🔧 Basic Settings",
            storage: "💾 Obsidian Storage",
            templates: "📝 Templates & Naming",
            duplicates: "🔄 Duplicate Handling",
            postImport: "⚡ Post-Import Actions",
            advanced: "🛠️ Advanced & Maintenance"
        },
        fields: {
            watchedFolder: {
                name: "Watched Folder Path",
                desc: "Full path to the folder where Krisp saves ZIP archives"
            },
            autoScan: {
                name: "Enable Auto-Watching",
                desc: "Automatically monitor the folder for new ZIP files"
            },
            notesFolder: {
                name: "Notes Folder",
                desc: "Folder in your Obsidian vault for saving meeting notes"
            },
            attachmentsFolder: {
                name: "Attachments Folder",
                desc: "Folder in your Obsidian vault for saving audio files"
            },
            noteNameTemplate: {
                name: "Note Name Template",
                desc: "Template for naming note files. Available variables: {{YYYY}}, {{MM}}, {{DD}}, {{HHMM}}, {{meetingTitle}}"
            },
            attachmentNameTemplate: {
                name: "Audio Name Template",
                desc: "Template for naming audio files. Same variables available"
            },
            noteContentTemplate: {
                name: "Note Content Template",
                desc: "Template for note content. Available variables: {{title}}, {{date}}, {{time}}, {{participants}}, {{summary}}, {{actionItems}}, {{keyPoints}}, {{transcript}}, {{audioLink}}"
            },
            duplicateStrategy: {
                name: "Duplicate Strategy",
                desc: "What to do when a meeting with the same name already exists",
                options: {
                    skip: "Skip import",
                    overwrite: "Overwrite existing",
                    rename: "Create with suffix"
                }
            },
            deleteZipAfterImport: {
                name: "Delete ZIP after import",
                desc: "Automatically delete the ZIP file after successful import"
            },
            openNoteAfterImport: {
                name: "Open note after import",
                desc: "Automatically open the created note in Obsidian"
            },
            language: {
                name: "Interface Language",
                desc: "Choose the language for the plugin interface"
            }
        },
        buttons: {
            testImport: "Test Import",
            massImport: "Import All Files",
            resetSettings: "Reset Settings",
            showLogs: "Show Logs",
            restoreTemplate: "Restore Default Template"
        },
        info: {
            title: "Plugin Information",
            version: "Version",
            status: "Status",
            features: [
                "✅ Manual ZIP import",
                "✅ Automatic folder watching",
                "✅ Beautiful note formatting with callouts",
                "✅ Advanced participant analytics",
                "✅ Complete UI settings",
                "✅ Logging and diagnostic system",
                "✅ Bilingual support (English/Russian)"
            ],
            commands: [
                "Import ZIP file manually",
                "Start auto-watching folder",
                "Stop auto-watching",
                "Scan existing files",
                "Check watching status",
                "Debug current settings"
            ]
        }
    },
    commands: {
        importZip: "Import ZIP file manually",
        startWatching: "Start auto-watching folder",
        stopWatching: "Stop auto-watching",
        scanExisting: "Scan existing files in folder",
        checkStatus: "Check watching status",
        debugSettings: "Debug current settings"
    },
    notifications: {
        success: {
            imported: "Meeting '{{title}}' imported successfully!",
            watchingStarted: "Auto-watching started for: {{path}}",
            watchingStopped: "Auto-watching stopped",
            settingsReset: "Settings reset to defaults"
        },
        error: {
            invalidZip: "Invalid ZIP file: {{file}}",
            missingFiles: "Required files not found in: {{file}}",
            createNote: "Failed to create note for: {{title}}",
            copyAudio: "Failed to copy audio file for: {{title}}",
            watchingFailed: "Failed to start watching: {{error}}"
        },
        warning: {
            duplicateSkipped: "Meeting '{{title}}' already exists - skipped",
            duplicateRenamed: "Meeting '{{title}}' already exists - created as '{{newTitle}}'",
            duplicateOverwritten: "Meeting '{{title}}' already exists - overwritten"
        },
        info: {
            processing: "Processing: {{file}}",
            scanningFolder: "Scanning folder for ZIP files..."
        }
    },
    statusBar: {
        idle: "Idle",
        watching: "Watching: {{path}}",
        processing: "Processing...",
        error: "Error: {{message}}"
    },
    modals: {
        testImport: {
            title: "Test Import ZIP File",
            placeholder: "Enter full path to ZIP file...",
            button: "Test Import"
        },
        confirmReset: {
            title: "Reset Settings",
            message: "Are you sure you want to reset all settings to defaults? This action cannot be undone.",
            confirm: "Reset",
            cancel: "Cancel"
        },
        logs: {
            title: "Plugin Logs",
            export: "Export",
            clear: "Clear",
            close: "Close"
        }
    }
};

const RU_STRINGS: LocalizedStrings = {
    settings: {
        title: "Настройки Krisp Notes Importer",
        sections: {
            basic: "🔧 Основные настройки",
            storage: "💾 Хранение в Obsidian",
            templates: "📝 Шаблоны и именование",
            duplicates: "🔄 Обработка дубликатов",
            postImport: "⚡ Действия после импорта",
            advanced: "🛠️ Дополнительно и обслуживание"
        },
        fields: {
            watchedFolder: {
                name: "Отслеживаемая папка",
                desc: "Полный путь к папке, где Krisp сохраняет ZIP-архивы"
            },
            autoScan: {
                name: "Включить автоматическое отслеживание",
                desc: "Автоматически отслеживать папку на предмет новых ZIP-файлов"
            },
            notesFolder: {
                name: "Папка для заметок",
                desc: "Папка в вашем хранилище Obsidian для сохранения заметок встреч"
            },
            attachmentsFolder: {
                name: "Папка для вложений",
                desc: "Папка в вашем хранилище Obsidian для сохранения аудиофайлов"
            },
            noteNameTemplate: {
                name: "Шаблон имени заметки",
                desc: "Шаблон для именования файлов заметок. Доступные переменные: {{YYYY}}, {{MM}}, {{DD}}, {{HHMM}}, {{meetingTitle}}"
            },
            attachmentNameTemplate: {
                name: "Шаблон имени аудио",
                desc: "Шаблон для именования аудиофайлов. Доступны те же переменные"
            },
            noteContentTemplate: {
                name: "Шаблон содержимого заметки",
                desc: "Шаблон для содержимого заметки. Доступные переменные: {{title}}, {{date}}, {{time}}, {{participants}}, {{summary}}, {{actionItems}}, {{keyPoints}}, {{transcript}}, {{audioLink}}"
            },
            duplicateStrategy: {
                name: "Стратегия дубликатов",
                desc: "Что делать, когда встреча с таким же именем уже существует",
                options: {
                    skip: "Пропустить импорт",
                    overwrite: "Перезаписать существующую",
                    rename: "Создать с суффиксом"
                }
            },
            deleteZipAfterImport: {
                name: "Удалять ZIP после импорта",
                desc: "Автоматически удалять ZIP-файл после успешного импорта"
            },
            openNoteAfterImport: {
                name: "Открывать заметку после импорта",
                desc: "Автоматически открывать созданную заметку в Obsidian"
            },
            language: {
                name: "Язык интерфейса",
                desc: "Выберите язык для интерфейса плагина"
            }
        },
        buttons: {
            testImport: "Тестовый импорт",
            massImport: "Импортировать все файлы",
            resetSettings: "Сбросить настройки",
            showLogs: "Показать логи",
            restoreTemplate: "Восстановить стандартный шаблон"
        },
        info: {
            title: "Информация о плагине",
            version: "Версия",
            status: "Статус",
            features: [
                "✅ Ручной импорт ZIP",
                "✅ Автоматическое отслеживание папки",
                "✅ Красивое оформление заметок с callouts",
                "✅ Расширенная аналитика участников",
                "✅ Полный UI настроек",
                "✅ Система логирования и диагностики",
                "✅ Двуязычная поддержка (English/Русский)"
            ],
            commands: [
                "Ручной импорт ZIP-файла",
                "Запуск автоматического отслеживания папки",
                "Остановка автоматического отслеживания",
                "Сканирование существующих файлов",
                "Проверка статуса отслеживания",
                "Отладка текущих настроек"
            ]
        }
    },
    commands: {
        importZip: "Ручной импорт ZIP-файла",
        startWatching: "Запустить автоматическое отслеживание папки",
        stopWatching: "Остановить автоматическое отслеживание",
        scanExisting: "Сканировать существующие файлы в папке",
        checkStatus: "Проверить статус отслеживания",
        debugSettings: "Отладка текущих настроек"
    },
    notifications: {
        success: {
            imported: "Встреча '{{title}}' успешно импортирована!",
            watchingStarted: "Автоматическое отслеживание запущено для: {{path}}",
            watchingStopped: "Автоматическое отслеживание остановлено",
            settingsReset: "Настройки сброшены к значениям по умолчанию"
        },
        error: {
            invalidZip: "Неверный ZIP-файл: {{file}}",
            missingFiles: "Необходимые файлы не найдены в: {{file}}",
            createNote: "Не удалось создать заметку для: {{title}}",
            copyAudio: "Не удалось скопировать аудиофайл для: {{title}}",
            watchingFailed: "Не удалось запустить отслеживание: {{error}}"
        },
        warning: {
            duplicateSkipped: "Встреча '{{title}}' уже существует - пропущена",
            duplicateRenamed: "Встреча '{{title}}' уже существует - создана как '{{newTitle}}'",
            duplicateOverwritten: "Встреча '{{title}}' уже существует - перезаписана"
        },
        info: {
            processing: "Обработка: {{file}}",
            scanningFolder: "Сканирование папки на предмет ZIP-файлов..."
        }
    },
    statusBar: {
        idle: "Ожидание",
        watching: "Отслеживание: {{path}}",
        processing: "Обработка...",
        error: "Ошибка: {{message}}"
    },
    modals: {
        testImport: {
            title: "Тестовый импорт ZIP-файла",
            placeholder: "Введите полный путь к ZIP-файлу...",
            button: "Тестовый импорт"
        },
        confirmReset: {
            title: "Сброс настроек",
            message: "Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.",
            confirm: "Сбросить",
            cancel: "Отмена"
        },
        logs: {
            title: "Логи плагина",
            export: "Экспорт",
            clear: "Очистить",
            close: "Закрыть"
        }
    }
};

export class LocalizationService {
    private currentLanguage: SupportedLanguage = 'en';
    private strings: Record<SupportedLanguage, LocalizedStrings> = {
        en: EN_STRINGS,
        ru: RU_STRINGS
    };

    constructor(language?: SupportedLanguage) {
        if (language) {
            this.currentLanguage = language;
        }
    }

    setLanguage(language: SupportedLanguage): void {
        this.currentLanguage = language;
    }

    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    t(key: string, variables?: Record<string, string>): string {
        const keys = key.split('.');
        let value: any = this.strings[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found
                value = this.strings.en;
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return `[Missing: ${key}]`;
                    }
                }
                break;
            }
        }

        if (typeof value !== 'string') {
            return `[Invalid: ${key}]`;
        }

        // Replace variables
        if (variables) {
            for (const [varKey, varValue] of Object.entries(variables)) {
                value = value.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
            }
        }

        return value;
    }

    // Convenience methods for common translations
    getSettingsStrings() {
        return this.strings[this.currentLanguage].settings;
    }

    getCommandStrings() {
        return this.strings[this.currentLanguage].commands;
    }

    getNotificationStrings() {
        return this.strings[this.currentLanguage].notifications;
    }

    getStatusBarStrings() {
        return this.strings[this.currentLanguage].statusBar;
    }

    getModalStrings() {
        return this.strings[this.currentLanguage].modals;
    }
}
