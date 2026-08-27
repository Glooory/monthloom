# Monthloom Mini Scope Correction + Phase 6 Persistence & Batch Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct Monthloom's formal Mini scope from 14 to 15 months everywhere, then complete Phase 6 with annual workspace state, holiday JSON import, IndexedDB persistence, portable `.monthloom` backup/import, persistent assets/font cache, and formal 28-file SVG ZIP export.

**Architecture:** Treat the Mini-count change as a cross-cutting product correction before adding new persistence/export code. Formal Mini months are now previous-year December + target-year January–December + next-year January + next-year February = 15. The same corrected month set must be the single source of truth for Calendar Domain, full-year Preview reuse, persistence snapshots, formal export, tests, docs, and verification. After correction, Phase 6 remains local-first: serializable snapshots + repositories + portable bundles + one merged font engine per formal 28-file export.

**Tech Stack:** TypeScript, React, Zustand/zundo/Immer already present, Dexie, Zod, JSZip, existing Phase 1–5 production modules, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Superseding Requirement

The following requirement overrides every earlier decision, implementation, test, comment, and document that says formal Mini output contains 14 SVGs or that `Y+1 February` is Preview-only:

```text
Formal Main:
Y January ... Y December
Y+1 January
= 13 SVGs

Formal Mini:
Y-1 December
Y January ... Y December
Y+1 January
Y+1 February
= 15 SVGs

Formal batch total:
13 Main + 15 Mini = 28 SVGs
```

For target year `2027`:

```text
Main:
2027-1 ... 2027-12
2028-1
= 13

Mini:
2026-12
2027-1 ... 2027-12
2028-1
2028-2
= 15

Total:
28
```

`2028-2` is now a formal Mini output and must appear in the ZIP as:

```text
mini/2028-2.svg
```

There is no longer a "Preview-only extra Mini month" concept.

## Global Constraints

- Before implementing new Phase 6 features, correct all existing Phase 1–5 assumptions that formal Mini count is 14.
- Do not patch only export code; Calendar Domain must own the corrected 15-month formal Mini sequence.
- Do not retain duplicate APIs where one returns 14 formal Minis and another adds temporary February.
- Remove/replace tests asserting `Y+1 February` is excluded from formal Mini output.
- Update comments, labels, UI copy, verification harnesses, and docs where they encode 14 / 27 / Preview-only February.
- Required holiday range must still be derived from actual formal rendering needs, not hardcoded.
- Monthloom remains local-first and static-hostable on GitHub Pages.
- Do not add backend, cloud sync, account, collaboration, PNG/PDF output, or server-side features.
- Formal output remains Main/Mini SVG only.
- Outlined SVG remains default batch mode.
- Batch export uses production Calendar/Layout/SVG pipeline and one merged font engine.
- Persistence snapshots contain serializable state only.
- `.monthloom` import validates fully before mutation.
- Production code must not import `src/spike/`.

---

# Task 0: Audit Every Existing 14-Mini / 27-File Assumption

**Files:**
- No code change in the first step; produce an audit note at:
  - Create: `docs/corrections/2026-08-27-mini-output-scope-audit.md`

**Interfaces:**
- Produces a concrete inventory of every current assumption that must change before Phase 6 continues.

- [ ] **Step 1: Search the repository for old numeric assumptions**

Run:

```bash
grep -RIn \
  -e "14 Mini" \
  -e "14 mini" \
  -e "14 SVG" \
  -e "27 SVG" \
  -e "27 files" \
  -e "27-file" \
  -e "27-file" \
  -e "Preview-only" \
  -e "preview-only" \
  -e "extra Mini" \
  -e "extra mini" \
  -e "Y+1 February" \
  -e "2028-2" \
  -e "getPreviewExtraMiniMonths" \
  src docs || true
```

- [ ] **Step 2: Search direct count assertions**

Run:

```bash
grep -RIn \
  -e "toHaveLength(14)" \
  -e "toBe(14)" \
  -e "=== 14" \
  -e "toHaveLength(27)" \
  -e "toBe(27)" \
  -e "=== 27" \
  src docs || true
```

