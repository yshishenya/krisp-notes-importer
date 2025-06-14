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

### 2.3. `FileWatcherService` - Сервис отслеживания папки ✅ **РЕАЛИЗОВАН v3.0.0**
*   **Ответственность:**
    *   Мониторинг указанной в настройках папки на предмет появления новых `.zip` файлов.
    *   Использование Node.js `fs.watch` для реального отслеживания файловой системы.
    *   Проверка стабильности файлов (ожидание завершения копирования).
    *   Передача пути к новому ZIP-файлу в `ProcessingService` для обработки.
*   **Методы:**
    *   `startWatching(folderPath)`: Начать отслеживание указанной папки.
    *   `stopWatching()`: Прекратить отслеживание.
    *   `isCurrentlyWatching()`: Проверка статуса отслеживания.
    *   `getWatchedPath()`: Получение текущего пути отслеживания.
    *   `scanExistingFiles()`: Массовое сканирование существующих ZIP-файлов.
    *   `waitForFileStability(filePath)`: Ожидание завершения копирования файла.

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

### 2.8. `NotificationService` - Сервис уведомлений ✅ **РЕАЛИЗОВАН**
*   **Ответственность:**
    *   Отображение уведомлений пользователю (успех, ошибка, дубликат) с использованием Obsidian API (`new Notice(...)`).
    *   Формирование текстов уведомлений.
    *   Возможно, реализация интерактивных уведомлений, если API позволяет.
*   **Методы:**
    *   `showSuccess(message)`.
    *   `showError(message)`.
    *   `showWarning(message)`.
    *   `showDuplicateFound(fileName, strategy, actions)`: Уведомление о дубликате с возможными действиями.

### 2.10. `LoggingService` - Система логирования ✅ **РЕАЛИЗОВАН v3.2.0**
*   **Ответственность:**
    *   Ведение подробного журнала работы плагина для диагностики.
    *   Поддержка уровней логирования (DEBUG, INFO, WARN, ERROR).
    *   Категоризация событий (Processing, FileWatcher, Settings, Commands).
    *   Экспорт логов в различных форматах.
    *   UI для просмотра логов через модальное окно.
*   **Методы:**
    *   `log(level, category, message, details?)`: Основной метод логирования.
    *   `info(category, message)`, `warn(category, message)`, `error(category, message)`.
    *   `exportLogs(format)`: Экспорт в текстовый или JSON формат.
    *   `clearLogs()`: Очистка журнала логов.

### 2.11. `StatusBarService` - Индикация статуса ✅ **РЕАЛИЗОВАН v3.2.0**
*   **Ответственность:**
    *   Отображение текущего статуса плагина в строке состояния Obsidian.
    *   Анимированные иконки для различных состояний.
    *   Цветовая индикация (зеленый/синий/красный/серый).
    *   Интерактивность (клик для открытия настроек).
*   **Методы:**
    *   `setIdle(message?)`, `setWatching(path)`, `setProcessing(message)`, `setError(message)`.
    *   `setTemporaryMessage(message, duration)`: Временные сообщения с автосбросом.

### 2.12. `LocalizationService` - Служба локализации ✅ **РЕАЛИЗОВАН v3.3.0**
*   **Ответственность:**
    *   Поддержка многоязычного интерфейса (русский/английский).
    *   Динамическое переключение языка без перезагрузки.
    *   Локализация всех строк интерфейса, команд, уведомлений.
    *   Контекстная передача переводов в модальные окна.
*   **Методы:**
    *   `t(key, params?)`: Получение переведенной строки с параметрами.
    *   `setLanguage(language)`: Изменение текущего языка.
    *   `getCurrentLanguage()`: Получение текущего языка.
    *   `getSettingsStrings()`, `getCommandStrings()`: Получение групп переводов.

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

## 6. Каталог с исходным кодом (финальная структура v3.4.0)

