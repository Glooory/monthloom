# Holiday Library and Dynamic Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed China/Japan holiday slots with a global SSOT holiday library in IndexedDB, accumulating multi-year data and driving ordered, template-owned holiday layers across Main, Mini, gallery preview, and formal SVG export.

**Architecture:**
- **Global Holiday Library (SSOT):** IndexedDB stores long-lived holiday calendars, source baselines, manual overrides, coverage ranges, and synchronization states independently from projects.
- **Template-Owned Holiday Layers:** `EditorDocument.holidayLayers` stores ordered visual rules referencing global calendar IDs; Main owns name, holiday marker, workday marker, and date colors; Mini owns holiday marker, workday marker, and date colors (Mini never renders holiday names).
- **Pure Centralized Resolver:** `resolveHolidayIndex({ library, layers })` resolves source baselines + manual overrides for referenced calendars and generates the single `HolidayIndex` consumed by calendar generation, geometry layout, font requirements, and SVG materialization.
- **Atomic Persistence & Bundles:** `.monthloom` project bundles automatically include the complete global holiday library snapshot and merge non-destructively on import; template bundles contain only layer design without holiday records.

**Tech Stack:** React 18, TypeScript 5.6, Zustand 5, Zundo, Dexie 4, Zod 4, Vitest 2, Testing Library, JSZip, Vite 6

**Spec:** `docs/superpowers/specs/2026-08-28-holiday-library-and-layers-design.md`

---

## Global Constraints & Invariants (Do Not Violate)

1. **Formal Output Invariant**: For target year `Y`, formal export must package exactly 28 SVGs (13 Main + 15 Mini). `getMainMonths(Y)` and `getMiniMonths(Y)` in `src/domain/calendar/monthSequence.ts` remain the single source of truth.
2. **Date Primitives & UTC Arithmetic**: Always use `LocalDate` (`{ year, month, day }`) and UTC date helpers (`Date.UTC`, `getUTCFullYear`, `compareDate`, `addDays`, etc.). Never use browser-local `new Date(year, month, day)`.
3. **Geometry & Layout Authority**: `layoutMain` and `layoutMini` compute all geometry and scene nodes. SVG materializers, serializers, previews, and batch export consume identical `SvgDocument` / `RenderScene` structures and must never re-calculate layout or re-interpret holiday precedence.
4. **Global Library SSOT**: The global library is the runtime SSOT; projects and templates hold no holiday-record copies. Modifying the global library immediately affects all projects referencing those calendars.
5. **Precedence Rules**:
   - **Baseline vs. Manual Overrides**: Manual overrides (`upsert` / `delete`) strictly override synchronized/imported source baselines. Subsequent sync or import must not overwrite manual overrides.
   - **Date Text Color vs. Name/Markers**: Later holiday layers in the template layer list override earlier layers **only** for date text colors. Enabled holiday names and markers from all layers coexist and are rendered simultaneously without overlap detection or warnings.
6. **Mini Calendar Scope**: Mini calendars never display holiday names or name settings. Mini supports holiday markers, workday markers, and date text colors.
7. **Clean Development Transition**: Do not implement backward compatibility, legacy snapshot migration, dual-write logic, or legacy fallbacks. All tests, fixtures, and schemas adopt the new model directly. Local database is cleanly switched to `MonthloomDB-v2`.

---

## File Structure & Module Map

### New domain modules
- `src/domain/holiday/types.ts` — Canonical types for calendars, records, overrides, coverage, sync states, library snapshot, and effective records.
- `src/domain/holiday/effectiveRecords.ts` — Pure resolver combining base records and manual overrides per calendar.
- `src/domain/holiday/effectiveRecords.test.ts` — Unit tests for baseline/override precedence, deletions, and provenance.
- `src/domain/holiday/resolveHolidayIndex.ts` — Pure resolver combining effective records and ordered template layers into `HolidayIndex`.
- `src/domain/holiday/monthloomJson.ts` — Strict parser and serializer for the public single-calendar exchange JSON (`monthloom-holidays` v1).
- `src/domain/holiday/monthloomJson.test.ts` — Validation and duplicate-detection tests for Monthloom JSON.
- `src/domain/template/holidayLayer.ts` — Holiday-layer visual types, default layer builders, and immutable manipulation helpers.
- `src/domain/template/holidayLayer.test.ts` — Unit tests for 1:1 calendar-layer constraints, ordering, and layer mutations.

### New persistence and application modules
- `src/persistence/db/holidayLibraryRepository.ts` — Dexie repository for atomic base updates, overrides, coverage, sync states, and snapshot queries.
- `src/persistence/db/holidayLibraryRepository.test.ts` — Integration tests for atomic multi-table updates and rollback.
- `src/persistence/schema/holidayLibrarySchema.ts` — Zod schemas for the global holiday library snapshot.
- `src/workspace/holiday/holidayLibraryOperations.ts` — Workflows for remote sync, provider/Monthloom import, manual edits, date ranges, deletion checks, and coverage confirmation.
- `src/workspace/holiday/holidayLibraryOperations.test.ts` — Tests for synchronization, manual conflict protection, and operations.
- `src/workspace/state/holidayLibraryStore.ts` — Hydrated Zustand store for global holiday library state.
- `src/workspace/state/holidayLibraryStore.test.ts` — Tests for library hydration, refreshing, and status transitions.

### New UI modules
- `src/workspace/components/HolidayLibraryPanel.tsx` — Global holiday library management panel (card/view).
- `src/workspace/components/HolidayCalendarList.tsx` — Left sidebar listing built-in and custom calendars with coverage badges.
- `src/workspace/components/HolidayCalendarDetail.tsx` — Right detail view with year selector, record table, sync/import actions, and manual entry buttons.
- `src/workspace/components/HolidayRecordDialog.tsx` — Modal form for adding/editing single dates or continuous date ranges.
- `src/workspace/components/holiday-library.css` — Scoped styling for holiday library manager.
- `src/editor/model/holidaySemanticId.ts` — Dynamic semantic ID construction and parsing (`main.holiday.${layerId}.${element}`, etc.).
- `src/editor/model/holidaySemanticId.test.ts` — Tests for round-trip parsing and validation of dynamic semantic IDs.
- `src/editor/components/HolidayLayerTree.tsx` — Ordered expandable holiday layer list in template editor sidebar.
- `src/editor/components/HolidayLayerInspector.tsx` — Main and Mini layer style inspector.
- `src/editor/components/HolidayDateColorInspector.tsx` — Holiday and workday date text color inspector.

### Existing modules with major updates
- `src/domain/holiday/coverage.ts` & `coverage.test.ts` — Generic coverage diagnostics across target year ranges (`Y-1 Dec` to `Y+1 Feb`).
- `src/domain/template/mainTemplate.ts`, `miniTemplate.ts`, `defaults.ts` — Removal of fixed China/Japan slots; clean `CalendarBaseColors`.
- `src/rendering/layout/mainLayout.ts`, `miniLayout.ts`, `colorRules.ts` — Dynamic layer-driven rendering of names, markers, and date colors.
- `src/resources/fonts/textRequirements.ts` & `textRequirements.test.ts` — Dynamic text collection from enabled holiday layers.
- `src/editor/model/templateBindings.ts`, `drag.ts`, `hitTargets.ts`, `types.ts` — Dynamic holiday bindings and anchor-relative dragging.
- `src/editor/components/TemplateEditor.tsx`, `Inspector.tsx`, `MarkerInspector.tsx` — Integration of holiday layer tree and inspectors.
- `src/persistence/db/monthloomDb.ts` — Database schema `MonthloomDB-v2` with new holiday library tables.
- `src/persistence/schema/projectSnapshot.ts`, `templateSnapshot.ts` — Clean snapshot schemas with `holidayLayers` and no project holiday datasets.
- `src/persistence/bundle/manifest.ts`, `exportBundle.ts`, `importBundle.ts` — Bundle manifest v2 with full library snapshot in project packages and non-destructive merge.
- `src/persistence/assets/referencedAssets.ts`, `remapAssets.ts` — Dynamic asset collection and remapping across all holiday layer markers.
- `src/workspace/state/workspaceStore.ts` & `src/app/App.tsx` — Clean workspace store; global library hydration and unified `holidayIndex` derivation.
- `src/preview/fullYear/FullYearPreview.tsx` & `src/export/components/BatchExportPanel.tsx` — Shared `holidayIndex` and coverage diagnostics.
- `src/shared/i18n/types.ts`, `locales/zh.ts`, `locales/en.ts` — Full bilingual localization keys for library and layer management.