- [ ] **Step 3: Search filenames/exclusion assertions**

Run:

```bash
grep -RIn \
  -e "mini/2028-2.svg" \
  -e "2028-2.svg" \
  -e "not.*2028-2" \
  -e "absent.*2028-2" \
  -e "exclude.*2028-2" \
  src docs || true
```

- [ ] **Step 4: Search formal Mini sequence construction**

Run:

```bash
grep -RIn \
  -e "getMiniMonths" \
  -e "miniMonths" \
  -e "formal.*mini" \
  -e "FormalExportCalendarSet" \
  -e "createFormalExportCalendarSet" \
  src || true
```

- [ ] **Step 5: Write the audit note**

The note must list each affected file under:

```text
Calendar Domain
Full-year Preview
Export
Persistence/Workspace
Verification Harness
Tests
Docs/Comments/UI copy
```

For each item, record:

```text
current assumption
required new behavior
planned Task that fixes it
```

- [ ] **Step 6: Do not proceed until the inventory is complete**

If any code path constructs formal Mini months without going through the Calendar Domain source-of-truth API, flag it explicitly.

- [ ] **Step 7: Commit audit**

```bash
git add docs/corrections/2026-08-27-mini-output-scope-audit.md
git commit -m "docs: audit formal mini output scope"
```

---

# Task 1: Correct Calendar Domain Formal Mini Scope to 15

**Files:**
- Modify: `src/domain/calendar/monthSequence.ts`
- Modify: `src/domain/calendar/monthSequence.test.ts`
- Remove or refactor any `getPreviewExtraMiniMonths` API if it exists
- Modify related Phase 1 integration tests

**Interfaces:**
- Formal source of truth becomes:

```ts
export function getMiniMonths(targetYear: number): readonly YearMonth[];
```

For `2027` it must return exactly:

```ts
[
  { year: 2026, month: 12 },
  { year: 2027, month: 1 },
  ...
  { year: 2027, month: 12 },
  { year: 2028, month: 1 },
  { year: 2028, month: 2 },
]
```

length:

```text
15
```

- [ ] **Step 1: Rewrite failing Mini sequence test**

Replace any old expectation of 14 with:

```ts
const months = getMiniMonths(2027);

expect(months).toHaveLength(15);
expect(months.at(0)).toEqual({ year: 2026, month: 12 });
expect(months.at(-2)).toEqual({ year: 2028, month: 1 });
expect(months.at(-1)).toEqual({ year: 2028, month: 2 });
```

- [ ] **Step 2: Run targeted test and confirm old implementation fails**

```bash
npm test -- src/domain/calendar/monthSequence.test.ts
```

Expected:

```text
FAIL because current implementation still returns 14.
```

- [ ] **Step 3: Update `getMiniMonths`**

Formal sequence:

```text
Y-1 December
Y January–December
Y+1 January
Y+1 February
```

Do not create a second "preview extra" list.

- [ ] **Step 4: Remove or collapse `getPreviewExtraMiniMonths`**

If it exists and its only purpose is `Y+1 February`, remove it.

Update callers to use `getMiniMonths`.

If a compatibility wrapper must temporarily remain during refactor, mark it deprecated and remove it within this same Task before commit.

- [ ] **Step 5: Recalculate required holiday range from formal needs**

`calculateRequiredHolidayRange(targetYear)` must derive from:

```text
Main visible dates
+
all 15 formal Mini months
```

Do not separately append Preview February.

For 2027 expected range remains:

```text
2026-12-01 → 2028-02-29
```

but now for the correct reason: February is formal output.

- [ ] **Step 6: Update Phase 1 integration tests**

Replace any wording or expectations that February is preview-only.

- [ ] **Step 7: Run full verification**

```bash
npm test -- src/domain/calendar
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/domain/calendar
git commit -m "fix: make next february a formal mini output"
```

---

# Task 2: Correct Phase 5 Full-year Preview to Reuse Formal Mini February

