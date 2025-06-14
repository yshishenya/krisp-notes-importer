# 📝 Changelog

Все важные изменения в проекте будут документироваться в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
и этот проект следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.4.0] - 2025-05-30

### ✨ Улучшения (Improvements)
- **Реструктуризация окна настроек**: Полностью переработан интерфейс настроек для лучшей организации, понятности и удобства использования. Настройки сгруппированы в логические разделы:
    - Текущий Статус (отображение статуса сервиса отслеживания)
    - Язык интерфейса
    - Ядро: Отслеживание и Автоматизация (настройки папки и авто-сканирования)
    - Хранилище Obsidian (папки для заметок и вложений)
    - Внешний вид и Именование (шаблоны имен и содержимого)
    - Поведение импорта (стратегия дубликатов, открытие заметки, удаление ZIP)
    - Ручные операции и Диагностика (тестовый импорт, обработка всех файлов, логи, сброс)
    - О плагине (версия, ссылки на GitHub, информация о разработке)
- Улучшены и добавлены новые строки локализации для всех элементов обновленного интерфейса настроек.
- В секции "О плагине" теперь используются корректные ссылки на GitHub репозиторий и страницу для сообщений об ошибках, сформированные на основе данных из `manifest.json`.
- Улучшена логика отображения информации о поддержке плагина в секции "О плагине".

### 🛠️ Исправления (Fixes)
- Устранены потенциальные ошибки, связанные с отсутствием полей `pluginUrl` и `fundingUrl` в `manifest.json` при отображении информации о плагине.

---

## [3.3.12] - 2025-05-30

### 🎯 Кардинально улучшенное форматирование Summary блока

- **📋 Нумерованные заголовки секций**: Верхнеуровневые темы теперь форматируются как `## 1. Тема`, `## 2. Тема`
- **🔹 Все предложения как буллеты**: Каждое предложение под заголовком становится элементом списка с `- `
- **🧠 Умное определение заголовков**: Алгоритм автоматически распознает что является темой, а что - содержанием
  - Строки <100 символов без знаков препинания в конце = заголовки
  - Строки перед дефисами = заголовки
  - Все остальное = буллеты
- **📖 Значительно улучшенная читаемость**: Четкая структура с визуальным разделением тем

### 🔧 Технические изменения
- `src/core/NoteCreator.ts`: Полностью переписана `formatSummaryForCallout()`
- Добавлена функция `isLikelyHeader()` для умного определения заголовков

## [3.3.11] - 2025-05-29

### ✨ Значительные улучшения читаемости

- **🎨 Кардинальное улучшение форматирования Summary блока**: Полностью переработана логика форматирования краткого содержания встреч
  - **Нумерованные секции**: Каждая тематическая секция получает заголовок `### 1.`, `### 2.` и т.д.
  - **Структурированные списки**: Правильная обработка маркеров `- `, `* `, `• `
  - **Многострочные пункты**: Корректные отступы для продолжений элементов списков
  - **Улучшенная читаемость**: Пустые строки между секциями для визуального разделения
  - **Пропуск заголовка**: Автоматическое удаление строки "Summary" если она присутствует

### 🔧 Технические изменения
- `src/core/NoteCreator.ts`: Добавлен метод `formatSummaryForCallout()` с умным алгоритмом форматирования
- Улучшенная обработка edge cases (пустые строки, разные маркеры списков)
- Сохранена полная совместимость с существующими заметками

### 📖 Пример улучшения
**До:** Сплошная стена текста без структуры
**После:** Четко структурированные секции с заголовками, списками и правильными отступами

## [3.3.10] - 2025-05-28

### 📚 Полная актуализация документации
- **Соответствие коду**: Все документы приведены в соответствие с реальным состоянием v3.3.9
- **Статус готовности**: Проект помечен как 100% готовый к публикации в Obsidian Community Plugins
- **Обновлены компоненты**: Добавлен LocalizationService в архитектурную документацию
- **Актуальные возможности**: README и UserGuide отражают все реализованные функции

### 🤖 Планы LLM-интеграции (v4.0.0+)
- **Детальный план**: Добавлен полный план семантического анализа встреч
- **Умное связывание**: Концепция автоматического создания связей между встречами
- **Проектная аналитика**: Группировка встреч по темам, участникам и проектам
- **Локальная обработка**: Приоритет на конфиденциальность с локальными LLM
- **Поэтапная реализация**: 4 фазы развития от базовой интеграции до продвинутой аналитики