---

## Tasks

### Task 1: Canonical holiday-library types, effective records, and coverage

**Files:**
- Modify: `src/domain/holiday/types.ts`
- Create: `src/domain/holiday/effectiveRecords.ts`
- Create: `src/domain/holiday/effectiveRecords.test.ts`
- Create: `src/domain/holiday/testFixtures.ts`
- Modify: `src/domain/holiday/coverage.ts`
- Modify: `src/domain/holiday/coverage.test.ts`

**Interfaces:**
- Produces: `HolidayCalendar`, `HolidayBaseRecord`, `HolidayOverride`, `HolidayCoverage`, `HolidaySyncState`, `HolidayLibrarySnapshot`, `EffectiveHolidayRecord`, `HolidayBaseUpdate`.
- Produces: `holidayRecordId(calendarId, date)`, `resolveEffectiveRecords(library, calendarId)`, `calculateRequiredHolidayRange(targetYear)`.
- Produces: `createCalendarCoverageDiagnostics({ calendar, requiredRange, coverage })`.

- [ ] **Step 1: Write test fixtures and precedence tests for effective records**

Create `src/domain/holiday/testFixtures.ts`:
```ts
import { parseISODate, toISODate } from "../date/date";
import type { LocalDate } from "../date/types";
import {
  holidayRecordId,
  type HolidayBaseRecord,
  type HolidayCalendar,
  type HolidayCoverage,
  type HolidayLibrarySnapshot,
  type HolidayOverride,
  type HolidayRecordType,
  type HolidaySyncState,
} from "./types";

export function mustDate(value: string): LocalDate {
  const parsed = parseISODate(value);
  if (!parsed) throw new Error(`Invalid test date: ${value}`);
  return parsed;
}

export function fixtureLibrary(
  input: Partial<HolidayLibrarySnapshot> = {},
): HolidayLibrarySnapshot {
  return {
    calendars: input.calendars ?? [],
    baseRecords: input.baseRecords ?? [],
    overrides: input.overrides ?? [],
    coverage: input.coverage ?? [],
    syncStates: input.syncStates ?? [],
  };
}

export function base(
  calendarId: string,
  isoDate: string,
  type: HolidayRecordType,
  name?: string,
): HolidayBaseRecord {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    type,
    ...(name ? { name } : {}),
    source: "sync",
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}

export function overrideUpsert(
  calendarId: string,
  isoDate: string,
  type: HolidayRecordType,
  name?: string,
): HolidayOverride {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    kind: "upsert",
    type,
    ...(name ? { name } : {}),
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}

export function overrideDelete(
  calendarId: string,
  isoDate: string,
): HolidayOverride {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    kind: "delete",
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}
```

Write `src/domain/holiday/effectiveRecords.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveEffectiveRecords } from "./effectiveRecords";
import { base, fixtureLibrary, overrideDelete, overrideUpsert } from "./testFixtures";

describe("resolveEffectiveRecords", () => {
  it("resolves pure baseline records as provenance 'source'", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-01-01", "holiday", "元旦")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-01-01")).toEqual({
      calendarId: "cn",
      date: { year: 2027, month: 1, day: 1 },
      type: "holiday",
      name: "元旦",
      provenance: "source",
    });
  });

  it("prioritizes manual modifications over synchronized baseline", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-01-01", "holiday", "元旦")],
      overrides: [overrideUpsert("cn", "2027-01-01", "holiday", "Custom New Year")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-01-01")).toMatchObject({
      type: "holiday",
      name: "Custom New Year",
      provenance: "manual-modified",
    });
  });

  it("marks manual additions not present in baseline as 'manual-added'", () => {
    const library = fixtureLibrary({
      overrides: [overrideUpsert("cn", "2027-05-20", "holiday", "Special Day")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-05-20")).toMatchObject({
      provenance: "manual-added",
    });
  });

  it("hides baseline records when a manual delete override exists", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-02-06", "workday")],
      overrides: [overrideDelete("cn", "2027-02-06")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.has("2027-02-06")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/domain/holiday/effectiveRecords.test.ts`
Expected: FAIL due to missing files.

- [ ] **Step 3: Define canonical types in `src/domain/holiday/types.ts`**

Export:
```ts
import type { DateRange, LocalDate } from "../date/types";

export type HolidayProviderId = "china-timor" | "japan-holidays-jp";
export type HolidayRecordType = "holiday" | "workday";
export type HolidayCoverageStatus = "confirmed" | "unconfirmed";

export const BUILTIN_CHINA_CALENDAR_ID = "builtin-cn-public-holidays";
export const BUILTIN_JAPAN_CALENDAR_ID = "builtin-jp-public-holidays";

export type NormalizedHolidayRecord = Readonly<{
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
}>;

export type HolidayCalendar = Readonly<{
  id: string;
  name: string;
  builtin: boolean;
  provider?: HolidayProviderId;
  createdAt: string;
  updatedAt: string;
}>;

export type HolidayBaseRecord = Readonly<{
  id: string;
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
  source: "sync" | "provider-import" | "monthloom-import";
  updatedAt: string;
}>;

export type HolidayOverride =
  | Readonly<{
      id: string;
      calendarId: string;
      date: LocalDate;
      kind: "upsert";
      type: HolidayRecordType;
      name?: string;
      updatedAt: string;
    }>
  | Readonly<{
      id: string;
      calendarId: string;
      date: LocalDate;
      kind: "delete";
      updatedAt: string;
    }>;

export type HolidayCoverage = Readonly<{
  id: string;
  calendarId: string;
  start: LocalDate;
  end: LocalDate;
  status: HolidayCoverageStatus;
  source: "sync" | "provider-import" | "monthloom-import" | "manual";
  updatedAt: string;
}>;

export type HolidaySyncState = Readonly<{
  calendarId: string;
  status: "never" | "success" | "error";
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  errorMessage?: string;
}>;

export type HolidayLibrarySnapshot = Readonly<{
  calendars: readonly HolidayCalendar[];
  baseRecords: readonly HolidayBaseRecord[];
  overrides: readonly HolidayOverride[];
  coverage: readonly HolidayCoverage[];
  syncStates: readonly HolidaySyncState[];
}>;

export type EffectiveHolidayRecord = Readonly<{
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
  provenance: "source" | "manual-modified" | "manual-added";
}>;

export type HolidayBaseUpdate = Readonly<{
  calendarId: string;
  records: readonly HolidayBaseRecord[];
  coverage: readonly HolidayCoverage[];
  replacementRanges: readonly DateRange[];
}>;

export type HolidayDiagnostic = Readonly<{
  level: "warning" | "error";
  code: string;
  message: string;
}>;

export function holidayRecordId(calendarId: string, date: LocalDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${calendarId}:${date.year}-${month}-${day}`;
}
```

- [ ] **Step 4: Implement `resolveEffectiveRecords` in `src/domain/holiday/effectiveRecords.ts`**

```ts
import { toISODate } from "../date/date";
import type { EffectiveHolidayRecord, HolidayLibrarySnapshot } from "./types";

