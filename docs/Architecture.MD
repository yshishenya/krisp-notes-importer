# Архитектура плагина "Krisp Notes Importer" v3.4.1+

## 1. Обзор архитектуры

Плагин "Krisp Notes Importer" построен на современной модульной архитектуре с **Dependency Injection** паттерном, обеспечивающей высокую тестируемость, масштабируемость и поддерживаемость. Архитектура следует принципам **SOLID** и использует специализированные сервисы с четким разделением ответственностей.

### Ключевые архитектурные принципы:
- **Single Responsibility Principle**: каждый сервис имеет одну четко определенную ответственность
- **Dependency Injection**: все зависимости инжектируются через IoC контейнер
- **Interface Segregation**: все сервисы реализуют минимальные интерфейсы
- **Error Boundaries**: централизованная обработка ошибок с graceful degradation
- **Performance Optimization**: специальная оптимизация для файлов >100MB

## 2. Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Plugin                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ SettingsManager │    │      ServiceContainer          │ │
│  │                 │    │  (Dependency Injection)        │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
┌─────────────────────────────────────────────────────────────┐
│            ProcessingOrchestrator                           │
│              (Main Coordinator)                             │
└─────────────────────────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────────────┐
│Extraction│ │  Parsing   │ │   Import    │ │ Error Handling  │
│ Service  │ │  Service   │ │  Service    │ │    Service      │
└──────────┘ └────────────┘ └─────────────┘ └─────────────────┘
     │             │             │                │
┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────────────┐
│   ZIP    │ │ NoteParser │ │NoteCreator  │ │  Notification   │
│Extractor │ │ (Streaming)│ │             │ │    Service      │
└──────────┘ └────────────┘ └─────────────┘ └─────────────────┘
```

## 3. Основные компоненты

### 3.1. **MainPlugin (main.ts)** - Точка входа
**Ответственности:**
- Инициализация IoC контейнера и регистрация сервисов
- Lifecycle management плагина (onload/onunload)
- Регистрация команд Obsidian
- Запуск FileWatcherService для автоматического мониторинга

**Ключевые методы:**
```typescript
async onload(): Promise<void>
async onunload(): Promise<void>
initializeServices(): void
registerCommands(): void
```

### 3.2. **ServiceContainer** - IoC контейнер
**Ответственности:**
- Управление жизненным циклом всех сервисов
- Dependency injection и разрешение зависимостей
- Поддержка singleton и transient регистраций
- Детекция циклических зависимостей

**Ключевые методы:**
```typescript
register<T>(identifier: ServiceIdentifier<T>, factory: () => T): void
registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: () => T): void
resolve<T>(identifier: ServiceIdentifier<T>): T
dispose(): void
```

### 3.3. **ProcessingOrchestrator** - Главный координатор
**Ответственности:**
- Координация всего процесса импорта Krisp файлов
- Управление фазами обработки (extraction → parsing → import → post-processing)
- Прогресс-трекинг и мониторинг производительности
- Graceful error handling с recovery механизмами

**Фазы обработки:**
1. **Extraction Phase**: Извлечение ZIP и поиск папок встреч
2. **Parsing Phase**: Парсинг данных с оптимизацией больших файлов
3. **Import Phase**: Создание заметок и обработка аудио
4. **Post-processing Phase**: Cleanup, удаление ZIP, открытие заметок

### 3.4. **Специализированные сервисы**

#### **MeetingExtractionService**
**Ответственности:**
- Извлечение ZIP архивов через ZipExtractor
- Поиск и валидация папок встреч
- Обнаружение аудиофайлов различных форматов
- Валидация структуры Krisp директорий

#### **MeetingParsingService**
**Ответственности:**
- Парсинг meeting_notes.txt и transcript.txt
- **Стриминг больших транскриптов >100MB**
- Контроль использования памяти (лимит 50MB)
- Валидация парсенных данных

**Алгоритм оптимизации больших файлов:**
```typescript
// Для файлов >100MB используется стриминг
if (fileSize > 100MB) {
    return await this.readLargeTranscriptFile(filePath);
} else {
    return await fsPromises.readFile(filePath, 'utf-8');
}
```

#### **MeetingImportService**
**Ответственности:**
- Создание Markdown заметок через NoteCreator
- Координация импорта множественных встреч
- Post-import действия (удаление ZIP, открытие заметок)
- Статистика и отчеты по импорту

#### **ErrorHandlingService**
**Ответственности:**
- Централизованная обработка всех типов ошибок
- Классификация ошибок по типам и важности
- User-friendly уведомления
- Логирование с контекстом

**Типы ошибок:**
- **Extraction errors**: проблемы с ZIP файлами
- **Parsing errors**: некорректные данные Krisp
- **Import errors**: проблемы создания заметок
- **File system errors**: права доступа, место на диске
- **Critical errors**: системные сбои

## 4. Dependency Injection система

### 4.1. Service Identifiers
```typescript
export const SERVICE_IDENTIFIERS = {
    // Основные сервисы
    App: { name: 'App' },
    NotificationService: { name: 'NotificationService' },
    LoggingService: { name: 'LoggingService' },
    StatusBarService: { name: 'StatusBarService' },

    // Специализированные сервисы
    MeetingExtractionService: { name: 'MeetingExtractionService' },
    MeetingParsingService: { name: 'MeetingParsingService' },
    MeetingImportService: { name: 'MeetingImportService' },
    ErrorHandlingService: { name: 'ErrorHandlingService' },

    // Оркестратор
    ProcessingOrchestrator: { name: 'ProcessingOrchestrator' }
} as const;
```

### 4.2. Service Registration Flow
```typescript
// 1. Базовые сервисы (без зависимостей)
container.registerSingleton(SERVICE_IDENTIFIERS.NotificationService, () => new NotificationService());