### 🎯 Практические сценарии LLM
- **Менеджер проекта**: Автоматический поиск всех встреч по проекту с контекстом
- **Разработчик**: Семантический поиск обсуждений архитектуры с временной линией
- **HR-менеджер**: Анализ эффективности команды и качества решений
- **Автоматические теги**: Иерархические категории и статусные метки

### 🔒 Безопасность и приватность
- **Локальные LLM**: Ollama, LM Studio для обработки на устройстве
- **Конфиденциальность**: Корпоративные данные не покидают устройство
- **GDPR соответствие**: Пользовательский контроль над данными
- **Опциональная облачная интеграция**: С шифрованием и анонимизацией

### 📊 Метрики успеха
- **Время поиска**: Сокращение с 10 минут до 30 секунд
- **Качество связей**: 85%+ релевантных рекомендаций
- **Скорость анализа**: <5 секунд на встречу
- **Точность извлечения тем**: 90%+

### 🔧 Техническое
- **Новые сервисы**: LLMService, SemanticLinkingService, ContextAnalyzer
- **UI компоненты**: Панель связей, дашборд аналитики, умные рекомендации
- **Интеграция**: Совместимость с локальными и облачными LLM
- **Производительность**: <100MB RAM для локальной обработки

## [3.3.9] - 2025-05-26

### 📦 Оптимизация релизов
- **Только ZIP-архив в релизах**: GitHub Actions теперь создает релизы только с архивом
- **Упрощенная установка**: Пользователи скачивают только один файл `krisp-notes-importer-X.Y.Z.zip`
- **Чистые релизы**: Убраны отдельные файлы `main.js`, `manifest.json`, `styles.css` из релизов
- **Профессиональный вид**: Релизы выглядят чище и проще для пользователей

### 🔧 Техническое
- Обновлен GitHub Actions workflow для создания только архивов
- Сохранена возможность локальной сборки через `npm run dist`
- Автоматическое именование архивов с версией

## [3.3.8] - 2025-05-25

### 🎯 Автоматическое отображение версии
- **Динамическая версия в настройках**: Версия теперь автоматически подтягивается из `manifest.json`
- **Больше не нужно вручную обновлять**: Версия в UI настроек обновляется автоматически при релизе
- **Руководство по релизам**: Создано подробное руководство `docs/RELEASE_GUIDE.md`

### 📚 Документация
- **Полное руководство по релизам**: Пошаговые инструкции для создания релизов
- **Шаблоны коммитов**: Стандартизированные форматы сообщений
- **Автоматизация процесса**: Описание работы GitHub Actions workflow
- **Мониторинг качества**: Метрики и проверки после релиза

### 🔧 Техническое
- Исправлено жестко прописанное значение версии в `src/ui/SettingsTab.ts`
- Добавлено автоматическое получение версии из `manifest.json`
- Улучшена документация процесса разработки

## [3.3.7] - 2025-05-24

### 📦 Автоматическое создание архивов
- **ZIP-архив в релизах**: GitHub Actions теперь автоматически создает архив `krisp-notes-importer-X.Y.Z.zip`
- **Локальная папка dist**: Команда `npm run dist` создает архив в папке `dist/`
- **Удобная установка**: Пользователи могут скачать готовый ZIP-архив для установки плагина
- **Оптимизированный размер**: Архив сжимается до ~106KB (вместо 193KB отдельных файлов)

### 🔧 Улучшения workflow
- Автоматическое создание папки `dist` в GitHub Actions
- Включение архива в релиз вместе с отдельными файлами
- Упрощенная команда `npm run dist` для локальной разработки

## [3.3.6] - 2025-05-23

### 🔐 Исправления прав доступа
- **GitHub Actions**: Добавлены явные права `contents: write` для создания релизов
- **Автоматизация**: Исправлена проблема с правами доступа в workflow
- **Релизы**: Теперь GitHub Actions может создавать релизы автоматически

## [3.3.5] - 2025-05-22

