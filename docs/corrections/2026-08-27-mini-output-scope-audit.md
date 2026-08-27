# Formal Mini Output Scope Audit & Resolution Report

**Date:** 2026-08-27
**Target:** Formal Mini Scope Correction (from 14 Mini / 27 Total SVGs to 15 Mini / 28 Total SVGs)

---

## 1. Calendar Domain

### `src/domain/calendar/monthSequence.ts`
- **Previous state:** `getMiniMonths(targetYear)` returned 14 months (`Y-1 Dec` to `Y+1 Jan`). `getPreviewExtraMiniMonths(targetYear)` returned `[{ year: Y+1, month: 2 }]`. `calculateRequiredHolidayRange` combined both.
- **Resolution:** `getMiniMonths(targetYear)` now returns all 15 months (`Y-1 Dec` to `Y+1 Feb`). `getPreviewExtraMiniMonths` was completely removed. `calculateRequiredHolidayRange` derives range naturally from `getMainMonths` + 15 `getMiniMonths`.
- **Status:** FIXED.

### `src/domain/calendar/monthSequence.test.ts`
- **Previous state:** Asserted `getMiniMonths(2027)` length is 14; tested `getPreviewExtraMiniMonths`.
- **Resolution:** Asserts `getMiniMonths(2027)` length is 15, ending in `{ year: 2028, month: 2 }`. Guard test added locking 13 Main + 15 Mini = 28 Total SVGs with `2028-2` present.
- **Status:** FIXED.

---

## 2. Full-Year Preview & Page Preview

### `src/domain/pagePreview/fullYearPages.test.ts`
- **Previous state:** Asserted `getMiniMonths(2027)` length is 14 and that `2028-2` is NOT in `formalMiniMonths`.
- **Resolution:** Asserts `getMiniMonths(2027)` length is 15 and `2028-2` IS in `formalMiniMonths`.
- **Status:** FIXED.

### `src/preview/fullYear/calendarSet.ts` & `src/preview/fullYear/calendarSet.test.ts`
- **Previous state:** Constructed mini calendars from pages (15 unique minis).
- **Resolution:** Reconfirmed 13 pages, 13 main months, and 15 mini months.
- **Status:** FIXED.

### `src/preview/fullYear/fontRequirements.ts` & `src/preview/fullYear/fontRequirements.test.ts`
- **Previous state:** Font text requirements collected from full-year calendar set including 2028-2.
- **Resolution:** Reconfirmed all 15 formal mini months are covered.
- **Status:** FIXED.

---

## 3. Export & Workspace (Phase 6)

### Formal Export Scope (`src/export/formal/*`)
- **Previous state:** Old specifications specified 13 Main + 14 Mini = 27 SVGs and excluded `mini/2028-2.svg`.
- **Resolution:** Formally implemented 13 Main + 15 Mini = 28 SVGs in `src/export/formal/monthSet.ts`, `renderFormalDocuments.ts`, and `createExportZip.ts`. Hard assertion that `mini/2028-2.svg` is generated and present.
- **Status:** FIXED.

### Batch Export Panel UI (`src/export/components/BatchExportPanel.tsx`)
- **Previous state:** N/A (new component).
- **Resolution:** UI copy displays "Export 28 SVGs" and target year info (13 Main + 15 Mini).
- **Status:** FIXED.

---

## 4. Tests, Comments, UI Copy, and Documentation

### `src/verification/phase5/fixture.ts`
- **Previous state:** Comment called 2028-02 `Preview-only leap-year February`.
- **Resolution:** Updated to `Formal 15th mini month, leap-year February`.
- **Status:** FIXED.

### `docs/phase5/manual-validation.md`
- **Previous state:** Mentioned "Formal Mini sequence remains 14 (excludes 2028-2 from formal scope)".
- **Resolution:** Updated to "Formal Mini sequence is 15 (includes 2028-2 in formal scope)".
- **Status:** FIXED.

### `docs/specs/2026-08-27-monthloom-technical-design.md`
- **Previous state:** Sections 26.2 and Phase 5/6 summary mentioned 14 Mini / 27 files.
- **Resolution:** Explicitly annotated with superseded notes and updated to 15 Mini / 28 Total files.
- **Status:** SUPERSEDED SECTIONS ANNOTATED.

### `docs/plans/2026-08-27-monthloom-calendar-domain-implementation-plan.md` & `docs/plans/2026-08-27-monthloom-full-year-page-preview-implementation-plan.md`
- **Previous state:** Historical Phase 1 and Phase 5 plans.
- **Resolution:** Preserved as historical artifacts; superseded by `docs/plans/2026-08-27-monthloom-mini-scope-correction-phase6-plan.md`.
- **Status:** SUPERSEDED.
