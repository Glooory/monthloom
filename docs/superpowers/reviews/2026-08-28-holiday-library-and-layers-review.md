# Holiday Library and Dynamic Layers Implementation Review

## Review scope

- Review date: 2026-08-28
- Fixed point: `HEAD` (`8f2c518dc6dbd3bcd9af7936fac5f1ab6c55e5a6`)
- Implementation: uncommitted workspace diff and untracked files
- Requirements: `docs/superpowers/specs/2026-08-28-holiday-library-and-layers-design.md`
- Plan: `docs/superpowers/plans/2026-08-28-holiday-library-and-layers-implementation-plan.md`
- Standards: `AGENTS.md` and `README.md`

## Conclusion

Do not merge the current implementation yet. The intended architecture is visible and the automated test/build gates pass, but core editor/preview behavior, import semantics, and persistence validation still contain release-blocking defects.

## Standards findings

### 1. [P1] Persistence schema accepts impossible marker states

`src/persistence/schema/projectSnapshot.ts:48-57` models text and image markers as a single object with optional `value`, `assetId`, `typography`, `width`, `height`, and `opacity`, then force-casts the document schema at line 204. Values such as `{ type: "image" }` pass validation and can later produce invalid SVG nodes.

Use a Zod discriminated union matching `TextMarkerTemplate | ImageMarkerTemplate`.

### 2. [P1] Holiday library schema accepts invalid calendar dates

`src/persistence/schema/holidayLibrarySchema.ts:3-7` validates `day` only as `1..31`, allowing values such as `2027-02-31`. Bundle import can persist such data, after which date serialization or arithmetic throws.

Refine the schema with `isValidLocalDate` and validate range ordering where applicable.

### 3. [P2] Holiday library repository bypasses Zod validation

`src/persistence/db/holidayLibraryRepository.ts` trusts raw IndexedDB entities on both reads and writes. This is weaker than `ProjectRepository` and `TemplateRepository` and violates the repository rule that persisted schemas validate through Zod.

Parse records/snapshots at persistence boundaries.

### 4. [P2] Project bundle import is not fully atomic

`src/persistence/bundle/importBundle.ts:120` calls `ensureBuiltins()` before the import transaction beginning at line 127. A later failure can therefore leave database mutations behind.

Move all holiday-library initialization, merge reads, and writes into the same Dexie `rw` transaction as assets and the imported project.

### 5. [P3, judgement] Main and Mini duplicate marker geometry

`src/rendering/layout/mainLayout.ts:13-41` and `src/rendering/layout/miniLayout.ts:13-41` contain the same `calculateImageMarkerBounds` implementation. Extract a shared layout helper so the two renderers cannot drift.

## Specification findings

### 1. [P1] Editor and gallery preview omit holiday names and markers

`src/editor/components/TemplateEditor.tsx:94-107` calls `layoutMain` and `layoutMini` without `holidayLayers`.

`src/preview/fullYear/FullYearPreview.tsx:79-85` omits layers from font requirements, and lines 140-146 omit them from document rendering. Date colors may still work because they are already resolved into the calendar cells, but names and markers are absent. Formal export is currently the only complete consumer.

Pass the same `document.holidayLayers` through editor, gallery preview, font collection, and formal export, and add integration assertions for names and markers.

### 2. [P1] Custom holiday layers create unresolved font IDs

`src/domain/template/holidayLayer.ts:242-343` creates IDs such as `main.holiday.${id}.name` and marker font IDs without registering corresponding descriptors in `document.fontCatalog`. `src/resources/fonts/resolveFonts.ts:22-26` throws when matching holiday text appears.

Register cloned default descriptors when adding a layer, or reuse a guaranteed catalog font ID.

### 3. [P1] Unconfirmed Monthloom coverage deletes existing baseline records

`src/workspace/holiday/holidayLibraryOperations.ts:231-251` converts every imported coverage entry into a replacement range. The repository then deletes baseline records even when coverage is `unconfirmed`.