### 🚀 Автоматизация релизов
- **GitHub Actions**: Исправлен workflow для автоматического создания релизов
- **Полная сборка**: Workflow теперь автоматически собирает проект из исходников
- **Надежность**: Использование проверенного action-gh-release@v1 с GITHUB_TOKEN
- **Верификация**: Автоматическая проверка размера и содержимого собранных файлов

### 🔧 Техническое
- Исправлены проблемы с правами доступа в GitHub Actions
- Добавлена автоматическая установка зависимостей в CI/CD
- Улучшена диагностика процесса сборки

## [3.3.2] - 2025-05-20

### 🐛 Исправления
- **Локализация интерфейса**: Удален жестко закодированный русский текст из английского интерфейса
- **Уведомления**: Все уведомления теперь корректно отображаются на выбранном языке
- **Сообщения об ошибках**: Исправлены русские сообщения об ошибках в основных сервисах
- **Модальные окна**: Исправлены проблемы с контекстом локализации в диалоговых окнах

### 🔧 Техническое
- Все пользовательские строки теперь используют LocalizationService
- Улучшена консистентность сообщений об ошибках
- Исправлены проблемы с доступом к локализации в анонимных классах
- Комментарии в коде остаются на русском языке (внутренняя документация)

### 📋 Git Workflow
- Добавлены профессиональные правила для Cursor IDE:
  - `.cursor/rules/git-workflow.mdc` - стандарты коммитов и версионирования
  - `.cursor/rules/release-management.mdc` - процесс релизов и автоматизация
  - `.cursor/rules/git-branching.mdc` - стратегия веток и соглашения

---

## [3.3.1] - 2025-05-19

### ✨ Новые возможности
- **Полная локализация интерфейса настроек**: Все элементы UI переведены на русский и английский языки
- **Динамическое переключение языка**: Интерфейс мгновенно обновляется при смене языка
- **Локализованные модальные окна**: Тестовый импорт и подтверждение сброса настроек на двух языках
- **Умные кнопки действий**: Все кнопки (тестовый импорт, массовый импорт, сброс настроек) полностью локализованы

### 🔧 Улучшения
- Обновлена информационная секция с динамическим отображением функций
- Улучшена структура LocalizationService для поддержки сложных строк
- Добавлены переводы для всех команд и уведомлений
- Оптимизирован код модальных окон для лучшей производительности

### 🐛 Исправления
- Исправлены ошибки TypeScript в анонимных классах модальных окон
- Устранены проблемы с контекстом в обработчиках событий
- Исправлено отображение версии в информационной секции

---

## [3.3.0] - 2025-05-18

### ✨ Добавлено
- **🌍 Двуязычная поддержка** - полная локализация интерфейса на русский и английский
- **📝 Двуязычная документация** - README, UserGuide и все документы на двух языках
- **🔧 LocalizationService** - система интернационализации с поддержкой переменных
- **📤 Руководства по публикации** - подробные инструкции для Obsidian Community Plugins
- **🎛️ Настройка языка** - выбор языка интерфейса в настройках плагина

### 🔄 Изменено
- **Интерфейс настроек** - все тексты локализованы через LocalizationService
- **Команды плагина** - названия команд адаптированы под выбранный язык
- **Уведомления** - все сообщения поддерживают локализацию
- **Структура проекта** - добавлены английские версии документов

### 📚 Документация
- `README.en.md` - английская версия главного README
- `docs/UserGuide.en.MD` - английское руководство пользователя
- `docs/PUBLISHING_GUIDE.md` - руководство по публикации (русский)
- `docs/PUBLISHING_GUIDE.en.md` - руководство по публикации (английский)
- Обновлены ссылки между языковыми версиями документов

### 🛠️ Техническое
- Добавлен `src/core/LocalizationService.ts` с полной системой i18n
- Обновлен `src/interfaces.ts` для типизированной поддержки языков
- Подготовка к интеграции локализации в существующие компоненты

---

## [3.2.4] - 2025-05-18

### 📖 Документация и структура проекта
- **Современный README** - полностью переписан в стиле лучших практик GitHub
- **Профессиональное оформление** - badges, таблицы, collapsible секции
- **Четкая структура** - возможности, установка, быстрый старт, примеры
- **Визуальные элементы** - эмодзи, таблицы сравнения "до/после"
- **Удобная навигация** - ссылки на документацию и поддержку

