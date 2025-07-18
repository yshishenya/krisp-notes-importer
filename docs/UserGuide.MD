# 📖 Руководство пользователя - Krisp Notes Importer

**Пошаговое руководство по использованию плагина для импорта заметок Krisp в Obsidian**

[🇺🇸 English version](UserGuide.en.MD)

---

## 🎯 Для чего нужен плагин

Плагин **Krisp Notes Importer** автоматизирует процесс переноса ваших записей встреч из Krisp в Obsidian. Вместо ручного копирования и форматирования, плагин создает красиво оформленные заметки с:

- 📊 **Детальной аналитикой** участников и активности
- 🎙️ **Встроенным аудиоплеером** для прослушивания записей
- 🏷️ **Умными тегами** для автоматической категоризации
- 📝 **Структурированным контентом** с использованием Obsidian callouts
- 🔗 **Автоматическими связями** между заметками
- 🛡️ **Защитой от ошибок** с комплексной валидацией данных
- 📈 **Прогресс-индикаторами** для больших архивов
- 🔧 **Улучшенной стабильностью** без критических багов

---

## 🚀 Быстрый старт

### 1. Установка плагина

1. **Скопируйте файлы плагина** в папку `.obsidian/plugins/krisp-notes-importer/`
   - `main.js`
   - `manifest.json`
   - `styles.css`

2. **Перезапустите Obsidian**

3. **Включите плагин**:
   - Откройте Настройки → Community plugins
   - Найдите "Krisp Notes Importer"
   - Включите переключатель

### 2. Первоначальная настройка

1. **Откройте настройки плагина**:
   - Настройки → Community plugins → Krisp Notes Importer → Settings

2. **Настройте основные пути**:
   ```
   Отслеживаемая папка: /Users/ваше_имя/Downloads/Krisp
   Папка заметок: KrispNotes/Notes
   Папка аудио: KrispNotes/Attachments
   ```

3. **Выберите стратегию дубликатов**: "Переименовать" (рекомендуется)

---

## 📥 Как импортировать встречи

### Ручной импорт

1. **Откройте палитру команд** (`Cmd/Ctrl + P`)
2. **Найдите команду** "Krisp Importer: Import ZIP file manually"
3. **Введите полный путь** к ZIP-архиву Krisp в модальном окне
4. **Дождитесь завершения** - появится уведомление об успехе

✅ **Готово**: Автоматическое отслеживание папки полностью реализовано в версии 3.0.0

### Автоматический импорт ✅ (доступно с v3.0.0)

1. **Включите автоматическое отслеживание** в настройках плагина
2. **Запустите отслеживание** командой "Start auto-watching folder" из палитры команд
3. **Проверьте статус** командой "Check watching status" для диагностики
4. **Остановите при необходимости** командой "Stop auto-watching"

⚠️ **Важно**: Плагин автоматически запускает отслеживание при загрузке, если включена настройка "Автоматическое отслеживание"

---

## 📋 Что получается на выходе

### Структура заметки

Каждая импортированная встреча создает заметку со следующими разделами:

```markdown
# 🎙️ Название встречи

> [!info]+ 📋 Информация о встрече
> Основные данные: дата, время, участники, длительность

## 🎧 Аудиозапись
![[аудиофайл.mp3]]

## 📝 Краткое содержание
> [!note]+ 💡 Основные моменты

## ✅ Задачи и действия
> [!todo]+ 📋 Action Items

## 🔑 Ключевые моменты
> [!important]+ ⭐ Key Points

## 📋 Полная транскрипция
> [!quote]- 🎙️ Транскрипт (сворачивается)

## 📊 Статистика встречи
Таблица с метриками и аналитикой
```

### YAML Frontmatter

Каждая заметка содержит структурированные метаданные:

```yaml
---
title: Обсуждение проекта
date: 2025-03-15
time: 14:30
type: meeting
source: krisp
tags:
  - project
  - planning
  - technical
audio: "KrispNotes/Attachments/2025/03/audio.mp3"
participants: [Denis, Yan, Alexey]
duration: 15:24
meeting_stats:
  participants_count: 3
  transcript_length: 2456
  most_active_speaker: "Denis"
---
```

---

## 🎨 Особенности оформления

### Callouts для лучшей организации

Плагин использует современные Obsidian callouts:

- `[!info]+` - Информация о встрече
- `[!note]+` - Краткое содержание
- `[!todo]+` - Список задач
- `[!important]+` - Ключевые моменты
- `[!quote]-` - Сворачиваемый транскрипт

### Эмодзи для быстрой навигации

