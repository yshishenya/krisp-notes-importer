# Makefile для Krisp Notes Importer
# Использование: make [команда]

.PHONY: help setup build check release clean install dev

# Цвета для вывода
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
NC := \033[0m

# По умолчанию показываем help
help:
	@echo "$(BLUE)Krisp Notes Importer - Команды разработки$(NC)"
	@echo ""
	@echo "$(GREEN)Основные команды:$(NC)"
	@echo "  make setup     - Настройка окружения разработки"
	@echo "  make build     - Сборка проекта"
	@echo "  make check     - Проверка состояния проекта"
	@echo "  make release   - Создание patch релиза"
	@echo "  make clean     - Очистка временных файлов"
	@echo ""
	@echo "$(GREEN)Релизы:$(NC)"
	@echo "  make patch     - Patch релиз (3.3.2 -> 3.3.3)"
	@echo "  make minor     - Minor релиз (3.3.2 -> 3.4.0)"
	@echo "  make major     - Major релиз (3.3.2 -> 4.0.0)"
	@echo ""
	@echo "$(GREEN)Разработка:$(NC)"
	@echo "  make install   - Установка зависимостей"
	@echo "  make dev       - Режим разработки (watch)"
	@echo "  make lint      - Проверка TypeScript"
	@echo ""
	@echo "$(YELLOW)Требования:$(NC)"
	@echo "  - Node.js 18+"
	@echo "  - npm"
	@echo "  - Git"

# Настройка окружения
setup:
	@echo "$(BLUE)Настройка окружения...$(NC)"
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

# Установка зависимостей
install:
	@echo "$(BLUE)Установка зависимостей...$(NC)"
	@npm install

# Сборка проекта
build:
	@echo "$(BLUE)Сборка проекта...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ Сборка завершена$(NC)"

# Проверка состояния
check:
	@echo "$(BLUE)Проверка проекта...$(NC)"
	@chmod +x scripts/check.sh
	@./scripts/check.sh

# Очистка
clean:
	@echo "$(BLUE)Очистка временных файлов...$(NC)"
	@rm -rf node_modules/.cache
	@rm -f *.zip
	@rm -f *.log
	@rm -f temp_*
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

# Проверка TypeScript
lint:
	@echo "$(BLUE)Проверка TypeScript...$(NC)"
	@npx tsc --noEmit
	@echo "$(GREEN)✓ TypeScript проверка пройдена$(NC)"

# Режим разработки (если настроен)
dev:
	@echo "$(BLUE)Запуск в режиме разработки...$(NC)"
	@if [ -f "package.json" ] && grep -q "\"dev\"" package.json; then \
		npm run dev; \
	else \
		echo "$(YELLOW)Режим разработки не настроен. Используйте: make build$(NC)"; \
	fi

# Релизы
release: patch

patch:
	@echo "$(BLUE)Создание patch релиза...$(NC)"
	@chmod +x scripts/release.sh
	@./scripts/release.sh patch

minor:
	@echo "$(BLUE)Создание minor релиза...$(NC)"
	@chmod +x scripts/release.sh
	@./scripts/release.sh minor

major:
	@echo "$(BLUE)Создание major релиза...$(NC)"
	@chmod +x scripts/release.sh
	@./scripts/release.sh major

# Быстрая проверка перед коммитом
pre-commit: lint build
	@echo "$(GREEN)✓ Готов к коммиту$(NC)"

# Полная проверка перед релизом
pre-release: clean install lint build check
	@echo "$(GREEN)✓ Готов к релизу$(NC)"

# Информация о проекте
info:
	@echo "$(BLUE)Информация о проекте:$(NC)"
	@if [ -f "package.json" ]; then \
		echo "Название: $$(node -p 'require("./package.json").name')"; \
		echo "Версия: $$(node -p 'require("./package.json").version')"; \
		echo "Описание: $$(node -p 'require("./package.json").description')"; \
	fi
	@if [ -d ".git" ]; then \
		echo "Git ветка: $$(git branch --show-current 2>/dev/null || echo 'неизвестно')"; \
		echo "Последний коммит: $$(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo 'нет коммитов')"; \
	fi

# Установка в Obsidian (для разработки)
install-obsidian:
	@echo "$(BLUE)Установка в Obsidian для разработки...$(NC)"
	@if [ -z "$(OBSIDIAN_PLUGINS_PATH)" ]; then \
		echo "$(YELLOW)Установите OBSIDIAN_PLUGINS_PATH:$(NC)"; \
		echo "export OBSIDIAN_PLUGINS_PATH=~/.obsidian/plugins"; \
		exit 1; \
	fi
	@mkdir -p "$(OBSIDIAN_PLUGINS_PATH)/krisp-notes-importer"
	@cp main.js manifest.json styles.css "$(OBSIDIAN_PLUGINS_PATH)/krisp-notes-importer/"
	@echo "$(GREEN)✓ Плагин установлен в Obsidian$(NC)"

# Создание архива для распространения
dist: build
	@echo "$(BLUE)Создание архива для распространения...$(NC)"
	@VERSION=$$(node -p 'require("./package.json").version'); \
	zip -r "krisp-notes-importer-$$VERSION.zip" main.js manifest.json styles.css README.md
	@echo "$(GREEN)✓ Архив создан$(NC)"
