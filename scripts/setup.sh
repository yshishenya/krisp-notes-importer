#!/bin/bash

# Скрипт настройки окружения разработки Krisp Notes Importer

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Настройка окружения разработки Krisp Notes Importer"

# Проверка Node.js
if ! command -v node &> /dev/null; then
    warning "Node.js не установлен. Установите Node.js 18+ и запустите скрипт снова."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    warning "Требуется Node.js 18+. Текущая версия: $(node --version)"
    exit 1
fi

success "Node.js $(node --version) ✓"

# Проверка npm
if ! command -v npm &> /dev/null; then
    warning "npm не установлен"
    exit 1
fi

success "npm $(npm --version) ✓"

# Установка зависимостей
log "Устанавливаю зависимости..."
npm install

# Проверка TypeScript
if ! command -v npx &> /dev/null; then
    warning "npx не доступен"
    exit 1
fi

# Первая сборка
log "Выполняю первую сборку..."
npm run build

# Проверка файлов
log "Проверяю созданные файлы..."
for file in main.js manifest.json styles.css; do
    if [[ ! -f "$file" ]]; then
        warning "Файл $file не создан"
        exit 1
    fi
done

success "Все файлы созданы ✓"

# Создание папки scripts если не существует
mkdir -p scripts

# Делаем скрипты исполняемыми
chmod +x scripts/*.sh 2>/dev/null || true

# Проверка Git
if ! command -v git &> /dev/null; then
    warning "Git не установлен"
    exit 1
fi

success "Git $(git --version | cut -d' ' -f3) ✓"

# Настройка Git hooks (опционально)
if [[ -d ".git" ]]; then
    log "Настраиваю Git hooks..."

    # Pre-commit hook для проверки сборки
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Проверяю сборку перед коммитом..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки. Коммит отменен."
    exit 1
fi
echo "✅ Сборка успешна"
EOF

    chmod +x .git/hooks/pre-commit
    success "Git pre-commit hook настроен ✓"
fi

# Проверка jq для работы с JSON (для release скрипта)
if ! command -v jq &> /dev/null; then
    warning "jq не установлен. Установите для полной функциональности release скрипта:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu: sudo apt-get install jq"
    echo "  Windows: choco install jq"
else
    success "jq $(jq --version) ✓"
fi

# Проверка curl
if ! command -v curl &> /dev/null; then
    warning "curl не установлен"
else
    success "curl доступен ✓"
fi

echo ""
success "🎉 Окружение настроено успешно!"
echo ""
echo "📋 Доступные команды:"
echo "  npm run build          - Сборка проекта"
echo "  npm run dev            - Режим разработки (если настроен)"
echo "  ./scripts/release.sh   - Автоматический релиз"
echo "  ./scripts/test.sh      - Запуск тестов (если настроен)"
echo ""
echo "🚀 Для создания релиза:"
echo "  ./scripts/release.sh patch   - Patch релиз (3.3.2 -> 3.3.3)"
echo "  ./scripts/release.sh minor   - Minor релиз (3.3.2 -> 3.4.0)"
echo "  ./scripts/release.sh major   - Major релиз (3.3.2 -> 4.0.0)"
echo ""
echo "🔑 Для автоматического создания GitHub релизов установите:"
echo "  export GITHUB_TOKEN=your_github_token"
