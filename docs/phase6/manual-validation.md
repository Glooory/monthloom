# Monthloom Phase 6 Manual Validation

## Environment

- Browser:
- OS:
- Git commit:
- Local URL: http://localhost:5173/

## Holiday JSON Import & Workspace

- Target Year configurable (default: 2027): PASS/FAIL
- Import China Holiday JSON (Timor format): PASS/FAIL
- Import Japan Holiday JSON (Holidays JP format): PASS/FAIL
- Unified HolidayIndex populates Main and Mini months: PASS/FAIL
- Coverage diagnostic banner shows missing datasets / coverage gaps: PASS/FAIL
- Clear China / Japan dataset buttons function: PASS/FAIL

## Persistence (Projects & Templates)

- Save Project to IndexedDB: PASS/FAIL
- Open saved Project: restores targetYear, holiday datasets, and full document: PASS/FAIL
- Full browser refresh and reload project: PASS/FAIL
- Project load clears Undo history: PASS/FAIL
- Delete Project removes project record from IndexedDB: PASS/FAIL
- Save Template: stores document layout without targetYear or holiday datasets: PASS/FAIL
- Apply Template: applies layout across years in a single undoable step: PASS/FAIL
- Delete Template removes template record: PASS/FAIL

## Asset Persistence

- Uploaded image marker survives project save, reload, and refresh: PASS/FAIL
- Uploaded page background survives project save, reload, and refresh: PASS/FAIL
- Local fonts stored in IndexedDB: PASS/FAIL

## .monthloom Backup & Portability

- Export Project as `.monthloom` bundle: PASS/FAIL
- Bundle contains `manifest.json`, `payload.json`, and referenced `assets/*.bin`: PASS/FAIL
- Bundle excludes unreferenced assets and font cache: PASS/FAIL
- Clear IndexedDB and import `.monthloom` bundle: full recovery: PASS/FAIL
- Import same bundle twice: generates fresh IDs safely without overwriting: PASS/FAIL
- Corrupted bundle is rejected atomically without partial writes: PASS/FAIL

## Formal Batch SVG Export (Exact 28 SVGs)

- Button copy displays: `Export 28 SVGs`: PASS/FAIL
- Outlined mode is default: PASS/FAIL
- Editable mode is selectable: PASS/FAIL
- ZIP filename: `Monthloom-2027.zip`: PASS/FAIL
- Main folder contains exactly 13 SVGs (`2027-1.svg` ... `2027-12.svg`, `2028-1.svg`): PASS/FAIL
- Mini folder contains exactly 15 SVGs (`2026-12.svg`, `2027-1.svg` ... `2027-12.svg`, `2028-1.svg`, `2028-2.svg`): PASS/FAIL
- Total SVG files in ZIP: exactly 28: PASS/FAIL
- `mini/2028-2.svg` is present in export ZIP: PASS/FAIL
- Months are not zero-padded (`2027-1.svg` vs `2027-01.svg`): PASS/FAIL
- Formal SVGs do not contain Preview background: PASS/FAIL
- Single font engine resolved for entire batch export: PASS/FAIL
- Outlined SVGs render offline with vector glyphs: PASS/FAIL

## Decision

- [ ] ACCEPT Phase 6
- [ ] REJECT Phase 6
