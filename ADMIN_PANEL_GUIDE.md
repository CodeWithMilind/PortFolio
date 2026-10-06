# Local Content Editor Guide

## Important limits

The Admin Panel is a browser-side content editing utility, not a secure CMS. Its passcode and authentication state are handled in public client-side code and browser storage. Do not rely on it to protect content or VPS files.

The panel can write only to a local project folder that you explicitly select in a compatible browser. It cannot write to the VPS. Changes are not published until the updated JSON and image files are uploaded separately.

## Requirements

- Use Chrome or Edge on `localhost` or an HTTPS site. The File System Access API is required.
- Select the local project folder containing `index.html` when prompted.
- If folder access is unavailable or denied, data edits may appear in the current page preview using `localStorage`; that data is not loaded after a page reload and is not shared with visitors. Adding a project image requires the File System Access API and folder access.

## Adding content

Projects require a title, category, image, and URL. Project images are written to `assets/projects/`; records are written to `assets/data/projects.json`.

Certifications require a title, issuer, date, and URL. An image is optional. Certificate images are written to `assets/certificates/`; records are written to `assets/data/certificates.json`.

The page reports whether the JSON file was saved to the selected local folder. A successful local save is not a deployment. Review the changed files and upload them to the VPS using your normal deployment process.

## Publishing changes

1. Confirm the JSON and image files were written under the selected local project folder.
2. Check that the image paths in the JSON match the saved files.
3. Preview the site over HTTP(S) and verify the updated content.
4. Upload the changed static files to the VPS. The browser panel does not perform this step.

