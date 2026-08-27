# Monthloom — Agent Guidelines

Monthloom is a client-side vector calendar studio that designs and exports 28 production SVG calendar files (13 Main + 15 Mini) for vertical wall calendars.

## Essential Commands

- `npm test` — Run all tests with Vitest (68 test files, 217 tests).
- `npm run build` — Typecheck (`tsc -b`) and bundle production assets with Vite.
- `npm run dev` — Start the local Vite development server.

## Architecture & Code Boundaries

The codebase is organized into strict layers with unidirectional dependencies:

```
src/
├── domain/        # Pure business logic (dates, calendar grids, templates, page geometry). No React or DOM deps.
├── rendering/     # Stateless layout engine (RenderScene) & SVG materialization (SvgDocument, AST, serializer).
├── resources/     # Fonts (Google Fonts, Fontkit engine, text metrics, persistent cache) & asset resolvers.
├── editor/        # React template editor (canvas overlay, drag interaction, inspector, undo/redo state).
├── preview/       # Full-year 13-page vertical calendar preview rendering.
├── export/        # Batch export engine (render 28 SVGs, packaging into Monthloom-<Year>.zip).
├── persistence/   # IndexedDB (Dexie), Zod schema snapshots, .monthloom bundle export/import.
├── workspace/     # Runtime workspace state (target year, holiday datasets, diagnostics).
└── app/           # AppShell, root composition, error boundary.
```

## Core Invariants (Do Not Violate)

1. **Formal Month Scope (13 Main + 15 Mini = 28 SVGs)**:
   - For target year `Y`:
     - **13 Main Months**: `Y-1` through `Y-12` plus `Y+1-1` (January of next year).
     - **15 Mini Months**: `Y-1-12` (December of prior year), `Y-1` through `Y-12`, `Y+1-1`, and `Y+1-2` (February of next year).
   - `getMainMonths(Y)` and `getMiniMonths(Y)` in `src/domain/calendar/monthSequence.ts` are the single source of truth.
   - Formal SVG export must always package exactly 28 SVGs (`main/*.svg` and `mini/*.svg`).

2. **Date Primitives & Timezones**:
   - Always use `LocalDate` (`{ year, month, day }`) and UTC arithmetic (`Date.UTC`, `getUTCFullYear`, etc.).
   - Never use browser-local `new Date(year, month, day)` to avoid timezone offsets and DST distortion.

3. **Layout & Single Source of Truth**:
   - `layoutMain` and `layoutMini` compute all geometry (`RenderScene`), including cell rects, anchor offsets, and text baselines.
   - Materializers (`materializeSvg`) and serializers (`serializeSvg`) must never re-calculate layout or geometry independently.
   - `SvgPreview` and `BatchExport` consume the identical `SvgDocument` structure.

4. **Editor State Separation**:
   - **Persistent State** (`documentStore`): `EditorDocument` (MainTemplate, MiniTemplate, FontCatalog, PagePreviewConfig) tracked by Zundo temporal history for undo/redo.
   - **Transient State** (`uiStore`): Selection, hover, drag delta, and resize sessions.
   - Dragging modifies template-level `Position` (`anchor`, `offsetX`, `offsetY`) once on drag completion (`applyDragCommit`). Never write absolute client coordinates to template state.

5. **Persistence & Bundle Import Atomicity**:
   - All persistence schemas must validate via Zod (`projectSnapshot.ts`, `templateSnapshot.ts`, `manifest.ts`).
   - Bundle import/export operations that write multiple entities (assets + project/template) must run inside a single Dexie transaction (`db.transaction('rw', ...)`).

## Workflow & Coding Standards

- **TDD First**: Write or update tests before fixing bugs or adding new features.
- **Minimal Diffs**: Make targeted, minimal edits. Avoid broad refactoring or reformatting unrelated code.
- **No Mock Fallbacks in Production**: If font resolution, asset resolution, or snapshot validation fails, throw clear descriptive errors rather than silently rendering broken fallbacks.
