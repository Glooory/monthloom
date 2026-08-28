# Holiday Library and Dynamic Layers Re-review

## Review scope

- Review date: 2026-08-28
- Fixed point: `HEAD` (`8f2c518dc6dbd3bcd9af7936fac5f1ab6c55e5a6`)
- Implementation: current uncommitted workspace diff and untracked files
- Requirements: `docs/superpowers/specs/2026-08-28-holiday-library-and-layers-design.md`
- Plan: `docs/superpowers/plans/2026-08-28-holiday-library-and-layers-implementation-plan.md`
- Previous review: `docs/superpowers/reviews/2026-08-28-holiday-library-and-layers-review.md`

## Outcome

The first remediation pass closed 13 of the 16 previous findings. Three previous findings remain partial, and the re-review exposed additional import and persistence defects. The current implementation should not be merged until the ten findings below are closed.

## Standards findings

### 1. [P2] Production fabricates a fallback font descriptor

`src/domain/template/holidayLayer.ts:415-458` uses a hard-coded Noto Sans descriptor when `default-sans` is missing and installs that fabricated value for missing layer font IDs.

This violates `AGENTS.md`'s **No Mock Fallbacks in Production** rule. Require an existing source descriptor or pass one explicitly. Throw a descriptive error when no valid descriptor is available.

### 2. [P3, judgement] Main and Mini duplicate marker materialization

`src/rendering/layout/mainLayout.ts:207-261` and `src/rendering/layout/miniLayout.ts:184-236` duplicate marker selection and text/image RenderNode construction.

Extract a shared marker-to-node helper. Keep Main's adjacent-month opacity behavior as an explicit input so the two renderers remain intentionally different where required.

## Specification findings

### 1. [P1] Imported project data does not reach the live holiday SSOT

`src/persistence/components/PersistenceControls.tsx:130-140` imports and loads a project but does not refresh `useHolidayLibraryStore`. `src/persistence/operations/projectOperations.ts:40-53` only replaces workspace and document state, while `src/app/App.tsx:40-42` hydrates holidays only at startup.

After import, restored layers can appear missing and render without the newly imported records until the application reloads. Refresh the runtime holiday store after the bundle transaction succeeds and before the imported project is presented as ready.

### 2. [P1] Calendars absent locally cannot be imported through Monthloom JSON UI

`src/workspace/components/HolidayLibraryPanel.tsx:170-176` always passes the selected calendar ID to `prepareMonthloomImport`. Files containing a different stable ID are therefore rejected. The create-by-file-ID path in `src/workspace/holiday/holidayLibraryOperations.ts:222-235` has no UI caller.

Provide an explicit import-new-calendar path that preserves the file's stable ID, while retaining the strict match requirement when importing into an existing selected calendar.

### 3. [P1] New-calendar Monthloom JSON import is not atomic

`src/workspace/holiday/holidayLibraryOperations.ts:269-275` writes `newCalendar` first, then applies records and coverage in a separate transaction. A later validation or transaction failure leaves an empty calendar.

Validate the complete prepared update before writing, then persist the calendar, baseline records, coverage, and optional sync state inside one Dexie `rw` transaction.

### 4. [P1] Holiday library snapshots permit conflicting records

`src/persistence/schema/holidayLibrarySchema.ts:84-90` validates element shapes but does not enforce:

- unique `(calendarId, date)` values for base records and overrides;
- canonical record IDs matching `holidayRecordId(calendarId, date)`;
- references to calendars included in the same snapshot;
- at most one sync state per calendar.

A crafted project bundle can persist multiple records for one date, after which `src/domain/holiday/effectiveRecords.ts:15-23` lets array order choose the winner. Add snapshot-level `superRefine` validation and regression tests.

### 5. [P2] Project and template schemas do not enforce layer 1:1 invariants

`src/persistence/schema/projectSnapshot.ts:151-170,187-193` accepts duplicate layer IDs and multiple layers referencing the same calendar ID.

Add document-schema validation for unique layer IDs and unique calendar IDs. Imported snapshots must enforce the same invariant as `addHolidayLayer` and `rebindHolidayLayer`.

### 6. [P2] Holiday-layer UI remains incomplete and partly untranslated

`src/editor/components/HolidayLayerTree.tsx:133-395` lacks:

- collapse/expand behavior for the entire Holiday Layers group;
- drag sorting;
- the explanation that later layers have higher date-color priority;
- current-range data or coverage status.

`HolidayLayerTree.tsx:254`, `HolidayCalendarDetail.tsx:113-116`, and `WorkspaceControls.tsx:108` still hard-code Chinese. The typed i18n dictionaries also retain unused fixed China/Japan dataset strings from the old workflow. Complete the interactions, localize all visible text, and remove obsolete keys.

### 7. [P2] Project import omits the required merge summary

`src/persistence/bundle/importBundle.ts:20-25` returns only `skippedManualConflicts`, and `src/persistence/components/PersistenceControls.tsx:134-140` displays neither added counts nor skipped-conflict counts.

Return a structured merge summary and display the number of calendars/records added plus skipped manual conflicts after project import.

### 8. [P2] Monthloom JSON accepts reversed coverage ranges

`src/domain/holiday/monthloomJson.ts:23-27,87-97` validates the individual dates but does not check `start <= end`. Invalid files pass parsing and confirmation preview, then fail only during repository application.

Reject reversed ranges during `parseMonthloomHolidayJson` so whole-file validation finishes before any preview or write path.

## Required regression coverage

Add focused tests proving:

1. Imported project holiday data is immediately visible through `useHolidayLibraryStore` without reload.
2. Monthloom JSON can create a previously absent calendar through the UI while preserving its stable ID.
3. New-calendar import rolls back every entity when any write fails.
4. Snapshot validation rejects duplicate dates, non-canonical IDs, missing calendar references, duplicate sync states, duplicate layer IDs, and duplicate calendar-layer bindings.
5. Reversed coverage is rejected by the public JSON parser.
6. Import results include and present the required merge summary.

## Verification evidence

- `npm test`: 80 test files, 286 tests passed.
- `npm run build`: passed; Vite emitted the existing large-chunk warning.
- `git diff --check`: clean.
- Core legacy model scan: clean.
- Timezone scan matched only valid `Date.UTC` arithmetic.
- Browser validation was not run, following repository policy.

## Completion gate

This re-review is closed only when all ten findings have corresponding fixes and regression evidence, the full test/build/diff gates pass, and the final response accounts for every finding individually.
