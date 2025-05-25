# 📖 User Guide - Krisp Notes Importer

**Step-by-step guide for using the plugin to import Krisp meeting notes into Obsidian**

---

## 🎯 What is this plugin for?

The **Krisp Notes Importer** plugin automates the process of transferring your meeting recordings from Krisp to Obsidian. Instead of manual copying and formatting, the plugin creates beautifully formatted notes with:

- 📊 **Detailed analytics** of participants and activity
- 🎙️ **Built-in audio player** for listening to recordings
- 🏷️ **Smart tags** for automatic categorization
- 📝 **Structured content** using Obsidian callouts
- 🔗 **Automatic links** between notes

---

## 🚀 Quick Start

### 1. Plugin Installation

1. **Copy plugin files** to `.obsidian/plugins/krisp-notes-importer/` folder
   - `main.js`
   - `manifest.json`
   - `styles.css`

2. **Restart Obsidian**

3. **Enable the plugin**:
   - Open Settings → Community plugins
   - Find "Krisp Notes Importer"
   - Toggle the switch on

### 2. Initial Setup

1. **Open plugin settings**:
   - Settings → Community plugins → Krisp Notes Importer → Settings

2. **Configure basic paths**:
   ```
   Watched Folder: /Users/your_name/Downloads/Krisp
   Notes Folder: KrispNotes/Notes
   Audio Folder: KrispNotes/Attachments
   ```

3. **Choose duplicate strategy**: "Rename" (recommended)

---

## 📥 How to Import Meetings

### Manual Import

1. **Open command palette** (`Cmd/Ctrl + P`)
2. **Find command** "Krisp Importer: Import ZIP file manually"
3. **Enter full path** to Krisp ZIP archive in modal window
4. **Wait for completion** - success notification will appear

✅ **Ready**: Automatic folder watching is fully implemented in version 3.0.0

### Automatic Import ✅ (available from v3.0.0)

1. **Enable auto-watching** in plugin settings
2. **Start watching** with "Start auto-watching folder" command from command palette
3. **Check status** with "Check watching status" command for diagnostics
4. **Stop if needed** with "Stop auto-watching" command

⚠️ **Important**: Plugin automatically starts watching on load if "Auto-watching" setting is enabled

---

## 📋 What You Get

### Note Structure

Each imported meeting creates a note with the following sections:

```markdown
# 🎙️ Meeting Title

> [!info]+ 📋 Meeting Information
> Basic data: date, time, participants, duration

## 🎧 Audio Recording
![[audiofile.mp3]]

## 📝 Summary
> [!note]+ 💡 Key Points

## ✅ Tasks and Actions
> [!todo]+ 📋 Action Items

## 🔑 Key Points
> [!important]+ ⭐ Key Points

## 📋 Full Transcript
> [!quote]- 🎙️ Transcript (collapsible)

## 📊 Meeting Statistics
Table with metrics and analytics
```

### YAML Frontmatter

Each note contains structured metadata:

```yaml
---
title: Project Discussion
date: 2025-01-22
time: 14:30
type: meeting
source: krisp
tags:
  - project
  - planning
  - technical
audio: "KrispNotes/Attachments/2025/01/audio.mp3"
participants: [Denis, Yan, Alexey]
duration: 15:24
meeting_stats:
  participants_count: 3
  transcript_length: 2456
  most_active_speaker: "Denis"
---
```

---

## 🎨 Formatting Features

### Callouts for Better Organization

The plugin uses modern Obsidian callouts:

- `[!info]+` - Meeting information
- `[!note]+` - Summary
- `[!todo]+` - Task list
- `[!important]+` - Key points
- `[!quote]-` - Collapsible transcript

### Emojis for Quick Navigation

Each section has corresponding emoji for instant recognition:

- 📋 Information
- 💡 Ideas
- ⭐ Important
- 🎙️ Audio/transcript
- 📊 Statistics

---

## 📊 Advanced Analytics

### Participant Statistics

The plugin automatically analyzes each participant's activity:

- **Word count** - volume of contributions
- **Activity percentage** - share of total time
- **Number of contributions** - frequency of participation
- **Most active speaker** - activity leader

