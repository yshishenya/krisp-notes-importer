# Архитектура плагина "Krisp Notes Importer"

## 1. Обзор

Плагин "Krisp Notes Importer" для Obsidian будет построен на модульной архитектуре, чтобы обеспечить гибкость, расширяемость и простоту поддержки. Основные компоненты будут взаимодействовать через четко определенные интерфейсы. Плагин будет использовать стандартный API Obsidian для взаимодействия с хранилищем, файловой системой и пользовательским интерфейсом.

## 2. Компоненты плагина

### 2.1. `MainPlugin (main.ts)` - Основной класс плагина
*   **Ответственность:**
    *   Инициализация и деинициализация плагина (загрузка/выгрузка).
    *   Регистрация настроек плагина в Obsidian.
    *   Регистрация команд плагина (ручной импорт, открытие настроек).
    *   Создание и управление экземплярами других компонентов (менеджер настроек, сервис отслеживания, сервис обработки, сервис уведомлений).
    *   Координация взаимодействия между компонентами.
*   **Методы:**
    *   `onload()`: Вызывается при загрузке плагина. Инициализирует компоненты, загружает настройки, запускает отслеживание (если включено).
    *   `onunload()`: Вызывается при выгрузке плагина. Останавливает отслеживание, освобождает ресурсы.
    *   `loadSettings()`: Загружает настройки плагина из хранилища Obsidian.
    *   `saveSettings()`: Сохраняет настройки плагина.
    *   Команды для палитры команд Obsidian (например, `importSingleZip`, `importAllZipsInWatchedFolder`, `openSettings`).

### 2.2. `SettingsManager` - Менеджер настроек
*   **Ответственность:**
    *   Хранение текущих настроек плагина.
    *   Предоставление доступа к настройкам другим компонентам.
    *   Загрузка и сохранение настроек (взаимодействует с `MainPlugin` и Obsidian API для хранения данных).
    *   Валидация настроек.
*   **Структура данных настроек (пример):**
    ```typescript
    interface KrispImporterSettings {
        watchedFolderPath: string;
        notesFolderPath: string;    // Относительно корня хранилища
        attachmentsFolderPath: string; // Относительно корня хранилища
        noteNameTemplate: string;
        attachmentNameTemplate: string;
        noteContentTemplate: string;
        duplicateStrategy: 'skip' | 'overwrite' | 'rename';
        deleteZipAfterImport: boolean;
        openNoteAfterImport: boolean;
        autoScanEnabled: boolean; // Включено ли автоматическое отслеживание
        // ... другие настройки из SRS
    }
    ```
*   **Методы:**
    *   `getSetting(key)`: Получить значение настройки.
    *   `updateSetting(key, value)`: Обновить значение настройки.
    *   `getAllSettings()`: Получить все настройки.
    *   `load()`: Загрузить настройки.
    *   `save()`: Сохранить настройки.
    *   `validate()`: Проверить корректность настроек (например, существование папок, если это применимо до запуска).

### 2.3. `FileWatcherService` - Сервис отслеживания папки
*   **Ответственность:**
    *   Мониторинг указанной в настройках папки на предмет появления новых `.zip` файлов.
    *   Использование Obsidian API (`Vault.on('create')` или более специфичные для файловой системы API, если доступны и подходят) или стандартных механизмов Node.js (например, `fs.watch` из `original-fs` адаптера Obsidian) для отслеживания. Приоритет на API Obsidian для лучшей интеграции и кроссплатформенности.
    *   Передача пути к новому ZIP-файлу в `ProcessingService` для обработки.
*   **Методы:**
    *   `startWatching(folderPath)`: Начать отслеживание указанной папки.
    *   `stopWatching()`: Прекратить отслеживание.
    *   `processNewFile(filePath)`: Внутренний метод, вызываемый при обнаружении нового файла.

### 2.4. `ProcessingService` - Сервис обработки файлов
*   **Ответственность:**
    *   Полный цикл обработки одного ZIP-файла.
    *   Взаимодействие с `ZipExtractor` для распаковки.
    *   Взаимодействие с `NoteParser` для извлечения данных из текстовых файлов.
    *   Взаимодействие с `NoteCreator` для создания Markdown-заметки.
    *   Взаимодействие с Obsidian API для работы с файлами (создание, перемещение).
    *   Обработка логики дубликатов согласно настройкам.
    *   Управление временными файлами/папками.
*   **Методы:**
    *   `processZipFile(zipFilePath)`: Основной метод, запускающий обработку ZIP-файла.
    *   `handleDuplicate(filePath, strategy)`: Логика обработки дубликатов.

### 2.5. `ZipExtractor` - Извлекатель из ZIP
*   **Ответственность:**
    *   Распаковка содержимого ZIP-архива во временную директорию.
    *   Использование библиотеки типа `jszip`.
*   **Методы:**
    *   `extract(zipFilePath, tempDirPath)`: Распаковать архив.
    *   `cleanup(tempDirPath)`: Удалить временную директорию.

### 2.6. `NoteParser` - Парсер заметок Krisp
*   **Ответственность:**
    *   Извлечение структурированных данных из файлов `meeting_notes.txt` и `transcript.txt`.
    *   Определение даты, времени, названия встречи, участников, резюме, ключевых моментов, списка действий.
    *   Форматирование транскрипта (например, создание кликабельных временных меток).
    *   Вся логика, которая ранее была в bash-скрипте по извлечению данных.
