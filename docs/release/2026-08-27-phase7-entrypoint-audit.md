# Monthloom Phase 7 — Production Entry Point and Verification Audit

Date: 2026-08-27
Status: Complete

## 1. Actual Browser Entry Point

- Current entry point: `src/main.tsx`
- Previous target: `Phase6Verification` from `src/verification/phase6/Phase6Verification.tsx`
- Target production entry: `src/app/App.tsx` wrapped in `src/app/AppErrorBoundary.tsx`

## 2. Verification Harness Inventory

- `src/verification/phase3/` (Font/SVG rendering harness) — Retained for developer regression.
- `src/verification/phase4/` (Editor interaction harness) — Retained for developer regression.
- `src/verification/phase5/` (Full-year preview harness) — Retained for developer regression.
- `src/verification/phase6/` (Persistence & export harness) — Retained for developer regression.
- `src/spike/` (Initial rendering spike) — Retained as historical reference/tests.

None of the verification harnesses are used by production modules.

## 3. Production Import Check

Production scan across `src/` (excluding `src/verification/` and `src/spike/`):
- Only `src/main.tsx` imported `Phase6Verification`.
- Zero downward leaks from domain or rendering to persistence/editor.
- Zero imports of `src/spike/` or `verification/` within production subsystems.

## 4. Production Integration Composition

The unified `App` will compose:
- **Header / Project Identity**: Shows current project state and year.
- **Workspace Controls**: Target year selection, China/Japan holiday JSON upload, and real-time coverage diagnostics.
- **Persistence Controls**: Save/Load projects, Save/Apply template presets, Portable `.monthloom` zip backup/restore.
- **Batch Export Panel**: Formal 28-SVG export (13 Main + 15 Mini), Outlined (default) vs Editable modes.
- **Template Editor**: Interactive canvas with Main & Mini month preview selector, anchor overlays, and inspector panels.
- **Page Preview Settings**: Background image upload, positioning, page padding/margins, opacity controls.
- **13-Page Full-Year Preview**: Real-time multi-page stream with Main + 2 Minis per page.
