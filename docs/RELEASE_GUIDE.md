# 🚀 Руководство по выпуску релизов Krisp Notes Importer

## 📋 Обзор процесса релиза

Процесс релиза полностью автоматизирован через GitHub Actions. При создании тега автоматически:
- Собирается проект из исходников
- Создается GitHub Release
- Прикрепляются файлы для установки
- Генерируется ZIP-архив

## 🔄 Пошаговая инструкция

### 1. Подготовка к релизу

#### Проверьте готовность:
- [ ] Все функции протестированы вручную
- [ ] Проект собирается без ошибок (`npm run build`)
- [ ] Нет критических TODO в коде
- [ ] Основная функциональность работает

#### Определите тип релиза:
- **PATCH** (X.Y.Z+1): Исправления ошибок, мелкие улучшения
- **MINOR** (X.Y+1.0): Новые функции, обратная совместимость
- **MAJOR** (X+1.0.0): Кардинальные изменения архитектуры

### 2. Обновление версий

**КРИТИЧНО**: Версии должны быть синхронизированы в трех файлах:

#### 2.1. Обновите `package.json`:
```json
{
  "version": "X.Y.Z"
}
```

#### 2.2. Обновите `manifest.json`:
```json
{
  "version": "X.Y.Z"
}
```

#### 2.3. Обновите `CHANGELOG.md`:
```markdown
## [X.Y.Z] - 2025-01-22

### ✨ Добавлено
- Новая функция A
- Улучшение B

### 🐛 Исправлено
- Ошибка C
- Проблема D
```

### 3. Создание релиза

#### 3.1. Соберите проект:
```bash
npm run build
```

#### 3.2. Создайте коммит и тег:
```bash
# Добавить все изменения
git add .

# Коммит с описанием версии
git commit -m "vX.Y.Z: Brief description of changes"

# Создать тег
git tag X.Y.Z

# Отправить в GitHub
git push origin master --tags
```

### 4. Автоматический процесс

После `git push --tags` автоматически запускается GitHub Actions:

1. **Установка окружения** (Node.js 18.x)
2. **Установка зависимостей** (`npm ci`)
3. **Сборка проекта** (`npm run build`)
4. **Создание архива** (`krisp-notes-importer-X.Y.Z.zip`)
5. **Создание релиза** с файлами:
   - `main.js` (основной код)
   - `manifest.json` (метаданные)
   - `styles.css` (стили)
   - `krisp-notes-importer-X.Y.Z.zip` (архив для установки)

### 5. Проверка релиза

#### 5.1. Проверьте статус workflow:
```bash
# Проверить последний запуск
curl -s "https://api.github.com/repos/yshishenya/krisp-notes-importer/actions/runs?per_page=1"
```

#### 5.2. Проверьте файлы релиза:
```bash
# Проверить файлы в релизе
curl -s "https://api.github.com/repos/yshishenya/krisp-notes-importer/releases/tags/X.Y.Z" | jq '.assets[] | {name: .name, size: .size}'
```

#### 5.3. Проверьте ссылку:
`https://github.com/yshishenya/krisp-notes-importer/releases/tag/X.Y.Z`

## 📝 Шаблоны сообщений коммитов

### Новые функции (Minor):
```
v3.4.0: Add advanced search functionality

✨ Features:
- Full-text search in meeting notes
- Filter by date range and participants
- Export search results

🔧 Improvements:
- Enhanced UI performance
- Better error handling
```

### Исправления (Patch):
```
v3.3.8: Fix localization and archive creation

🐛 Fixes:
- Automatic version display in settings
- ZIP archive creation in releases
- GitHub Actions permissions

🔧 Technical:
- Dynamic version from manifest.json
- Improved release workflow
```

### Документация:
```
v3.3.9: Update documentation and release guide

📚 Documentation:
- Complete release guide
- Updated README with new features
- Enhanced troubleshooting section

🔧 Maintenance:
- Automated version display
- Improved developer workflow
```

## 🎯 Автоматическое отображение версии

### Проблема решена ✅
Версия в настройках теперь автоматически подтягивается из `manifest.json`:

```typescript
// В src/ui/SettingsTab.ts
const pluginVersion = (this.plugin as any).manifest?.version || 'unknown';
versionInfo.createEl('p', { text: `Version: v${pluginVersion}` });
```

**Больше не нужно** вручную обновлять версию в коде настроек!

## ⚠️ Важные правила

### НИКОГДА НЕ ДЕЛАТЬ:
- ❌ Релиз с несобирающимся кодом
- ❌ Пропуск обновления CHANGELOG.md
- ❌ Несинхронизированные версии в файлах
- ❌ Релиз без тестирования основных функций

### ВСЕГДА ДЕЛАТЬ:
- ✅ Тестировать на чистой установке Obsidian
- ✅ Проверять работу всех команд плагина
- ✅ Убеждаться в корректности локализации
- ✅ Проверять автоматическое отображение версии

## 🔧 Локальная разработка

### Команды для разработки:
```bash
# Разработка с hot reload
npm run dev

# Сборка для продакшена
npm run build

# Создание локального архива
npm run dist

# Очистка собранных файлов
npm run clean
```

### Структура файлов релиза:
```
dist/
├── main.js                           # Основной код плагина
├── manifest.json                     # Метаданные для Obsidian
├── styles.css                        # Стили интерфейса
└── krisp-notes-importer.zip         # Архив для установки
```

## 📊 Мониторинг релизов

### Метрики качества:
- **Время сборки**: < 30 секунд
- **Размер архива**: ~50-60KB
- **Успешность workflow**: 100%
- **Время от тега до релиза**: < 2 минуты

### После релиза проверить:
- [ ] GitHub Release создан автоматически
- [ ] Все 4 файла прикреплены к релизу
- [ ] ZIP-архив корректного размера
- [ ] Версия отображается правильно в настройках

## 🎯 Планирование релизов

### Частота релизов:
- **Patch**: По мере необходимости (1-3 дня)
- **Minor**: Еженедельно при наличии новых функций
- **Major**: По завершении крупных итераций

### Текущий статус:
- **Последняя версия**: v3.3.7
- **Следующая планируемая**: v3.3.8 (исправления)
- **Готовность к публикации**: 99%

## 🚀 Подготовка к Obsidian Community Plugins

### Требования для публикации:
- [ ] Стабильная версия (v3.4.0+)
- [ ] Полная документация
- [ ] Двуязычная поддержка
- [ ] Отсутствие критических багов
- [ ] Соответствие стандартам Obsidian

### Процесс подачи:
1. Fork репозитория `obsidian-releases`
2. Добавить запись в `community-plugins.json`
3. Создать Pull Request
4. Дождаться ревью (1-2 недели)

---

**Помните**: Хорошие релизы = довольные пользователи! 🎉