Каждый раздел имеет соответствующий эмодзи для мгновенного распознавания:

- 📋 Информация
- 💡 Идеи
- ⭐ Важное
- 🎙️ Аудио/транскрипт
- 📊 Статистика

---

## 📊 Расширенная аналитика

### Статистика участников

Плагин автоматически анализирует активность каждого участника:

- **Количество слов** - объем выступлений
- **Процент активности** - доля от общего времени
- **Количество выступлений** - частота участия
- **Самый активный спикер** - лидер по активности

### Умные теги

Автоматическая категоризация встреч по содержанию:

- `project` - обсуждения проектов
- `technical` - технические вопросы
- `hr` - кадровые вопросы
- `analysis` - аналитические встречи
- `planning` - планирование

### Извлечение сущностей

Автоматическое выделение важной информации:

- **Названия проектов** - упомянутые инициативы
- **Компании** - организации-партнеры
- **Важные даты** - дедлайны и события
- **Ключевые термины** - специальная терминология

---

## ⚙️ Настройки

Все настройки плагина доступны через меню Obsidian: **Настройки → Community Plugins → Krisp Notes Importer → Настройки (значок шестеренки)**.
Окно настроек имеет следующую структуру:

### 1. 📊 Текущий Статус

Эта секция отображает текущее состояние сервиса автоматического отслеживания файлов:
- **АКТИВНО**: Если отслеживание запущено и указана корректная папка.
- **НЕАКТИВНО**: Если отслеживание выключено.
- **ПРЕДУПРЕЖДЕНИЕ**: Если авто-отслеживание включено, но папка не указана или указана неверно.
- **ЗАПУСК...**: В момент применения настроек и старта сервиса.
- **СЕРВИС НЕДОСТУПЕН**: Если возникла внутренняя ошибка плагина.

Цвет индикатора слева от блока статуса также меняется (зеленый, красный, желтый, синий, оранжевый) для наглядности.

### 2. 🌐 Язык интерфейса

- **Interface Language**: Позволяет выбрать язык интерфейса плагина.
  - Доступные языки: Английский (English), Русский (Русский).
  - Изменение языка немедленно обновляет весь интерфейс настроек.

### 3. 📂 Ядро: Отслеживание и Автоматизация

Эта секция управляет основной функцией автоматического импорта.

- **Отслеживаемая папка (Watched Folder Path)**:
  - **Описание**: Полный путь к папке на вашем компьютере, куда Krisp сохраняет ZIP-архивы ваших встреч (например, `/Users/ваше_имя/Downloads/Krisp`).
  - **Действие**: Плагин будет мониторить эту папку на появление новых `.zip` файлов.
- **Включить автоматическое отслеживание (Enable Auto-Watching)**:
  - **Описание**: Переключатель для активации или деактивации автоматического отслеживания указанной папки.
  - **Действие**:
    - Если **включено**, плагин автоматически начнет отслеживание папки (если путь указан корректно) при загрузке Obsidian и при изменении этой настройки.
    - Если **выключено**, автоматическое отслеживание будет остановлено.

### 4. 🗄️ Хранилище Obsidian

Здесь настраивается, куда будут сохраняться импортированные заметки и аудиофайлы в вашем хранилище Obsidian.

- **Папка для заметок (Notes Folder)**:
  - **Описание**: Путь внутри вашего хранилища Obsidian, куда будут сохраняться созданные `.md` файлы заметок (например, `KrispNotes/Notes`).
  - Если папка не существует, плагин попытается ее создать.
- **Папка для вложений (Attachments Folder)**:
  - **Описание**: Путь внутри вашего хранилища Obsidian для сохранения аудиофайлов (например, `KrispNotes/Attachments`).
  - Рекомендуется, чтобы эта папка совпадала с настройками папки для вложений в Obsidian (Настройки → Файлы и ссылки → Папка для новых вложений) для корректной работы ссылок.

### 5. 🎨 Внешний вид и Именование

Настройки, отвечающие за то, как будут называться файлы и как будет выглядеть содержимое заметок.

- **Шаблон имени заметки (Note Name Template)**:
  - **Описание**: Определяет формат имени для создаваемых файлов заметок.
  - **Пример**: `{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}`
- **Шаблон имени аудио (Audio Name Template)**:
  - **Описание**: Определяет формат имени для копируемых аудиофайлов.
  - **Пример**: `{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio`

  **Доступные переменные для шаблонов имен**:
  - `{{YYYY}}`: Год (например, 2025)
  - `{{MM}}`: Месяц (например, 03)
  - `{{DD}}`: День (например, 15)
  - `{{HHMM}}`: Время (например, 1430)
  - `{{meetingTitle}}`: Название встречи из файла Krisp (без UUID).