### Smart Tags

Automatic meeting categorization by content:

- `project` - project discussions
- `technical` - technical issues
- `hr` - HR matters
- `analysis` - analytical meetings
- `planning` - planning sessions

### Entity Extraction

Automatic highlighting of important information:

- **Project names** - mentioned initiatives
- **Companies** - partner organizations
- **Important dates** - deadlines and events
- **Key terms** - specialized terminology

---

## ⚙️ Settings

### Available Settings (v3.2.4) ✅

All settings are available through a convenient interface:

#### Basic Settings
1. **Watched Folder** - path to folder with Krisp ZIP archives
2. **Auto-watching** - enable/disable FileWatcher

#### Obsidian Storage
3. **Notes Folder** - path in Obsidian for creating notes
4. **Audio Folder** - path in Obsidian for saving audio files

#### Advanced Settings

#### Name Templates
- **Notes**: `{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}`
- **Audio**: `{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio`

**Available Variables**:
- `{{YYYY}}` - year (2025)
- `{{MM}}` - month (01)
- `{{DD}}` - day (22)
- `{{HHMM}}` - time (1430)
- `{{meetingTitle}}` - meeting name

#### Duplicate Strategies

**Skip** - ignore existing files

**Overwrite** - replace existing files

**Rename** - create new with suffix `_2`, `_3`, etc. ✅ *Default*

#### Post-Import Options
- **Open note** - automatically show created note
- **Delete ZIP** - remove source archive after import

#### Additional Features
- **Language for dates** - language selection (English/Russian)
- **Note content template** - full customization with editor
- **Restore button** - return to default template
- **Test import** - check settings on one file
- **Batch import** - process all ZIP files in folder
- **Reset settings** - return to default values
- **Show logs** - view plugin work log

---

## 🔧 Troubleshooting

### Import Not Working

1. **Check paths** in plugin settings
2. **Ensure** ZIP file contains Krisp files
3. **Check access permissions** to folders
4. **Restart Obsidian** if plugin is not responding
5. **Check path format** - use full absolute path

### Audio Not Playing

1. **Check path** to audio file in note
2. **Ensure** file copied to correct folder
3. **Try** opening audio file directly

### Note Created Without Data

1. **Check structure** of Krisp ZIP archive
2. **Ensure** files `meeting_notes.txt` and `transcript.txt` are present
3. **Check file encoding** (should be UTF-8)

### Tags Not Working

1. **Check** that transcript has enough text for analysis
2. **Ensure** meeting language is supported
3. **Try** re-importing the file

### Watching Diagnostics (new in v3.2.3)

If automatic watching is not working:

1. **Check status** with "Check watching status" command
2. **Ensure** "Auto-watching" setting is enabled
3. **Check path** to watched folder
4. **Start manually** with "Start auto-watching folder" command
5. **View logs** with "Show logs" button in settings

### Diagnostic Commands

- **"Debug current settings"** - check all plugin settings
- **"Check watching status"** - FileWatcherService status
- **"Start auto-watching folder"** - start watching
- **"Stop auto-watching"** - stop watching
- **"Scan existing files"** - one-time folder scan

---

## 💡 Usage Tips

### Note Organization

1. **Use project folders** in path settings
2. **Create links** between related meetings
3. **Add additional tags** manually when needed

### Working with Audio

1. **Use timestamps** in transcript for navigation
2. **Add notes** directly in transcript while listening
3. **Reference audio** from other notes via `![[audio.mp3]]`

### Workflow Integration

1. **Create daily notes** with links to meetings
2. **Use search** by participants and tags
3. **Create summary reports** from multiple meetings

### Preparing for Automatic Import (v3.0.0)

1. **Set up correct paths** now
2. **Create folder structure** in advance
3. **Test manual import** to debug settings

---

## 🆘 Support

If you have questions or problems:

1. **Check** this guide and [README.en.md](../README.en.md)
2. **Review** [CHANGELOG.md](../CHANGELOG.md) for change information
3. **Study** known limitations of current version
4. **Wait** for v2.1.0 release for extended settings
5. **Create issue** in project repository

---

*Enjoy using the plugin! 🎉*
