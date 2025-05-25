# 📤 Publishing Guide for Obsidian Community Plugins

**Step-by-step guide for submitting your plugin to the official Obsidian catalog**

[🇷🇺 Русская версия](PUBLISHING_GUIDE.md)

---

## 🎯 Process Overview

Publishing a plugin to Obsidian Community Plugins involves several stages:

1. **Plugin Preparation** - final testing and verification
2. **Release Creation** - GitHub release with proper files
3. **Application Submission** - PR to obsidian-releases repository
4. **Review and Approval** - verification by Obsidian team

---

## ✅ Plugin Requirements

### Required Files
- `main.js` - compiled plugin code
- `manifest.json` - plugin metadata
- `styles.css` - styles (optional)

### manifest.json Requirements
```json
{
    "id": "krisp-notes-importer",
    "name": "Krisp Notes Importer",
    "version": "3.2.4",
    "minAppVersion": "0.15.0",
    "description": "Automatically import Krisp meeting notes into beautifully formatted Obsidian notes",
    "author": "Your Name",
    "authorUrl": "https://github.com/your-profile",
    "fundingUrl": "https://buymeacoffee.com/your-profile",
    "isDesktopOnly": false
}
```

### Code Requirements
- ✅ Use only official Obsidian API
- ✅ No dependencies on external services
- ✅ Proper error handling
- ✅ Mobile device compatibility (if applicable)

---

## 🚀 Preparation for Publishing

### 1. Final Testing

```bash
# Build production version
npm run build

# Check file sizes
ls -la main.js manifest.json styles.css

# Test in clean Obsidian vault
```

### 2. Documentation Check

- ✅ README.md is current and informative
- ✅ CHANGELOG.md contains all changes
- ✅ License is specified correctly
- ✅ Installation instructions work

### 3. Versioning

Ensure versions are synchronized:
- `package.json` → `"version": "3.2.4"`
- `manifest.json` → `"version": "3.2.4"`
- Git tag → `3.2.4`

---

## 📦 Creating GitHub Release

### Automatic Release (Recommended)

We already have GitHub Action configured in `.github/workflows/release.yml`:

```bash
# Create tag and push
git tag 3.2.4
git push origin 3.2.4

# GitHub Action automatically:
# 1. Builds the plugin
# 2. Creates release
# 3. Attaches files main.js, manifest.json, styles.css
```

### Manual Release

If you need to create release manually:

1. **Go to GitHub** → Releases → "Create a new release"
2. **Create tag** `3.2.4`
3. **Fill release description**
4. **Attach files**:
   - `main.js`
   - `manifest.json`
   - `styles.css`
5. **Publish** release

---

## 📝 Submitting to Community Plugins

### 1. Fork Repository

```bash
# Fork the repository
https://github.com/obsidianmd/obsidian-releases

# Clone your fork
git clone https://github.com/your-username/obsidian-releases.git
cd obsidian-releases
```

### 2. Add Plugin

```bash
# Create file with plugin information
echo '{
    "id": "krisp-notes-importer",
    "name": "Krisp Notes Importer",
    "author": "Your Name",
    "description": "Automatically import Krisp meeting notes into beautifully formatted Obsidian notes",
    "repo": "your-username/krisp-notes-importer"
}' > community-plugins.json.new

# Add entry to community-plugins.json
# (insert content in alphabetical order by id)
```

### 3. Create Pull Request

```bash
# Create branch
git checkout -b add-krisp-notes-importer

# Add changes
git add community-plugins.json
git commit -m "Add Krisp Notes Importer plugin"

# Push to your fork
git push origin add-krisp-notes-importer
```

### 4. Fill PR

**PR Title:**
```
Add plugin: Krisp Notes Importer
```

**PR Description:**
```markdown
## Plugin Information
- **Name:** Krisp Notes Importer
- **ID:** krisp-notes-importer
- **Repository:** https://github.com/your-username/krisp-notes-importer
- **Latest Release:** v3.2.4

## Description
Automatically import Krisp meeting notes into beautifully formatted Obsidian notes with advanced analytics and smart tags.

## Features
- ✅ Automatic folder watching for ZIP archives
- ✅ Beautiful note formatting with callouts
- ✅ Advanced participant analytics
- ✅ Complete UI settings with 11 options
- ✅ Logging and diagnostic system
- ✅ Bilingual support (English/Russian)

## Checklist
- [x] Plugin follows Obsidian API guidelines
- [x] No external dependencies
- [x] Proper error handling
- [x] Mobile compatibility (desktop-focused but compatible)
- [x] Comprehensive documentation
- [x] MIT License
- [x] Latest release includes required files
```

---

## 🔍 Review Process

### What Obsidian Team Checks

1. **Code Security**
   - No malicious code
   - Use only allowed APIs
   - Proper user data handling

2. **Plugin Quality**
   - Stable operation
   - No critical bugs
   - Matches declared functionality

3. **Documentation**
   - Clear description
   - Usage instructions
   - Correct manifest.json information

### Common Rejection Reasons

❌ **Code Issues:**
- Using unofficial APIs
- Missing error handling
- Performance problems

❌ **Documentation Issues:**
- Incomplete or inaccurate description
- Missing usage instructions
- Incorrect manifest.json information

❌ **Release Issues:**
- Missing required files
- Version mismatches
- Broken functionality

---

## ⏱️ Timeline

### Typical Process
- **PR Submission:** 1 day
- **Initial Review:** 1-2 weeks
- **Fixes (if needed):** 1-3 days
- **Final Approval:** 1-7 days
- **Publication:** automatic after approval

### Our Status
**Krisp Notes Importer** plugin is ready for publication:
- ✅ All requirements met
- ✅ Code tested and stable
- ✅ Documentation complete and current
- ✅ Release created correctly

---

## 🎯 After Publication

### User Support
1. **Monitor issues** in GitHub repository
2. **Answer questions** in Obsidian community
3. **Regular updates** with fixes and new features

### Plugin Updates
```bash
# To update published plugin:
# 1. Update version in manifest.json and package.json
# 2. Create new release in GitHub
# 3. Plugin will update automatically for users
```

### Success Metrics
- 📊 Download count
- ⭐ User ratings and reviews
- 🐛 Number and quality of bug reports
- 💡 Feature requests

---

## 🆘 Help and Support

### Useful Resources
- [Obsidian Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Community Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Discord](https://discord.gg/obsidianmd) - #plugin-dev channel

### Contacts
- **GitHub Issues:** for technical questions
- **Obsidian Forum:** for community discussions
- **Discord:** for quick help from developers

---

**Good luck with publishing! 🚀**