**Files:**
- Modify: `src/domain/pagePreview/fullYearPages.ts`
- Modify: `src/domain/pagePreview/fullYearPages.test.ts`
- Modify: `src/preview/fullYear/calendarSet.ts`
- Modify: `src/preview/fullYear/calendarSet.test.ts`
- Modify: `src/preview/fullYear/fontRequirements.ts`
- Modify related verification/docs

**Interfaces:**
- Phase 5 still renders:
  - 13 Pages
  - 13 unique Main months
  - 15 unique Mini months

The important correction is semantic:

```text
all 15 unique Mini months are now formal Mini months
```

There is no preview-only Mini.

- [ ] **Step 1: Update Page-definition tests**

Final Page remains:

```text
Main = 2028-1
Previous Mini = 2027-12
Next Mini = 2028-2
```

But test description must no longer call `2028-2` temporary/extra/preview-only.

- [ ] **Step 2: Simplify CalendarSet construction**

Use:

```text
getMiniMonths(targetYear)
```

as the complete 15-month unique Mini set where practical.

Do not independently reconstruct an extra February list.

- [ ] **Step 3: Keep counts stable**

Expected:

```text
pages = 13
mainCalendars.size = 13
miniCalendars.size = 15
```

- [ ] **Step 4: Update font requirement tests**

`2028-2` remains included, now because it is a formal Mini requirement.

- [ ] **Step 5: Remove old verification statements**

Remove/replace:

```text
Preview-only February
Formal Mini remains 14
February excluded from export scope
```

- [ ] **Step 6: Run regression**

```bash
npm test -- src/domain/pagePreview src/preview/fullYear
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/domain/pagePreview src/preview/fullYear src/verification/phase5 docs/phase5
git commit -m "fix: align full year preview with 15 formal minis"
```

Stage only files that exist and actually changed.

---

# Task 3: Sweep Tests, Comments, UI Copy, and Docs for the Old Requirement

**Files:**
- Modify any repository files identified in Task 0 that still encode:
  - 14 formal Minis
  - 27 formal SVGs
  - February is preview-only
  - February must be absent

**Interfaces:**
- No new production API.
- Produces repository-wide semantic consistency before new Phase 6 code.

- [ ] **Step 1: Re-run Task 0 searches**

All old requirement occurrences must be reviewed, not blindly deleted.

- [ ] **Step 2: Update assertions**

Required new invariants:

```text
Formal Mini count = 15
Formal total count = 28
Y+1 February is included
```

- [ ] **Step 3: Update comments and UI labels**

Examples:

```text
Export 27 SVGs
→ Export 28 SVGs

14 Mini
→ 15 Mini
```

- [ ] **Step 4: Update plan/verification docs that are part of the repository**

Historical docs may retain old content only if clearly marked as superseded.

For active specs/checklists, correct the requirement.

- [ ] **Step 5: Add one repository-level guard test**

Create or extend a formal month sequence test that explicitly locks:

```text
13 Main
15 Mini
28 total
Y+1 February present
```

- [ ] **Step 6: Run complete suite**

```bash
npm test
npm run build
```

- [ ] **Step 7: Re-run search**

There should be no active production/test assertion saying February is excluded.

- [ ] **Step 8: Commit**

```bash
git add src docs
git commit -m "fix: remove obsolete 14 mini assumptions"
```

---

# Task 4: Add Production Workspace State for Year and Holiday Datasets

**Files:**
- Create or modify according to current code:
  - `src/workspace/state/workspaceStore.ts`
  - `src/workspace/state/workspaceStore.test.ts`
  - `src/workspace/holiday/holidayWorkspace.ts`
  - `src/workspace/holiday/holidayWorkspace.test.ts`

**Interfaces:**
- Produces:

```ts
export type WorkspaceState = {
  currentProjectId: string | null;
  projectName: string;
  targetYear: number;
  chinaHolidayDataset: HolidayDataset | null;
  japanHolidayDataset: HolidayDataset | null;
  ...
};
```

- [ ] **Step 1: Keep workspace state out of template Undo history**
- [ ] **Step 2: Build HolidayIndex from normalized datasets**
- [ ] **Step 3: Calculate coverage from corrected required range**
- [ ] **Step 4: Add missing-dataset warnings**
- [ ] **Step 5: Run tests/build**
- [ ] **Step 6: Commit**

