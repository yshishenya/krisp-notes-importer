# 🎙️ Krisp Notes Importer

<div align="center">

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white)
![Version](https://img.shields.io/badge/Version-3.2.4-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**Automatically import Krisp meeting notes into beautifully formatted Obsidian notes**

[🚀 Quick Start](#-quick-start) • [📥 Installation](#-installation) • [⚙️ Settings](#️-settings) • [📖 User Guide](docs/UserGuide.MD) • [🇷🇺 Русский](README.md)

</div>

---

## 🎯 Why do you need this plugin?

Transform your Krisp meeting recordings into professional Obsidian notes with advanced analytics and beautiful formatting.

| **Before** | **After** |
|------------|-----------|
| 📁 ZIP files scattered in Downloads | 📝 Organized notes in Obsidian |
| 🎵 Separate audio files | 🎧 Embedded audio player |
| 📄 Plain text transcripts | 🎨 Beautiful callouts and formatting |
| ❓ No meeting analytics | 📊 Detailed participant statistics |
| 🔍 Hard to find information | 🏷️ Smart tags and links |

---

## ✨ Key Features

### 🔄 Import Methods
- **✅ Manual Import** - Import individual ZIP files via command palette
- **✅ Automatic Watching** - Monitor folder for new files (v3.0.0+)
- **✅ Batch Import** - Process all files in folder at once

### 🎨 Beautiful Formatting
- **📋 Obsidian Callouts** - Professional note structure
- **🎧 Embedded Audio** - Built-in audio player support
- **📊 Analytics Tables** - Participant statistics and metrics
- **🏷️ Smart Tags** - Automatic categorization

### 🛠️ Advanced Features
- **🔍 Entity Extraction** - Automatic detection of projects, companies, dates
- **📈 Participant Analytics** - Speaking time, activity levels, word counts
- **🎯 Duplicate Handling** - Skip, overwrite, or rename strategies
- **📝 Custom Templates** - Full customization of note content and naming
- **🌍 Bilingual Support** - English and Russian interface

---

## 🚀 Quick Start

### 1. Installation

<details>
<summary>📦 Method 1: Download ZIP (Recommended)</summary>

1. **Download** the latest release: [krisp-notes-importer.zip](dist/krisp-notes-importer.zip)
2. **Extract** to your Obsidian plugins folder:
   ```
   .obsidian/plugins/krisp-notes-importer/
   ```
3. **Restart** Obsidian
4. **Enable** the plugin in Settings → Community plugins

</details>

<details>
<summary>🔧 Method 2: Manual Installation</summary>

1. **Copy files** to `.obsidian/plugins/krisp-notes-importer/`:
   - `main.js`
   - `manifest.json`
   - `styles.css`
2. **Restart** Obsidian
3. **Enable** the plugin

</details>

### 2. Basic Setup

1. **Open Settings** → Community plugins → Krisp Notes Importer
2. **Configure paths**:
   ```
   Watched Folder: /Users/yourname/Downloads/Krisp
   Notes Folder: KrispNotes/Notes
   Audio Folder: KrispNotes/Attachments
   ```
3. **Choose duplicate strategy**: "Rename" (recommended)
4. **Enable auto-watching** if desired

### 3. Import Your First Meeting

**Manual Import:**
1. Press `Cmd/Ctrl + P` → "Krisp Importer: Import ZIP file manually"
2. Enter the full path to your Krisp ZIP file
3. Wait for completion notification

**Automatic Import:**
1. Enable "Auto-watching" in settings
2. Copy Krisp ZIP files to your watched folder
3. Notes are created automatically!

---

## 📋 What You Get

### Example Output

Each imported meeting creates a comprehensive note with:

```markdown
# 🎙️ Project Discussion

> [!info]+ 📋 Meeting Information
> **📅 Date:** 2025-01-22
> **⏰ Time:** 14:30
> **⏱️ Duration:** 15:24
> **👥 Participants:** 3 people

## 🎧 Audio Recording
![[2025-01-22_Project-Discussion_audio.mp3]]

## 📝 Summary
> [!note]+ 💡 Key Points
> Main discussion topics and decisions...

## ✅ Action Items
> [!todo]+ 📋 Tasks
> - [ ] Complete project proposal by Friday
> - [ ] Schedule follow-up meeting

## 📊 Participant Statistics
| Speaker | Words | Activity % | Contributions |
|---------|-------|------------|---------------|
| Alice   | 1,234 | 45%        | 12           |
| Bob     | 987   | 35%        | 8            |
| Carol   | 543   | 20%        | 5            |
```

### YAML Frontmatter

Rich metadata for powerful queries:

```yaml
---
title: Project Discussion
date: 2025-01-22
time: 14:30
type: meeting
source: krisp
tags: [project, planning, technical]
participants: [Alice, Bob, Carol]
duration: 15:24
meeting_stats:
  participants_count: 3
  most_active_speaker: "Alice"
---
```

---

## ⚙️ Settings

<details>
<summary>🔧 Basic Settings</summary>

- **Watched Folder** - Path where Krisp saves ZIP files
- **Auto-watching** - Enable automatic folder monitoring
- **Notes Folder** - Where to save meeting notes in Obsidian
- **Attachments Folder** - Where to save audio files

</details>

<details>
<summary>📝 Templates & Naming</summary>

**File Name Templates:**
- Notes: `{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}`
- Audio: `{{YYYY}}-{{MM}}-{{DD}}_{{meetingTitle}}_audio`

**Available Variables:**
- `{{YYYY}}` - Year (2025)
- `{{MM}}` - Month (01)
- `{{DD}}` - Day (22)
- `{{HHMM}}` - Time (1430)
- `{{meetingTitle}}` - Meeting name

**Content Template:**
Full customization of note structure with variables for all meeting data.

</details>

<details>
<summary>🔄 Duplicate Handling</summary>

- **Skip** - Ignore existing files
- **Overwrite** - Replace existing files
- **Rename** - Create new with suffix `_2`, `_3`, etc. ✅ *Default*

</details>

<details>
<summary>⚡ Post-Import Actions</summary>

- **Open Note** - Automatically show created note
- **Delete ZIP** - Remove source file after import
- **Language** - Interface language (English/Russian)

</details>

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `Import ZIP file manually` | Import a single ZIP file |
| `Start auto-watching folder` | Begin automatic monitoring |
| `Stop auto-watching` | Stop automatic monitoring |
| `Scan existing files` | Process all ZIP files in folder |
| `Check watching status` | Diagnostic information |
| `Debug current settings` | Troubleshooting tool |

---

## 🔧 Troubleshooting

### Import Not Working
1. Check folder paths in settings
2. Verify ZIP file contains Krisp files
3. Check folder permissions
4. Use full absolute paths

### Audio Not Playing
1. Verify audio file path in note
2. Check if file copied to correct folder
3. Try opening audio file directly

### Auto-watching Issues
1. Run "Check watching status" command
2. Ensure "Auto-watching" is enabled
3. Verify watched folder path
4. Check plugin logs

### Getting Help
1. Check [User Guide](docs/UserGuide.MD)
2. Review [CHANGELOG.md](CHANGELOG.md)
3. Use "Show Logs" button in settings
4. Create an issue in the repository

---

## 📊 Project Status

### 🎯 Current Version: **v3.2.4** - 99% Complete

### ✅ Fully Implemented:
- ✅ Manual ZIP import with command palette
- ✅ Automatic folder watching (FileWatcherService)
- ✅ Beautiful note formatting with callouts
- ✅ Advanced participant analytics
- ✅ Complete UI settings (11 options)
- ✅ Smart duplicate handling
- ✅ Custom templates for names and content
- ✅ Logging system with UI
- ✅ Status bar integration
- ✅ Bilingual support (EN/RU)

### 🔄 In Development:
- 📋 Setup wizard for new users (v4.0.0)
- 🌐 Additional language support

---

## 🤝 Support

### 💡 Tips for Best Experience
1. **Test with manual import** before enabling auto-watching
2. **Customize templates** to match your workflow
3. **Use smart tags** for better organization
4. **Create folder structure** in advance

### 🆘 Need Help?
- 📖 Read the [User Guide](docs/UserGuide.MD)
- 🔍 Check [known issues](CHANGELOG.md)
- 🐛 Report bugs in repository issues
- 💬 Join community discussions

---

## 🛠️ For Developers

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd krisp-notes-importer

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Project Structure
```
src/
├── main.ts                    # Main plugin class
├── core/                      # Business logic
│   ├── SettingsManager.ts     # Settings management
│   ├── ProcessingService.ts   # ZIP processing
│   ├── FileWatcherService.ts  # Folder monitoring
│   ├── LocalizationService.ts # i18n support
│   └── ...
├── ui/                        # User interface
│   └── SettingsTab.ts         # Settings UI
└── interfaces.ts              # Type definitions
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Obsidian community**

[🇷🇺 Русская версия](README.md) • [📖 Documentation](docs/) • [🚀 Releases](https://github.com/your-repo/releases)

</div>