### 🎨 Улучшения README
- **Центрированные элементы** - красивое оформление заголовка с badges
- **Collapsible секции** - сворачиваемые блоки для установки и настроек
- **Таблица возможностей** - наглядное представление функций плагина
- **Пример заметки** - демонстрация результата работы плагина
- **Статус проекта** - визуальные индикаторы готовности

### 📄 Добавлено
- **LICENSE** - файл лицензии MIT для проекта
- **Ссылки на GitHub** - issues, pull requests, документация
- **Инструкции для разработчиков** - команды для сборки и разработки
- **Секция поддержки** - FAQ и решение частых проблем

### 🔧 Техническое
- Обновлена структура документации для лучшей читаемости
- Добавлены ссылки на все разделы документации
- Улучшена навигация между файлами проекта
- Подготовка к публикации в GitHub

---

## [3.2.3] - 2025-05-17

### 🔍 Диагностика автоматического отслеживания
- **Новая команда**: "Check watching status" для проверки состояния отслеживания
- **Детальная диагностика**: Проверка связи между настройкой autoScanEnabled и активным отслеживанием
- **Статус в уведомлениях**: Информация о текущем состоянии FileWatcherService
- **Логирование статуса**: Подробная информация в консоли для отладки

### 🔧 Техническая информация
- `src/main.ts`: Добавлена команда "Krisp Importer: Check watching status"
- Проверка соответствия настройки autoScanEnabled и реального состояния отслеживания
- Диагностика автозапуска отслеживания при загрузке плагина

### 📋 Обновления
- package.json: 3.2.2 → 3.2.3
- manifest.json: 3.2.2 → 3.2.3

### 🎯 Цель версии
Добавление инструментов для диагностики работы автоматического отслеживания папки.

---

## [3.2.2] - 2025-05-16

### 🔧 Отладка и диагностика
- **Расширенное логирование**: Добавлено детальное логирование для отслеживания файлов и удаления ZIP-архивов
- **Команда отладки настроек**: Новая команда "Debug current settings" для проверки текущих настроек
- **Логирование FileWatcher**: Подробные логи событий файловой системы и обработки файлов
- **Диагностика удаления ZIP**: Логирование всех этапов удаления ZIP-файлов после импорта

### 🐛 Исправления
- **Отслеживание файлов**: Улучшена диагностика работы FileWatcherService
- **Удаление ZIP-файлов**: Добавлена детальная диагностика процесса удаления
- **Обработка событий**: Более подробное логирование событий файловой системы

### 🔧 Технические изменения
- `src/core/ProcessingService.ts`: Добавлено логирование настроек и процесса удаления ZIP
- `src/core/FileWatcherService.ts`: Расширенное логирование событий и обработки файлов
- `src/main.ts`: Новая команда для отладки текущих настроек плагина

### 🎯 Цель версии
Эта версия добавляет инструменты для диагностики проблем с отслеживанием файлов и удалением ZIP-архивов.

---

## [3.2.1] - 2025-05-15

### 🐛 Исправления
- **Форматирование Summary**: Исправлено неправильное отображение краткого содержания в callout блоках
  - Убраны лишние префиксы `> ` для элементов списков внутри Summary
  - Улучшено форматирование смешанного контента (текст + списки)
  - Более читаемое отображение структурированного содержимого

### 🔧 Технические изменения
- `src/core/NoteCreator.ts`: Улучшена логика форматирования Summary для callout блоков
- Умная обработка элементов списков и обычного текста в Summary
- Сохранена совместимость с существующими заметками

---

## [3.2.0] - 2025-05-14

### 🎉 Новые функции (Завершение Итерации 5)
- **LoggingService** - полноценная система логирования с уровнями DEBUG, INFO, WARN, ERROR
- **Кнопка "Показать логи"** - модальное окно с просмотром логов, статистикой и управлением
- **StatusBarService** - индикация статуса плагина в строке состояния Obsidian
- **Детальное логирование** - все операции плагина записываются в логи для диагностики

### 🎨 Улучшения интерфейса
- **Модальное окно логов** - красивый интерфейс с статистикой и кнопками управления
- **Статус-бар индикатор** - визуальная индикация состояния плагина (неактивен/отслеживание/обработка/ошибка)
- **Цветовая индикация** - разные цвета для разных статусов в строке состояния
- **Анимация обработки** - вращающаяся иконка при импорте файлов
- **Клик для настроек** - клик по статус-бару открывает настройки плагина

