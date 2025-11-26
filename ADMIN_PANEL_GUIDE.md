# Admin Panel Guide - File Management

## Overview
The admin panel allows you to add projects and certifications locally. When you upload images, they need to be saved to your project's `assets/images/` directory so they can be tracked by Git and pushed to GitHub.

## How to Use

### Step 1: Select Your Project Directory (Recommended)
1. Open the admin panel and log in
2. Click the **"Select Project Directory"** button at the top
3. Navigate to and select your project folder (the one containing `index.html`)
4. This allows files to be saved automatically to `assets/images/`

**Note:** This feature works best in Chrome/Edge browsers. If not available, files will be downloaded instead.

### Step 2: Adding Projects
1. Fill in the project form:
   - **Title**: Project name
   - **Category**: Select or enter a custom category
   - **Image**: Click to upload an image file
   - **Link**: Project URL (GitHub/Live demo)
2. Submit the form
3. If directory is selected: File is saved automatically to `assets/images/`
4. If not: File downloads - manually save it to `assets/images/` folder

### Step 3: Adding Certifications
1. Fill in the certification form:
   - **Title**: Certification name
   - **Issuer**: Platform/Organization name
   - **Date**: Completion date
   - **Link**: Certificate URL
   - **Image**: Upload certificate image
2. Submit the form
3. File is saved automatically (if directory selected) or downloaded

### Step 4: Ensuring Git Tracks Your Files

After uploading files through the admin panel:

1. **If files were saved automatically:**
   - Open GitHub Desktop
   - You should see the new image files in the "Changes" tab
   - If not visible, try refreshing GitHub Desktop (View → Refresh or press F5)

2. **If files were downloaded:**
   - Manually copy the downloaded files to `assets/images/` folder
   - Open GitHub Desktop
   - The files should appear in the "Changes" tab

3. **If files still don't appear:**
   - Check that files are in `assets/images/` directory
   - Ensure `.gitignore` doesn't ignore image files (it shouldn't with the current setup)
   - Try staging files manually in GitHub Desktop:
     - Right-click on the file → "Stage All"
     - Or use the "+" button next to each file

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

## Important Notes
- All data (projects, certifications) is stored in browser localStorage
- Image files are saved to `assets/images/` directory
- Make sure to commit both the localStorage data (stored in browser) and the image files
- The admin panel is for **local use only** - it won't work when deployed to GitHub Pages

