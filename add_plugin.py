import json

# Читаем существующий файл
with open('community-plugins.json', 'r') as f:
    data = json.load(f)

# Новый плагин
new_plugin = {
    "id": "krisp-notes-importer",
    "name": "Krisp Notes Importer",
    "author": "yshishenya",
    "description": "Automatically import Krisp meeting notes into beautifully formatted Obsidian notes with advanced analytics and smart tags.",
    "repo": "yshishenya/krisp-notes-importer"
}

# Найдем позицию для вставки (перед kr-book-info-plugin)
insert_pos = None
for i, plugin in enumerate(data):
    if plugin['id'] == 'kr-book-info-plugin':
        insert_pos = i
        break

if insert_pos is not None:
    data.insert(insert_pos, new_plugin)
    with open('community-plugins.json', 'w') as f:
        json.dump(data, f, indent=4)
    print(f'Plugin inserted at position {insert_pos}')
else:
    print('kr-book-info-plugin not found')
