#!/bin/bash
set -e # Выход при ошибке

# --- НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ ---
# Укажите полный путь к вашему хранилищу Obsidian
OBSIDIAN_VAULT_PATH="/Users/yshishenya/Yandex.Disk.localized/obsidian"
# Имя папки для аудиовложений внутри хранилища (относительно корня хранилища)
OBSIDIAN_ATTACHMENTS_SUBFOLDER="attachments/krisp_audio"
# Имя папки для заметок о встречах внутри хранилища (относительно корня хранилища)
OBSIDIAN_MEETINGS_SUBFOLDER="Meetings"
# --- КОНЕЦ НАСТРОЕК ПОЛЬЗОВАТЕЛЯ ---

# Функция для извлечения даты из текста
extract_date() {
    local text="$1"
    local date=""
    # Берём первую строку
    local first_line=$(echo "$text" | head -n 1)
    # Ищем шаблон "Month, DD" или "Month DD" после последнего дефиса
    local date_part=$(echo "$first_line" | awk -F'-' '{print $NF}' | sed 's/^ *//;s/ *$//')
    # Пробуем найти дату
    if [[ "$date_part" =~ ([A-Za-z]+)[[:space:]]*,?[[:space:]]*([0-9]{1,2}) ]]; then
        local month="${BASH_REMATCH[1]}"
        local day="${BASH_REMATCH[2]}"
        case "$(echo "$month" | tr '[:upper:]' '[:lower:]')" in
            "january"|"jan") month="01" ;;
            "february"|"feb") month="02" ;;
            "march"|"mar") month="03" ;;
            "april"|"apr") month="04" ;;
            "may") month="05" ;;
            "june"|"jun") month="06" ;;
            "july"|"jul") month="07" ;;
            "august"|"aug") month="08" ;;
            "september"|"sep") month="09" ;;
            "october"|"oct") month="10" ;;
            "november"|"nov") month="11" ;;
            "december"|"dec") month="12" ;;
            *) month="01" ;;
        esac
        day=$(printf "%02d" "$day")
        local year=$(date +"%Y")
        date="${year}-${month}-${day}"
    fi
    echo "$date"
}

