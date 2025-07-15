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

**📅 {{date}}** • **⏰ {{time}}** • **⏱️ {{duration}}** • **👥 {{participantsCount}} участников**

---

## 🔥 Задачи и действия

> [!todo]+ 📋 Action Items — Требуют выполнения
>
> {{actionItemsList}}

---

## 📝 Краткое содержание встречи

> [!note]+ 💡 Основные темы и результаты
>
> {{summary}}

---

## 🔑 Ключевые моменты

> [!important]+ ⭐ Key Points — Важные решения и выводы
>
> {{keyPointsList}}

---

## 👥 Участники и активность

> [!info]+ 👤 Состав встречи ({{participantsCount}} человек)
>
> {{participantsList}}
>
> ### 📊 Статистика активности
> {{participantsStats}}
>
> **🗣️ Самый активный спикер:** {{mostActiveSpeaker}}

---

## 🎧 Аудиозапись

{{audioEmbed}}

*📂 Файл аудиозаписи: [[{{audioPathForYaml}}]]*

---

## 🏷️ Дополнительная информация

> [!abstract]+ 🔍 Извлеченные данные и связи
>
> {{extractedEntities}}
>
> ### 🔗 Связанные материалы
> {{relatedLinks}}

---

## 📋 Полная транскрипция

> [!quote]- 🎙️ Транскрипт встречи ({{transcriptWords}} слов) — Развернуть для чтения
>
> {{formattedTranscript}}

---

> [!tip]+ 🤖 Метаданные импорта
>
> **Источник:** Krisp Meeting Archive
> **Импортировано:** {{importDate}}
> **Плагин:** Krisp Notes Importer
`,
    duplicateStrategy: 'rename',
    deleteZipAfterImport: false,
    openNoteAfterImport: true,
    autoScanEnabled: false,
    language: 'en',
};

// Улучшенный шаблон заметки (по умолчанию)
export const IMPROVED_NOTE_TEMPLATE = `---
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

**📅 {{date}}** • **⏰ {{time}}** • **⏱️ {{duration}}** • **👥 {{participantsCount}} участников**

---

## 🔥 Задачи и действия

> [!todo]+ 📋 Action Items — Требуют выполнения
>
> {{actionItemsList}}

---

## 📝 Краткое содержание встречи

> [!note]+ 💡 Основные темы и результаты
>
> {{summary}}

---

## 🔑 Ключевые моменты

> [!important]+ ⭐ Key Points — Важные решения и выводы
>
> {{keyPointsList}}

---

## 👥 Участники и активность

> [!info]+ 👤 Состав встречи ({{participantsCount}} человек)
>
> {{participantsList}}
>
> ### 📊 Статистика активности
> {{participantsStats}}
>
> **🗣️ Самый активный спикер:** {{mostActiveSpeaker}}

---

## 🎧 Аудиозапись

{{audioEmbed}}

*📂 Файл аудиозаписи: [[{{audioPathForYaml}}]]*

---

## 🏷️ Дополнительная информация

> [!abstract]+ 🔍 Извлеченные данные и связи
>
> {{extractedEntities}}
>
> ### 🔗 Связанные материалы
> {{relatedLinks}}

---

## 📋 Полная транскрипция

> [!quote]- 🎙️ Транскрипт встречи ({{transcriptWords}} слов) — Развернуть для чтения
>
> {{formattedTranscript}}

---

> [!tip]+ 🤖 Метаданные импорта
>
> **Источник:** Krisp Meeting Archive
> **Импортировано:** {{importDate}}
> **Плагин:** Krisp Notes Importer
`;

// Компактный шаблон заметки для минималистов
export const COMPACT_NOTE_TEMPLATE = `---
title: {{meetingTitle}}
date: {{date}}
time: {{time}}
type: meeting
source: krisp
audio: "{{audioPathForYaml}}"
participants: [{{participants}}]
tags:
{{yamlTags}}
  - meeting
  - krisp
---

# {{meetingTitle}}

*{{date}} • {{time}} • {{duration}} • {{participantsCount}} участников*

## ✅ Action Items

{{actionItemsList}}

## 📝 Summary

{{summary}}

## 🔑 Key Points

{{keyPointsList}}

## 👥 Участники

{{participantsList}}

## 🎧 Аудио

{{audioEmbed}}

## 📋 Транскрипт

> [!quote]- Полный транскрипт ({{transcriptWords}} слов)
> {{formattedTranscript}}

*Импортировано {{importDate}} | Krisp Notes Importer*
`;

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
