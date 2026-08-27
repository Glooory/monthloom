# Monthloom Backup and Recovery

## Local Persistence (IndexedDB)

Monthloom stores projects, custom templates, and uploaded assets locally in your browser's **IndexedDB** storage.

> [!WARNING]
> IndexedDB storage is strictly origin-scoped and local to your specific browser profile.
> Clearing your browser's cache, cookies, or "Site Data" will delete all locally stored Monthloom projects and templates.

## Portable Backup (`.monthloom`)

To safeguard your work or transfer projects between browsers and devices, use the **.monthloom** backup bundle.

### Creating a Backup
1. Navigate to the **Project Persistence** panel.
2. Click **Backup (.monthloom)**.
3. Your browser will download a ZIP file named `<project-name>-backup.monthloom`.

### What is Included in `.monthloom`?
- **`project.json`**: Complete project metadata, target year, holiday datasets, template definitions, and page preview configuration.
- **`assets/`**: All referenced binary assets (e.g. background images and custom image markers) as PNG/JPEG binaries.
- **`manifest.json`**: Schema version and asset hash mapping.

> [!NOTE]
> Google Fonts binary caches are automatically fetched on demand and do not need to be bundled in the backup file.

### Restoring from a Backup
1. In the **Project Persistence** panel, click **Choose File** under **Import .monthloom**.
2. Select your `.monthloom` file.
3. Monthloom will import the project and all embedded assets into IndexedDB with deduplicated asset IDs.
4. Select the project from the **Saved Projects** dropdown and click **Load Project**.
