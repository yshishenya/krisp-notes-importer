export interface KrispImporterSettings {
    watchedFolderPath: string;
    notesFolderPath: string;    // Относительно корня хранилища
    attachmentsFolderPath: string; // Относительно корня хранилища
    noteNameTemplate: string;
    attachmentNameTemplate: string;
    noteContentTemplate: string;
    duplicateStrategy: 'skip' | 'overwrite' | 'rename';
    deleteZipAfterImport: boolean;
    openNoteAfterImport: boolean;
    autoScanEnabled: boolean;
    language: 'en' | 'ru';
    // Поля, необходимые для Итерации 1, согласно DevelopmentPlan.MD и SRS.MD
    // Остальные поля из SRS.MD будут добавлены в Итерации 3
}

export const DEFAULT_SETTINGS: KrispImporterSettings = {
    watchedFolderPath: '',
    notesFolderPath: 'KrispNotes/Notes',
    attachmentsFolderPath: 'KrispNotes/Attachments',
    noteNameTemplate: '{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}',
    attachmentNameTemplate: '{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio',
    noteContentTemplate: `---
title: {{meetingTitle}}
date: {{date}}
time: {{time}}
type: meeting
source: krisp
tags:
{{yamlTags}}
  - meeting
  - krisp
audio: "{{audioPathForYaml}}"
participants: [{{participants}}]
duration: {{duration}}
meeting_stats:
  participants_count: {{participantsCount}}
  transcript_length: {{transcriptWords}}
  most_active_speaker: "{{mostActiveSpeaker}}"
---

# 🎙️ {{meetingTitle}}

> [!info]+ 📋 Информация о встрече
>
> **📅 Дата:** {{date}}
> **⏰ Время:** {{time}}
> **⏱️ Длительность:** {{duration}}
> **👥 Участники:** {{participantsCount}} человек
> **📊 Слов в транскрипте:** {{transcriptWords}}
> **🗣️ Самый активный:** {{mostActiveSpeaker}}

---

## 🎧 Аудиозапись

![[{{audioPathForYaml}}]]

*Для воспроизведения аудио используйте встроенный плеер Obsidian или откройте файл: [[{{audioPathForYaml}}]]*

---

## 📝 Краткое содержание

> [!note]+ 💡 Основные моменты встречи
>
> {{summary}}

---

## 👥 Участники встречи

{{participantsList}}

### 📈 Статистика активности

{{participantsStats}}

---

## ✅ Задачи и действия

> [!todo]+ 📋 Action Items
>
> {{actionItemsList}}

---

## 🔑 Ключевые моменты

> [!important]+ ⭐ Key Points
>
> {{keyPointsList}}

---

## 🏷️ Извлеченная информация

{{extractedEntities}}

---

## 📋 Полная транскрипция

> [!quote]- 🎙️ Транскрипт встречи ({{transcriptWords}} слов)
>
> {{formattedTranscript}}

---

## 🔗 Связанные материалы

- 📄 **Заметка:** [[{{noteFileName}}]]
- 🎵 **Аудиофайл:** [[{{audioPathForYaml}}]]

{{relatedLinks}}

---

## 📊 Статистика встречи

| Параметр | Значение |
|----------|----------|
| 📅 Дата | {{date}} |
| ⏰ Время начала | {{time}} |
| ⏱️ Длительность | {{duration}} |
| 👥 Участников | {{participantsCount}} |
| 📝 Слов в транскрипте | {{transcriptWords}} |
| 🗣️ Самый активный | {{mostActiveSpeaker}} |

---

> [!tip]+ 🤖 Информация об импорте
>
> **Создано:** Krisp Notes Importer
> **Импортировано:** {{importDate}}
> **Источник:** Krisp Meeting Archive
`,
    duplicateStrategy: 'rename',
    deleteZipAfterImport: false,
    openNoteAfterImport: true,
    autoScanEnabled: false,
    language: 'en',
};

export interface ParsedKrispData {
    meetingTitle?: string;
    date?: string; // YYYY-MM-DD
    time?: string; // HH:MM
    participants?: string[];
    summary?: string[];
    actionItems?: string[];
    keyPoints?: string[];
    rawTranscript?: string;
    formattedTranscript?: string;
    duration?: string;
    tags?: string[];

    // Новые поля для расширенной аналитики
    participantsCount?: number;
    transcriptWords?: number;
    mostActiveSpeaker?: string;
    participantsStats?: string[]; // Статистика по участникам
    extractedEntities?: string[]; // Извлеченные сущности (проекты, компании, даты)
    relatedLinks?: string[]; // Связанные ссылки
    importDate?: string; // Дата импорта

    // Расширенные теги
    smartTags?: string[]; // Умные теги на основе содержимого
}
