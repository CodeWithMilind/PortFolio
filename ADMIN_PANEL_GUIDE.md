# Portfolio Admin Guide

## How the admin panel works

The Admin Panel at the bottom of the sidebar authenticates with the Express backend. Login uses `POST /api/auth/login`, and the server keeps the authenticated session in an HTTP-only, same-site cookie. The browser does not save the password or an authentication flag. Admin writes also include a session-bound CSRF token.

Run the backend with a valid `.env` and the SQLite database migrated. Create or update an administrator with `npm run create-admin` from the `server` directory. Serve the portfolio and backend on the same origin, with `/api` and `/uploads` routed to Express (as in the existing deployment architecture). The admin panel requires that same-origin routing; it does not use the browser File System Access API.

## Editing content

The panel reads and writes profile, education, experience, categories, projects, certifications, awards, skills, and existing site settings through the authenticated `/api/admin` endpoints. Each section reports save status. Deletes require confirmation. A category referenced by projects cannot be deleted until those projects are reassigned or removed.

Choose an image or PDF and click that section's Save button to upload it. Image uploads accept JPEG, PNG, or WEBP up to 5 MB. CV uploads accept PDF up to 10 MB. The panel shows the currently stored file and previews a selected image before upload.

## Public data and publishing

The database is the admin source of truth. The public sidebar profile (including the CV link and profile image), Resume Education and Experience sections, and Technical Skills section use values returned by the same-origin SQLite API; missing profile fields stay hidden. Projects, Categories, and Certifications also prefer the API, with projects and certifications falling back to `assets/data/projects.json` and `assets/data/certificates.json` if the API is unavailable or has no records. The JSON files remain in place and admin changes do not rewrite them. Other public sections have not been migrated.

Existing images and JSON remain in place. New uploads are stored under the configured `UPLOAD_DIR`, with only relative paths stored in SQLite. Review database backups and upload files as part of the normal server backup process.