export function resolveEffectiveRecords(
  library: HolidayLibrarySnapshot,
  calendarId: string,
): ReadonlyMap<string, EffectiveHolidayRecord> {
  const result = new Map<string, EffectiveHolidayRecord>();

  for (const record of library.baseRecords) {
    if (record.calendarId !== calendarId) continue;
    result.set(toISODate(record.date), {
      calendarId,
      date: record.date,
      type: record.type,
      ...(record.name ? { name: record.name } : {}),
      provenance: "source",
    });
  }

  for (const override of library.overrides) {
    if (override.calendarId !== calendarId) continue;
    const key = toISODate(override.date);
    if (override.kind === "delete") {
      result.delete(key);
      continue;
    }
    result.set(key, {
      calendarId,
      date: override.date,
      type: override.type,
      ...(override.name ? { name: override.name } : {}),
      provenance: result.has(key) ? "manual-modified" : "manual-added",
    });
  }

  return result;
}
```

- [ ] **Step 5: Implement generic coverage diagnostics in `src/domain/holiday/coverage.ts`**

```ts
import { addDays, compareDate, toISODate } from "../date/date";
import type { DateRange, LocalDate } from "../date/types";
import type { HolidayCalendar, HolidayCoverage, HolidayDiagnostic } from "./types";

export function calculateRequiredHolidayRange(targetYear: number): DateRange {
  const isNextLeap = (targetYear + 1) % 4 === 0 && ((targetYear + 1) % 100 !== 0 || (targetYear + 1) % 400 === 0);
  return {
    start: { year: targetYear - 1, month: 12, day: 1 },
    end: { year: targetYear + 1, month: 2, day: isNextLeap ? 29 : 28 },
  };
}

export function isDateInConfirmedCoverage(
  date: LocalDate,
  coverageList: readonly HolidayCoverage[],
  calendarId: string,
): boolean {
  for (const cov of coverageList) {
    if (cov.calendarId !== calendarId || cov.status !== "confirmed") continue;
    if (compareDate(cov.start, date) <= 0 && compareDate(date, cov.end) <= 0) {
      return true;
    }
  }
  return false;
}

export function getUncoveredCalendarRanges(
  required: DateRange,
  coverageList: readonly HolidayCoverage[],
  calendarId: string,
): readonly DateRange[] {
  const gaps: DateRange[] = [];
  let cursor = required.start;
  let gapStart: LocalDate | null = null;
  let gapEnd: LocalDate | null = null;

  while (compareDate(cursor, required.end) <= 0) {
    if (!isDateInConfirmedCoverage(cursor, coverageList, calendarId)) {
      if (!gapStart) {
        gapStart = cursor;
      }
      gapEnd = cursor;
    } else {
      if (gapStart && gapEnd) {
        gaps.push({ start: gapStart, end: gapEnd });
        gapStart = null;
        gapEnd = null;
      }
    }
    cursor = addDays(cursor, 1);
  }

  if (gapStart && gapEnd) {
    gaps.push({ start: gapStart, end: gapEnd });
  }

  return gaps;
}

export function createCalendarCoverageDiagnostics(args: {
  calendar: HolidayCalendar;
  requiredRange: DateRange;
  coverage: readonly HolidayCoverage[];
}): readonly HolidayDiagnostic[] {
  const gaps = getUncoveredCalendarRanges(args.requiredRange, args.coverage, args.calendar.id);
  return gaps.map((gap) => ({
    level: "warning",
    code: "holiday-coverage-gap",
    message: `${args.calendar.name} holiday data does not cover ${toISODate(gap.start)} through ${toISODate(gap.end)}.`,
  }));
}
```

- [ ] **Step 6: Run tests and verify PASS**

Run: `npm test -- src/domain/holiday/effectiveRecords.test.ts src/domain/holiday/coverage.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/domain/holiday
git commit -m "feat: implement canonical holiday domain, effective records, and coverage"
```

---

### Task 2: Template-owned holiday layers and defaults

**Files:**
- Create: `src/domain/template/holidayLayer.ts`
- Create: `src/domain/template/holidayLayer.test.ts`
- Modify: `src/domain/template/mainTemplate.ts`
- Modify: `src/domain/template/miniTemplate.ts`
- Modify: `src/domain/template/defaults.ts`
- Modify: `src/editor/model/types.ts`
- Modify: `src/editor/state/documentStore.ts`
- Modify: `src/editor/state/documentStore.test.ts`
- Modify: `src/persistence/schema/projectSnapshot.ts`

**Interfaces:**
- Produces: `HolidayLayer`, `HolidayLayerMainStyle`, `HolidayLayerMiniStyle`, `HolidayDateColors`, `EnabledMarkerStyle`.
- Produces: `createDefaultHolidayLayers()`, `addHolidayLayer`, `updateHolidayLayer`, `moveHolidayLayer`, `removeHolidayLayer`, `getHolidayLayer`, `rebindHolidayLayer`.
- Changes: `EditorDocument` gains `holidayLayers: readonly HolidayLayer[]`.

- [ ] **Step 1: Write layer unit tests**

In `src/domain/template/holidayLayer.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { BUILTIN_CHINA_CALENDAR_ID, BUILTIN_JAPAN_CALENDAR_ID } from "../holiday/types";
import {
  addHolidayLayer,
  createDefaultHolidayLayers,
  moveHolidayLayer,
  rebindHolidayLayer,
  removeHolidayLayer,
  updateHolidayLayer,
} from "./holidayLayer";