# Функция для извлечения времени из текста
extract_time() {
    local text="$1"
    local time=""

    # Пробуем найти время в формате "HH:MM AM/PM" в начале заметок
    if [[ "$text" =~ ^[^#]*([0-9]{1,2}):([0-9]{2})[[:space:]]*([AaPp][Mm]) ]]; then
        local hour="${BASH_REMATCH[1]}"
        local minute="${BASH_REMATCH[2]}"
        local ampm="${BASH_REMATCH[3]}"

        # Преобразуем 12-часовой формат в 24-часовой
        ampm_lower=$(echo "$ampm" | tr '[:upper:]' '[:lower:]')
        if [[ "$ampm_lower" == "pm" && "$hour" != "12" ]]; then
            hour=$((hour + 12))
        elif [[ "$ampm_lower" == "am" && "$hour" == "12" ]]; then
            hour="00"
        fi

        # Добавляем ведущий ноль к часу, если нужно
        hour=$(printf "%02d" "$hour")

        time="${hour}${minute}"
    fi

    echo "$time"
}

# Функция для извлечения участников из транскрипта
extract_participants() {
    local transcript="$1"
    # Извлекаем уникальные имена участников из транскрипта
    echo "$transcript" | grep -E "^[^|]+\s*\|\s*" | sed -E 's/^([^|]+)\s*\|\s*.*$/\1/' | sort -u | tr '\n' ',' | sed 's/,$//'
}

# Функция для форматирования времени в транскрипте
format_transcript() {
    local transcript="$1"
    # Добавляем ссылки на временные метки
    echo "$transcript" | sed -E 's/([0-9]{2}:[0-9]{2})/[[\1]]/g'
}

# Полный путь к папке вложений
OBSIDIAN_FULL_ATTACHMENTS_PATH="${OBSIDIAN_VAULT_PATH}/${OBSIDIAN_ATTACHMENTS_SUBFOLDER}"
# Полный путь к папке заметок
OBSIDIAN_FULL_MEETINGS_PATH="${OBSIDIAN_VAULT_PATH}/${OBSIDIAN_MEETINGS_SUBFOLDER}"

# Создаем папки, если их нет
mkdir -p "$OBSIDIAN_FULL_ATTACHMENTS_PATH"
mkdir -p "$OBSIDIAN_FULL_MEETINGS_PATH"

# Цикл по всем файлам, переданным в действие папки (обычно это один ZIP-файл)
for zip_file_path in "$@"; do
    # Проверяем, что это ZIP-файл
    if [[ "$zip_file_path" != *.zip ]]; then
        echo "Пропущен не ZIP-файл: $zip_file_path"
        continue
    fi

    echo "Обработка файла: $zip_file_path"

    # Имя файла без расширения и пути (используется для именования)
    base_name=$(basename "$zip_file_path" .zip)

    # Создаем временную папку для распаковки
    temp_extract_dir=$(mktemp -d "/tmp/krisp_extract_${base_name}_XXXXXX")
    echo "Временная папка для распаковки: $temp_extract_dir"

    # Распаковываем архив
    if ! unzip -q "$zip_file_path" -d "$temp_extract_dir"; then
        echo "Ошибка распаковки $zip_file_path"
        rm -rf "$temp_extract_dir" # Удаляем временную папку при ошибке
        continue
    fi

    # Обрабатываем каждую подпапку в архиве
    for meeting_dir in "$temp_extract_dir"/*/; do
        if [ ! -d "$meeting_dir" ]; then
            continue
        fi

        echo "Обработка встречи в папке: $meeting_dir"

        # Ожидаемые имена файлов внутри архива
        notes_txt_filename="meeting_notes.txt"
        transcript_txt_filename="transcript.txt"
        recording_mp3_filename="recording.mp3"

        notes_file="${meeting_dir}${notes_txt_filename}"
        transcript_file="${meeting_dir}${transcript_txt_filename}"
        audio_file_original="${meeting_dir}${recording_mp3_filename}"

        # Проверяем наличие всех необходимых файлов
        if [ ! -f "$notes_file" ] || [ ! -f "$transcript_file" ] || [ ! -f "$audio_file_original" ]; then
            echo "Один или несколько необходимых файлов не найдены в папке $meeting_dir:"
            [ ! -f "$notes_file" ] && echo " - $notes_txt_filename отсутствует"
            [ ! -f "$transcript_file" ] && echo " - $transcript_txt_filename отсутствует"
            [ ! -f "$audio_file_original" ] && echo " - $recording_mp3_filename отсутствует"
            continue
        fi

        # Получаем имя встречи из имени папки
        meeting_name=$(basename "$meeting_dir")
        # Удаляем UUID из имени встречи (всё после последнего дефиса)
        meeting_name=$(echo "$meeting_name" | sed -E 's/-[^-]+$//')

        # Читаем содержимое текстовых файлов
        notes_content=$(cat "$notes_file")
        transcript_content=$(cat "$transcript_file")

        # Извлекаем дату и время из заметок
        meeting_date=$(extract_date "$notes_content")
        # Извлекаем время из первой строки заметок
        if [[ "$notes_content" =~ ^[^#]*([0-9]{1,2}):([0-9]{2})[[:space:]]*([AaPp][Mm]) ]]; then
            hour="${BASH_REMATCH[1]}"
            minute="${BASH_REMATCH[2]}"
            ampm="${BASH_REMATCH[3]}"

            # Преобразуем 12-часовой формат в 24-часовой
            ampm_lower=$(echo "$ampm" | tr '[:upper:]' '[:lower:]')
            if [[ "$ampm_lower" == "pm" && "$hour" != "12" ]]; then
                hour=$((hour + 12))
            elif [[ "$ampm_lower" == "am" && "$hour" == "12" ]]; then
                hour="00"
            fi

            # Добавляем ведущий ноль к часу, если нужно
            hour=$(printf "%02d" "$hour")
            meeting_time="${hour}:${minute}"
        else
            meeting_time="00:00"
        fi

        # Если дата или время не найдены, используем текущие
        if [ -z "$meeting_date" ]; then
            meeting_date=$(date +"%Y-%m-%d")
        fi

        # Извлекаем год и месяц из даты встречи
        current_year=$(echo "$meeting_date" | cut -d'-' -f1)
        current_month=$(echo "$meeting_date" | cut -d'-' -f2)

        # Создаем структуру папок по году и месяцу
        year_month_path="${OBSIDIAN_FULL_MEETINGS_PATH}/${current_year}/${current_month}"
        mkdir -p "$year_month_path"

        # Формируем имена для Obsidian
        obsidian_note_title="${meeting_date}_${meeting_name}"
        obsidian_md_filename="${obsidian_note_title}.md"
        obsidian_audio_filename="${meeting_date}_${meeting_name}.mp3"

        # Полный путь для аудиофайла в Obsidian
        obsidian_audio_target_path="${OBSIDIAN_FULL_ATTACHMENTS_PATH}/${obsidian_audio_filename}"
        # Полный путь для заметки Markdown в Obsidian
        obsidian_md_target_path="${year_month_path}/${obsidian_md_filename}"

        # Перемещаем аудиофайл
        mv "$audio_file_original" "$obsidian_audio_target_path"
        echo "Аудиофайл перемещен в: $obsidian_audio_target_path"

        # Извлекаем ключевые слова из заметок для тегов
        # Ищем упоминания проектов, людей и тем
        projects=$(echo "$notes_content" | grep -i -E "проект|project" | head -n 1)
        people=$(echo "$notes_content" | grep -i -E "участник|participant" | head -n 1)

        # Формируем теги
        tags="#meeting #krisp"
        if [ ! -z "$projects" ]; then
            tags="$tags #project"
        fi
        if [ ! -z "$people" ]; then
            tags="$tags #people"
        fi

        # Извлекаем участников из транскрипта
        participants=$(extract_participants "$transcript_content")

        # Форматируем транскрипт
        formatted_transcript=$(format_transcript "$transcript_content")

        # Формируем содержимое Markdown файла с YAML frontmatter
        markdown_content=$(cat <<EOF
---
title: ${meeting_name}
date: ${meeting_date}
time: ${meeting_time}
type: meeting
source: krisp
tags: [meeting, krisp${projects:+, project}${people:+, people}]
audio: [${OBSIDIAN_ATTACHMENTS_SUBFOLDER}/${obsidian_audio_filename}]
participants: [${participants}]
duration: $(echo "$transcript_content" | grep -E "^[^|]+\s*\|\s*[0-9]{2}:[0-9]{2}" | tail -n 1 | sed -E 's/.*\| ([0-9]{2}:[0-9]{2}).*/\1/')
---

# ${meeting_name}

## 📝 Краткое содержание
$(echo "$notes_content" | grep -A 1 "^Summary" | grep -v "^Summary" | grep -v "^$" | sed 's/^-/- /')

## 👥 Участники
$(echo "$participants" | tr ',' '\n' | sed 's/^/- /')

## ✅ Действия (Action Items)
$(echo "$notes_content" | grep -A 10 "^Action Items" | grep -v "^Action Items" | grep -v "^$" | sed 's/^-/- [ ] /')

## 📋 Ключевые моменты (Key Points)
$(echo "$notes_content" | grep -A 20 "^Key Points" | grep -v "^Key Points" | grep -v "^$" | sed 's/^-/- /')

## 📝 Подробное содержание
$(echo "$notes_content" | grep -A 100 "^Summary" | grep -v "^Summary" | grep -v "^Key Points" | grep -v "^$" | sed 's/^-/- /')

## 🎙️ Транскрипция (Transcript)
\`\`\`transcript
${formatted_transcript}
\`\`\`

## 🎧 Аудиозапись
<audio src="${OBSIDIAN_ATTACHMENTS_SUBFOLDER}/${obsidian_audio_filename}" controls></audio>

## 🔗 Ссылки
- [[Meetings/${current_year}/${current_month}/${obsidian_md_filename}]]
- [[${OBSIDIAN_ATTACHMENTS_SUBFOLDER}/${obsidian_audio_filename}]]

${tags}

---
*Сгенерировано автоматически с помощью Krisp*
EOF
)

        # Создаем Markdown файл в Obsidian
        echo "$markdown_content" > "$obsidian_md_target_path"
        echo "Заметка Obsidian создана: $obsidian_md_target_path"

        # Создаем символическую ссылку в корневой папке Meetings для быстрого доступа
        ln -sf "${year_month_path}/${obsidian_md_filename}" "${OBSIDIAN_FULL_MEETINGS_PATH}/${obsidian_md_filename}"
    done

    # Очистка: удаляем временную папку
    rm -rf "$temp_extract_dir"
    echo "Временная папка $temp_extract_dir удалена."

    # Удаляем оригинальный ZIP-файл после успешной обработки
    rm "$zip_file_path"
    echo "Оригинальный ZIP-файл $zip_file_path удален."

    echo "Обработка $zip_file_path завершена."
done

echo "Все файлы обработаны."
