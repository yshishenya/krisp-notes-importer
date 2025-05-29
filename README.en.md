# 🎙️ Krisp Notes Importer

<div align="center">

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white)
![Version](https://img.shields.io/badge/Version-3.4.0-2563EB?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=for-the-badge)

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
> **📅 Date:** 2025-03-15
> **⏰ Time:** 14:30
> **⏱️ Duration:** 45 min
> **👥 Participants:** 3 people

## 🎧 Audio Recording
![[2025-03-15_Project-Discussion_audio.mp3]]

## 📝 Summary
> [!note]+ 💡 Key Points
> ## 1. Current Status Review
> - Analysis of project progress
> - Identification of bottlenecks
> - Assessment of timeline feasibility
>
> ## 2. Next Steps Planning
> - Resource allocation strategy
> - Risk mitigation approaches
> - Milestone definitions

## ✅ Action Items
> [!todo]+ 📋 Tasks
> - [ ] Create project timeline
> - [ ] Prepare resource allocation plan
> - [ ] Schedule follow-up meeting

## 📊 Participant Statistics
| Speaker | Words | Activity % | Contributions |
|---------|-------|------------|---------------|
| Alex    | 1,234 | 45%        | 12           |
| Maria   | 987   | 35%        | 8            |
| John    | 543   | 20%        | 5            |
```

### YAML Frontmatter

Rich metadata for powerful queries:

```yaml
---
title: Project Discussion
date: 2025-03-15
time: 14:30
type: meeting
source: krisp
tags: [project, planning, technical]
participants: [Alex, Maria, John]
duration: 45 min
meeting_stats:
  participants_count: 3
  most_active_speaker: "Alex"
---
```

---

## ⚙️ Settings

The plugin offers flexible configuration via the Obsidian settings menu: **Settings → Community Plugins → Krisp Notes Importer**.

<details>
<summary>📊 Current Status & Language</summary>

- **Current Status**: Displays the real-time status of the file watching service (Active, Inactive, Warning, etc.).
- **Interface Language**: Choose between English and Russian for the plugin's UI.

</details>

<details>
<summary>📂 Core: Watching & Automation</summary>

- **Watched Folder Path**: Full path to the folder where Krisp saves its ZIP archives.
- **Enable Auto-Watching**: Toggle to activate/deactivate automatic monitoring of the watched folder.

</details>

<details>
<summary>🗄️ Obsidian Storage</summary>

- **Notes Folder**: Path within your Obsidian vault to save the generated `.md` note files.
- **Attachments Folder**: Path within your Obsidian vault to save audio files.

</details>

<details>
<summary>🎨 Appearance & Naming</summary>

- **Note Name Template**: Define the naming pattern for note files (e.g., `{{YYYY}}-{{MM}}-{{DD}}_{{HHMM}}_{{meetingTitle}}`).
  - Variables: `{{YYYY}}`, `{{MM}}`, `{{DD}}`, `{{HHMM}}`, `{{meetingTitle}}`.
- **Audio Name Template**: Define the naming pattern for audio files.
- **Note Content Template**: A large text field to fully customize the Markdown content and structure of your notes using variables and callouts.
  - Includes a "Restore Default Template" button.

</details>

<details>
<summary>⚙️ Import Behavior</summary>

- **Duplicate Strategy**: How to handle existing notes with the same name.
  - Options: Skip, Overwrite, or Create with suffix (default).
- **Open note after import**: Automatically open the newly created note.
- **Delete ZIP after import**: Remove the original ZIP file after successful import.

</details>

<details>
<summary>🛠️ Manual Operations & Diagnostics</summary>

- **Test Manual Import**: Select and import a single ZIP file.
- **Process All Existing Files**: Scan and import all ZIPs in the watched folder.
- **Show Logs**: View plugin activity logs in a modal.
- **Reset Settings**: Revert all plugin settings to their defaults (requires confirmation).

</details>

<details>
<summary>ℹ️ About Plugin</summary>

- **Plugin Version**: Displays the current installed version.
- **Links**: GitHub repository, Bug report/Feature request.
- **Developer Info**: Author of the plugin.
- **Plugin Description**: Brief overview from the manifest.

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

## 🤖 Future: LLM Integration (v4.0.0+)

We're planning revolutionary **LLM-powered features** for intelligent meeting management:

### 🎯 Smart Meeting Linking
- **Semantic Analysis** - Automatically find related meetings by content
- **Project Grouping** - Organize meetings by projects and topics
- **Timeline Building** - Create project timelines from meeting history
- **Context Recommendations** - Suggest relevant past discussions

### 📊 Intelligent Analytics
- **Automatic Tagging** - Smart tags based on content analysis
- **Participant Insights** - Role analysis and contribution tracking
- **Decision Tracking** - Monitor implementation of meeting decisions
- **Productivity Metrics** - Meeting effectiveness analysis

### 🔒 Privacy-First Approach
- **Local Processing** - Use local LLM models (Ollama, LM Studio)
- **Data Privacy** - No data leaves your device
- **Optional Cloud** - Encrypted cloud processing available
- **GDPR Compliant** - Full user control over data

### 💡 Practical Benefits
- **Save 2+ hours/week** on meeting preparation and follow-up
- **Never lose context** - Automatic project knowledge management
- **Better decisions** - Full historical context at your fingertips
- **Team insights** - Understand team dynamics and productivity

**Detailed plan available in:** `docs/LLM_INTEGRATION_PLAN.md`

---

### Getting Help
1. Check [User Guide](docs/UserGuide.MD)
2. Review [CHANGELOG.md](CHANGELOG.md)
3. Use "Show Logs" button in settings
4. Create an issue in the repository

---

## 📊 Project Status

### 🎯 Current Version: **v3.3.12** - 99% Complete

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

**Latest Version:** [v3.3.12](https://github.com/your-username/krisp-notes-importer/releases/tag/v3.3.12) (2025-05-30)