Only `confirmed` coverage may create replacement ranges. Imports without confirmed coverage must be additive/updating only.

### 4. [P1] Monthloom stable calendar IDs are silently ignored

`src/workspace/components/HolidayLibraryPanel.tsx:158-164` always targets the selected calendar. `HolidayLibraryOperations.prepareMonthloomImport` then rewrites imported records and coverage to that ID without comparing it to `exchange.calendar.id`.

Reject ID mismatches or provide a separate, explicit import-as-new/rebind workflow. Do not silently retarget a file.

### 5. [P1] Missing-calendar layers cannot be rebound

`src/editor/components/HolidayLayerTree.tsx:163-286` displays a missing badge but provides no rebind control and never calls `rebindHolidayLayer`.

Add a select containing calendars not already used by the template and persist the new stable ID.

### 6. [P2] Record dialog reuses stale state and Add Range opens the wrong mode

`src/workspace/components/HolidayRecordDialog.tsx:36-55` initializes state from `initialRecord` only once. Reopening it for another record can save the previous values. In `HolidayLibraryPanel.tsx:235-242`, Add Date and Add Range perform identical state changes, so both open single-date mode.

Reset form state whenever the dialog opens or its target changes, and pass an explicit initial mode.

### 7. [P2] Delete and restore-source workflows are incomplete

`src/workspace/components/HolidayCalendarDetail.tsx:376-406` shows Restore instead of Delete for manual modifications. Delete overrides disappear from `resolveEffectiveRecords`, so deleted source records no longer have a row from which the user can restore them.

Expose both Delete and Restore where applicable, and include deleted baseline tombstones in the management view.

### 8. [P2] Forbidden China/Japan compatibility model remains

`src/domain/holiday/types.ts:121-148`, `src/domain/holiday/coverage.ts:85-145`, `src/domain/holiday/holidayIndex.ts`, and both provider adapters retain fixed `HolidayInfo.china/japan`, `HolidayDataset`, and legacy helper paths. `projectSnapshot.ts:177-183` also treats `holidayLayers` as optional with an empty fallback.

Remove the compatibility model and update remaining tests/fixtures to consume the new SSOT directly.

### 9. [P2] Bundle format remains v1 and holiday-library.json is optional

`src/persistence/bundle/manifest.ts:9-16` still declares version 1. `src/persistence/bundle/importBundle.ts:114-125` accepts project bundles without `holiday-library.json`.

Implement the planned manifest v2 and require a validated full library snapshot for project bundles. Template bundles must continue to omit it.

### 10. [P2] Annual coverage badge checks only January 1

`src/workspace/components/HolidayLibraryPanel.tsx:83-99` marks a year confirmed when January 1 is covered, even if the remainder of the year is unknown.

Determine the badge from full-year uncovered ranges.

### 11. [P2] Layer management UI is not fully bilingual or feature-complete

`HolidayLayerTree.tsx` and `HolidayLayerInspector.tsx` contain hard-coded Chinese strings, so English mode remains partially Chinese. The tree also lacks drag sorting and the required explanation that later layers have higher date-color priority.

Move strings into the typed i18n dictionaries and implement the remaining interactions.

## Verification evidence

- `npm test`: 80 test files and 277 tests passed.
- `npm run build`: passed; Vite emitted the existing large-chunk warning.
- `git diff --check`: failed because `src/shared/i18n/locales/en.ts` and `zh.ts` each contain an extra blank line at EOF.
- The legacy scan still finds production compatibility code.

The green test suite does not establish acceptance: it lacks integration assertions proving that editor and gallery preview receive `holidayLayers` and render dynamic names/markers.

## Summary

- Standards axis: 5 findings; worst issue is invalid states passing persistence schemas.
- Specification axis: 11 findings; worst issue is editor/gallery preview not consuming dynamic holiday layers.
