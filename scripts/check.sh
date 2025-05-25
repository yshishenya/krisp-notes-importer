#!/bin/bash

# Скрипт проверки состояния проекта Krisp Notes Importer

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

ERRORS=0

log "Проверка состояния проекта Krisp Notes Importer"
echo ""

# Проверка основных файлов
log "📁 Проверка файлов проекта..."
REQUIRED_FILES=(
    "package.json"
    "manifest.json"
    "tsconfig.json"
    "esbuild.config.mjs"
    "src/main.ts"
    "src/interfaces.ts"
    "src/core/SettingsManager.ts"
    "src/core/ProcessingService.ts"
    "src/core/LocalizationService.ts"
    "src/ui/SettingsTab.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file"
    else
        error "$file - ОТСУТСТВУЕТ"
        ((ERRORS++))
    fi
done

echo ""

# Проверка собранных файлов
log "🔨 Проверка собранных файлов..."
BUILD_FILES=("main.js" "manifest.json" "styles.css")

for file in "${BUILD_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file"
    else
        warning "$file - не собран"
    fi
done

echo ""

# Проверка версий
log "📋 Проверка версий..."
if [[ -f "package.json" ]] && [[ -f "manifest.json" ]]; then
    PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "ERROR")
    MANIFEST_VERSION=$(node -p "require('./manifest.json').version" 2>/dev/null || echo "ERROR")

    if [[ "$PACKAGE_VERSION" == "$MANIFEST_VERSION" ]]; then
        success "Версии синхронизированы: $PACKAGE_VERSION"
    else
        error "Версии не синхронизированы: package.json=$PACKAGE_VERSION, manifest.json=$MANIFEST_VERSION"
        ((ERRORS++))
    fi

    # Проверка версии в SettingsTab.ts
    if [[ -f "src/ui/SettingsTab.ts" ]]; then
        if grep -q "v$PACKAGE_VERSION" src/ui/SettingsTab.ts; then
            success "Версия в SettingsTab.ts актуальна"
        else
            warning "Версия в SettingsTab.ts может быть устаревшей"
        fi
    fi
else
    error "Не удалось проверить версии"
    ((ERRORS++))
fi

echo ""

# Проверка Git статуса
log "📝 Проверка Git статуса..."
if command -v git &> /dev/null && [[ -d ".git" ]]; then
    if [[ -z $(git status --porcelain) ]]; then
        success "Рабочая директория чистая"
    else
        warning "Есть незакоммиченные изменения:"
        git status --porcelain | head -5
        if [[ $(git status --porcelain | wc -l) -gt 5 ]]; then
            echo "  ... и еще $(( $(git status --porcelain | wc -l) - 5 )) файлов"
        fi
    fi

    # Проверка последнего коммита
    LAST_COMMIT=$(git log -1 --pretty=format:"%h %s" 2>/dev/null || echo "Нет коммитов")
    success "Последний коммит: $LAST_COMMIT"
else
    warning "Git не инициализирован или недоступен"
fi

echo ""

# Проверка зависимостей
log "📦 Проверка зависимостей..."
if [[ -f "package.json" ]] && [[ -d "node_modules" ]]; then
    success "node_modules установлены"

    # Проверка основных зависимостей
    DEPS=("obsidian" "typescript" "esbuild")
    for dep in "${DEPS[@]}"; do
        if [[ -d "node_modules/$dep" ]]; then
            success "$dep установлен"
        else
            warning "$dep не найден в node_modules"
        fi
    done
else
    warning "Зависимости не установлены. Запустите: npm install"
fi

echo ""

# Проверка сборки
log "🔧 Проверка сборки..."
if npm run build &>/dev/null; then
    success "Проект собирается без ошибок"
else
    error "Ошибка сборки проекта"
    ((ERRORS++))
fi

echo ""

# Проверка TypeScript
log "📘 Проверка TypeScript..."
if command -v npx &> /dev/null; then
    if npx tsc --noEmit &>/dev/null; then
        success "TypeScript проверка пройдена"
    else
        warning "Есть ошибки TypeScript"
        echo "Запустите: npx tsc --noEmit для подробностей"
    fi
else
    warning "npx недоступен"
fi

echo ""

# Проверка размеров файлов
log "📊 Размеры файлов..."
if [[ -f "main.js" ]]; then
    MAIN_SIZE=$(wc -c < main.js)
    if [[ $MAIN_SIZE -lt 1000000 ]]; then  # < 1MB
        success "main.js: $(( MAIN_SIZE / 1024 ))KB"
    else
        warning "main.js слишком большой: $(( MAIN_SIZE / 1024 ))KB"
    fi
fi

echo ""

# Проверка документации
log "📚 Проверка документации..."
DOC_FILES=("README.md" "CHANGELOG.md" "docs/UserGuide.MD")
for file in "${DOC_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "$file"
    else
        warning "$file отсутствует"
    fi
done

echo ""

# Итоговый статус
if [[ $ERRORS -eq 0 ]]; then
    success "🎉 Проект в хорошем состоянии!"
    echo ""
    echo "✅ Готов к:"
    echo "  - Разработке новых функций"
    echo "  - Созданию релиза"
    echo "  - Публикации"
else
    error "❌ Найдено $ERRORS критических проблем"
    echo ""
    echo "🔧 Рекомендуемые действия:"
    echo "  1. Исправьте критические ошибки"
    echo "  2. Запустите: npm install"
    echo "  3. Запустите: npm run build"
    echo "  4. Повторите проверку: ./scripts/check.sh"
fi

echo ""
echo "📋 Дополнительные команды:"
echo "  ./scripts/setup.sh     - Настройка окружения"
echo "  ./scripts/release.sh   - Создание релиза"
echo "  npm run build          - Сборка проекта"

exit $ERRORS