- **Шаблон содержимого заметки (Note Content Template)**:
  - **Описание**: Большое текстовое поле, позволяющее полностью настроить структуру и содержимое создаваемой Markdown-заметки. Вы можете использовать Markdown, переменные и Obsidian callouts.
  - **Переменные для шаблона содержимого**: `{{title}}`, `{{date}}`, `{{time}}`, `{{participants}}`, `{{summary}}`, `{{actionItems}}`, `{{keyPoints}}`, `{{transcript}}`, `{{audioLink}}` и другие, соответствующие данным извлекаемым парсером.
  - **Кнопка "Восстановить стандартный шаблон"**: Сбрасывает содержимое этого поля к шаблону по умолчанию, поставляемому с плагином.

### 6. ⚙️ Поведение импорта

Настройки, управляющие процессом импорта.

- **Стратегия дубликатов (Duplicate Strategy)**:
  - **Описание**: Определяет, как плагин должен поступать, если обнаруживается попытка импортировать встречу, заметка для которой (с таким же именем) уже существует.
  - **Опции**:
    - **Пропустить импорт (Skip import)**: Ничего не делать, существующая заметка остается без изменений.
    - **Перезаписать существующую (Overwrite existing)**: Старая заметка и связанный аудиофайл будут удалены, и на их место будут записаны новые.
    - **Создать с суффиксом (Create with suffix)**: Будет создана новая заметка с добавлением числового суффикса к имени (например, `Название встречи_1`, `Название встречи_2`). **Рекомендуется по умолчанию.**
- **Открывать заметку после импорта (Open note after import)**:
  - **Описание**: Если включено, плагин автоматически откроет только что созданную заметку в текущей панели Obsidian.
- **Удалять ZIP после импорта (Delete ZIP after import)**:
  - **Описание**: Если включено, исходный `.zip` архив будет удален из отслеживаемой папки после успешного импорта.

### 7. 🛠️ Ручные операции и Диагностика

Эта секция содержит инструменты для ручного управления импортом и диагностики.

- **Тестовый ручной импорт (Test Manual Import)**:
  - **Описание**: Позволяет выбрать один `.zip` файл с вашего компьютера и немедленно его импортировать с текущими настройками. Удобно для проверки работы плагина или шаблонов.
  - **Действие**: Открывает модальное окно для выбора файла.
- **Обработать все существующие файлы (Process All Existing Files)**:
  - **Описание**: Запускает сканирование указанной "Отслеживаемой папки" и импортирует все найденные там `.zip` файлы, которые еще не были обработаны.
  - **Действие**: Полезна для первоначального импорта всех накопленных архивов Krisp.
- **Показать логи (Show Logs)**:
  - **Описание**: Открывает модальное окно с логами работы плагина. Это помогает диагностировать проблемы или видеть, что плагин делал.
  - **В окне логов**: Можно скопировать логи в буфер обмена или очистить их.
- **Сбросить настройки (Reset Settings)**:
  - **Описание**: Сбрасывает все настройки плагина к их значениям по умолчанию. Это действие требует подтверждения.
  - **Действие**: Открывает модальное окно для подтверждения сброса.

### 8. ℹ️ О плагине (About Plugin)

Информация о плагине.

- **Версия плагина (Plugin Version)**: Отображает текущую установленную версию плагина.
- **Ссылки**:
  - **Иконка GitHub**: Переход на страницу репозитория плагина на GitHub.
  - **Иконка "жука" (Bug)**: Переход на страницу создания нового "Issue" (сообщения об ошибке или предложении) в GitHub репозитории плагина.
- **Разработчик (Developed by)**: Имя автора плагина.
- **Поддержка разработки (Support Development)**: Информация о том, как можно поддержать разработку плагина (обычно ссылка на GitHub, где автор может разместить информацию о донатах или спонсорстве).
- **Описание (Description)**: Краткое описание плагина, взятое из его манифеста.

---

## 🔧 Решение проблем

### Импорт не работает

1. **Проверьте пути** в настройках плагина
2. **Убедитесь** что ZIP-файл содержит файлы Krisp
3. **Проверьте права доступа** к папкам
4. **Перезапустите Obsidian** если плагин не отвечает
5. **Проверьте формат пути** - используйте полный абсолютный путь

### Аудио не воспроизводится

1. **Проверьте путь** к аудиофайлу в заметке
2. **Убедитесь** что файл скопировался в правильную папку
3. **Попробуйте** открыть аудиофайл напрямую

### Заметка создается без данных