### 🔧 Техническое
- **Специализированные методы логирования** - для ZIP-обработки, FileWatcher, дубликатов, настроек
- **Экспорт логов** - в текстовый и JSON форматы
- **Копирование в буфер** - быстрое копирование логов для поддержки
- **Автоочистка логов** - ограничение до 1000 записей в памяти
- **Статистика логов** - подсчет по уровням и категориям

### 📋 Функции из Итерации 5
- ✅ **Логирование** - полная система с просмотром через UI
- ✅ **Индикация статуса** - в строке состояния Obsidian
- ✅ **Кнопка "Показать логи"** - с модальным окном и управлением
- ⏳ **Мастер настройки** - планируется в v4.0.0

### 🎯 Диагностика и поддержка
- **Детальные логи операций** - каждый шаг импорта записывается
- **Категоризация событий** - Processing, FileWatcher, Settings, Commands и др.
- **Временные метки** - точное время каждого события
- **Контекстная информация** - дополнительные детали для сложных операций

---

## [3.1.0] - 2025-05-13

### 🎉 Новые функции (Итерация 5: UI/UX улучшения)
- **Массовый импорт** - кнопка "Импортировать все файлы" в настройках
- **Тестовый импорт** - возможность протестировать импорт одного файла
- **Сброс настроек** - кнопка полного сброса к значениям по умолчанию
- **Улучшенная информационная панель** - актуальный статус и список команд

### 🎨 Улучшения интерфейса
- **Модальные окна** - красивые диалоги для тестового импорта и подтверждения сброса
- **Улучшенное оформление** - лучшие стили для информационных блоков
- **Актуальная информация** - обновленный статус v3.0.1 → v3.1.0
- **Подробные подсказки** - список всех доступных команд плагина

### 🔧 Техническое
- Добавлен импорт `Modal` из Obsidian API
- Улучшена обработка ошибок в UI функциях
- Правильная типизация событий клавиатуры
- Использование замыканий для доступа к экземпляру плагина

### 📋 Функции из Итерации 5
- ✅ **Кнопка массового импорта** - обработка всех ZIP-файлов в папке
- ✅ **Тестовый импорт** - проверка настроек на одном файле
- ✅ **Сброс настроек** - возврат к значениям по умолчанию
- ✅ **Улучшенная информация** - актуальный статус и команды
- ⏳ **Логирование** - планируется в следующих версиях
- ⏳ **Индикация статуса** - планируется в следующих версиях

---

## [3.0.1] - 2025-05-12

### 🔧 Исправлено
- **Форматирование Action Items** - убран лишний отступ в первой задаче
- **Форматирование Key Points** - исправлено консистентное оформление списков
- **Callout содержимое** - правильное отображение элементов внутри callout блоков

### Техническое
- Исправлена логика генерации списков в `NoteCreator.ts`
- Убраны дублирующие префиксы `> ` для элементов внутри callouts
- Улучшена читаемость создаваемых заметок

---

## [3.0.0] - 2025-05-11

### 🎉 Новая основная функция
- **FileWatcherService** - автоматическое отслеживание папки с ZIP-файлами
- **Команды управления отслеживанием** - старт/стоп автоматического сканирования
- **Массовое сканирование** - обработка всех существующих ZIP-файлов в папке
- **Автозапуск отслеживания** - при включенной настройке autoScanEnabled

### ✨ Добавленные команды
- **"Start auto-watching folder"** - запуск автоматического отслеживания
- **"Stop auto-watching"** - остановка отслеживания
- **"Scan existing files in folder"** - сканирование существующих файлов

### 🔧 Улучшения
- **Интеграция с настройками** - автозапуск при включенной опции
- **Уведомления о статусе** - информация о начале/завершении отслеживания
- **Обработка ошибок** - корректная обработка недоступных папок
- **Логирование** - подробные логи работы FileWatcher

### 📋 Статус проекта
- **Готовность**: 85% (было 75%)
- **Ручной импорт**: ✅ Полностью работает
- **Автоматическое отслеживание**: ✅ Реализовано
- **Полный UI настроек**: ✅ Все 11 настроек доступны
- **Расширенная аналитика**: ✅ Работает

