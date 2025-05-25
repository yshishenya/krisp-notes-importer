#!/bin/bash

# Скрипт автоматического релиза Krisp Notes Importer
# Использование: ./scripts/release.sh [patch|minor|major]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${BLUE}[RELEASE]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка аргументов
RELEASE_TYPE=${1:-patch}
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    error "Неверный тип релиза. Используйте: patch, minor или major"
fi

log "Начинаю автоматический релиз (тип: $RELEASE_TYPE)"

# Проверка, что мы в корне проекта
if [[ ! -f "package.json" ]] || [[ ! -f "manifest.json" ]]; then
    error "Запустите скрипт из корня проекта"
fi

# Проверка чистоты Git
if [[ -n $(git status --porcelain) ]]; then
    error "Есть незакоммиченные изменения. Сначала закоммитьте их."
fi

# Получение текущей версии
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Текущая версия: $CURRENT_VERSION"

# Вычисление новой версии
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $RELEASE_TYPE in
    "major")
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    "minor")
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    "patch")
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log "Новая версия: $NEW_VERSION"

# Обновление package.json
log "Обновляю package.json..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
rm package.json.bak

# Обновление manifest.json
log "Обновляю manifest.json..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" manifest.json
rm manifest.json.bak

# Обновление версии в SettingsTab.ts
log "Обновляю версию в SettingsTab.ts..."
sed -i.bak "s/version.*: v$CURRENT_VERSION/version.*: v$NEW_VERSION/" src/ui/SettingsTab.ts
rm src/ui/SettingsTab.ts.bak

# Сборка проекта
log "Собираю проект..."
npm run build || error "Ошибка сборки проекта"

# Проверка наличия необходимых файлов
log "Проверяю наличие файлов релиза..."
for file in main.js manifest.json styles.css; do
    if [[ ! -f "$file" ]]; then
        error "Файл $file не найден"
    fi
done

# Обновление CHANGELOG.md
log "Обновляю CHANGELOG.md..."
CURRENT_DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEW_VERSION] - $CURRENT_DATE

### 🔄 Автоматический релиз
- Версия обновлена с $CURRENT_VERSION до $NEW_VERSION
- Проект пересобран с последними изменениями
- Все файлы синхронизированы

---

"

# Создаем временный файл с новой записью
echo "$CHANGELOG_ENTRY" > temp_changelog.md
# Добавляем существующий CHANGELOG после новой записи
tail -n +4 CHANGELOG.md >> temp_changelog.md
# Заменяем оригинальный файл
mv temp_changelog.md CHANGELOG.md

# Git операции
log "Создаю коммит..."
git add .
git commit -m "v$NEW_VERSION: Automated release - update version and rebuild"

log "Создаю тег..."
git tag "$NEW_VERSION"

log "Отправляю в GitHub..."
git push origin master --tags

# Создание ZIP архива для релиза
log "Создаю архив релиза..."
ZIP_NAME="krisp-notes-importer-$NEW_VERSION.zip"
zip -r "$ZIP_NAME" main.js manifest.json styles.css

# Попытка создать GitHub релиз через API
log "Создаю GitHub релиз..."
RELEASE_NOTES="# Krisp Notes Importer v$NEW_VERSION

## 🚀 Автоматический релиз

Версия обновлена с $CURRENT_VERSION до $NEW_VERSION.

### 📦 Файлы релиза:
- \`main.js\` - основной код плагина
- \`manifest.json\` - метаданные для Obsidian
- \`styles.css\` - стили интерфейса

### 📥 Установка:
1. Скачайте файлы из этого релиза
2. Поместите их в папку \`.obsidian/plugins/krisp-notes-importer/\`
3. Перезапустите Obsidian и включите плагин

### 🔗 Ссылки:
- [Руководство пользователя](https://github.com/yshishenya/krisp-notes-importer/blob/master/docs/UserGuide.MD)
- [Документация](https://github.com/yshishenya/krisp-notes-importer/blob/master/README.md)"

# Создание релиза через GitHub API (требует GITHUB_TOKEN)
if [[ -n "$GITHUB_TOKEN" ]]; then
    log "Создаю релиз через GitHub API..."

    # Создание релиза
    RELEASE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/yshishenya/krisp-notes-importer/releases \
        -d "{
            \"tag_name\": \"$NEW_VERSION\",
            \"target_commitish\": \"master\",
            \"name\": \"v$NEW_VERSION\",
            \"body\": $(echo "$RELEASE_NOTES" | jq -R -s .),
            \"draft\": false,
            \"prerelease\": false
        }")

    RELEASE_ID=$(echo "$RELEASE_RESPONSE" | jq -r '.id')

    if [[ "$RELEASE_ID" != "null" ]] && [[ -n "$RELEASE_ID" ]]; then
        success "Релиз создан с ID: $RELEASE_ID"

        # Загрузка файлов
        for file in main.js manifest.json styles.css; do
            log "Загружаю $file..."
            curl -s -X POST \
                -H "Authorization: token $GITHUB_TOKEN" \
                -H "Content-Type: application/octet-stream" \
                --data-binary @"$file" \
                "https://uploads.github.com/repos/yshishenya/krisp-notes-importer/releases/$RELEASE_ID/assets?name=$file"
        done

        success "Все файлы загружены в релиз"
    else
        warning "Не удалось создать релиз через API. Создайте вручную на GitHub."
        echo "Ответ API: $RELEASE_RESPONSE"
    fi
else
    warning "GITHUB_TOKEN не установлен. Создайте релиз вручную на GitHub."
    echo "Используйте следующие файлы: main.js, manifest.json, styles.css"
    echo "Или установите GITHUB_TOKEN и запустите скрипт снова."
fi

# Очистка
rm -f "$ZIP_NAME"

success "Релиз v$NEW_VERSION завершен!"
success "Тег: $NEW_VERSION"
success "Коммит отправлен в GitHub"

if [[ -z "$GITHUB_TOKEN" ]]; then
    echo ""
    warning "Для полной автоматизации установите GITHUB_TOKEN:"
    echo "export GITHUB_TOKEN=your_github_token"
    echo ""
    echo "Или создайте релиз вручную:"
    echo "https://github.com/yshishenya/krisp-notes-importer/releases/new?tag=$NEW_VERSION"
fi
