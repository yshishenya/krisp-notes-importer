# 🚀 Быстрый релиз

## Пошаговая инструкция

### 1. Обновите версии в 3 файлах:
- `package.json` → `"version": "X.Y.Z"`
- `manifest.json` → `"version": "X.Y.Z"`
- `CHANGELOG.md` → добавьте новую секцию

### 2. Создайте релиз:
```bash
npm run build
git add .
git commit -m "vX.Y.Z: Brief description"
git tag X.Y.Z
git push origin master --tags
```

### 3. Проверьте результат:
- GitHub Actions автоматически создаст релиз с детальными release notes
- Release notes извлекаются из соответствующей секции CHANGELOG.md
- Версия в настройках обновится автоматически
- **Только ZIP-архив** будет прикреплен к релизу (v3.3.9+)

### 📝 Автоматические Release Notes
- Система извлекает notes из `## [X.Y.Z]` секции в CHANGELOG.md
- Если секция не найдена, используется `## [Unreleased]`
- Fallback к базовым инструкциям по установке
- Больше **НЕТ** автогенерированных списков коммитов!

## 📖 Подробное руководство
См. [docs/RELEASE_GUIDE.md](./docs/RELEASE_GUIDE.md)

## ✅ Автоматическое отображение версии
Версия в настройках плагина теперь **автоматически** подтягивается из `manifest.json` - больше не нужно обновлять вручную!