*   **Методы:**
    *   `parseMeetingNotes(notesContent: string, meetingFolderName: string)`: Извлечь данные из `meeting_notes.txt` и имени папки.
    *   `parseTranscript(transcriptContent: string)`: Извлечь участников и отформатировать транскрипт.
    *   Вспомогательные методы для извлечения конкретных секций (например, `extractDate`, `extractTime`, `extractParticipants`, `extractActionItems`).

### 2.7. `NoteCreator` - Создатель заметок Obsidian
*   **Ответственность:**
    *   Формирование содержимого Markdown-заметки на основе извлеченных данных и пользовательского шаблона (или шаблона по умолчанию).
    *   Создание YAML Frontmatter.
    *   Сохранение заметки в указанной папке в хранилище Obsidian с использованием API.
*   **Методы:**
    *   `createNote(parsedData, settings)`: Создать и сохранить заметку.
    *   `applyTemplate(templateString, data)`: Заполнить шаблон данными.

### 2.8. `NotificationService` - Сервис уведомлений
*   **Ответственность:**
    *   Отображение уведомлений пользователю (успех, ошибка, дубликат) с использованием Obsidian API (`new Notice(...)`).
    *   Формирование текстов уведомлений.
    *   Возможно, реализация интерактивных уведомлений, если API позволяет.
*   **Методы:**
    *   `showSuccess(message)`.
    *   `showError(message)`.
    *   `showWarning(message)`.
    *   `showDuplicateFound(fileName, strategy, actions)`: Уведомление о дубликате с возможными действиями.

### 2.9. `SettingsUI (SettingsTab.ts)` - Пользовательский интерфейс настроек
*   **Ответственность:**
    *   Создание и отображение вкладки настроек плагина в Obsidian.
    *   Предоставление пользователю элементов управления для всех настраиваемых параметров (текстовые поля, выпадающие списки, чекбоксы, кнопки выбора папок).
    *   Взаимодействие с `SettingsManager` для загрузки и сохранения настроек.
    *   Реализация "Мастера первоначальной настройки", "Тестового импорта" и других интерактивных элементов UI.
*   **Методы (внутренние, для построения UI):**
    *   `display()`: Основной метод, вызываемый Obsidian для отрисовки вкладки настроек.
    *   Методы для создания каждого элемента управления (например, `createFolderPathSetting`, `createTemplateSetting`).

## 3. Потоки данных и взаимодействие

1.  **Загрузка плагина:** `MainPlugin.onload()` -> `SettingsManager.load()` -> `FileWatcherService.startWatching()` (если включено).
2.  **Обнаружение нового файла:** `FileWatcherService` -> `ProcessingService.processZipFile()`.
3.  **Обработка ZIP:**
    *   `ProcessingService` -> `ZipExtractor.extract()`.
    *   `ProcessingService` читает файлы -> `NoteParser.parseMeetingNotes()`, `NoteParser.parseTranscript()`.
    *   `ProcessingService` проверяет дубликаты (используя Obsidian API для проверки существования файлов).
    *   `ProcessingService` -> `NoteCreator.createNote()` (использует `SettingsManager` для шаблонов).
    *   `ProcessingService` перемещает аудиофайл (Obsidian API).
    *   `ProcessingService` -> `NotificationService.showSuccess()` или `showError()`.
    *   `ProcessingService` (опционально) удаляет ZIP-файл.
4.  **Изменение настроек:** Пользователь в `SettingsUI` -> `SettingsManager.updateSetting()` -> `SettingsManager.save()`.
5.  **Ручной импорт:** Команда в Obsidian -> `MainPlugin` -> `ProcessingService.processZipFile()` (для одного файла) или итерация по файлам в папке.

## 4. Используемые технологии и API Obsidian

*   **Язык:** TypeScript.
*   **Сборка:** Стандартный процесс сборки для плагинов Obsidian (например, через `npm run dev` или `npm run build`).
*   **Obsidian API:**
    *   `Plugin`, `App`, `Vault`, `Workspace`, `Notice`, `Setting`, `PluginSettingTab`.
    *   `Vault.on('create', ...)`, `Vault.getAbstractFileByPath()`, `Vault.create()`, `Vault.modify()`, `Vault.rename()`, `Vault.delete()`.
    *   `DataAdapter.read()`, `DataAdapter.write()`.
    *   API для работы с настройками: `loadData()`, `saveData()`.
*   **Сторонние библиотеки:**
    *   `jszip` (или аналогичная) для работы с ZIP-архивами.

## 5. Расширяемость

*   Четкое разделение на сервисы позволит в будущем добавлять новые функции (например, поддержку других форматов встреч, кроме Krisp) с меньшими изменениями в существующем коде.
*   Использование шаблонов для заметок уже обеспечивает хорошую гибкость для пользователя.

## 6. Каталог с исходным кодом (предполагаемая структура)

```
krisp-notes-importer/
├── src/
│   ├── main.ts                 # MainPlugin
│   ├── core/
│   │   ├── SettingsManager.ts
│   │   ├── FileWatcherService.ts
│   │   ├── ProcessingService.ts
│   │   ├── ZipExtractor.ts
│   │   ├── NoteParser.ts
│   │   ├── NoteCreator.ts
│   │   └── NotificationService.ts
│   ├── ui/
│   │   └── SettingsTab.ts        # SettingsUI
│   └──
    interfaces.ts         # Общие интерфейсы (например, для настроек, данных парсера)
├── styles.css
├── manifest.json
├── package.json
├── tsconfig.json
└── rollup.config.js
```
