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
            coreAutomation: string;
            namingAndTemplates: string;
            importBehavior: string;
            manualOperations: string;
            aboutPlugin: string;
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
            restoreImprovedTemplate: string;
            restoreCompactTemplate: string;
        };
        info: {
            title: string;
            version: string;
            status: string;
            features: string[];
            commands: string[];
            errors: {
                watchedFolderMissing: string;
                watchedFolderEmptyAutoscan: string;
            };
        };
        status: {
            title: string;
            watchingActive: string;
            watchingInactive: string;
            watchingWarningFolderMissing: string;
            watchingStarting: string;
            inactiveDetailEnableAutoScan: string;
            inactiveDetailSetPath: string;
            serviceUnavailable: string;
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
        scanExistingDesc: string;
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
            noFileSelected: string;
            importFailedGeneral: string;
            massImportFailed: string;
        };
        warning: {
            duplicateSkipped: string;
            duplicateRenamed: string;
            duplicateOverwritten: string;
        };
        info: {
            processing: string;
            scanningFolder: string;
            scanningFolderComplete: string;
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
            description: string;
            importing: string;
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
            description: string;
            noLogs: string;
            copy: string;
            copiedNotice: string;
            clearedNotice: string;
        };
    };

    // New section for settings.info tooltips and links, can be nested under settings.info if preferred
    settingsInfoTooltips: {
        githubRepoTooltip: string;
        reportIssueTooltip: string;
        developer: string;
        supportDevelopment: string;
        donateLinkText: string;
        pluginDescription: string;
        resetSettingsDesc: string;
        supportDevelopmentPlaceholder: string;
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
            advanced: "🛠️ Advanced & Maintenance",
            coreAutomation: "📂 Core: Watching & Automation",
            namingAndTemplates: "🎨 Appearance & Naming",
            importBehavior: "⚙️ Import Behavior",
            manualOperations: "🛠️ Manual Operations & Diagnostics",
            aboutPlugin: "ℹ️ About Plugin"
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
            restoreTemplate: "Restore Default Template",
            restoreImprovedTemplate: "Use Improved Template",
            restoreCompactTemplate: "Use Compact Template"
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
            ],
            errors: {
                watchedFolderMissing: "Watched folder path is not specified. Auto-watching cannot start.",
                watchedFolderEmptyAutoscan: "Watched folder path is empty. Auto-watching stopped if it was active for a previous path."
            }
        },
        status: {
            title: "📊 Current Status",
            watchingActive: "Auto-watching is ACTIVE for folder: {{path}}",
            watchingInactive: "Auto-watching is INACTIVE.",
            watchingWarningFolderMissing: "Auto-watching is ON, but no folder specified. Please set the 'Watched Folder Path'.",
            watchingStarting: "Auto-watching is starting...",
            inactiveDetailEnableAutoScan: "Hint: Enable 'Enable Auto-Watching' option.",
            inactiveDetailSetPath: "Hint: Set the 'Watched Folder Path'.",
            serviceUnavailable: "File Watcher Service is not available. Please check plugin logs or restart Obsidian."
        }
    },
    commands: {
        importZip: "Import ZIP file manually",
        startWatching: "Start auto-watching folder",
        stopWatching: "Stop auto-watching",
        scanExisting: "Process All Existing Files",
        checkStatus: "Check watching status",
        debugSettings: "Debug current settings",
        scanExistingDesc: "Scan the watched folder and import all existing ZIP files that haven't been processed yet."
    },
    notifications: {
        success: {
            imported: "Successfully imported: {{fileName}}",
            watchingStarted: "Started watching folder: {{folderPath}}",
            watchingStopped: "Stopped watching folder.",
            settingsReset: "Settings have been reset to default."
        },
        error: {
            invalidZip: "Invalid ZIP file: {{fileName}}",
            missingFiles: "Missing required files in ZIP: {{fileName}}",
            createNote: "Error creating note for: {{fileName}} - {{error}}",
            copyAudio: "Error copying audio for: {{fileName}} - {{error}}",
            watchingFailed: "Failed to start watching: {{error}}",
            noFileSelected: "No file selected.",
            importFailedGeneral: "Import failed: {{error}}",
            massImportFailed: "Mass import failed. Check logs for details."
        },
        warning: {
            duplicateSkipped: "Skipped duplicate: {{fileName}}",
            duplicateRenamed: "Renamed duplicate: {{newName}} from {{originalName}}",
            duplicateOverwritten: "Overwritten duplicate: {{fileName}}"
        },
        info: {
            processing: "Processing: {{fileName}}...",
            scanningFolder: "Scanning folder: {{folderPath}}...",
            scanningFolderComplete: "Folder scan and import complete!"
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
            title: "Test Manual Import",
            placeholder: "Select Krisp ZIP file...",
            button: "Import Selected File",
            description: "Manually select a ZIP file to test the import process.",
            importing: "Importing..."
        },
        confirmReset: {
            title: "Confirm Reset",
            message: "Are you sure you want to reset all settings to their default values? This action cannot be undone.",
            confirm: "Reset Settings",
            cancel: "Cancel"
        },
        logs: {
            title: "Plugin Logs",
            export: "Export Logs",
            clear: "Clear Logs",
            close: "Close",
            description: "View recent activity logs for troubleshooting.",
            noLogs: "No logs yet.",
            copy: "Copy Logs",
            copiedNotice: "Logs copied to clipboard!",
            clearedNotice: "Logs cleared!"
        }
    },
    settingsInfoTooltips: {
        githubRepoTooltip: "Visit GitHub Repository",
        reportIssueTooltip: "Report an Issue",
        developer: "Developed by: {{author}}",
        supportDevelopment: "If you find this plugin useful, consider supporting its development: ",
        donateLinkText: "Buy Me a Coffee",
        pluginDescription: "Description: {{description}}",
        resetSettingsDesc: "Reset all plugin settings to their default values.",
        supportDevelopmentPlaceholder: "Support information for this plugin is not specified by the author."
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
            advanced: "🛠️ Расширенные и Обслуживание",
            coreAutomation: "📂 Ядро: Отслеживание и Автоматизация",
            namingAndTemplates: "🎨 Внешний вид и Именование",
            importBehavior: "⚙️ Поведение импорта",
            manualOperations: "🛠️ Ручные операции и Диагностика",
            aboutPlugin: "ℹ️ О плагине"
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
            restoreTemplate: "Восстановить стандартный шаблон",
            restoreImprovedTemplate: "Использовать улучшенный шаблон",
            restoreCompactTemplate: "Использовать компактный шаблон"
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
                "Импортировать ZIP-файл вручную",
                "Запустить автоматическое отслеживание папки",
                "Остановить автоматическое отслеживание",
                "Сканировать существующие файлы",
                "Проверить статус отслеживания",
                "Отладить текущие настройки"
            ],
            errors: {
                watchedFolderMissing: "Путь к отслеживаемой папке не указан. Автоматическое отслеживание не может быть запущено.",
                watchedFolderEmptyAutoscan: "Путь к отслеживаемой папке пуст. Автоматическое отслеживание остановлено, если было активно для предыдущего пути."
            }
        },
        status: {
            title: "📊 Текущий статус",
            watchingActive: "Автоотслеживание АКТИВНО для папки: {{path}}",
            watchingInactive: "Автоотслеживание НЕАКТИВНО.",
            watchingWarningFolderMissing: "Автоотслеживание ВКЛЮЧЕНО, но папка не указана. Укажите 'Отслеживаемая папка'.",
            watchingStarting: "Запуск автоотслеживания...",
            inactiveDetailEnableAutoScan: "Подсказка: Включите опцию 'Включить автоматическое отслеживание'.",
            inactiveDetailSetPath: "Подсказка: Укажите 'Отслеживаемая папка'.",
            serviceUnavailable: "Сервис отслеживания файлов недоступен. Проверьте логи плагина или перезапустите Obsidian."
        }
    },
    commands: {
        importZip: "Импортировать ZIP-файл вручную",
        startWatching: "Начать автоматическое отслеживание папки",
        stopWatching: "Остановить автоматическое отслеживание",
        scanExisting: "Обработать все существующие файлы",
        checkStatus: "Проверить статус отслеживания",
        debugSettings: "Отладить текущие настройки",
        scanExistingDesc: "Просканировать отслеживаемую папку и импортировать все существующие ZIP-файлы, которые еще не были обработаны."
    },
    notifications: {
        success: {
            imported: "Успешно импортирован: {{fileName}}",
            watchingStarted: "Начато отслеживание папки: {{folderPath}}",
            watchingStopped: "Отслеживание папки остановлено.",
            settingsReset: "Настройки были сброшены до значений по умолчанию."
        },
        error: {
            invalidZip: "Неверный ZIP-файл: {{fileName}}",
            missingFiles: "В ZIP отсутствуют необходимые файлы: {{fileName}}",
            createNote: "Ошибка создания заметки для: {{fileName}} - {{error}}",
            copyAudio: "Ошибка копирования аудио для: {{fileName}} - {{error}}",
            watchingFailed: "Не удалось начать отслеживание: {{error}}",
            noFileSelected: "Файл не выбран.",
            importFailedGeneral: "Ошибка импорта: {{error}}",
            massImportFailed: "Массовый импорт не удался. Проверьте логи для деталей."
        },
        warning: {
            duplicateSkipped: "Пропущен дубликат: {{fileName}}",
            duplicateRenamed: "Переименован дубликат: {{newName}} из {{originalName}}",
            duplicateOverwritten: "Перезаписан дубликат: {{fileName}}"
        },
        info: {
            processing: "Обработка: {{fileName}}...",
            scanningFolder: "Сканирование папки: {{folderPath}}...",
            scanningFolderComplete: "Сканирование папки и импорт завершены!"
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
            title: "Тестовый ручной импорт",
            placeholder: "Выберите ZIP-архив Krisp...",
            button: "Импортировать выбранный файл",
            description: "Выберите ZIP-архив вручную, чтобы протестировать процесс импорта.",
            importing: "Импорт..."
        },
        confirmReset: {
            title: "Подтвердите сброс",
            message: "Вы уверены, что хотите сбросить все настройки до значений по умолчанию? Это действие нельзя будет отменить.",
            confirm: "Сбросить настройки",
            cancel: "Отмена"
        },
        logs: {
            title: "Логи плагина",
            export: "Экспортировать логи",
            clear: "Очистить логи",
            close: "Закрыть",
            description: "Просмотр недавних логов активности для устранения неполадок.",
            noLogs: "Логов пока нет.",
            copy: "Копировать логи",
            copiedNotice: "Логи скопированы в буфер обмена!",
            clearedNotice: "Логи очищены!"
        }
    },
    settingsInfoTooltips: {
        githubRepoTooltip: "Посетить репозиторий GitHub",
        reportIssueTooltip: "Сообщить о проблеме",
        developer: "Разработано: {{author}}",
        supportDevelopment: "Если вы находите этот плагин полезным, рассмотрите возможность поддержки его разработки: ",
        donateLinkText: "Поддержать автора",
        pluginDescription: "Описание: {{description}}",
        resetSettingsDesc: "Сбросить все настройки плагина к значениям по умолчанию.",
        supportDevelopmentPlaceholder: "Информация о поддержке для этого плагина не указана автором."
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

    /**
     * Получает локализованную строку по ключу с переменными
     * Оптимизированная версия с одним проходом по ключам
     */
    t(key: string, variables?: Record<string, string>): string {
        const keys = key.split('.');

        // Пытаемся найти значение в текущем языке и английском за один проход
        const currentLangValue = this.getValueByKeys(this.strings[this.currentLanguage], keys);
        const englishValue = this.currentLanguage !== 'en'
            ? this.getValueByKeys(this.strings.en, keys)
            : null;

        // Выбираем подходящее значение
        const finalValue = currentLangValue ?? englishValue;

        if (typeof finalValue !== 'string') {
            return `[Missing: ${key}]`;
        }

        // Заменяем переменные
        return this.replaceVariables(finalValue, variables);
    }

    /**
     * Получает значение по массиву ключей за один проход
     */
    private getValueByKeys(obj: any, keys: string[]): any {
        let current = obj;

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return null; // Ключ не найден
            }
        }

        return current;
    }

    /**
     * Заменяет переменные в строке
     */
    private replaceVariables(text: string, variables?: Record<string, string>): string {
        if (!variables) {
            return text;
        }

        let result = text;
        for (const [varKey, varValue] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
        }

        return result;
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
