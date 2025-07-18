# 💻 Исходный код Krisp Notes Importer

Исходные файлы плагина на TypeScript для разработки и сборки.

## 📁 Структура проекта

```
src/
├── main.ts                 # 🎯 Основной класс плагина
├── interfaces.ts           # 📋 Интерфейсы и настройки
├── core/                   # 🏗️ Основная бизнес-логика
│   ├── SettingsManager.ts      # ⚙️ Управление настройками
│   ├── ProcessingService.ts    # 🔄 Обработка ZIP-файлов
│   ├── ZipExtractor.ts         # 📦 Извлечение архивов
│   ├── NoteParser.ts           # 📝 Парсинг данных Krisp
│   ├── NoteCreator.ts          # 📄 Создание заметок Obsidian
│   ├── NotificationService.ts  # 🔔 Система уведомлений
│   ├── FileWatcherService.ts   # 👁️ Отслеживание папки
│   ├── LoggingService.ts       # 📊 Система логирования
│   └── StatusBarService.ts     # 📍 Индикация статуса
└── ui/
    └── SettingsTab.ts          # 🎨 Интерфейс настроек
```

## 🎯 Основные компоненты

### [main.ts](./main.ts)
**Главный класс плагина**
- Инициализация и деинициализация
- Регистрация команд Obsidian
- Координация всех сервисов
- Управление жизненным циклом

### [interfaces.ts](./interfaces.ts)
**Типы и интерфейсы**
- `KrispImporterSettings` - настройки плагина
- `ParsedMeetingData` - структура данных встречи
- `MeetingStats` - статистика и аналитика
- Константы и значения по умолчанию

## 🏗️ Основная логика (core/)

### [SettingsManager.ts](./core/SettingsManager.ts)
**Управление настройками**
- Загрузка/сохранение настроек
- Валидация конфигурации
- Значения по умолчанию
- Интеграция с Obsidian API

### [ProcessingService.ts](./core/ProcessingService.ts)
**Координатор обработки**
- Полный цикл импорта ZIP-файла
- Управление временными файлами
- Обработка дубликатов
- Интеграция всех сервисов

### [ZipExtractor.ts](./core/ZipExtractor.ts)
**Работа с архивами**
- Распаковка ZIP-файлов
- Валидация содержимого
- Управление временными папками
- Обработка ошибок

### [NoteParser.ts](./core/NoteParser.ts)
**Извлечение данных**
- Парсинг `meeting_notes.txt`
- Обработка `transcript.txt`
- Извлечение метаданных
- Расширенная аналитика

### [NoteCreator.ts](./core/NoteCreator.ts)
**Создание заметок**
- Применение шаблонов
- Генерация YAML frontmatter
- Создание Markdown контента
- Интеграция с Obsidian

### [NotificationService.ts](./core/NotificationService.ts)
**Система уведомлений**
- Отображение статуса операций
- Обработка ошибок
- Информационные сообщения
- Интеграция с Obsidian Notice

### [FileWatcherService.ts](./core/FileWatcherService.ts)
**Автоматическое отслеживание**
- Мониторинг файловой системы
- Обнаружение новых ZIP-файлов
- Проверка стабильности файлов
- Массовое сканирование

### [LoggingService.ts](./core/LoggingService.ts)
**Система логирования**
- Многоуровневое логирование
- Категоризация событий
- Экспорт логов
- Диагностика проблем

### [StatusBarService.ts](./core/StatusBarService.ts)
**Индикация статуса**
- Отображение в строке состояния
- Анимированные иконки
- Цветовая индикация
- Интерактивность

## 🎨 Пользовательский интерфейс (ui/)

### [SettingsTab.ts](./ui/SettingsTab.ts)
**Интерфейс настроек**
- Структурированные секции настроек
- Интерактивные элементы управления
- Валидация пользовательского ввода
- Интеграция с SettingsManager

## 🔧 Сборка проекта

### Команды разработки
```bash
# Установка зависимостей
npm install

# Сборка для разработки (с watch)
npm run dev

# Сборка для продакшена
npm run build

# Проверка типов
npm run type-check

# Линтинг кода
npm run lint
```

### Конфигурация сборки
- **[esbuild.config.mjs](../esbuild.config.mjs)** - настройки сборки
- **[tsconfig.json](../tsconfig.json)** - конфигурация TypeScript
- **[package.json](../package.json)** - зависимости и скрипты

## 📊 Архитектурные принципы

### Модульность
- Четкое разделение ответственности
- Слабая связанность компонентов
- Высокая когезия внутри модулей

### Типизация
- Строгая типизация TypeScript
- Интерфейсы для всех структур данных
- Документирование через JSDoc

### Обработка ошибок
- Graceful degradation
- Подробное логирование
- Информативные уведомления

## 🔄 Процесс разработки

### Добавление новых функций
1. Обновить интерфейсы в `interfaces.ts`
2. Реализовать логику в соответствующем сервисе
3. Добавить UI элементы в `SettingsTab.ts`
4. Обновить документацию

### Отладка
- Использовать `LoggingService` для диагностики
- Проверять статус через `StatusBarService`
- Тестировать через команды палитры

---

**Версия:** v3.2.3
**TypeScript:** 4.5+
**Obsidian API:** 1.0.0+