// 2. Сервисы с простыми зависимостями
container.registerSingleton(SERVICE_IDENTIFIERS.ErrorHandlingService, () => {
    const notificationService = container.resolve(SERVICE_IDENTIFIERS.NotificationService);
    return new ErrorHandlingService(notificationService);
});

// 3. Главный оркестратор (зависит от всех сервисов)
container.registerSingleton(SERVICE_IDENTIFIERS.ProcessingOrchestrator, () => {
    // Resolved все зависимости и создает оркестратор
});
```

## 5. Поток данных и обработка

### 5.1. Типы данных между сервисами
```typescript
interface ExtractionResult {
    tempDirPath: string;
    meetingFolders: MeetingFolder[];
}

interface ParsingResult {
    parsedData: ParsedKrispData;
    audioFilePath: string;
    meetingFolderName: string;
}

interface ProcessingResult {
    importedCount: number;
    errorCount: number;
    lastCreatedNote: ImportResult | null;
}
```

### 5.2. Полный цикл обработки
```
ZIP File → MeetingExtractionService → ExtractionResult
                ↓
MeetingParsingService → ParsingResult[]
                ↓
MeetingImportService → ProcessingResult
                ↓
Post-processing (ZIP deletion, note opening)
```

## 6. Оптимизация производительности

### 6.1. Обработка больших файлов (>100MB)
- **Streaming parsing** через Node.js readline
- **Memory limits**: максимум 50MB для транскриптов
- **Progress callbacks** для длительных операций
- **Graceful truncation** при превышении лимитов

### 6.2. Memory Management
```typescript
const PERFORMANCE_LIMITS = {
    MAX_TRANSCRIPT_MEMORY_MB: 50,
    LARGE_FILE_CHUNK_SIZE: 64 * 1024,
    STREAMING_BUFFER_SIZE: 1024 * 1024,
    ENTITIES_TEXT_LIMIT: 5000,
    SMART_TAGS_TEXT_LIMIT: 3000
} as const;
```

### 6.3. Error Recovery Strategies
- **Recoverable errors**: file not found, parsing issues → continue processing
- **Non-recoverable errors**: disk space, critical system errors → stop processing
- **Partial success**: некоторые встречи импортированы, другие с ошибками

## 7. Тестируемость и качество кода

### 7.1. Мокирование для тестов
Каждый сервис может быть легко замокан через интерфейсы:
```typescript
const mockExtractionService: IMeetingExtractionService = {
    extractZipFile: jest.fn().mockResolvedValue(mockResult),
    discoverMeetingFolders: jest.fn(),
    // ...
};
```

### 7.2. Integration тесты
```typescript
// Тест полного цикла обработки
it('should process complete ZIP file', async () => {
    const orchestrator = container.resolve(SERVICE_IDENTIFIERS.ProcessingOrchestrator);
    await orchestrator.processZipFile(testZipPath, testSettings);
    // Assertions...
});
```

## 8. Мониторинг и логирование

### 8.1. Structured Logging
```typescript
loggingService.info('Processing', 'Extracted ZIP file', {
    tempDir: extractionResult.tempDirPath,
    meetingFoldersFound: extractionResult.meetingFolders.length,
    zipSize: '15.3MB',
    extractionTime: '1.2s'
});
```

### 8.2. Performance Metrics
- Memory usage tracking
- Processing time per phase
- File size statistics
- Error rates and recovery success

## 9. Расширяемость архитектуры

### 9.1. Добавление новых сервисов
1. Создать интерфейс `INewService`
2. Реализовать сервис `NewService implements INewService`
3. Добавить в `SERVICE_IDENTIFIERS`
4. Зарегистрировать в `ServiceConfiguration.configure()`

### 9.2. Новые форматы данных
- Добавить новые парсеры в `MeetingParsingService`
- Расширить `ParsedKrispData` интерфейс
- Обновить `NoteCreator` для новых форматов

### 9.3. Интеграции с внешними системами
- Создать новые сервисы (например, `CloudStorageService`)
- Инжектировать через DI систему
- Не нарушать существующую архитектуру

## 10. Безопасность и валидация

### 10.1. Type Guards для внешних данных
```typescript
export function isValidKrispZipFile(filePath: string): boolean;
export function isValidMeetingNotesContent(content: string): boolean;
export function isValidTranscriptContent(content: string): boolean;
```

### 10.2. Sandbox для обработки файлов
- Все временные файлы создаются в изолированных директориях
- Automatic cleanup при ошибках
- Защита от path traversal атак

## Заключение

Новая архитектура v3.4.1+ обеспечивает:
- ✅ **Модульность**: четкое разделение ответственностей
- ✅ **Тестируемость**: dependency injection и интерфейсы
- ✅ **Производительность**: оптимизация для больших файлов
- ✅ **Надежность**: централизованная обработка ошибок
- ✅ **Расширяемость**: легко добавлять новые сервисы
- ✅ **Поддерживаемость**: чистый код и документация
