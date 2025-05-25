# Скрипты автоматизации Krisp Notes Importer

Этот каталог содержит скрипты для автоматизации разработки и релизов плагина.

## 📋 Доступные скрипты

### 🚀 `release.sh` - Автоматический релиз
Полностью автоматизированный процесс создания релиза.

**Использование:**
```bash
./scripts/release.sh [patch|minor|major]
```

**Что делает:**
- ✅ Автоматически вычисляет новую версию
- ✅ Обновляет `package.json`, `manifest.json`, `src/ui/SettingsTab.ts`
- ✅ Пересобирает проект
- ✅ Обновляет `CHANGELOG.md`
- ✅ Создает Git коммит и тег
- ✅ Отправляет в GitHub
- ✅ Создает GitHub релиз (при наличии `GITHUB_TOKEN`)

**Примеры:**
```bash
# Patch релиз: 3.3.2 -> 3.3.3
./scripts/release.sh patch

# Minor релиз: 3.3.2 -> 3.4.0
./scripts/release.sh minor

# Major релиз: 3.3.2 -> 4.0.0
./scripts/release.sh major
```

### 🔧 `setup.sh` - Настройка окружения
Первоначальная настройка окружения разработки.

**Использование:**
```bash
./scripts/setup.sh
```

**Что делает:**
- ✅ Проверяет Node.js, npm, Git
- ✅ Устанавливает зависимости
- ✅ Выполняет первую сборку
- ✅ Настраивает Git hooks
- ✅ Проверяет дополнительные инструменты

### 🔍 `check.sh` - Проверка проекта
Комплексная проверка состояния проекта.

**Использование:**
```bash
./scripts/check.sh
```

**Что проверяет:**
- ✅ Наличие всех необходимых файлов
- ✅ Синхронизацию версий
- ✅ Состояние Git репозитория
- ✅ Зависимости и сборку
- ✅ TypeScript ошибки
- ✅ Размеры файлов
- ✅ Документацию

## 🛠️ Makefile команды

Для еще большего удобства используйте Makefile:

```bash
# Показать все доступные команды
make help

# Основные команды
make setup      # Настройка окружения
make build      # Сборка проекта
make check      # Проверка состояния
make clean      # Очистка временных файлов

# Релизы
make patch      # Patch релиз
make minor      # Minor релиз
make major      # Major релиз

# Разработка
make install    # Установка зависимостей
make lint       # Проверка TypeScript
make info       # Информация о проекте
```

## 🔑 Настройка GitHub Token

Для автоматического создания GitHub релизов установите токен:

```bash
# Создайте Personal Access Token на GitHub с правами repo
export GITHUB_TOKEN=your_github_token

# Или добавьте в ~/.bashrc / ~/.zshrc
echo 'export GITHUB_TOKEN=your_github_token' >> ~/.bashrc
```

**Создание токена:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Выберите scope: `repo` (Full control of private repositories)
4. Скопируйте токен и установите в переменную окружения

## 📦 Workflow разработки

### Ежедневная разработка:
```bash
# Проверка состояния
make check

# Сборка и проверка
make build
make lint

# Коммит изменений
git add .
git commit -m "feat: add new feature"
git push
```

### Создание релиза:
```bash
# Полная проверка перед релизом
make pre-release

# Создание релиза
make patch  # или minor/major

# Релиз автоматически:
# - Обновит версии
# - Пересоберет проект
# - Создаст коммит и тег
# - Отправит в GitHub
# - Создаст GitHub релиз
```

### Первоначальная настройка:
```bash
# Клонирование репозитория
git clone https://github.com/yshishenya/krisp-notes-importer.git
cd krisp-notes-importer

# Настройка окружения
make setup

# Проверка что все работает
make check
```

## 🔧 Требования

### Обязательные:
- **Node.js 18+** - для сборки TypeScript
- **npm** - управление зависимостями
- **Git** - контроль версий
- **make** - выполнение Makefile команд

### Рекомендуемые:
- **jq** - обработка JSON в скриптах
- **curl** - работа с GitHub API
- **zip** - создание архивов релизов

### Установка на macOS:
```bash
# Homebrew
brew install node git jq curl

# Проверка make (обычно уже установлен)
make --version
```

### Установка на Ubuntu:
```bash
# APT
sudo apt-get update
sudo apt-get install nodejs npm git jq curl zip make

# Проверка версии Node.js
node --version  # должно быть 18+
```

## 🐛 Устранение проблем

### Ошибка "Permission denied":
```bash
chmod +x scripts/*.sh
```

### Ошибка сборки TypeScript:
```bash
npm install
npx tsc --noEmit  # проверка ошибок
```

### Проблемы с Git:
```bash
git status
git add .
git commit -m "fix: resolve issues"
```

### GitHub API ошибки:
```bash
# Проверьте токен
echo $GITHUB_TOKEN

# Проверьте права доступа
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

## 📚 Дополнительные ресурсы

- [Semantic Versioning](https://semver.org/) - правила версионирования
- [GitHub API](https://docs.github.com/en/rest) - документация API
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) - разработка плагинов

## 🤝 Вклад в проект

При внесении изменений в скрипты:

1. Протестируйте на чистом окружении
2. Обновите документацию
3. Проверьте совместимость с разными ОС
4. Добавьте обработку ошибок
5. Используйте понятные сообщения

**Помните:** Хорошие скрипты автоматизации экономят время всей команде!