describe("holidayLayer domain", () => {
  it("creates default layers for China and Japan with unique calendar IDs", () => {
    const layers = createDefaultHolidayLayers();
    expect(layers).toHaveLength(2);
    expect(layers[0].calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
    expect(layers[1].calendarId).toBe(BUILTIN_JAPAN_CALENDAR_ID);
    expect(layers[0].main.showName).toBe(true);
    expect(layers[0].main.holidayMarker.enabled).toBe(true);
    expect(layers[1].main.dateColors.enabled).toBe(true);
  });

  it("enforces 1:1 calendar-to-layer constraint in a template", () => {
    const layers = createDefaultHolidayLayers();
    expect(() => addHolidayLayer(layers, { ...layers[0], id: "layer-new" })).toThrow(/already has a layer/);
  });

  it("supports reordering layers", () => {
    const layers = createDefaultHolidayLayers();
    const moved = moveHolidayLayer(layers, layers[0].id, 1);
    expect(moved[0].calendarId).toBe(BUILTIN_JAPAN_CALENDAR_ID);
    expect(moved[1].calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
  });

  it("supports rebinding a layer to an unassigned calendar", () => {
    const layers = createDefaultHolidayLayers();
    const remapped = rebindHolidayLayer(layers, layers[0].id, "custom-calendar-id");
    expect(remapped[0].calendarId).toBe("custom-calendar-id");
  });

  it("rejects rebinding to an already assigned calendar", () => {
    const layers = createDefaultHolidayLayers();
    expect(() => rebindHolidayLayer(layers, layers[0].id, BUILTIN_JAPAN_CALENDAR_ID)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/domain/template/holidayLayer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/template/holidayLayer.ts`**

```ts
import { BUILTIN_CHINA_CALENDAR_ID, BUILTIN_JAPAN_CALENDAR_ID } from "../holiday/types";
import type { MarkerTemplate, TextElementTemplate } from "./primitives";

export type EnabledMarkerStyle = Readonly<{
  enabled: boolean;
  marker: MarkerTemplate;
}>;

export type HolidayDateColors = Readonly<{
  enabled: boolean;
  holiday: string;
  workday: string;
}>;

export type HolidayLayerMainStyle = Readonly<{
  showName: boolean;
  name: TextElementTemplate;
  holidayMarker: EnabledMarkerStyle;
  workdayMarker: EnabledMarkerStyle;
  dateColors: HolidayDateColors;
}>;

export type HolidayLayerMiniStyle = Readonly<{
  holidayMarker: EnabledMarkerStyle;
  workdayMarker: EnabledMarkerStyle;
  dateColors: HolidayDateColors;
}>;

export type HolidayLayer = Readonly<{
  id: string;
  calendarId: string;
  enabled: boolean;
  main: HolidayLayerMainStyle;
  mini: HolidayLayerMiniStyle;
}>;

export function createDefaultHolidayLayers(): readonly HolidayLayer[] {
  return [
    {
      id: "builtin-cn-layer",
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      enabled: true,
      main: {
        showName: true,
        name: {
          position: { anchor: "bottom-left", offsetX: 10, offsetY: -8 },
          typography: {
            fontId: "default-sans",
            fontSize: 11,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
        holidayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "休",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "班",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#4B5563",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: false,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
      mini: {
        holidayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#6B7280",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: false,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
    },
    {
      id: "builtin-jp-layer",
      calendarId: BUILTIN_JAPAN_CALENDAR_ID,
      enabled: true,
      main: {
        showName: true,
        name: {
          position: { anchor: "bottom-right", offsetX: -10, offsetY: -8 },
          typography: {
            fontId: "default-sans",
            fontSize: 11,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
        holidayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "祝",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#4B5563",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: true,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
      mini: {
        holidayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#6B7280",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: true,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
    },
  ];
}

export function addHolidayLayer(
  layers: readonly HolidayLayer[],
  layer: HolidayLayer,
): readonly HolidayLayer[] {
  if (layers.some((l) => l.calendarId === layer.calendarId)) {
    throw new Error(`Template already has a layer referencing calendar: ${layer.calendarId}`);
  }
  return [...layers, layer];
}

export function updateHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  update: (layer: HolidayLayer) => HolidayLayer,
): readonly HolidayLayer[] {
  return layers.map((l) => (l.id === layerId ? update(l) : l));
}

export function moveHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  direction: -1 | 1,
): readonly HolidayLayer[] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1) return layers;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= layers.length) return layers;
  const next = [...layers];
  const [removed] = next.splice(index, 1);
  next.splice(targetIndex, 0, removed);
  return next;
}

export function removeHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): readonly HolidayLayer[] {
  return layers.filter((l) => l.id !== layerId);
}

export function getHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): HolidayLayer {
  const found = layers.find((l) => l.id === layerId);
  if (!found) throw new Error(`Holiday layer not found: ${layerId}`);
  return found;
}

export function rebindHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  newCalendarId: string,
): readonly HolidayLayer[] {
  if (layers.some((l) => l.id !== layerId && l.calendarId === newCalendarId)) {
    throw new Error(`Calendar ${newCalendarId} is already referenced by another layer in this template.`);
  }
  return updateHolidayLayer(layers, layerId, (layer) => ({ ...layer, calendarId: newCalendarId }));
}
```

- [ ] **Step 4: Update `EditorDocument` and Zod schemas**

In `src/editor/model/types.ts`:
```ts
export type EditorDocument = Readonly<{
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  holidayLayers: readonly HolidayLayer[];
  fontCatalog: FontCatalog;
  pagePreview: PagePreviewConfig;
}>;
```

In `src/domain/template/defaults.ts`:
Update `createDefaultEditorDocument()` to include `holidayLayers: createDefaultHolidayLayers()`.

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- src/domain/template/holidayLayer.test.ts src/editor/state/documentStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/domain/template src/editor/model/types.ts src/editor/state/documentStore.ts
git commit -m "feat: add template-owned holiday layers and defaults"
```

---

### Task 3: Generic holiday resolution and rendering pipeline

**Files:**
- Create: `src/domain/holiday/resolveHolidayIndex.ts`
- Replace: `src/domain/holiday/holidayIndex.ts`
- Modify: `src/domain/holiday/holidayIndex.test.ts`
- Modify: `src/domain/calendar/types.ts`
- Modify: `src/domain/calendar/generateCalendarMonth.ts`
- Modify: `src/rendering/layout/colorRules.ts`
- Modify: `src/rendering/layout/colorRules.test.ts`
- Modify: `src/rendering/layout/mainLayout.ts`
- Modify: `src/rendering/layout/mainLayout.test.ts`
- Modify: `src/rendering/layout/miniLayout.ts`
- Modify: `src/rendering/layout/miniLayout.test.ts`
- Modify: `src/rendering/scene/types.ts`
- Modify: `src/resources/fonts/textRequirements.ts`
- Modify: `src/resources/fonts/textRequirements.test.ts`
- Modify: `src/editor/fonts/useEditorFontEngine.ts`
- Modify: `src/preview/fullYear/renderDocuments.ts`
- Modify: `src/export/formal/renderFormalDocuments.ts`

**Interfaces:**
- Produces: `HolidayOccurrence`, `ResolvedHolidayDate`, `HolidayIndex`.
- Produces: `resolveHolidayIndex({ library, layers }): HolidayIndex`.
- Produces: Dynamic scene nodes for Main name/markers and Mini markers.

- [ ] **Step 1: Write `resolveHolidayIndex` tests**

In `src/domain/holiday/holidayIndex.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createDefaultHolidayLayers } from "../template/holidayLayer";
import { resolveHolidayIndex } from "./resolveHolidayIndex";
import { base, fixtureLibrary } from "./testFixtures";

describe("resolveHolidayIndex", () => {
  it("resolves multi-layer occurrences and later layer date text color override", () => {
    const [cnLayer, jpLayer] = createDefaultHolidayLayers();
    const library = fixtureLibrary({
      baseRecords: [
        base(cnLayer.calendarId, "2027-01-01", "holiday", "元旦"),
        base(jpLayer.calendarId, "2027-01-01", "holiday", "元日"),
      ],
    });

    const index = resolveHolidayIndex({ library, layers: [cnLayer, jpLayer] });
    const resolved = index.get("2027-01-01");
    expect(resolved).toBeDefined();
    expect(resolved?.occurrences).toHaveLength(2);
    expect(resolved?.occurrences[0]).toMatchObject({ calendarId: cnLayer.calendarId, name: "元旦" });
    expect(resolved?.occurrences[1]).toMatchObject({ calendarId: jpLayer.calendarId, name: "元日" });
    expect(resolved?.mainDateColor).toBe(jpLayer.main.dateColors.holiday);
    expect(resolved?.miniDateColor).toBe(jpLayer.mini.dateColors.holiday);
  });
});
```

- [ ] **Step 2: Implement `src/domain/holiday/resolveHolidayIndex.ts`**

```ts
import { toISODate } from "../date/date";
import type { HolidayLayer } from "../template/holidayLayer";
import { resolveEffectiveRecords } from "./effectiveRecords";
import type {
  HolidayLibrarySnapshot,
  HolidayRecordType,
} from "./types";

export type HolidayOccurrence = Readonly<{
  layerId: string;
  calendarId: string;
  type: HolidayRecordType;
  name?: string;
}>;

export type ResolvedHolidayDate = Readonly<{
  occurrences: readonly HolidayOccurrence[];
  mainDateColor?: string;
  miniDateColor?: string;
}>;

export type HolidayIndex = ReadonlyMap<string, ResolvedHolidayDate>;

export function resolveHolidayIndex(args: {
  library: HolidayLibrarySnapshot;
  layers: readonly HolidayLayer[];
}): HolidayIndex {
  const { library, layers } = args;
  const resultMap = new Map<string, {
    occurrences: HolidayOccurrence[];
    mainDateColor?: string;
    miniDateColor?: string;
  }>();

  for (const layer of layers) {
    if (!layer.enabled) continue;
    const effectiveRecords = resolveEffectiveRecords(library, layer.calendarId);

    for (const [isoDate, record] of effectiveRecords) {
      let entry = resultMap.get(isoDate);
      if (!entry) {
        entry = { occurrences: [] };
        resultMap.set(isoDate, entry);
      }

      entry.occurrences.push({
        layerId: layer.id,
        calendarId: layer.calendarId,
        type: record.type,
        ...(record.name ? { name: record.name } : {}),
      });

      if (layer.main.dateColors.enabled) {
        entry.mainDateColor =
          record.type === "holiday"
            ? layer.main.dateColors.holiday
            : layer.main.dateColors.workday;
      }

      if (layer.mini.dateColors.enabled) {
        entry.miniDateColor =
          record.type === "holiday"
            ? layer.mini.dateColors.holiday
            : layer.mini.dateColors.workday;
      }
    }
  }

  return resultMap;
}
```

- [ ] **Step 3: Update `layoutMain` and `layoutMini` to render dynamic layers**

In `mainLayout.ts`:
- Accept `holidayLayers?: readonly HolidayLayer[]`.
- For each cell, iterate `cellData.holiday?.occurrences`.
- Render holiday name if `occurrence.type === "holiday" && occurrence.name && layer.main.showName` with semanticId `main.holiday.${layer.id}.name`.
- Render holiday marker or workday marker if `configured.enabled` with semanticId `main.holiday.${layer.id}.holiday-marker` or `main.holiday.${layer.id}.workday-marker`.

In `miniLayout.ts`:
- Accept `holidayLayers?: readonly HolidayLayer[]`.
- For each cell, iterate `cellData.holiday?.occurrences`.
- Render holiday/workday marker if `configured.enabled` with semanticId `mini.holiday.${layer.id}.holiday-marker` or `mini.holiday.${layer.id}.workday-marker`. Mini never renders names.

- [ ] **Step 4: Update `colorRules.ts`**

Update `resolveDateColor`:
```ts
export function resolveDateColor(
  cell: CalendarCell,
  colors: { default: string; sunday: string; saturday: string },
  target: "main" | "mini" = "main",
): string {
  const holidayColor =
    target === "main" ? cell.holiday?.mainDateColor : cell.holiday?.miniDateColor;
  if (holidayColor) return holidayColor;
  if (cell.dayOfWeek === 0) return colors.sunday;
  if (cell.dayOfWeek === 6) return colors.saturday;
  return colors.default;
}
```

- [ ] **Step 5: Update font text collection and callers**

Update `collectMainFontText` and `collectMiniFontText` to accept `holidayLayers` and collect text across all enabled layers. Update `useEditorFontEngine`, `renderDocuments`, and `renderFormalDocuments`.

- [ ] **Step 6: Run domain, layout, and render tests**

Run: `npm test -- src/domain/holiday src/rendering src/resources/fonts src/preview src/export`
Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/domain/holiday src/domain/calendar src/rendering src/resources/fonts src/editor/fonts src/preview src/export
git commit -m "feat: implement dynamic holiday rendering for Main and Mini"
```

---

### Task 4: Global IndexedDB repository and hydrated store

**Files:**
- Modify: `src/persistence/db/monthloomDb.ts`
- Create: `src/persistence/db/holidayLibraryRepository.ts`
- Create: `src/persistence/db/holidayLibraryRepository.test.ts`
- Create: `src/persistence/schema/holidayLibrarySchema.ts`
- Create: `src/workspace/state/holidayLibraryStore.ts`
- Create: `src/workspace/state/holidayLibraryStore.test.ts`

**Interfaces:**
- Produces: `HolidayLibraryRepository` (`ensureBuiltins`, `getSnapshot`, `applyBaseUpdate`, `putOverride`, `clearOverride`, `deleteCalendar`, `recordSyncFailure`).
- Produces: `useHolidayLibraryStore` (`snapshot`, `status`, `error`, `hydrate`, `refresh`).

- [ ] **Step 1: Write repository tests**

In `src/persistence/db/holidayLibraryRepository.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { BUILTIN_CHINA_CALENDAR_ID, BUILTIN_JAPAN_CALENDAR_ID } from "../../domain/holiday/types";
import { base, overrideUpsert } from "../../domain/holiday/testFixtures";
import { MonthloomDatabase } from "./monthloomDb";
import { HolidayLibraryRepository } from "./holidayLibraryRepository";

describe("HolidayLibraryRepository", () => {
  let db: MonthloomDatabase;
  let repo: HolidayLibraryRepository;

  beforeEach(async () => {
    db = new MonthloomDatabase(`test-holiday-db-${Math.random()}`);
    repo = new HolidayLibraryRepository(db);
    await repo.ensureBuiltins();
  });

  it("seeds built-in China and Japan calendars without duplication", async () => {
    const snapshot = await repo.getSnapshot();
    expect(snapshot.calendars.map((c) => c.id)).toContain(BUILTIN_CHINA_CALENDAR_ID);
    expect(snapshot.calendars.map((c) => c.id)).toContain(BUILTIN_JAPAN_CALENDAR_ID);

    await repo.ensureBuiltins();
    const second = await repo.getSnapshot();
    expect(second.calendars).toHaveLength(2);
  });

  it("applies atomic base updates and preserves manual overrides", async () => {
    await repo.putOverride(overrideUpsert(BUILTIN_CHINA_CALENDAR_ID, "2027-01-01", "holiday", "My New Year"));
    await repo.applyBaseUpdate({
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      records: [base(BUILTIN_CHINA_CALENDAR_ID, "2027-01-01", "holiday", "元旦")],
      replacementRanges: [{ start: { year: 2027, month: 1, day: 1 }, end: { year: 2027, month: 12, day: 31 } }],
      coverage: [{
        id: `${BUILTIN_CHINA_CALENDAR_ID}:2027`,
        calendarId: BUILTIN_CHINA_CALENDAR_ID,
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
        status: "confirmed",
        source: "sync",
        updatedAt: "2026-08-28T00:00:00.000Z",
      }],
    });

    const snapshot = await repo.getSnapshot();
    expect(snapshot.overrides).toHaveLength(1);
    expect(snapshot.baseRecords).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Update `MonthloomDatabase` in `src/persistence/db/monthloomDb.ts`**

Switch db name to `MonthloomDB-v2` and add table definitions:
```ts
holidayCalendars!: EntityTable<HolidayCalendar, "id">;
holidayBaseRecords!: EntityTable<HolidayBaseRecord, "id">;
holidayOverrides!: EntityTable<HolidayOverride, "id">;
holidayCoverage!: EntityTable<HolidayCoverage, "id">;
holidaySyncStates!: EntityTable<HolidaySyncState, "calendarId">;
```
Add to `.stores({...})`.

- [ ] **Step 3: Implement `HolidayLibraryRepository` in `src/persistence/db/holidayLibraryRepository.ts`**

Implement atomic methods with Dexie transactions:
- `ensureBuiltins()`
- `getSnapshot(): Promise<HolidayLibrarySnapshot>`
- `applyBaseUpdate(update: HolidayBaseUpdate, syncState?: HolidaySyncState): Promise<void>`
- `putOverride(override: HolidayOverride): Promise<void>`
- `clearOverride(calendarId: string, date: LocalDate): Promise<void>`
- `deleteCalendar(calendarId: string): Promise<void>`
- `recordSyncFailure(calendarId: string, errorMessage: string, attemptedAt: string): Promise<void>`

- [ ] **Step 4: Implement `src/workspace/state/holidayLibraryStore.ts`**

Create Zustand store:
```ts
export type HolidayLibraryStore = {
  snapshot: HolidayLibrarySnapshot;
  status: "idle" | "loading" | "ready" | "error";
  error: Error | null;
  hydrate: (repository?: HolidayLibraryRepository) => Promise<void>;
  refresh: (repository?: HolidayLibraryRepository) => Promise<void>;
};
```

- [ ] **Step 5: Run persistence & store tests**

Run: `npm test -- src/persistence/db/holidayLibraryRepository.test.ts src/workspace/state/holidayLibraryStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/persistence/db src/persistence/schema/holidayLibrarySchema.ts src/workspace/state/holidayLibraryStore.ts
git commit -m "feat: implement global holiday library persistence and store"
```

---

### Task 5: Synchronization, Monthloom JSON exchange, and operations

**Files:**
- Modify: `src/domain/holiday/adapters/chinaTimorHolidayAdapter.ts`
- Modify: `src/domain/holiday/adapters/chinaTimorHolidayAdapter.test.ts`
- Modify: `src/domain/holiday/adapters/japanHolidaysJpAdapter.ts`
- Modify: `src/domain/holiday/adapters/japanHolidaysJpAdapter.test.ts`
- Create: `src/domain/holiday/monthloomJson.ts`
- Create: `src/domain/holiday/monthloomJson.test.ts`
- Create: `src/workspace/holiday/holidayLibraryOperations.ts`
- Create: `src/workspace/holiday/holidayLibraryOperations.test.ts`

**Interfaces:**
- Produces: `fetchChinaHolidayYear`, `fetchJapanHolidayYear`, `normalizeChinaTimorHolidayYear`, `normalizeJapanHolidaysJp`.
- Produces: `parseMonthloomHolidayJson`, `serializeMonthloomHolidayJson`.
- Produces: `HolidayLibraryOperations` class for sync, import, manual single date / date range add, edit, delete, restore, and coverage confirmation.

- [ ] **Step 1: Write provider adapters and Monthloom JSON tests**

In `src/domain/holiday/monthloomJson.test.ts`:
Test strict format validation, duplicate dates rejection, and roundtrip serialization.

In `src/workspace/holiday/holidayLibraryOperations.test.ts`:
Test `prepareSyncYear`, `applyPreparedUpdate`, `upsertManualDateRange`, `deleteRecord`, `restoreSourceRecord`, and `deleteCalendar` (verifying template reference checks).

- [ ] **Step 2: Implement adapters and direct browser fetch in `chinaTimorHolidayAdapter.ts` & `japanHolidaysJpAdapter.ts`**

Implement `fetchChinaHolidayYear(year, fetchImpl)` and `fetchJapanHolidayYear(year, fetchImpl)` converting response to `HolidayBaseUpdate`.

- [ ] **Step 3: Implement `src/domain/holiday/monthloomJson.ts`**

Strict Zod schema validating format `"monthloom-holidays"`, version `1`, unique dates, and valid ISO strings.
Export:
```ts
export function parseMonthloomHolidayJson(raw: unknown): MonthloomHolidayExchange;
export function serializeMonthloomHolidayJson(args: {
  calendar: HolidayCalendar;
  records: readonly EffectiveHolidayRecord[];
  coverage?: readonly HolidayCoverage[];
}): string;
```

- [ ] **Step 4: Implement `src/workspace/holiday/holidayLibraryOperations.ts`**

Include:
- `createCalendar(name: string): Promise<HolidayCalendar>`
- `renameCalendar(calendarId: string, name: string): Promise<void>` (reject built-ins)
- `deleteCalendar(calendarId: string): Promise<void>` (check active doc, saved templates in `db.templates`, saved projects in `db.projects`)
- `prepareSyncYear(calendarId: string, year: number, fetchImpl?: typeof fetch): Promise<PreparedHolidayUpdate>`
- `prepareMonthloomImport(raw: unknown): Promise<PreparedHolidayUpdate>`
- `prepareProviderImport(calendarId: string, provider: HolidayProviderId, year: number, raw: unknown): Promise<PreparedHolidayUpdate>`
- `applyPreparedUpdate(prepared: PreparedHolidayUpdate): Promise<HolidayChangeSummary>`
- `upsertManualRecord(input: ManualHolidayRecordInput): Promise<void>`
- `upsertManualDateRange(input: ManualHolidayDateRangeInput): Promise<void>` (iterates `start` to `end` via `addDays`/`compareDate`)
- `deleteRecord(calendarId: string, date: LocalDate): Promise<void>`
- `restoreSourceRecord(calendarId: string, date: LocalDate): Promise<void>`
- `markCoverageConfirmed(calendarId: string, range: DateRange): Promise<void>`

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- src/domain/holiday/adapters src/domain/holiday/monthloomJson.test.ts src/workspace/holiday/holidayLibraryOperations.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/domain/holiday src/workspace/holiday
git commit -m "feat: implement holiday synchronization, JSON exchange, and operations"
```

---

### Task 6: Global holiday-library management UI

**Files:**
- Create: `src/workspace/components/HolidayLibraryPanel.tsx`
- Create: `src/workspace/components/HolidayCalendarList.tsx`
- Create: `src/workspace/components/HolidayCalendarDetail.tsx`
- Create: `src/workspace/components/HolidayRecordDialog.tsx`
- Create: `src/workspace/components/holiday-library.css`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `useHolidayLibraryStore`, `HolidayLibraryOperations`.
- Produces: Complete, accessible Holiday Library management card/panel.

- [ ] **Step 1: Write UI unit tests for modal validation and action dispatch**

Test `HolidayRecordDialog` validating ISO dates, switching between single date and date range, and submitting `upsertManualRecord` / `upsertManualDateRange`.

- [ ] **Step 2: Implement `HolidayLibraryPanel.tsx` and child components**

- Left list (`HolidayCalendarList`): built-in/custom calendars, record count, current target year coverage badge (`confirmed`/`unconfirmed`/`unknown`), "Add Calendar" button.
- Right detail (`HolidayCalendarDetail`):
  - Calendar name header (rename button for custom).
  - Sync state status (last sync time/status).
  - Coverage banner with "Mark Confirmed" button.
  - Action bar: Year selector, Sync year (China/Japan), Import raw JSON (China/Japan), Import Monthloom JSON, Export Monthloom JSON, Add Date, Add Date Range.
  - Record table: Date, Type badge (`holiday` / `workday`), Name, Provenance badge (`数据源记录`, `人工修改`, `人工新增`), Edit, Delete, and Restore Source buttons.
  - Summary Confirmation Dialog before applying sync/import.

- [ ] **Step 3: Implement `HolidayRecordDialog.tsx`**

Tabs/toggle for "Single Date" vs "Date Range":
- Single Date: Date input, Type radio (`holiday` / `workday`), Name input.
- Date Range: Start Date input, End Date input, Type radio, Name input.

- [ ] **Step 4: Add complete bilingual localization in `zh.ts` & `en.ts`**

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- src/workspace/components src/shared/i18n`
Expected: PASS.

- [ ] **Step 6: Commit Task 6**

```bash
git add src/workspace/components src/shared/i18n
git commit -m "feat: implement global holiday library management UI"
```

---

### Task 7: Dynamic holiday semantic IDs and editor bindings

**Files:**
- Create: `src/editor/model/holidaySemanticId.ts`
- Create: `src/editor/model/holidaySemanticId.test.ts`
- Modify: `src/editor/model/types.ts`
- Modify: `src/editor/model/templateBindings.ts`
- Modify: `src/editor/model/templateBindings.test.ts`
- Modify: `src/editor/interaction/drag.ts`
- Modify: `src/editor/interaction/drag.test.ts`
- Modify: `src/editor/selection/hitTargets.ts`
- Modify: `src/editor/selection/hitTargets.test.ts`

**Interfaces:**
- Produces: `HolidaySemanticId`, `buildHolidaySemanticId`, `parseHolidaySemanticId`.
- Updates `EditableSemanticId` and `PositionableSemanticId` to include dynamic holiday IDs.
- Updates `getElementPosition`, `setElementPosition`, `getTypography`, `setTypography`, `applyDragCommit`.

- [ ] **Step 1: Write semantic ID parser and template binding tests**

In `src/editor/model/holidaySemanticId.test.ts`:
Test `buildHolidaySemanticId` and `parseHolidaySemanticId` roundtrips for `main` and `mini` (rejecting mini name IDs).

In `src/editor/model/templateBindings.test.ts`:
Test getting and setting position, typography, and markers for dynamic layer elements.

- [ ] **Step 2: Implement `src/editor/model/holidaySemanticId.ts`**

```ts
export type HolidayLayerElement =
  | "name"
  | "holiday-marker"
  | "workday-marker"
  | "date-colors";

export type HolidaySemanticId =
  | `main.holiday.${string}.${HolidayLayerElement}`
  | `mini.holiday.${string}.${Exclude<HolidayLayerElement, "name">}`;

export function buildHolidaySemanticId(
  target: "main" | "mini",
  layerId: string,
  element: HolidayLayerElement,
): HolidaySemanticId {
  if (target === "mini" && element === "name") {
    throw new Error("Mini calendars do not support holiday names.");
  }
  return `${target}.holiday.${layerId}.${element}` as HolidaySemanticId;
}

export function parseHolidaySemanticId(id: string): {
  target: "main" | "mini";
  layerId: string;
  element: HolidayLayerElement;
} | null {
  const parts = id.split(".");
  if (parts.length !== 4 || parts[1] !== "holiday") return null;
  const target = parts[0];
  const layerId = parts[2];
  const element = parts[3] as HolidayLayerElement;
  if (target !== "main" && target !== "mini") return null;
  if (target === "mini" && element === "name") return null;
  return { target, layerId, element };
}
```

- [ ] **Step 3: Update `templateBindings.ts` for dynamic holiday routing**

Add branches for `parseHolidaySemanticId(semanticId)` in `getElementPosition`, `setElementPosition`, `getTypography`, `setTypography`.

- [ ] **Step 4: Update `hitTargets.ts` and `drag.ts`**

Verify dynamic nodes generate hit targets and calculate anchor-relative drag deltas cleanly.

- [ ] **Step 5: Run tests and verify PASS**

Run: `npm test -- src/editor/model src/editor/interaction src/editor/selection`
Expected: PASS.

- [ ] **Step 6: Commit Task 7**

```bash
git add src/editor/model src/editor/interaction src/editor/selection
git commit -m "feat: support dynamic holiday semantic IDs and template bindings"
```

---

### Task 8: Holiday layer tree and inspector UI

**Files:**
- Create: `src/editor/components/HolidayLayerTree.tsx`
- Create: `src/editor/components/HolidayLayerInspector.tsx`
- Create: `src/editor/components/HolidayDateColorInspector.tsx`
- Modify: `src/editor/components/TemplateEditor.tsx`
- Modify: `src/editor/components/Inspector.tsx`
- Modify: `src/editor/components/MarkerInspector.tsx`
- Modify: `src/editor/components/editor.css`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces: `HolidayLayerTree` with reorder handles, enable/disable toggle, remove, missing calendar indicator, and rebind select.
- Produces: `HolidayLayerInspector` for Name, Holiday Marker, Workday Marker, Date Colors.

- [ ] **Step 1: Implement `HolidayLayerTree.tsx`**

- Collapsible "Holiday Layers" group in the left editor sidebar.
- "Add Layer" (+) button with dropdown filtering out calendars already in the template.
- Layer rows displaying calendar name, missing calendar warning badge if not found in library, "Rebind" select, toggle visibility, drag handle, up/down buttons, and delete layer button.
- Expandable child items:
  - Main: Name (with text icon), Holiday Marker (休 icon), Workday Marker (班 icon), Date Colors (palette icon).
  - Mini: Holiday Marker, Workday Marker, Date Colors.
- Clicking canvas element selects corresponding layer child item.

- [ ] **Step 2: Implement `HolidayLayerInspector.tsx` and `HolidayDateColorInspector.tsx`**

- When `name` selected: `showName` checkbox, `PositionInspector`, `TypographyInspector`.
- When `holiday-marker` or `workday-marker` selected: `enabled` toggle, `MarkerInspector` (text/image, size, position, typography/asset).
- When `date-colors` selected: `HolidayDateColorInspector` (`enabled` toggle, holiday color picker, workday color picker).

- [ ] **Step 3: Integrate into `TemplateEditor.tsx` and `Inspector.tsx`**

Replace static holiday items in `TemplateEditor` layers list with `HolidayLayerTree`. Route dynamic selections in `Inspector` to `HolidayLayerInspector`.

- [ ] **Step 4: Run editor and i18n tests**

Run: `npm test -- src/editor src/shared/i18n`
Expected: PASS.

- [ ] **Step 5: Commit Task 8**

```bash
git add src/editor src/shared/i18n
git commit -m "feat: implement holiday layer tree and inspector in editor"
```

---

### Task 9: Project/template schemas and full-library bundles

**Files:**
- Modify: `src/persistence/schema/projectSnapshot.ts`
- Modify: `src/persistence/schema/templateSnapshot.ts`
- Modify: `src/persistence/schema/validation.ts`
- Modify: `src/persistence/schema/snapshot.test.ts`
- Modify: `src/persistence/operations/projectOperations.ts`
- Modify: `src/persistence/bundle/manifest.ts`
- Modify: `src/persistence/bundle/exportBundle.ts`
- Modify: `src/persistence/bundle/importBundle.ts`
- Modify: `src/persistence/bundle/bundle.test.ts`
- Modify: `src/persistence/assets/referencedAssets.ts`
- Modify: `src/persistence/assets/remapAssets.ts`
- Modify: `src/persistence/components/PersistenceControls.tsx`

**Interfaces:**
- Clean project snapshot without `chinaHolidayDataset` or `japanHolidayDataset`.
- Bundle manifest v2: project bundle contains `holiday-library.json`; template bundle does not.
- Non-destructive library merge on project import with conflict summary reporting.

- [ ] **Step 1: Write snapshot and bundle roundtrip tests**

In `src/persistence/schema/snapshot.test.ts`:
Verify `ProjectSnapshotV1` contains `document.holidayLayers` and no fixed holiday dataset fields.

In `src/persistence/bundle/bundle.test.ts`:
Verify project bundle contains `holiday-library.json`, imports non-destructively, keeps local overrides on conflict, and reports `skippedManualConflicts`. Verify template bundle contains no `holiday-library.json`.

- [ ] **Step 2: Update snapshot schemas**

Remove `chinaHolidayDataset` and `japanHolidayDataset` from `ProjectSnapshotV1` and its Zod schema.

- [ ] **Step 3: Update `collectReferencedAssetIds` and `remapDocumentAssetIds`**

Iterate `document.holidayLayers` and extract/remap image asset IDs from Main and Mini markers.

- [ ] **Step 4: Update bundle manifest, export, and import**

In `exportBundle.ts`:
For project bundles, load snapshot from `HolidayLibraryRepository` and write `holiday-library.json`.

In `importBundle.ts`:
For project bundles, validate `holiday-library.json`, load local library snapshot, execute `mergeHolidayLibraries(local, incoming)`, and save assets, project, and merged holiday tables inside a single Dexie `rw` transaction.

In `PersistenceControls.tsx`:
Display the spec notice: "项目包将包含 Monthloom 中的完整节假日资料库，以便在其他设备上继续使用。"

- [ ] **Step 5: Run persistence tests**

Run: `npm test -- src/persistence`
Expected: PASS.

- [ ] **Step 6: Commit Task 9**

```bash
git add src/persistence
git commit -m "feat: bundle full holiday library with projects and merge on import"
```

---

### Task 10: Application, workspace, preview, and export integration

**Files:**
- Modify: `src/workspace/state/workspaceStore.ts`
- Modify: `src/workspace/state/workspaceStore.test.ts`
- Replace: `src/workspace/holiday/holidayWorkspace.ts`
- Modify: `src/workspace/holiday/holidayWorkspace.test.ts`
- Delete: `src/workspace/holiday/importHolidayJson.ts`
- Delete: `src/workspace/holiday/importHolidayJson.test.ts`
- Delete: `src/workspace/components/HolidayImportControls.tsx`
- Modify: `src/workspace/components/WorkspaceControls.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/preview/fullYear/FullYearPreview.tsx`
- Modify: `src/preview/fullYear/FullYearPreview.test.tsx`
- Modify: `src/export/components/BatchExportPanel.tsx`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Workspace store holds project meta and target year only.
- `App.tsx` hydrates `holidayLibraryStore`, derives single `holidayIndex` and coverage diagnostics, and mounts `HolidayLibraryPanel`.
- Editor, preview, and export consume identical `holidayIndex` and `document.holidayLayers`.

- [ ] **Step 1: Clean up `workspaceStore.ts`**

Remove `chinaHolidayDataset` and `japanHolidayDataset`. Workspace state holds:
```ts
export type WorkspaceState = {
  currentProjectId: string | null;
  projectName: string;
  targetYear: number;
  setProjectInfo: (id: string | null, name: string) => void;
  setTargetYear: (year: number) => void;
  resetWorkspace: () => void;
  loadWorkspace: (data: { projectId: string; projectName: string; targetYear: number }) => void;
};
```

- [ ] **Step 2: Update `holidayWorkspace.ts`**

Export:
```ts
export function getWorkspaceHolidayDiagnostics(args: {
  targetYear: number;
  library: HolidayLibrarySnapshot;
  layers: readonly HolidayLayer[];
}): readonly HolidayDiagnostic[];
```

- [ ] **Step 3: Integrate in `App.tsx`**

- Call `useHolidayLibraryStore.getState().hydrate()` in an initial effect.
- Derive `holidayIndex`:
  ```ts
  const holidayLibrary = useHolidayLibraryStore((s) => s.snapshot);
  const holidayIndex = useMemo(
    () => resolveHolidayIndex({ library: holidayLibrary, layers: document.holidayLayers }),
    [holidayLibrary, document.holidayLayers],
  );
  ```
- Derive diagnostics from targetYear, holidayLibrary, and document.holidayLayers.
- Mount `<HolidayLibraryPanel />` in the workspace view.

- [ ] **Step 4: Pass `holidayIndex` and `document.holidayLayers` to `FullYearPreview` and `BatchExportPanel`**

- [ ] **Step 5: Run integration tests and full build**

Run: `npm test -- src/app src/workspace src/preview src/export`
Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit Task 10**

```bash
git add src/app src/workspace src/preview src/export src/shared/i18n
git commit -m "feat: wire global holiday library into app, preview, and batch export"
```

---

### Task 11: Remove fixed holiday fields and update verification/docs

**Files:**
- Modify: `src/domain/template/mainTemplate.ts`
- Modify: `src/domain/template/miniTemplate.ts`
- Modify: `src/domain/template/defaults.ts`
- Modify: `src/editor/state/documentStore.ts`
- Modify: `src/editor/components/ColorInspector.tsx`
- Modify: all remaining files returned by `rg -n "chinaHoliday|japanHoliday|chinaMarkers|holidayDot|workdayDot|chinaHolidayDataset|japanHolidayDataset" src`
- Modify: `docs/user/holiday-json.md`
- Modify: `docs/user/backup-and-recovery.md`
- Modify: `docs/user/getting-started.md`
- Modify: relevant `src/verification/**` fixtures

**Interfaces:**
- Clean repository with zero legacy China/Japan template slots or workspace fields.
- Updated user documentation.

- [ ] **Step 1: Scan for legacy fields**

Run:
```bash
rg -n "chinaHoliday|japanHoliday|chinaMarkers|holidayDot|workdayDot|chinaHolidayDataset|japanHolidayDataset" src
```

- [ ] **Step 2: Clean up legacy template fields**

In `mainTemplate.ts`: remove `chinaHolidayName`, `japanHolidayName`, `chinaMarkers`, and `japanHoliday` color.
In `miniTemplate.ts`: remove `markers`, and `japanHoliday` color.
`CalendarBaseColors` is `{ default: string; sunday: string; saturday: string }`.

- [ ] **Step 3: Update verification fixtures and user documentation**

Update `holiday-json.md`, `backup-and-recovery.md`, `getting-started.md`.

- [ ] **Step 4: Run complete verification**

Run: `npm test`
Expected: All tests pass.

Run: `npm run build`
Expected: TypeScript and Vite production bundle pass.

- [ ] **Step 5: Verify no compatibility or legacy residue remains**

Run:
```bash
rg -n "legacy|migrate|migration|version === 0|chinaHolidayDataset|japanHolidayDataset" src
git diff --check
```
Expected: No matches in application logic; clean git diff.

- [ ] **Step 6: Commit Task 11**

```bash
git add src docs/user
git commit -m "chore: clean up fixed holiday legacy fields and update documentation"
```

---

## Final Verification Checklist

1. [ ] **Test Suite**: Run `npm test` — all test files pass.
2. [ ] **Typecheck & Production Build**: Run `npm run build` — `tsc -b` and Vite bundle succeed.
3. [ ] **Formal Output Invariant**: Run `npm test -- src/domain/calendar/monthSequence.test.ts src/export/formal src/preview/fullYear/calendarSet.test.ts` — exactly 13 Main + 15 Mini = 28 SVGs.
4. [ ] **Timezone Invariant**: Run `rg -n "new Date\([^)]*,[^)]*,[^)]*\)" src/domain src/workspace src/rendering` — no browser-local date arithmetic.
5. [ ] **Architecture Boundary**: Run `rg -n "chinaHolidayDataset|japanHolidayDataset|main\.chinaHoliday|main\.japanHoliday|mini\.holidayDot|mini\.workdayDot" src` — no legacy slots exist.
