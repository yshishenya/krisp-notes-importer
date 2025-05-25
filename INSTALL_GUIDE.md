# 🚀 Установка Krisp Notes Importer

## Для пользователей

### 🎯 Самый простой способ (ZIP-архив)

1. **Скачайте** [`dist/krisp-notes-importer.zip`](./dist/krisp-notes-importer.zip)
2. **Распакуйте** в папку `.obsidian/plugins/` вашего хранилища
3. **Перезапустите** Obsidian и включите плагин

### ⭐ Альтернативный способ (папка)

1. **Скачайте** папку [`dist/krisp-notes-importer/`](./dist/krisp-notes-importer/)
2. **Скопируйте** в папку `.obsidian/plugins/` вашего хранилища
3. **Перезапустите** Obsidian и включите плагин

## Для разработчиков

### Сборка проекта

```bash
# Клонирование
git clone <repository-url>
cd krisp-notes-importer

# Установка зависимостей
npm install

# Разработка (с watch)
npm run dev

# Сборка для продакшена
npm run build

# Создание готового плагина
npm run dist
```

### Результат команды `npm run dist`

Создает в папке `dist/`:
- `krisp-notes-importer.zip` - готовый архив для пользователей
- `krisp-notes-importer/` - готовая папка плагина
- Отдельные файлы для ручной установки

---

**Подробная документация:** [README.md](./README.md)
