# 📤 Руководство по публикации в Obsidian Community Plugins

**Пошаговое руководство по подаче плагина в официальный каталог Obsidian**

[🇺🇸 English version](PUBLISHING_GUIDE.en.md)

---

## 🎯 Обзор процесса

Публикация плагина в Obsidian Community Plugins включает несколько этапов:

1. **Подготовка плагина** - финальная проверка и тестирование
2. **Создание релиза** - GitHub релиз с правильными файлами
3. **Подача заявки** - PR в репозиторий obsidian-releases
4. **Ревью и одобрение** - проверка командой Obsidian

---

## ✅ Требования к плагину

### Обязательные файлы
- `main.js` - скомпилированный код плагина
- `manifest.json` - метаданные плагина
- `styles.css` - стили (опционально)

### Требования к manifest.json
```json
{
    "id": "krisp-notes-importer",
    "name": "Krisp Notes Importer",
    "version": "3.2.4",
    "minAppVersion": "0.15.0",
    "description": "Автоматический импорт заметок встреч из Krisp в красиво оформленные заметки Obsidian",
    "author": "Ваше имя",
    "authorUrl": "https://github.com/ваш-профиль",
    "fundingUrl": "https://buymeacoffee.com/ваш-профиль",
    "isDesktopOnly": false
}
```

### Требования к коду
- ✅ Использование только официального Obsidian API
- ✅ Отсутствие зависимостей от внешних сервисов
- ✅ Корректная обработка ошибок
- ✅ Совместимость с мобильными устройствами (если применимо)

---

## 🚀 Подготовка к публикации

### 1. Финальное тестирование

```bash
# Сборка продакшн версии
npm run build

# Проверка размера файлов
ls -la main.js manifest.json styles.css

# Тестирование в чистом хранилище Obsidian
```

### 2. Проверка документации

- ✅ README.md актуален и информативен
- ✅ CHANGELOG.md содержит все изменения
- ✅ Лицензия указана корректно
- ✅ Инструкции по установке работают

### 3. Версионирование

Убедитесь, что версии синхронизированы:
- `package.json` → `"version": "3.2.4"`
- `manifest.json` → `"version": "3.2.4"`
- Git тег → `3.2.4`

---

## 📦 Создание GitHub релиза

### Автоматический релиз (рекомендуется)

У нас уже настроен GitHub Action в `.github/workflows/release.yml`:

```bash
# Создание тега и пуш
git tag 3.2.4
git push origin 3.2.4

# GitHub Action автоматически:
# 1. Соберет плагин
# 2. Создаст релиз
# 3. Прикрепит файлы main.js, manifest.json, styles.css
```

### Ручной релиз

Если нужно создать релиз вручную:

1. **Перейдите в GitHub** → Releases → "Create a new release"
2. **Создайте тег** `3.2.4`
3. **Заполните описание** релиза
4. **Прикрепите файлы**:
   - `main.js`
   - `manifest.json`
   - `styles.css`
5. **Опубликуйте** релиз

---

## 📝 Подача заявки в Community Plugins

### 1. Форк репозитория

```bash
# Форкните репозиторий
https://github.com/obsidianmd/obsidian-releases

# Клонируйте свой форк
git clone https://github.com/ваш-username/obsidian-releases.git
cd obsidian-releases
```

### 2. Добавление плагина

```bash
# Создайте файл с информацией о плагине
echo '{
    "id": "krisp-notes-importer",
    "name": "Krisp Notes Importer",
    "author": "Ваше имя",
    "description": "Автоматический импорт заметок встреч из Krisp в красиво оформленные заметки Obsidian",
    "repo": "ваш-username/krisp-notes-importer"
}' > community-plugins.json.new

# Добавьте запись в community-plugins.json
# (вставьте содержимое в алфавитном порядке по id)
```

### 3. Создание Pull Request

```bash
# Создайте ветку
git checkout -b add-krisp-notes-importer

# Добавьте изменения
git add community-plugins.json
git commit -m "Add Krisp Notes Importer plugin"

# Отправьте в свой форк
git push origin add-krisp-notes-importer
```

### 4. Заполнение PR

**Заголовок PR:**
```
Add plugin: Krisp Notes Importer
```

**Описание PR:**
```markdown
## Plugin Information
- **Name:** Krisp Notes Importer
- **ID:** krisp-notes-importer
- **Repository:** https://github.com/ваш-username/krisp-notes-importer
- **Latest Release:** v3.2.4

## Description
Автоматический импорт заметок встреч из Krisp в красиво оформленные заметки Obsidian с расширенной аналитикой и умными тегами.

## Features
- ✅ Автоматическое отслеживание папки с ZIP-архивами
- ✅ Создание красиво оформленных заметок с callouts
- ✅ Расширенная аналитика участников встреч
- ✅ Полный UI настроек с 11 опциями
- ✅ Система логирования и диагностики
- ✅ Поддержка двух языков (русский/английский)

## Checklist
- [x] Plugin follows Obsidian API guidelines
- [x] No external dependencies
- [x] Proper error handling
- [x] Mobile compatibility (desktop-focused but compatible)
- [x] Comprehensive documentation
- [x] MIT License
- [x] Latest release includes required files
```

---

## 🔍 Процесс ревью

### Что проверяет команда Obsidian

1. **Безопасность кода**
   - Отсутствие вредоносного кода
   - Использование только разрешенных API
   - Корректная обработка пользовательских данных

2. **Качество плагина**
   - Стабильность работы
   - Отсутствие критических багов
   - Соответствие заявленной функциональности

3. **Документация**
   - Понятное описание
   - Инструкции по использованию
   - Корректная информация в manifest.json

### Типичные причины отклонения

❌ **Проблемы с кодом:**
- Использование неофициальных API
- Отсутствие обработки ошибок
- Проблемы с производительностью

❌ **Проблемы с документацией:**
- Неполное или неточное описание
- Отсутствие инструкций по использованию
- Некорректная информация в manifest.json

❌ **Проблемы с релизом:**
- Отсутствие необходимых файлов
- Несоответствие версий
- Поломанная функциональность

---

## ⏱️ Временные рамки

### Обычный процесс
- **Подача PR:** 1 день
- **Первичное ревью:** 1-2 недели
- **Исправления (если нужны):** 1-3 дня
- **Финальное одобрение:** 1-7 дней
- **Публикация:** автоматически после одобрения

### Наш статус
Плагин **Krisp Notes Importer** готов к публикации:
- ✅ Все требования выполнены
- ✅ Код протестирован и стабилен
- ✅ Документация полная и актуальная
- ✅ Релиз создан корректно

---

## 🎯 После публикации

### Поддержка пользователей
1. **Мониторинг issues** в GitHub репозитории
2. **Ответы на вопросы** в сообществе Obsidian
3. **Регулярные обновления** с исправлениями и новыми функциями

### Обновления плагина
```bash
# Для обновления опубликованного плагина:
# 1. Обновите версию в manifest.json и package.json
# 2. Создайте новый релиз в GitHub
# 3. Плагин обновится автоматически для пользователей
```

### Метрики успеха
- 📊 Количество загрузок
- ⭐ Рейтинг и отзывы пользователей
- 🐛 Количество и качество багрепортов
- 💡 Запросы на новые функции

---

## 🆘 Помощь и поддержка

### Полезные ресурсы
- [Obsidian Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Community Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Discord](https://discord.gg/obsidianmd) - канал #plugin-dev

### Контакты
- **GitHub Issues:** для технических вопросов
- **Obsidian Forum:** для обсуждения с сообществом
- **Discord:** для быстрой помощи от разработчиков

---

**Удачи с публикацией! 🚀**