### ⚠️ Известные ограничения
- FileWatcher использует базовую реализацию (без fs.watch)
- Требует ручного запуска команд для управления отслеживанием
- Автозапуск работает только при включенной настройке

---

## [2.1.0] - 2025-05-10

### ✨ Добавлено
- **Полный UI настроек** - все 11 настроек из interfaces.ts теперь доступны через интерфейс
- **Шаблоны имен файлов** - настройка форматов для заметок и аудио через UI
- **Стратегии дубликатов** - выбор через dropdown (пропустить/перезаписать/переименовать)
- **Опции после импорта** - переключатели для открытия заметки и удаления ZIP
- **Редактор шаблона заметки** - большое текстовое поле для настройки содержимого
- **Кнопка восстановления** - возврат к стандартному шаблону одним кликом
- **Выбор языка** - настройка для распознавания дат (English/Русский)
- **Автоматическое отслеживание** - переключатель (готов к FileWatcherService v3.0)

### 🎨 Улучшено
- **Структурированный интерфейс** - логические секции с эмодзи заголовками
- **Русскоязычный интерфейс** - все настройки переведены на русский
- **Информативные описания** - подробные подсказки для каждой настройки
- **Статус проекта** - информационная панель с текущими возможностями
- **Советы по использованию** - подсказки для тестирования функций

### 🔧 Исправлено
- **Импорт DEFAULT_SETTINGS** - корректная работа кнопки восстановления
- **Типизация dropdown** - строгие типы для стратегий дубликатов
- **Стилизация textarea** - моноширинный шрифт для редактора шаблонов

### 📊 Результаты
- ✅ **11 настроек в UI** - все параметры из interfaces.ts доступны
- ✅ **6 логических секций** - структурированная навигация
- ✅ **100% функциональность** - Итерация 3 полностью завершена
- ✅ **Готовность к v3.0** - переключатель автоматического отслеживания

### ⚠️ Известные ограничения
- **FileWatcherService** - НЕ РЕАЛИЗОВАН (автоматическое отслеживание не работает)
- **Мастер настройки** - планируется в v4.0.0
- **Тестовый импорт** - планируется в v4.0.0

---

## [2.0.0] - 2025-05-09

### ✨ Добавлено
- **Расширенная аналитика участников** - статистика слов, активности и выступлений
- **Автоматическое извлечение сущностей** - проекты, компании, важные даты
- **Умные теги** - автоматическая категоризация встреч (project, technical, hr, analysis, planning)
- **Связанные материалы** - автоматические перекрестные ссылки
- **Профессиональная статистическая панель** - детальные таблицы с метриками встречи
- **Дата импорта** - отметка времени создания заметки для отслеживания версий
- **Расширенный YAML frontmatter** - секция `meeting_stats` с детальной аналитикой

### 🎨 Улучшено
- **Современный дизайн** - использование Obsidian callouts с эмодзи (`📋`, `💡`, `⭐`, `🎙️`)
- **Горизонтальные разделители** - четкое структурирование документа
- **Улучшенное форматирование контента** - правильные префиксы для callout содержимого
- **Обработка отсутствующих данных** - курсивные плейсхолдеры вместо пустых полей
- **Профессиональные таблицы** - красивое оформление статистики

### 🔧 Исправлено (Критические проблемы совместимости)
- **Замена HTML5 `<audio>` на Obsidian wikilink** - теперь `![[audio.mp3]]` для нативной поддержки
- **Замена HTML `<details>/<summary>` на Obsidian callout** - сворачиваемый `> [!quote]- Transcript`
- **Удаление всех HTML атрибутов и стилей** - полная совместимость с Obsidian Markdown
- **Обновление интерфейса и создателя заметок** - оба файла приведены к стандарту Obsidian

### 📊 Результаты тестирования
- ✅ **167 строк документа** - профессиональная структура заметки
- ✅ **9 секций с эмодзи** - красивые заголовки разделов
- ✅ **11 горизонтальных разделителей** - четкое разграничение секций
- ✅ **13 таблиц** - структурированная презентация данных
- ✅ **5 ключевых улучшений** - все запланированные изменения реализованы
- ✅ **0 HTML элементов** - полная совместимость с Obsidian