```bash
git add src/workspace
git commit -m "feat: add annual workspace state"
```

---

# Task 5: Add Real China/Japan Holiday JSON Import

**Files:**
- `src/workspace/holiday/importHolidayJson.ts`
- tests
- `HolidayImportControls.tsx`
- `HolidayDiagnostics.tsx`
- `WorkspaceControls.tsx`

**Interfaces:**
- Reuse Phase 1 adapters only.

- [ ] **Step 1: Parse browser JSON files**
- [ ] **Step 2: Reuse China/Japan adapters**
- [ ] **Step 3: Add Target Year input**
- [ ] **Step 4: Add independent China/Japan import/clear**
- [ ] **Step 5: Show entry counts, coverage, diagnostics**
- [ ] **Step 6: Wire imported HolidayIndex into Editor/Preview/Export**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/workspace
git commit -m "feat: import annual holiday json"
```

---

# Task 6: Define Versioned Project and Template Snapshot Schemas

**Files:**
- `src/persistence/schema/*`

**Interfaces:**
- Project V1 stores:
  - id/name
  - targetYear
  - EditorDocument
  - normalized China/Japan HolidayDataset
  - timestamps
- Template V1 stores:
  - id/name
  - EditorDocument
  - timestamps

- [ ] **Step 1: Build Zod schemas**
- [ ] **Step 2: Reject transient/non-serializable data**
- [ ] **Step 3: Add round-trip tests**
- [ ] **Step 4: Add unknown-version test**
- [ ] **Step 5: Add migration dispatcher**
- [ ] **Step 6: Run tests/build**
- [ ] **Step 7: Commit**

```bash
git add src/persistence/schema
git commit -m "feat: define versioned persistence snapshots"
```

---

# Task 7: Add Dexie Repositories

**Files:**
- `src/persistence/db/*`
- `package.json`
- lockfile

**Dependencies:**

```bash
npm install dexie jszip
```

**Tables:**

```text
projects
templates
assets
fontCache
```

- [ ] **Step 1: Define Dexie schema V1**
- [ ] **Step 2: Use isolated test DBs**
- [ ] **Step 3: Implement ProjectRepository**
- [ ] **Step 4: Implement TemplateRepository**
- [ ] **Step 5: Implement AssetRepository**
- [ ] **Step 6: Implement FontCacheRepository**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/persistence/db
git commit -m "feat: add indexeddb repositories"
```

---

# Task 8: Persist Binary Assets and Font Cache

**Files:**
- `src/editor/assets/persistentAssetStore.ts`
- Phase 4/5 upload call sites
- `src/resources/fonts/fontCache.ts`
- `src/resources/fonts/resolveFonts.ts`
- tests

- [ ] **Step 1: Persist image/background/local-font bytes by assetId**
- [ ] **Step 2: Replace production memory-only asset ownership**
- [ ] **Step 3: Add FontBinaryCache interface**
- [ ] **Step 4: Cache Google font binaries using concrete request key**
- [ ] **Step 5: Cache hit avoids fetch**
- [ ] **Step 6: Cache write failure does not break rendering**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/editor/assets src/resources/fonts
git commit -m "feat: persist assets and font binaries"
```

---

# Task 9: Implement Project Save / Load / Delete

**Files:**
- persistence UI/components
- application composition
- tests

- [ ] **Step 1: Create project snapshot from canonical state**
- [ ] **Step 2: Save New Project**
- [ ] **Step 3: Save existing Project**
- [ ] **Step 4: List Projects**
- [ ] **Step 5: Load atomically after validation/migration**
- [ ] **Step 6: Clear document Undo history on Project load**
- [ ] **Step 7: Delete only Project record**
- [ ] **Step 8: Test full browser-state reconstruction**
- [ ] **Step 9: Run tests/build**
- [ ] **Step 10: Commit**

```bash
git add src/persistence/components src/workspace src/editor/state
git commit -m "feat: save and load local projects"
```

---

# Task 10: Implement Reusable Template Save / Apply / Delete

**Files:**
- persistence Template UI/helpers/tests

- [ ] **Step 1: Save EditorDocument only**
- [ ] **Step 2: List Templates**
- [ ] **Step 3: Apply as one undoable document edit**
- [ ] **Step 4: Preserve targetYear/holiday datasets**
- [ ] **Step 5: Delete only Template record**
- [ ] **Step 6: Test cross-year reuse**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/persistence/components src/editor/state
git commit -m "feat: save reusable calendar templates"
```

---

# Task 11: Collect and Remap Referenced Binary Assets

**Files:**
- `src/persistence/assets/referencedAssets.ts`
- `remapAssets.ts`
- tests

Must cover:

```text
China image marker
China workday image marker
Background
Local font asset IDs
```

- [ ] **Step 1: Collect**
- [ ] **Step 2: Deduplicate**
- [ ] **Step 3: Remap every supported asset reference**
- [ ] **Step 4: Run tests/build**
- [ ] **Step 5: Commit**

```bash
git add src/persistence/assets
git commit -m "feat: track persisted template assets"
```

---

# Task 12: Implement Portable `.monthloom` Bundles

**Files:**
- `src/persistence/bundle/*`
- bundle UI/tests

**ZIP:**

```text
manifest.json
payload.json
assets/*.bin
```

- [ ] **Step 1: Export only referenced assets**
- [ ] **Step 2: Validate versioned manifest**
- [ ] **Step 3: Validate project/template payload**
- [ ] **Step 4: Read all declared assets before mutation**
- [ ] **Step 5: Generate fresh local asset IDs**
- [ ] **Step 6: Remap asset references**
- [ ] **Step 7: Give imported project/template a fresh ID**
- [ ] **Step 8: Add round-trip tests**
- [ ] **Step 9: Add corrupted-bundle atomicity tests**
- [ ] **Step 10: Add backup/import UI**
- [ ] **Step 11: Run tests/build**
- [ ] **Step 12: Commit**

```bash
git add src/persistence/bundle src/persistence/components
git commit -m "feat: backup and restore monthloom bundles"
```

---

# Task 13: Define Correct Formal Export Set — 13 Main + 15 Mini

**Files:**
- `src/export/formal/types.ts`
- `src/export/formal/monthSet.ts`
- `src/export/formal/monthSet.test.ts`
- `src/export/formal/fontRequirements.ts`
- tests

**Interfaces:**
- Uses corrected:

```ts
getMainMonths(targetYear) // 13
getMiniMonths(targetYear) // 15
```

- [ ] **Step 1: Lock exact Main sequence**

2027:

```text
2027-1 ... 2027-12
2028-1
```

13.

- [ ] **Step 2: Lock exact Mini sequence**

2027:

```text
2026-12
2027-1 ... 2027-12
2028-1
2028-2
```

15.

- [ ] **Step 3: Assert total formal document count**

```text
28
```

- [ ] **Step 4: Explicitly assert February is present**

```ts
expect(miniMonths.at(-1)).toEqual({
  year: 2028,
  month: 2,
});
```

- [ ] **Step 5: Generate each CalendarMonth once**
- [ ] **Step 6: Merge font requirements across all 28 outputs**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/export/formal
git commit -m "feat: define 28 file formal svg export set"
```

---

# Task 14: Render Exactly 28 Formal SVG Documents

**Files:**
- `src/export/formal/renderFormalDocuments.ts`
- tests

**Expected:**

```text
13 Main
15 Mini
28 total
```

- [ ] **Step 1: Write exact count test**
- [ ] **Step 2: Render all Main through production layout/materialize**
- [ ] **Step 3: Render all Mini through production layout/materialize**
- [ ] **Step 4: Use one supplied ResolvedFontEngine**
- [ ] **Step 5: Assert Background exclusion**
- [ ] **Step 6: Return deterministic chronological groups**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/export/formal/renderFormalDocuments.ts src/export/formal/renderFormalDocuments.test.ts
git commit -m "feat: render 28 formal calendar svgs"
```

---

# Task 15: Package Exact 28-file ZIP

**Files:**
- `src/export/formal/createExportZip.ts`
- tests
- download helper

**ZIP filename:**

```text
Monthloom-2027.zip
```

**Exact paths:**

```text
main/
  2027-1.svg
  ...
  2027-12.svg
  2028-1.svg

mini/
  2026-12.svg
  2027-1.svg
  ...
  2027-12.svg
  2028-1.svg
  2028-2.svg
```

- [ ] **Step 1: Lock non-zero-padded filenames**
- [ ] **Step 2: Add all 28 files**
- [ ] **Step 3: Assert ZIP exact path set**
- [ ] **Step 4: Explicitly assert `mini/2028-2.svg` exists**
- [ ] **Step 5: Assert total entries = 28 SVG files**
- [ ] **Step 6: Verify Outlined representative files contain paths/no semantic text**
- [ ] **Step 7: Verify image markers remain data URI/self-contained**
- [ ] **Step 8: Add browser download**
- [ ] **Step 9: Run tests/build**
- [ ] **Step 10: Commit**

```bash
git add src/export/formal
git commit -m "feat: package 28 formal svg files"
```

---

# Task 16: Add Batch Export UI and One-engine Orchestration

**Files:**
- `src/export/components/BatchExportPanel.tsx`
- app composition
- tests

**UI:**

```text
Outlined (default)
Editable
Export 28 SVGs
```

**Pipeline:**

```text
targetYear
+ HolidayIndex
→ Formal Calendar Set (13 + 15)
→ merged font requirements
→ resolveFontEngine once
→ render 28 documents
→ ZIP
→ download
```

- [ ] **Step 1: Update old `Export 27 SVGs` copy if present**
- [ ] **Step 2: Default Outlined**
- [ ] **Step 3: Resolve font engine once**
- [ ] **Step 4: Use persistent asset/font cache**
- [ ] **Step 5: Prevent duplicate concurrent export**
- [ ] **Step 6: Surface fatal asset/font/render errors**
- [ ] **Step 7: Run tests/build**
- [ ] **Step 8: Commit**

```bash
git add src/export src
git commit -m "feat: export 28 formal calendar svgs"
```

---

# Task 17: Build Phase 6 Verification Harness

**Files:**
- `src/verification/phase6/*`
- `docs/phase6/manual-validation.md`

Use target year:

```text
2027
```

- [ ] **Step 1: Verify real China/Japan Holiday import**
- [ ] **Step 2: Save a Project with visible design/background/image-marker changes**
- [ ] **Step 3: Full browser refresh and reload Project**
- [ ] **Step 4: Save/apply Template across a changed target year**
- [ ] **Step 5: Backup Project as `.monthloom`**
- [ ] **Step 6: Clear IndexedDB and recover from bundle**
- [ ] **Step 7: Import same bundle twice safely**
- [ ] **Step 8: Export Outlined ZIP**
- [ ] **Step 9: Assert `main = 13`**
- [ ] **Step 10: Assert `mini = 15`**
- [ ] **Step 11: Assert `total = 28`**
- [ ] **Step 12: Assert `mini/2028-2.svg` exists**
- [ ] **Step 13: Open representative boundary SVGs offline**
- [ ] **Step 14: Export Editable ZIP and inspect `<text>`**
- [ ] **Step 15: Verify persistent font cache**
- [ ] **Step 16: Create manual validation document with corrected counts**
- [ ] **Step 17: Run `npm test` and `npm run build`**
- [ ] **Step 18: Commit**

---

# Task 18: Final Cross-cutting Regression and Obsolete-Assumption Sweep

**Files:**
- Any active files still identified by repository search

- [ ] **Step 1: Run the entire suite**

```bash
npm test
npm run build
```

- [ ] **Step 2: Search old counts again**

```bash
grep -RIn \
  -e "14 Mini" \
  -e "14 mini" \
  -e "27 SVG" \
  -e "27 files" \
  -e "Export 27" \
  -e "Preview-only" \
  -e "preview-only" \
  -e "getPreviewExtraMiniMonths" \
  src docs || true
```

Every remaining occurrence must either:

```text
be removed/corrected
```

or:

```text
be clearly historical and explicitly marked superseded
```

- [ ] **Step 3: Search negative February assertions**

```bash
grep -RIn \
  -e "2028-2.svg" \
  -e "Y+1 February" \
  src docs || true
```

Active export tests must assert inclusion, not exclusion.

- [ ] **Step 4: Verify formal counts from production functions**

Run or test:

```text
getMainMonths(2027).length = 13
getMiniMonths(2027).length = 15
formal total = 28
```

- [ ] **Step 5: Verify Phase 5 still uses 15 unique Mini documents**

This count remains unchanged, but now they are all formal.

- [ ] **Step 6: Verify no architecture regressions**

```bash
grep -R "dexie\|monthloomDb\|ProjectRepository\|TemplateRepository" \
  src/domain src/rendering || true

grep -R "src/spike\|/spike/" \
  src/domain src/rendering src/resources src/editor src/preview \
  src/workspace src/persistence src/export || true
```

- [ ] **Step 7: Update the correction audit with completion status**

Mark every item from Task 0 as:

```text
fixed
or
superseded historical doc
```

No unresolved active assumption may remain.

- [ ] **Step 8: Commit**

```bash
git add src docs
git commit -m "test: verify 15 mini output correction"
```

---

# Corrected Phase 6 Acceptance Gate

## Cross-cutting Requirement Correction

- [ ] `getMiniMonths(Y)` returns 15 months.
- [ ] `Y+1 February` is formal Mini output.
- [ ] No production API still models February as Preview-only.
- [ ] Active tests no longer expect 14 Mini outputs.
- [ ] Active tests no longer expect 27 formal files.
- [ ] Active UI copy no longer says `Export 27 SVGs`.
- [ ] Phase 5 still renders 15 unique Mini documents.
- [ ] Phase 5 reuses the formal February Mini.
- [ ] Required holiday range remains correct.

## Workspace / Holiday Import

- [ ] Target year is real production state.
- [ ] China JSON import works.
- [ ] Japan JSON import works.
- [ ] Coverage diagnostics use corrected formal required range.
- [ ] Imported data feeds Editor/Preview/Export.

## Persistence

- [ ] Project reload after browser refresh works.
- [ ] Template reuse across years works.
- [ ] Background/image-marker assets survive reload.
- [ ] Project load clears Undo history.
- [ ] Template Apply is one Undo step.
- [ ] Snapshots are versioned/Zod validated.
- [ ] Dexie stays outside Domain/Layout/Renderer.

## `.monthloom`

- [ ] Project backup works.
- [ ] Template backup works.
- [ ] Referenced assets are included.
- [ ] Font cache is excluded.
- [ ] Import validates atomically.
- [ ] Asset IDs are remapped.
- [ ] Duplicate imports are safe.
- [ ] Recovery after clearing IndexedDB works.

## Formal Batch Export

- [ ] Main count = 13.
- [ ] Mini count = 15.
- [ ] Total count = 28.
- [ ] `mini/Y+1-2.svg` exists.
- [ ] ZIP name is `Monthloom-Y.zip`.
- [ ] Months are not zero-padded.
- [ ] Outlined is default.
- [ ] Editable is selectable.
- [ ] One merged font requirement set is used.
- [ ] One resolved font engine serves one export batch.
- [ ] Background is absent from formal SVG.
- [ ] Image markers remain self-contained.
- [ ] Representative SVGs work offline.

## Regression

- [ ] Phase 1 Calendar tests pass.
- [ ] Phase 2 Layout tests pass.
- [ ] Phase 3 Renderer tests pass.
- [ ] Phase 4 Editor tests pass.
- [ ] Phase 5 Preview tests pass.
- [ ] Rendering Spike tests pass.
- [ ] `npm run build` succeeds.
- [ ] GitHub Pages remains compatible.

## Decision

If all corrected Mini-scope, persistence, recovery, and 28-file export checks pass:

```text
Mini Scope Correction
+
Phase 6 — Persistence + Batch Export
→ ACCEPT
→ Proceed to Phase 7
```

If any active 14/27/Preview-only assumption remains in production code or tests:

```text
DO NOT ACCEPT PHASE 6
```

Fix the stale assumption first.
