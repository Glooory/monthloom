# Getting Started with Monthloom

Monthloom is a client-side web application for creating and batch-exporting production-quality calendar SVG files.

## Complete Workflow

1. **Set the Target Calendar Year**
   - Use the **Workspace Controls** at the top left to set your target calendar year (e.g. `2027`).

2. **Manage Holiday Library**
   - Click **节假日资料库** in the workspace header to view and manage calendars.
   - Sync or import holiday data (China Timor format, Japan Holidays JP format, or native Monthloom JSON).
   - Add or edit manual date overrides directly within any calendar.
   - Review holiday coverage status across the required 15-month span ($Y-1$ December through $Y+1$ February).

3. **Customize Templates & Holiday Layers**
   - Switch between **Main Template** (full-size monthly page) and **Mini Template** (compact monthly thumbnail).
   - In the **节假日图层 (Holiday Layers)** panel:
     - Add, remove, reorder, or toggle holiday layers bound to specific calendars.
     - Customize holiday name typography, holiday markers, workday markers, and date color highlights for each layer.
   - Click any canvas element (Date grid, Weekday header, Month name, etc.) to inspect and edit typography, borders, and positions.

4. **Configure Page Preview & Background**
   - Under **Page Preview Settings**, adjust page margins, padding, and layout dimensions.
   - Upload an optional background reference image and adjust its opacity.

5. **Review the 13-Page Full-Year Stream**
   - Scroll through the 13 generated calendar pages ($Y$ January through $Y+1$ January).
   - Each page displays one Main calendar month and two Mini calendar months.

6. **Save Project & Backup**
   - Click **Save Project** under Project Persistence to save your current work to browser IndexedDB.
   - Click **Backup (.monthloom)** to download a complete bundle containing your project, templates, full holiday library snapshot, and image assets.

7. **Export Formal SVGs**
   - Under **Formal Batch Export**, select **Outlined (Production Default)** or **Editable**.
   - Click **Export 28 SVGs (ZIP)** to download `Monthloom-<Year>.zip`.

## Output Scope

Monthloom exports exactly **28 standalone SVG files**:
- **13 Main Month SVGs**: `main/<Year>-1.svg` through `main/<Year>-12.svg`, plus `main/<Year+1>-1.svg`.
- **15 Mini Month SVGs**: `mini/<Year-1>-12.svg`, `mini/<Year>-1.svg` through `mini/<Year>-12.svg`, `mini/<Year+1>-1.svg`, and `mini/<Year+1>-2.svg`.