1. **Проверьте структуру** ZIP-архива Krisp
2. **Убедитесь** что файлы `meeting_notes.txt` и `transcript.txt` присутствуют
3. **Проверьте кодировку** файлов (должна быть UTF-8)

### Теги не работают

1. **Проверьте** что в транскрипте есть достаточно текста для анализа
2. **Убедитесь** что язык встречи поддерживается
3. **Попробуйте** переимпортировать файл

### Диагностика отслеживания (новое в v3.2.3)

Если автоматическое отслеживание не работает:

1. **Проверьте статус** командой "Check watching status"
2. **Убедитесь** что настройка "Автоматическое отслеживание" включена
3. **Проверьте путь** к отслеживаемой папке
4. **Запустите вручную** командой "Start auto-watching folder"
5. **Посмотрите логи** кнопкой "Показать логи" в настройках

### Команды для диагностики

- **"Debug current settings"** - проверка всех настроек плагина
- **"Check watching status"** - статус FileWatcherService
- **"Start auto-watching folder"** - запуск отслеживания
- **"Stop auto-watching"** - остановка отслеживания
- **"Scan existing files"** - разовое сканирование папки

---

## 🔔 Система уведомлений (новое в v3.5.3)

### Умные уведомления

Плагин использует интеллектуальную систему уведомлений, которая адаптируется к масштабу операции:

**Для одной встречи:**
- Отображаются детальные уведомления о прогрессе
- Показываются результаты создания заметки и аудиофайла
- Уведомления об успехе и ошибках в полном объеме

**Для множественных встреч (>1):**
- Автоматически включается batch режим
- Прогресс отображается в status bar (внизу Obsidian)
- Подавляются избыточные уведомления для каждой встречи
- Показывается только итоговый результат с детальной статистикой

### Типы итоговых уведомлений

- ✅ **Полный успех:** `"Импорт завершен: 18 встреч(и) из 'архив.zip'"`
- ⚠️ **Частичный успех:** `"Импорт завершен частично: 16 успешно, 2 ошибки"`
- ❌ **Неудача:** `"Импорт не удался: 18 ошибок в 'архив.zip'"`
- ℹ️ **Информация:** `"Нет данных для импорта"`

### Диагностика уведомлений

- Все уведомления дублируются в консоль для отладки
- Детальные логи доступны через команду "Show logs"
- Статистика операций сохраняется в логах

---

## 🔍 Диагностика ошибок (улучшено в v3.5.3)

### Новые возможности диагностики

**Structured Logging:**
- Все ошибки сохраняются с полным контекстом
- Метаданные включают: пути файлов, индексы встреч, stack traces
- Категоризация ошибок по типам: extraction, parsing, import, critical

**Silent Failures устранены:**
- Все failed встречи теперь диагностируемы
- Детальное логирование ошибок чтения файлов
- Логирование попыток использования альтернативных файлов
- Error boundaries для неожиданных ошибок

### Как диагностировать проблемы

1. **Используйте команду "Show logs"** для просмотра детальных логов
2. **Ищите записи [ERROR]** для critical проблем
3. **Проверяйте metadata** в логах для контекста ошибок
4. **Анализируйте структуру ZIP-архива** если есть проблемы с извлечением

---

## 💡 Советы по использованию

### Организация заметок

1. **Используйте папки по проектам** в настройках путей
2. **Создавайте связи** между связанными встречами
3. **Добавляйте дополнительные теги** вручную при необходимости

### Работа с аудио

1. **Используйте временные метки** в транскрипте для навигации
2. **Добавляйте заметки** прямо в транскрипт при прослушивании
3. **Ссылайтесь на аудио** из других заметок через `![[audio.mp3]]`

### Интеграция с рабочим процессом

1. **Создавайте ежедневные заметки** со ссылками на встречи
2. **Используйте поиск** по участникам и тегам
3. **Создавайте сводные отчеты** из нескольких встреч

### Подготовка к автоматическому импорту (v3.0.0)

1. **Настройте корректные пути** уже сейчас
2. **Создайте структуру папок** заранее
3. **Протестируйте ручной импорт** для отладки настроек

---

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. **Проверьте** этот гайд и [README.md](../README.md)
2. **Посмотрите** [CHANGELOG.md](../CHANGELOG.md) для информации об изменениях
3. **Изучите** известные ограничения текущей версии
4. **Дождитесь** выхода v2.1.0 для расширенных настроек
5. **Создайте issue** в репозитории проекта

---

*Приятного использования! 🎉*

Это руководство было обновлено 2025-07-16 и отражает функциональность версии 3.5.3 (unreleased).
