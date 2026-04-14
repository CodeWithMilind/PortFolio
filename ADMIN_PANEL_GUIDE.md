# Admin Panel Guide - File Management

## Overview
The admin panel allows you to add projects and certifications that will be visible to **all users** of your portfolio. When you upload content:
- **Images** are saved to `assets/projects/` or `assets/certificates/` directories
- **Data** (project/certificate information) is saved to JSON files in `assets/data/` directory
- All files are automatically saved and ready to be committed to Git

**Important**: Only you (the admin) can access the admin panel. All uploaded content is visible to everyone who visits your portfolio.

## How to Use

### Step 1: Access Admin Panel
1. Click the **"Admin Panel"** button in the sidebar (or navigate to Admin page)
2. Enter your admin password to log in
3. The system will automatically request directory access when you upload your first file
4. Grant access to your project folder (the one containing `index.html`)

**Note:** This feature works best in Chrome/Edge browsers. The File System Access API is required to save files automatically.

### Step 2: Adding Projects
1. Fill in the project form:
   - **Title**: Project name
   - **Category**: Select or enter a custom category
   - **Image**: Click to upload an image file
   - **Link**: Project URL (GitHub/Live demo)
2. Submit the form
3. The image is automatically saved to `assets/projects/` directory
4. The project data is saved to `assets/data/projects.json`
5. **All users will immediately see the new project** when they visit your portfolio

### Step 3: Adding Certifications
1. Fill in the certification form:
   - **Title**: Certification name
   - **Issuer**: Platform/Organization name
   - **Date**: Completion date
   - **Link**: Certificate URL
   - **Image**: Upload certificate image
2. Submit the form
3. The image is automatically saved to `assets/certificates/` directory
4. The certificate data is saved to `assets/data/certificates.json`
5. **All users will immediately see the new certification** when they visit your portfolio

### Step 4: Committing Changes to GitHub

After uploading content through the admin panel:

1. **Files are automatically saved:**
   - Image files → `assets/projects/` or `assets/certificates/`
   - Data files → `assets/data/projects.json` and `assets/data/certificates.json`

2. **Commit to Git:**
   - Open GitHub Desktop (or use Git command line)
   - You should see the new files in the "Changes" tab:
     - New image files in `assets/projects/` or `assets/certificates/`
     - Updated JSON files in `assets/data/`
   - If not visible, refresh GitHub Desktop (View → Refresh or F5)

3. **Stage and commit:**
   - Stage all changes (or select specific files)
   - Write a commit message (e.g., "Add new project: Data Science Dashboard")
   - Push to GitHub

4. **After pushing to GitHub:**
   - All users visiting your portfolio will see the new content
   - The JSON files ensure data is shared across all visitors

## Troubleshooting

### GitHub Desktop Not Showing Files
1. **Refresh GitHub Desktop**: View → Refresh (or F5)
2. **Check file location**: Ensure files are in `assets/images/` relative to your project root
3. **Check .gitignore**: Open `.gitignore` and ensure it doesn't contain patterns like `*.jpg`, `*.png`, `assets/images/`, etc.
4. **Manual staging**: Try staging files manually in GitHub Desktop

### Files Not Saving Automatically
- Make sure you've selected the project directory using the "Select Project Directory" button
- This feature requires Chrome/Edge browser
- If using Firefox/Safari, files will download instead - save them manually to `assets/images/`

### Browser Compatibility
- **Chrome/Edge**: Full support for automatic file saving
- **Firefox/Safari**: Files will download - save manually to `assets/images/`

## File Naming Convention
- **Projects**: `project-{title}.{extension}` (e.g., `project-data-science-project.jpg`)
- **Certifications**: `cert-{title}.{extension}` (e.g., `cert-google-data-analytics.png`)

## Data Storage

### How It Works
- **For All Users**: Data is loaded from JSON files (`assets/data/projects.json` and `assets/data/certificates.json`)
- **For Admin**: When you add/edit content, it's saved to:
  1. JSON files (visible to all users)
  2. localStorage (for immediate preview)

### File Structure
```
assets/
├── data/
│   ├── projects.json      # All project data (visible to everyone)
│   └── certificates.json  # All certificate data (visible to everyone)
├── projects/              # Project images
└── certificates/          # Certificate images
```

## Important Notes
- ✅ **Admin-only access**: Only you can log in to the admin panel
- ✅ **Public content**: All uploaded content is visible to all users
- ✅ **Git-friendly**: All data is stored in JSON files that can be committed to Git
- ✅ **Works on GitHub Pages**: The system works both locally and when deployed
- ⚠️ **Browser requirement**: File System Access API (Chrome/Edge) needed to save files automatically
- ⚠️ **Always commit**: After adding content, commit the JSON files and images to Git so they're available to all users

