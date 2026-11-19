# Getting Started with Monthloom

Monthloom is a client-side web application for creating and batch-exporting production-quality calendar SVG files.

## Complete Workflow

1. **Set the Target Calendar Year**
   - Use the **Workspace Controls** at the top left to set your target calendar year (e.g. `2027`).

2. **Manage Holiday Library**
   - Click **节假日资料库** in the workspace header to view and manage calendars.
   - Sync or import holiday data (China Timor format, Japan Holidays JP format, or native Monthloom JSON).
   - Add or edit manual date overrides directly within any calendar.
   - Review holiday coverage for the months used by your project.

3. **Customize Templates & Holiday Layers**
   - Edit the full-size calendar in **Main Calendar**. To add adjacent months to each page, open **Mini Calendar** and turn on **Enable mini calendars**. The switch is off by default.
   - In the **节假日图层 (Holiday Layers)** panel:
     - Add, remove, reorder, or toggle holiday layers bound to specific calendars.
     - Customize holiday name typography, holiday markers, workday markers, and date color highlights for each layer.
   - Click any canvas element (Date grid, Weekday header, Month name, etc.) to inspect and edit typography, borders, and positions.

4. **Configure Page Preview & Background**
   - Under **Page Preview Settings**, adjust page margins, padding, and layout dimensions.
   - Upload an optional background reference image and adjust its opacity.

5. **Review the 13-Page Full-Year Stream**
   - Scroll through the 13 generated calendar pages ($Y$ January through $Y+1$ January).
   - Each page displays a Main calendar. Enable Mini calendars to also show the previous and next months.

6. **Save Project & Backup**
   - Click **Save Project** under Project Persistence to save your current work to browser IndexedDB.
   - Click **Backup (.monthloom)** to download a complete bundle containing your project, templates, full holiday library snapshot, and image assets.

7. **Export Calendars**
   - Choose the outputs you want. For SVGs, choose **Outlined** or **Editable Text**.
   - Click **Export ZIP** to download `Monthloom_<Year>.zip`.

## Output Scope

The ZIP includes the output sets you select.

- **13 Full-Page SVGs**: `full-svg/<Year>_1_full.svg` through `full-svg/<Year>_12_full.svg`, plus `full-svg/<Year+1>_1_full.svg`. Each page uses the preview's layout dimensions, positions for the Main calendar and any enabled Mini calendars, and a transparent page background. The preview background image is excluded from SVG exports. SVG text can be outlined or editable.
- **13 Main Month SVGs**: `main/<Year>_1.svg` through `main/<Year>_12.svg`, plus `main/<Year+1>_1.svg`.
- **13 Full-Page PNGs**: `full/` contains the composed pages with their backgrounds.
- **15 Mini Month SVGs** (available when Mini calendars are enabled): `mini/<Year-1>_12_mini.svg`, `mini/<Year>_1_mini.svg` through `mini/<Year>_12_mini.svg`, `mini/<Year+1>_1_mini.svg`, and `mini/<Year+1>_2_mini.svg`.

SVG badge assets are embedded as vector shapes in the exported files. Raster badges remain embedded images.
