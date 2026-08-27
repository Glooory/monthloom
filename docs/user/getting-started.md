# Getting Started with Monthloom

Monthloom is a client-side web application for creating and batch-exporting production-quality calendar SVG files.

## Complete Workflow

1. **Set the Target Calendar Year**
   - Use the **Workspace Controls** at the top left to set your target calendar year (e.g. `2027`).

2. **Import Holiday Datasets**
   - Import **China Holiday JSON** (Timor / NianJia format, e.g. `2026.json` or `2027.json`).
   - Import **Japan Holiday JSON** (Holidays JP format, e.g. `ja.json`).
   - Review the **Holiday Coverage Diagnostics** banner to ensure complete coverage for the entire year span ($Y-1$ December through $Y+1$ February).

3. **Customize Templates in the Template Editor**
   - Switch between **Main Template** (full-size monthly page) and **Mini Template** (compact monthly thumbnail).
   - Click any visual element (Date grid, Month name, Year number, Weekday header, Border, Image marker) to edit its properties in the Inspector:
     - **Position & Anchor**: Change coordinate anchor alignments and pixel offsets.
     - **Typography**: Set font family, weight, style, and font size.
     - **Colors**: Configure text, weekend, and holiday colors.
     - **Borders & Markers**: Adjust stroke width, padding, and image markers.

4. **Configure Page Preview & Background**
   - Under **Page Preview Settings**, adjust page margins, padding, and layout dimensions.
   - Upload an optional background reference image and adjust its opacity.

5. **Review the 13-Page Full-Year Stream**
   - Scroll through the 13 generated calendar pages ($Y$ January through $Y+1$ January).
   - Each page displays one Main calendar month and two Mini calendar months.

6. **Save Project & Backup**
   - Click **Save Project** under Project Persistence to save your current work to browser IndexedDB.
   - Click **Backup (.monthloom)** to download a complete, self-contained bundle containing your project configuration, holiday datasets, and embedded image assets.

7. **Export Formal SVGs**
   - Under **Formal Batch Export**, select **Outlined (Production Default)** or **Editable**.
   - Click **Export 28 SVGs (ZIP)** to download `Monthloom-<Year>.zip`.

## Output Scope

Monthloom exports exactly **28 standalone SVG files**:
- **13 Main Month SVGs**: `main/<Year>-1.svg` through `main/<Year>-12.svg`, plus `main/<Year+1>-1.svg`.
- **15 Mini Month SVGs**: `mini/<Year-1>-12.svg`, `mini/<Year>-1.svg` through `mini/<Year>-12.svg`, `mini/<Year+1>-1.svg`, and `mini/<Year+1>-2.svg`.