### ⚠️ Известные ограничения
- **Автоматическое отслеживание папки** - НЕ РЕАЛИЗОВАНО (планируется в v3.0.0)
- **Расширенный UI настроек** - доступны только базовые пути (планируется в v2.1.0)
- **Массовый импорт** - только ручной импорт по одному файлу

---

## [1.0.0] - 2025-05-05

### ✨ Добавлено
- **Базовая обработка ZIP-архивов Krisp** - полная распаковка и анализ содержимого
- **Создание структурированных заметок** - Markdown с YAML frontmatter
- **Копирование аудиофайлов** - в организованную структуру папок год/месяц
- **Парсинг транскриптов** - с кликабельными временными метками
- **Извлечение метаданных** - название, дата, время, участники
- **Обработка дубликатов** - стратегии пропуска, перезаписи, переименования (логика в коде)
- **Система уведомлений** - информативные сообщения о статусе импорта
- **Базовые настройки** - пути к 3 основным папкам через UI

### 🔧 Исправлено
- **Логика удаления UUID** - корректная обрезка 32-символьных hex суффиксов
- **Плейсхолдеры в шаблонах** - поддержка всех переменных
- **Копирование аудиофайлов** - использование правильных file system API
- **Парсинг транскриптов** - корректное форматирование временных меток

### 🏗️ Архитектура
- **Модульная структура** - разделение на сервисы и компоненты
- **TypeScript** - типобезопасность и современный код
- **Obsidian API** - нативная интеграция с платформой
- **JSZip** - надежная работа с архивами

---

## [0.1.0] - 2025-04-30

### ✨ Добавлено
- **Инициализация проекта** - базовая структура плагина Obsidian
- **Настройка окружения** - TypeScript, esbuild, зависимости
- **Основные интерфейсы** - определение типов и настроек
- **Базовый UI** - простая страница настроек (3 основных поля)
- **Загрузка/сохранение настроек** - интеграция с Obsidian data API

### 🏗️ Инфраструктура
- **Git репозиторий** - система контроля версий
- **NPM пакет** - управление зависимостями
- **ESBuild** - быстрая сборка TypeScript
- **Manifest** - описание плагина для Obsidian

---

## 🔮 Планируется

### [2.1.0] - Расширенные настройки UI
- **Полный интерфейс настроек** - все параметры из interfaces.ts
- **Стратегии дубликатов** - выбор через dropdown
- **Шаблоны имен** - настройка форматов файлов
- **Опции после импорта** - удаление ZIP, открытие заметки
- **Шаблон содержимого** - редактор для создания заметок

### [3.0.0] - Автоматизация
- **FileWatcherService** - мониторинг папки Krisp
- **Автоматическое отслеживание** - импорт новых ZIP файлов
- **Настройки автоматизации** - включение/выключение, интервалы проверки

### [4.0.0] - Расширенный UI/UX
- **Мастер первоначальной настройки** - пошаговая конфигурация
- **Тестовый импорт** - превью создаваемых заметок
- **Массовый импорт** - обработка всех файлов в папке
- **Интерактивные уведомления** - действия прямо из уведомлений
- **Логирование** - детальные журналы работы плагина
- **Индикация статуса** - отображение в строке состояния Obsidian

### [5.0.0] - Публикация
- **Community Plugin** - подготовка к публикации в каталоге Obsidian
- **Документация пользователя** - детальные инструкции и FAQ
- **Тестирование на разных ОС** - кроссплатформенная совместимость

---

## 📌 Легенда типов изменений

- ✨ **Добавлено** - новые функции
- 🎨 **Улучшено** - изменения существующих функций
- 🔧 **Исправлено** - исправления ошибок
- ⚠️ **Известные ограничения** - что не работает/не реализовано
- 🔒 **Безопасность** - уязвимости безопасности
- 📚 **Документация** - только изменения документации
- 🏗️ **Инфраструктура** - изменения инфраструктуры/сборки
- ⚡ **Производительность** - улучшения производительности
- 🧪 **Тестирование** - добавление или исправление тестов
- 🗑️ **Удалено** - удаленные функции

---

*Файл обновляется при каждом релизе с детальным описанием всех изменений*