```
krisp-notes-importer/
├── src/
│   ├── main.ts                     # ✅ MainPlugin с полной интеграцией
│   ├── core/
│   │   ├── SettingsManager.ts      # ✅ РЕАЛИЗОВАН
│   │   ├── FileWatcherService.ts   # ✅ РЕАЛИЗОВАН v3.0.0
│   │   ├── ProcessingService.ts    # ✅ РЕАЛИЗОВАН
│   │   ├── ZipExtractor.ts         # ✅ РЕАЛИЗОВАН
│   │   ├── NoteParser.ts           # ✅ РЕАЛИЗОВАН
│   │   ├── NoteCreator.ts          # ✅ РЕАЛИЗОВАН
│   │   ├── NotificationService.ts  # ✅ РЕАЛИЗОВАН
│   │   ├── LoggingService.ts       # ✅ РЕАЛИЗОВАН v3.2.0
│   │   ├── StatusBarService.ts     # ✅ РЕАЛИЗОВАН v3.2.0
│   │   └── LocalizationService.ts  # ✅ РЕАЛИЗОВАН v3.3.0
│   ├── ui/
│   │   └── SettingsTab.ts          # ✅ Полный UI с локализацией
│   └── interfaces.ts               # ✅ Все интерфейсы и типы
├── dist/                           # Готовые файлы для релиза
│   ├── main.js                     # Собранный код
│   ├── manifest.json               # Метаданные
│   ├── styles.css                  # Стили
│   └── krisp-notes-importer.zip    # Архив для установки
├── docs/                           # Полная документация
├── .github/workflows/              # GitHub Actions
├── styles.css                      # Стили интерфейса
├── manifest.json                   # Метаданные плагина
├── package.json                    # Конфигурация проекта
├── tsconfig.json                   # Настройки TypeScript
└── esbuild.config.mjs              # Конфигурация сборки
```

### Статус реализации: **100% ЗАВЕРШЕНО** ✅

Все компоненты архитектуры полностью реализованы и интегрированы.

## 7. Система уведомлений

### Принципы уведомлений
- **Своевременность** - появляются когда необходимо
- **Информативность** - достаточно информации для понимания
- **Ненавязчивость** - не мешают работе пользователя
- **Действенность** - предлагают варианты действий

### Типы уведомлений
- **Успешный импорт** - информация об успешной обработке встречи
- **Ошибки импорта** - сообщения об ошибках (распаковка, отсутствие файлов, ошибки чтения/записи)
- **Обнаружение дубликата** - предупреждение в зависимости от стратегии обработки
- **Статус отслеживания** - начало/завершение отслеживания папки
- **Ошибки конфигурации** - некорректные настройки
- **Массовый импорт** - статус обработки нескольких файлов

### Логирование
Подробный журнал работы плагина через `LoggingService`:
- Уровни: DEBUG, INFO, WARN, ERROR
- Категории: Processing, FileWatcher, Settings, Commands
- UI для просмотра логов через модальное окно
- Экспорт в текстовый или JSON формат

## 8. Управление релизами

### Автоматизация релизов
GitHub Actions автоматически создает релизы при создании тега:
- Файл: `.github/workflows/release.yml`
- Сборка проекта из исходников
- Создание GitHub Release
- Генерация ZIP-архива с файлами: `main.js`, `manifest.json`, `styles.css`

### Процесс релиза
1. **Подготовка**: обновление версий в `package.json`, `manifest.json`, `CHANGELOG.md`
2. **Сборка**: `npm run build`
3. **Создание тега**: `git tag X.Y.Z && git push origin master --tags`
4. **Автоматический релиз**: GitHub Actions создает релиз с ZIP-архивом

### Типы релизов
- **Patch** (X.Y.Z+1) - исправления ошибок, мелкие улучшения
- **Minor** (X.Y+1.0) - новые функции, обратная совместимость
- **Major** (X+1.0.0) - кардинальные изменения архитектуры

### Метрики качества
- Время сборки: < 30 секунд
- Размер релиза: ~52KB (оптимизированный)
- Успешность установки: 100%
- Обратная совместимость: сохранение настроек

---

*Последнее обновление: 2025-05-29*

**Версия документа**: 1.3 (от 2025-05-29)

| Дата       | Версия | Описание изменений                                      | Автор        |
|------------|--------|---------------------------------------------------------|--------------|
| 2025-05-12 | 1.0    | Начальная версия документа архитектуры                   | ИИ Ассистент |
| 2025-05-18 | 1.1    | Добавлены описания всех ключевых сервисов (v3.3.0)     | ИИ Ассистент |
| 2025-05-26 | 1.2    | Обновлена диаграмма компонентов, уточнены зависимости   | ИИ Ассистент |
| 2025-05-29 | 1.3    | Актуализирована информация о NoteCreator и NoteParser   | ИИ Ассистент |
