# Holiday Library and Dynamic Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed China/Japan holiday slots with a global SSOT holiday library, accumulating multi-year data and driving ordered, template-owned holiday layers across Main, Mini, preview, and formal export.

**Architecture:** IndexedDB stores long-lived holiday calendars, source baselines, manual overrides, and coverage independently from projects. `EditorDocument.holidayLayers` stores ordered visual rules that reference global calendar IDs; a pure resolver combines effective records and ordered layers into the single `HolidayIndex` consumed by calendar generation and rendering.

**Tech Stack:** React 18, TypeScript 5.6, Zustand 5, Zundo, Dexie 4, Zod 4, Vitest 2, Testing Library, JSZip, Vite 6

**Spec:** `docs/superpowers/specs/2026-08-28-holiday-library-and-layers-design.md`

## Global Constraints

- Preserve the formal output invariant: 13 Main + 15 Mini = exactly 28 SVG files.
- Use `LocalDate` and UTC date helpers only; never introduce browser-local date arithmetic.
- Keep `layoutMain` and `layoutMini` as the only geometry authorities; preview and export consume identical scenes/documents.
- The global holiday library is the runtime SSOT; projects do not hold holiday-record copies.
- Template snapshots include holiday-layer design but no holiday records.
- Project bundles include the complete global holiday library automatically; template bundles do not.
- Manual holiday overrides always beat synchronized or imported baselines.
- Later holiday layers override earlier layers only for date text color; all enabled names and markers remain visible.
- Mini never renders holiday names.
- Do not add overlap detection or overlap warnings.
- Do not implement backward compatibility, legacy snapshot readers, database migrations, or dual-write compatibility logic.
- Do not add dependencies.
- Unit-test domain, persistence, rendering, and shared behavior; do not add tests for visual-only UI details.
- Do not launch a browser for validation unless the user explicitly requests it.

---

## File Structure

### New domain modules

- `src/domain/holiday/effectiveRecords.ts` — resolve source baselines plus manual overrides.
- `src/domain/holiday/resolveHolidayIndex.ts` — combine effective records with ordered layers.
- `src/domain/holiday/monthloomJson.ts` — validate the public per-calendar interchange format.
- `src/domain/template/holidayLayer.ts` — holiday-layer visual types and immutable helpers.

### New persistence and application modules

- `src/persistence/db/holidayLibraryRepository.ts` — global library repository and atomic base/override writes.
- `src/persistence/schema/holidayLibrarySchema.ts` — Zod schemas for stored library snapshots.
- `src/workspace/holiday/holidayLibraryOperations.ts` — synchronization, import, manual edit, and restore workflows.
- `src/workspace/state/holidayLibraryStore.ts` — hydrated global library state for React consumers.

### New UI modules

- `src/workspace/components/HolidayLibraryPanel.tsx` — global library entry and calendar list.
- `src/workspace/components/HolidayCalendarList.tsx` — selectable built-in/custom calendar list.
- `src/workspace/components/HolidayCalendarDetail.tsx` — year-filtered records and actions.
- `src/workspace/components/HolidayRecordDialog.tsx` — manual add/edit form.
- `src/editor/model/holidaySemanticId.ts` — dynamic semantic-ID construction and parsing.
- `src/editor/components/HolidayLayerTree.tsx` — ordered expandable holiday layers.
- `src/editor/components/HolidayLayerInspector.tsx` — Main/Mini layer style editor.
- `src/editor/components/HolidayDateColorInspector.tsx` — per-type date-color settings.

### Existing modules with major changes

- `src/domain/holiday/types.ts`, adapters, coverage, and holiday-index tests.
- `src/domain/template/mainTemplate.ts`, `miniTemplate.ts`, `defaults.ts`, and editor document types.
- `src/rendering/layout/mainLayout.ts`, `miniLayout.ts`, `colorRules.ts`, and scene semantic IDs.
- `src/resources/fonts/textRequirements.ts` and editor/preview font requirement callers.
- `src/editor/model/templateBindings.ts`, selection, dragging, inspector, and layer tree.
- `src/persistence/db/monthloomDb.ts`, snapshot schemas, bundle import/export, and asset traversal.
- `src/workspace/state/workspaceStore.ts`, `src/app/App.tsx`, preview, and formal export entry points.
- `src/shared/i18n/types.ts` and both locale dictionaries.

---

### Task 1: Canonical holiday-library types and effective records

**Files:**
- Modify: `src/domain/holiday/types.ts`
- Create: `src/domain/holiday/effectiveRecords.ts`
- Create: `src/domain/holiday/effectiveRecords.test.ts`
- Create: `src/domain/holiday/testFixtures.ts`
- Modify: `src/domain/holiday/coverage.ts`
- Modify: `src/domain/holiday/coverage.test.ts`

**Interfaces:**
- Produces: `HolidayCalendar`, `HolidayBaseRecord`, `HolidayOverride`, `HolidayCoverage`, `HolidaySyncState`, `HolidayLibrarySnapshot`, `EffectiveHolidayRecord`.
- Produces: `holidayRecordId(calendarId, date)`, `resolveEffectiveRecords(library, calendarId)`.
- Consumes: `LocalDate`, `DateRange`, `toISODate`, and current UTC date helpers.

- [ ] **Step 1: Replace the country-shaped test fixtures with baseline/override cases**

Create reusable test builders so later tasks do not invent incompatible fixtures:

```ts
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

Each builder uses `holidayRecordId`, `mustDate`, and the fixed timestamp `2026-08-28T00:00:00.000Z`.

```ts
it("keeps a manual modification when the synchronized baseline changes", () => {
  const library = fixtureLibrary({
    baseRecords: [base("cn", "2027-01-01", "holiday", "元旦")],
    overrides: [overrideUpsert("cn", "2027-01-01", "holiday", "New Year")],
  });

  expect(resolveEffectiveRecords(library, "cn").get("2027-01-01")).toMatchObject({
    type: "holiday",
    name: "New Year",
    provenance: "manual-modified",
  });
});

it("keeps a manual deletion hidden after the baseline is refreshed", () => {
  const library = fixtureLibrary({
    baseRecords: [base("cn", "2027-02-06", "workday")],
    overrides: [overrideDelete("cn", "2027-02-06")],
  });

  expect(resolveEffectiveRecords(library, "cn").has("2027-02-06")).toBe(false);
});
```

- [ ] **Step 2: Run the focused tests and verify the new interface is missing**

Run: `npm test -- src/domain/holiday/effectiveRecords.test.ts`

Expected: FAIL because `effectiveRecords.ts` and the canonical types do not exist.

- [ ] **Step 3: Define the canonical types and record-ID invariant**

Add these canonical exports alongside the still-referenced development-era `HolidayDataset` types so focused work remains executable. New code must use only the canonical types; Task 11 deletes the obsolete exports after Task 10 switches every caller. This is implementation staging, not a supported compatibility path.

```ts
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

export function holidayRecordId(calendarId: string, date: LocalDate): string {
  return `${calendarId}:${toISODate(date)}`;
}
```

- [ ] **Step 4: Implement the pure effective-record resolver**

```ts
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

- [ ] **Step 5: Add generic coverage diagnostics away from provider names**

Add the generic function below. Keep the existing provider-shaped function only until Task 10 switches workspace callers; Task 11 deletes it.

```ts
export function createCalendarCoverageDiagnostics(args: {
  calendar: HolidayCalendar;
  requiredRange: DateRange;
  coverage: readonly HolidayCoverage[];
}): readonly HolidayDiagnostic[];
```

Test confirmed, unconfirmed, and absent ranges. Missing or future coverage must produce warnings, not errors.

- [ ] **Step 6: Run the focused holiday-domain tests**

Run: `npm test -- src/domain/holiday/effectiveRecords.test.ts src/domain/holiday/coverage.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the canonical model**

```bash
git add src/domain/holiday/types.ts src/domain/holiday/effectiveRecords.ts src/domain/holiday/effectiveRecords.test.ts src/domain/holiday/testFixtures.ts src/domain/holiday/coverage.ts src/domain/holiday/coverage.test.ts
git commit -m "refactor: define global holiday library domain"
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
- Produces: `createDefaultHolidayLayers()` and immutable layer helpers.
- Changes: `EditorDocument` gains `holidayLayers: readonly HolidayLayer[]`.

- [ ] **Step 1: Write tests for one-to-one membership and default layers**

```ts
it("creates one China layer and one Japan layer with unique calendar IDs", () => {
  const layers = createDefaultHolidayLayers();
  expect(layers.map((layer) => layer.calendarId)).toEqual([
    BUILTIN_CHINA_CALENDAR_ID,
    BUILTIN_JAPAN_CALENDAR_ID,
  ]);
  expect(new Set(layers.map((layer) => layer.calendarId)).size).toBe(2);
});

it("rejects adding the same calendar twice to one template", () => {
  const layers = createDefaultHolidayLayers();
  expect(() => addHolidayLayer(layers, layers[0])).toThrow(/already has a layer/);
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/domain/template/holidayLayer.test.ts`

Expected: FAIL because the layer module is missing.

- [ ] **Step 3: Define the final layer interface**

```ts
export type EnabledMarkerStyle = Readonly<{
  enabled: boolean;
  marker: MarkerTemplate;
}>;

export type HolidayDateColors = Readonly<{
  enabled: boolean;
  holiday: string;
  workday: string;
}>;

export type HolidayLayer = Readonly<{
  id: string;
  calendarId: string;
  enabled: boolean;
  main: Readonly<{
    showName: boolean;
    name: TextElementTemplate;
    holidayMarker: EnabledMarkerStyle;
    workdayMarker: EnabledMarkerStyle;
    dateColors: HolidayDateColors;
  }>;
  mini: Readonly<{
    holidayMarker: EnabledMarkerStyle;
    workdayMarker: EnabledMarkerStyle;
    dateColors: HolidayDateColors;
  }>;
}>;
```

Keep the layer array at `EditorDocument.holidayLayers`, because Main and Mini share ordering while owning independent style branches.

- [ ] **Step 4: Add immutable layer helpers**

```ts
export function addHolidayLayer(
  layers: readonly HolidayLayer[],
  layer: HolidayLayer,
): readonly HolidayLayer[];

export function updateHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  update: (layer: HolidayLayer) => HolidayLayer,
): readonly HolidayLayer[];

export function moveHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  direction: -1 | 1,
): readonly HolidayLayer[];

export function removeHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): readonly HolidayLayer[];

export function getHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): HolidayLayer;

export function rebindHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  calendarId: string,
): readonly HolidayLayer[];
```

- [ ] **Step 5: Add China/Japan default layers to the default editor document**

Use fixed calendar IDs and stable layer IDs. Preserve the recognizable current design: China names bottom-left with `休`/`班` markers; Japan names bottom-right with holiday date coloring; Mini uses compact colored text markers and never contains a name style.

```ts
return {
  mainTemplate,
  miniTemplate,
  holidayLayers: createDefaultHolidayLayers(),
  fontCatalog: DEFAULT_FONT_CATALOG,
  pagePreview: DEFAULT_PAGE_PREVIEW_CONFIG,
};
```

- [ ] **Step 6: Extend the editor-document Zod schema with dynamic layers**

Define schemas for `MarkerTemplate`, `HolidayDateColors`, and `HolidayLayer`; require `holidayLayers` in `editorDocumentSchema`. Do not add a fallback or legacy transform.

```ts
const holidayDateColorsSchema = z.object({
  enabled: z.boolean(),
  holiday: z.string(),
  workday: z.string(),
});

const holidayLayerSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  enabled: z.boolean(),
  main: holidayLayerMainStyleSchema,
  mini: holidayLayerMiniStyleSchema,
});

export const editorDocumentSchema = z.object({
  mainTemplate: mainTemplateSchema,
  miniTemplate: miniTemplateSchema,
  holidayLayers: z.array(holidayLayerSchema),
  fontCatalog: fontCatalogSchema,
  pagePreview: pagePreviewConfigSchema,
});
```

- [ ] **Step 7: Run template and document-store tests**

Run: `npm test -- src/domain/template/holidayLayer.test.ts src/domain/template/template.test.ts src/editor/state/documentStore.test.ts src/persistence/schema/snapshot.test.ts`

Expected: PASS after fixtures include `holidayLayers`.

- [ ] **Step 8: Commit the layer model**

```bash
git add src/domain/template src/editor/model/types.ts src/editor/state/documentStore.ts src/editor/state/documentStore.test.ts src/persistence/schema/projectSnapshot.ts src/persistence/schema/snapshot.test.ts
git commit -m "feat: add template-owned holiday layers"
```

---

### Task 3: Generic holiday resolution and rendering

**Files:**
- Create: `src/domain/holiday/resolveHolidayIndex.ts`
- Replace: `src/domain/holiday/holidayIndex.ts`
- Modify: `src/domain/holiday/holidayIndex.test.ts`
- Modify: `src/domain/calendar/types.ts`
- Modify: `src/domain/calendar/generateCalendarMonth.ts`
- Modify: `src/domain/calendar/calendarDomain.integration.test.ts`
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
- Modify: `src/preview/fullYear/fontRequirements.ts`
- Modify: `src/preview/fullYear/renderDocuments.ts`
- Modify: `src/export/formal/renderFormalDocuments.ts`

**Interfaces:**
- Consumes: `HolidayLibrarySnapshot`, `HolidayLayer`, `resolveEffectiveRecords`.
- Produces: `resolveHolidayIndex({ library, layers }): HolidayIndex`.
- Produces: generic dynamic scene semantic IDs containing the layer ID.

- [ ] **Step 1: Write precedence and coexistence tests**

Create explicit layer/library fixtures in the test file:

```ts
const [chinaDefault, japanDefault] = createDefaultHolidayLayers();
const chinaLayer = {
  ...chinaDefault,
  calendarId: "cn",
  main: { ...chinaDefault.main, dateColors: { enabled: true, holiday: "#aa0000", workday: "#333333" } },
  mini: { ...chinaDefault.mini, dateColors: { enabled: true, holiday: "#bb0000", workday: "#444444" } },
};
const japanLayer = {
  ...japanDefault,
  calendarId: "jp",
  main: { ...japanDefault.main, dateColors: { enabled: true, holiday: "#cc0000", workday: "#555555" } },
  mini: { ...japanDefault.mini, dateColors: { enabled: true, holiday: "#dd0000", workday: "#666666" } },
};
const library = fixtureLibrary({
  baseRecords: [
    base("cn", "2027-01-01", "holiday", "元旦"),
    base("jp", "2027-01-01", "holiday", "元日"),
  ],
});
const disabledColorLayer = {
  ...chinaLayer,
  main: { ...chinaLayer.main, dateColors: { ...chinaLayer.main.dateColors, enabled: false } },
  mini: { ...chinaLayer.mini, dateColors: { ...chinaLayer.mini.dateColors, enabled: false } },
};
```

```ts
it("lets the later matching layer override only the date colors", () => {
  const index = resolveHolidayIndex({ library, layers: [chinaLayer, japanLayer] });
  expect(index.get("2027-01-01")).toEqual({
    occurrences: [
      { layerId: chinaLayer.id, calendarId: "cn", type: "holiday", name: "元旦" },
      { layerId: japanLayer.id, calendarId: "jp", type: "holiday", name: "元日" },
    ],
    mainDateColor: japanLayer.main.dateColors.holiday,
    miniDateColor: japanLayer.mini.dateColors.holiday,
  });
});

it("does not apply colors from a layer with date colors disabled", () => {
  const index = resolveHolidayIndex({ library, layers: [disabledColorLayer] });
  expect(index.get("2027-01-01")?.mainDateColor).toBeUndefined();
});
```

- [ ] **Step 2: Run resolver tests and verify failure**

Run: `npm test -- src/domain/holiday/holidayIndex.test.ts`

Expected: FAIL because the fixed `china`/`japan` `HolidayInfo` shape still exists.

- [ ] **Step 3: Define the generic resolved index**

```ts
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
```

Implement `resolveHolidayIndex` by iterating enabled layers in stored order. Append every occurrence; assign `mainDateColor`/`miniDateColor` only when that branch has date colors enabled, allowing later assignments to win.

- [ ] **Step 4: Simplify base calendar colors**

Remove `japanHoliday` from Main/Mini base color palettes. Change date-color resolution to:

```ts
export function resolveDateColor(
  cell: CalendarCell,
  colors: { default: string; sunday: string; saturday: string },
  target: "main" | "mini",
): string {
  const holidayColor =
    target === "main" ? cell.holiday?.mainDateColor : cell.holiday?.miniDateColor;
  if (holidayColor) return holidayColor;
  if (cell.dayOfWeek === 0) return colors.sunday;
  if (cell.dayOfWeek === 6) return colors.saturday;
  return colors.default;
}
```

- [ ] **Step 5: Render dynamic Main names and markers**

Change `layoutMain` to accept `holidayLayers`. Build a `Map<layerId, HolidayLayer>` once, then render every occurrence using its layer style. Use semantic IDs:

```ts
`main.holiday.${layer.id}.name`
`main.holiday.${layer.id}.holiday-marker`
`main.holiday.${layer.id}.workday-marker`
```

Only `holiday` records with a name and `showName` render a name. Workday records may render only the workday marker and date color.

- [ ] **Step 6: Render dynamic Mini markers without names**

Change `layoutMini` to accept the same `holidayLayers`; render only the applicable enabled marker and resolved Mini date color. No Mini code path may read or emit a name style.

```ts
for (const occurrence of cellData.holiday?.occurrences ?? []) {
  const layer = layerById.get(occurrence.layerId);
  if (!layer?.enabled) continue;
  const configured = occurrence.type === "holiday"
    ? layer.mini.holidayMarker
    : layer.mini.workdayMarker;
  if (configured.enabled) {
    nodes.push(...layoutMarker(configured.marker, cellRect, miniMarkerSemanticId(layer.id, occurrence.type)));
  }
}
```

- [ ] **Step 7: Update font requirement collection and render callers**

Change both collectors to accept `holidayLayers`; collect dynamic holiday-name and text-marker characters. Pass layers through editor, preview, and formal render functions:

```ts
collectMainFontText({ calendar, template, holidayLayers })
collectMiniFontText({ calendar, template, holidayLayers })
layoutMain({ calendar, template, holidayLayers, textMeasurer })
layoutMini({ calendar, template, holidayLayers, textMeasurer })
```

- [ ] **Step 8: Run domain, layout, font, preview-render, and export-render tests**

Run: `npm test -- src/domain/holiday/holidayIndex.test.ts src/domain/calendar/calendarDomain.integration.test.ts src/rendering/layout src/resources/fonts/textRequirements.test.ts src/preview/fullYear/renderDocuments.test.ts src/export/formal/renderFormalDocuments.test.ts`

Expected: PASS with generic occurrences, dynamic semantic IDs, and no Mini holiday names.

- [ ] **Step 9: Commit the generic rendering pipeline**

```bash
git add src/domain/holiday src/domain/calendar src/rendering src/resources/fonts src/editor/fonts src/preview/fullYear src/export/formal
git commit -m "refactor: render holidays from ordered dynamic layers"
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
- Produces: `HolidayLibraryRepository.getSnapshot()`, `ensureBuiltins()`, `applyBaseUpdate(update, syncState?)`, `putOverride()`, `clearOverride()`, `deleteCalendar()`.
- Produces: `useHolidayLibraryStore` with `hydrate`, `refresh`, `snapshot`, `status`, and `error`.

- [ ] **Step 1: Write atomic repository tests**

Use this local helper in the repository test:

```ts
function updateForYear(
  calendarId: string,
  year: number,
  records: readonly HolidayBaseRecord[],
): HolidayBaseUpdate {
  const start = { year, month: 1, day: 1 };
  const end = { year, month: 12, day: 31 };
  return {
    calendarId,
    records,
    replacementRanges: [{ start, end }],
    coverage: [{
      id: `${calendarId}:${year}`,
      calendarId,
      start,
      end,
      status: "confirmed",
      source: "sync",
      updatedAt: "2026-08-28T00:00:00.000Z",
    }],
  };
}
```

```ts
it("replaces only the confirmed update range and preserves manual overrides", async () => {
  await repo.applyBaseUpdate(updateForYear("cn", 2027, [base("cn", "2027-01-01", "holiday", "元旦")]));
  await repo.putOverride(overrideUpsert("cn", "2027-01-01", "holiday", "Custom"));
  await repo.applyBaseUpdate(updateForYear("cn", 2028, [base("cn", "2028-01-01", "holiday", "元旦")]));

  const snapshot = await repo.getSnapshot();
  expect(resolveEffectiveRecords(snapshot, "cn").get("2027-01-01")?.name).toBe("Custom");
  expect(resolveEffectiveRecords(snapshot, "cn").has("2028-01-01")).toBe(true);
});

it("rolls back a failed multi-table base update", async () => {
  const duplicate = base("cn", "2027-01-01", "holiday", "元旦");
  await expect(repo.applyBaseUpdate(updateForYear("cn", 2027, [duplicate, duplicate]))).rejects.toThrow();
  expect((await repo.getSnapshot()).baseRecords).toHaveLength(0);
});
```

- [ ] **Step 2: Run repository tests and verify failure**

Run: `npm test -- src/persistence/db/holidayLibraryRepository.test.ts`

Expected: FAIL because the repository and tables are missing.

- [ ] **Step 3: Introduce a clean development database schema**

Change the default database name to `MonthloomDB-v2` instead of adding a legacy upgrade. Add tables:

```ts
holidayCalendars!: EntityTable<HolidayCalendar, "id">;
holidayBaseRecords!: EntityTable<HolidayBaseRecord, "id">;
holidayOverrides!: EntityTable<HolidayOverride, "id">;
holidayCoverage!: EntityTable<HolidayCoverage, "id">;
holidaySyncStates!: EntityTable<HolidaySyncState, "calendarId">;
```

```ts
this.version(1).stores({
  projects: "id, name, targetYear, updatedAt",
  templates: "id, name, updatedAt",
  assets: "id, mimeType, createdAt",
  fontCache: "cacheKey, family, weight, style, format, updatedAt",
  holidayCalendars: "id, name, builtin, provider, updatedAt",
  holidayBaseRecords: "id, calendarId, updatedAt",
  holidayOverrides: "id, calendarId, updatedAt",
  holidayCoverage: "id, calendarId, updatedAt",
  holidaySyncStates: "calendarId, status, lastAttemptAt, lastSuccessAt",
});
```

Keep `LocalDate` objects as domain values and compare/filter their ISO strings inside the repository. Do not attempt to index a plain `LocalDate` object as an IndexedDB key.

- [ ] **Step 4: Implement repository transactions and built-ins**

`ensureBuiltins()` must insert the fixed China/Japan metadata only when absent. `applyBaseUpdate()` must validate all records, delete baseline records only inside declared replacement ranges, then put new baseline and coverage rows within one Dexie `rw` transaction.

```ts
async ensureBuiltins(): Promise<void> {
  const builtins = [
    createBuiltinCalendar(BUILTIN_CHINA_CALENDAR_ID, "中国公众假期", "china-timor"),
    createBuiltinCalendar(BUILTIN_JAPAN_CALENDAR_ID, "日本公众假期", "japan-holidays-jp"),
  ];
  const existing = await this.db.holidayCalendars.bulkGet(builtins.map((calendar) => calendar.id));
  await this.db.holidayCalendars.bulkAdd(
    builtins.filter((_, index) => existing[index] === undefined),
  );
}

async applyBaseUpdate(update: HolidayBaseUpdate, syncState?: HolidaySyncState): Promise<void> {
  assertValidBaseUpdate(update);
  await this.db.transaction(
    "rw",
    [this.db.holidayBaseRecords, this.db.holidayCoverage, this.db.holidaySyncStates],
    async () => {
      const current = await this.db.holidayBaseRecords.where("calendarId").equals(update.calendarId).toArray();
      const replacedIds = current
        .filter((record) => update.replacementRanges.some((range) => isDateInRange(record.date, range)))
        .map((record) => record.id);
      await this.db.holidayBaseRecords.bulkDelete(replacedIds);
      await this.db.holidayBaseRecords.bulkPut([...update.records]);
      await replaceCoverageRows(this.db, update);
      if (syncState) await this.db.holidaySyncStates.put(syncState);
    },
  );
}
```

`createBuiltinCalendar` fills `builtin: true`, the supplied provider, and one shared ISO timestamp. `isDateInRange` uses `compareDate`; `replaceCoverageRows` deletes only overlapping coverage rows for the same calendar before putting `update.coverage`. `assertValidBaseUpdate` rejects foreign calendar IDs, duplicate record IDs/dates, invalid dates, and records outside the declared calendar.

Add `recordSyncFailure(calendarId, errorMessage, attemptedAt)`. It updates only `holidaySyncStates`; a failed request must never alter calendars, records, overrides, or coverage. Successful synchronization passes its success state to `applyBaseUpdate` so data and status commit atomically.

- [ ] **Step 5: Implement the hydrated Zustand store**

```ts
export type HolidayLibraryStore = {
  snapshot: HolidayLibrarySnapshot;
  status: "idle" | "loading" | "ready" | "error";
  error: Error | null;
  hydrate: (repository?: HolidayLibraryRepository) => Promise<void>;
  refresh: (repository?: HolidayLibraryRepository) => Promise<void>;
};
```

Hydration calls `ensureBuiltins()` and then `getSnapshot()`. It must not put holiday data into `workspaceStore`.

- [ ] **Step 6: Run repository/store tests**

Run: `npm test -- src/persistence/db/holidayLibraryRepository.test.ts src/workspace/state/holidayLibraryStore.test.ts src/persistence/db/repositories.test.ts`

Expected: PASS against `fake-indexeddb`.

- [ ] **Step 7: Commit global persistence**

```bash
git add src/persistence/db src/persistence/schema/holidayLibrarySchema.ts src/workspace/state/holidayLibraryStore.ts src/workspace/state/holidayLibraryStore.test.ts
git commit -m "feat: persist the global holiday library"
```

---

### Task 5: Synchronization, Monthloom JSON, and manual operations

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
- Produces: `fetchChinaHolidayYear(year, fetchImpl)`, `fetchJapanHolidayYear(year, fetchImpl)`.
- Produces: `parseMonthloomHolidayJson`, `serializeMonthloomHolidayJson`.
- Produces: prepared-update workflows for sync/import, `summarizeBaseUpdate`, plus calendar CRUD and manual-record operations.

- [ ] **Step 1: Write provider-fetch and manual-priority tests**

Define the provider fixture and fetch stub in the test file:

```ts
const chinaPayload = {
  code: 0,
  holiday: {
    "01-01": { holiday: true, name: "元旦", date: "2027-01-01" },
    "02-06": { holiday: false, name: "春节调休", date: "2027-02-06" },
  },
};

function fakeFetch(payload: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

function effectiveName(snapshot: HolidayLibrarySnapshot, isoDate: string): string | undefined {
  return resolveEffectiveRecords(snapshot, BUILTIN_CHINA_CALENDAR_ID).get(isoDate)?.name;
}
```

```ts
it("fetches one China year into a confirmed baseline update", async () => {
  const update = await fetchChinaHolidayYear(2027, fakeFetch(chinaPayload));
  expect(update.calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
  expect(update.replacementRanges).toEqual([
    { start: { year: 2027, month: 1, day: 1 }, end: { year: 2027, month: 12, day: 31 } },
  ]);
});

it("syncs a new baseline without changing a manual override", async () => {
  await operations.upsertManualRecord({
    calendarId: BUILTIN_CHINA_CALENDAR_ID,
    date: { year: 2027, month: 1, day: 1 },
    type: "holiday",
    name: "Custom New Year",
  });
  const prepared = await operations.prepareSyncYear(
    BUILTIN_CHINA_CALENDAR_ID,
    2027,
    fakeFetch(chinaPayload),
  );
  await operations.applyPreparedUpdate(prepared);
  expect(effectiveName(await repo.getSnapshot(), "2027-01-01")).toBe("Custom New Year");
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/domain/holiday/adapters src/domain/holiday/monthloomJson.test.ts src/workspace/holiday/holidayLibraryOperations.test.ts`

Expected: FAIL because fetch workflows and JSON exchange do not exist.

- [ ] **Step 3: Add normalized provider adapters without breaking the still-running legacy screen**

Add normalized functions that return records or throw descriptive validation errors. Keep the current country-shaped parser exports temporarily so the application remains buildable until Task 10 deletes the legacy upload screen; Task 11 removes the obsolete exports.

```ts
export function normalizeChinaTimorHolidayYear(raw: unknown): readonly NormalizedHolidayRecord[];
export function normalizeJapanHolidaysJp(raw: unknown): readonly NormalizedHolidayRecord[];
```

- [ ] **Step 4: Add direct browser synchronization functions**

```ts
export async function fetchChinaHolidayYear(
  year: number,
  fetchImpl: typeof fetch = fetch,
): Promise<HolidayBaseUpdate> {
  const response = await fetchImpl(`https://timor.tech/api/holiday/year/${year}/`);
  if (!response.ok) throw new Error(`China holiday sync failed: HTTP ${response.status}`);
  return providerRecordsToYearUpdate(BUILTIN_CHINA_CALENDAR_ID, year, normalizeChinaTimorHolidayYear(await response.json()));
}
```

Implement the Japan equivalent with `https://holidays-jp.github.io/api/v1/${year}/date.json`.

```ts
function providerRecordsToYearUpdate(
  calendarId: string,
  year: number,
  records: readonly NormalizedHolidayRecord[],
): HolidayBaseUpdate {
  const now = new Date().toISOString();
  const start = { year, month: 1, day: 1 };
  const end = { year, month: 12, day: 31 };
  return {
    calendarId,
    records: records.map((record) => ({
      id: holidayRecordId(calendarId, record.date),
      calendarId,
      date: record.date,
      type: record.type,
      ...(record.name ? { name: record.name } : {}),
      source: "sync",
      updatedAt: now,
    })),
    replacementRanges: [{ start, end }],
    coverage: [{
      id: `${calendarId}:${year}`,
      calendarId,
      start,
      end,
      status: "confirmed",
      source: "sync",
      updatedAt: now,
    }],
  };
}
```

- [ ] **Step 5: Implement strict Monthloom JSON exchange**

Use Zod to validate `format`, version `1`, calendar metadata, coverage, and unique records. Confirmed ranges replace baseline only in those ranges; absent confirmed ranges upsert without deletion.

```ts
const isoLocalDateSchema = z.string().transform((value, ctx) => {
  const date = parseISODate(value);
  if (!date) {
    ctx.addIssue({ code: "custom", message: `Invalid ISO date: ${value}` });
    return z.NEVER;
  }
  return date;
});

const monthloomHolidayExchangeSchema = z.object({
  format: z.literal("monthloom-holidays"),
  version: z.literal(1),
  calendar: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  coverage: z.array(z.object({
    start: isoLocalDateSchema,
    end: isoLocalDateSchema,
    status: z.enum(["confirmed", "unconfirmed"]),
  })),
  records: z.array(z.object({
    date: isoLocalDateSchema,
    type: z.enum(["holiday", "workday"]),
    name: z.string().min(1).optional(),
  })),
}).superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.records.forEach((record, index) => {
    const key = toISODate(record.date);
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", path: ["records", index, "date"], message: `Duplicate date: ${key}` });
    }
    seen.add(key);
  });
});
```

- [ ] **Step 6: Implement prepared updates and atomic user operations**

```ts
export class HolidayLibraryOperations {
  async createCalendar(name: string): Promise<HolidayCalendar>;
  async renameCalendar(calendarId: string, name: string): Promise<void>;
  async deleteCalendar(calendarId: string): Promise<void>;
  async prepareSyncYear(calendarId: string, year: number, fetchImpl?: typeof fetch): Promise<PreparedHolidayUpdate>;
  async prepareMonthloomImport(raw: unknown): Promise<PreparedHolidayUpdate>;
  async prepareProviderImport(calendarId: string, provider: HolidayProviderId, year: number, raw: unknown): Promise<PreparedHolidayUpdate>;
  async applyPreparedUpdate(prepared: PreparedHolidayUpdate): Promise<HolidayChangeSummary>;
  async upsertManualRecord(input: ManualHolidayRecordInput): Promise<void>;
  async upsertManualRecords(inputs: readonly ManualHolidayRecordInput[]): Promise<void>;
  async deleteRecord(calendarId: string, date: LocalDate): Promise<void>;
  async restoreSourceRecord(calendarId: string, date: LocalDate): Promise<void>;
  async markCoverageConfirmed(calendarId: string, range: DateRange): Promise<void>;
}
```

Define the operation DTOs in the same module:

```ts
export type ManualHolidayRecordInput = Readonly<{
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
}>;

export type HolidayChangeSummary = Readonly<{
  added: number;
  changed: number;
  removed: number;
  skippedManualConflicts: number;
}>;

export type PreparedHolidayUpdate = Readonly<{
  update: HolidayBaseUpdate;
  summary: HolidayChangeSummary;
}>;
```

`PreparedHolidayUpdate` contains the validated base update and exact added/changed/removed counts, but does not mutate holiday records. The UI displays that summary and calls `applyPreparedUpdate` only after confirmation. Successful synchronization passes a success `HolidaySyncState` into the same repository transaction as its base update. A failed remote request writes only an error `HolidaySyncState`; calendars, records, overrides, and coverage remain unchanged. Refresh `useHolidayLibraryStore` after either outcome.

```ts
async prepareSyncYear(calendarId: string, year: number, fetchImpl: typeof fetch = fetch) {
  try {
    let update: HolidayBaseUpdate;
    if (calendarId === BUILTIN_CHINA_CALENDAR_ID) {
      update = await fetchChinaHolidayYear(year, fetchImpl);
    } else if (calendarId === BUILTIN_JAPAN_CALENDAR_ID) {
      update = await fetchJapanHolidayYear(year, fetchImpl);
    } else {
      throw new Error(`Calendar does not support synchronization: ${calendarId}`);
    }
    return {
      update,
      summary: summarizeBaseUpdate(await this.repository.getSnapshot(), update),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await this.repository.recordSyncFailure(calendarId, message, new Date().toISOString());
    await useHolidayLibraryStore.getState().refresh(this.repository);
    throw error;
  }
}
```

`summarizeBaseUpdate(library, update)` resolves effective records before and after applying the update in memory, then counts added, changed, and removed effective dates; dates protected by manual overrides therefore do not appear as changes.

`deleteCalendar` rejects built-ins and scans the current `useDocumentStore` document plus saved project/template documents for `holidayLayers.calendarId`; referenced custom calendars cannot be deleted.

`renameCalendar` also rejects built-ins so their stable system identity and localized display names cannot drift.

- [ ] **Step 7: Run provider, interchange, and operation tests**

Run: `npm test -- src/domain/holiday/adapters src/domain/holiday/monthloomJson.test.ts src/workspace/holiday/holidayLibraryOperations.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit data acquisition and editing workflows**

```bash
git add src/domain/holiday src/workspace/holiday/holidayLibraryOperations.ts src/workspace/holiday/holidayLibraryOperations.test.ts
git commit -m "feat: sync and edit global holiday calendars"
```

---

### Task 6: Global holiday-library management UI

**Files:**
- Create: `src/workspace/components/HolidayLibraryPanel.tsx`
- Create: `src/workspace/components/HolidayCalendarList.tsx`
- Create: `src/workspace/components/HolidayCalendarDetail.tsx`
- Create: `src/workspace/components/HolidayRecordDialog.tsx`
- Create: `src/workspace/components/holiday-library.css`
- Modify: `src/workspace/components/HolidayDiagnostics.tsx`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `useHolidayLibraryStore`, `HolidayLibraryOperations`, canonical calendar/record types.
- Produces: independent global-library workspace panel.

- [ ] **Step 1: Add behavior tests only for form validation and action wiring**

Test invalid date/type submission and that manual save calls `upsertManualRecord` with a `LocalDate`. Do not snapshot styling or layout.

```tsx
fireEvent.change(screen.getByLabelText("日期"), { target: { value: "2027-02-30" } });
fireEvent.click(screen.getByRole("button", { name: "保存" }));
expect(screen.getByRole("alert")).toHaveTextContent("日期无效");
expect(upsertManualRecord).not.toHaveBeenCalled();
```

- [ ] **Step 2: Implement the left-list/right-detail management flow**

`HolidayLibraryPanel` lists built-in and custom calendars and supports creating/renaming/deleting custom calendars; `HolidayCalendarDetail` filters records by selected year and displays date, type, name, provenance, and actions.

```tsx
export const HolidayLibraryPanel: React.FC = () => {
  const snapshot = useHolidayLibraryStore((state) => state.snapshot);
  const [selectedId, setSelectedId] = useState(snapshot.calendars[0]?.id ?? null);
  const selected = snapshot.calendars.find((calendar) => calendar.id === selectedId) ?? null;
  return (
    <section className="holiday-library-panel">
      <HolidayCalendarList calendars={snapshot.calendars} selectedId={selectedId} onSelect={setSelectedId} />
      {selected && <HolidayCalendarDetail calendar={selected} snapshot={snapshot} />}
    </section>
  );
};
```

Show the selected calendar's latest synchronization success or failure from `snapshot.syncStates`; keep this separate from coverage status.

- [ ] **Step 3: Implement sync/import previews and manual edits**

Show the `PreparedHolidayUpdate` change counts before applying sync/import. China/Japan expose year sync and raw provider JSON import; all calendars expose manual add/edit and Monthloom JSON import/export. Keep the selected calendar/year after refresh.

```ts
const prepared = await operations.prepareSyncYear(calendar.id, selectedYear);
setPendingUpdate(prepared);

const confirmPendingUpdate = async () => {
  if (!pendingUpdate) return;
  const summary = await operations.applyPreparedUpdate(pendingUpdate);
  setLastSummary(summary);
  setPendingUpdate(null);
};
```

- [ ] **Step 4: Add coverage messaging without blocking export**

Display `confirmed`, `unconfirmed`, and `unknown` distinctly. Missing future data is warning copy, never a disabled editor or export action.

```tsx
<div role="status" className={`coverage-status coverage-${coverageState}`}>
  {t.holidayLibrary.coverage[coverageState]}
</div>
```

Do not pass coverage state into any `disabled` prop on preview/export controls.

- [ ] **Step 5: Export a mount-ready panel**

Export `<HolidayLibraryPanel />` with its scoped stylesheet and no dependency on project-owned holiday state. Task 10 mounts it as a separate workspace card beside project persistence/export controls when the application switches to the global SSOT.

```ts
export { HolidayLibraryPanel } from "./HolidayLibraryPanel";
```

- [ ] **Step 6: Run the focused UI behavior tests and i18n tests**

Run: `npm test -- src/workspace/components src/shared/i18n/i18n.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the global-library UI**

```bash
git add src/workspace/components src/shared/i18n
git commit -m "feat: add holiday library management UI"
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
- Modify: `src/editor/model/effectiveDocument.ts`
- Modify: `src/editor/selection/hitTargets.ts`
- Modify: `src/editor/selection/hitTargets.test.ts`
- Modify: `src/editor/selection/selection.ts`
- Modify: `src/rendering/scene/types.ts`

**Interfaces:**
- Produces: `HolidaySemanticId`, `buildHolidaySemanticId`, `parseHolidaySemanticId`.
- Extends: `EditableSemanticId` and `PositionableSemanticId` with dynamic layer IDs.
- Consumes: immutable holiday-layer helpers from Task 2.

- [ ] **Step 1: Write round-trip and binding tests**

```ts
it("round-trips a dynamic Main holiday-name semantic ID", () => {
  const id = buildHolidaySemanticId("main", "layer-cn", "name");
  expect(id).toBe("main.holiday.layer-cn.name");
  expect(parseHolidaySemanticId(id)).toEqual({
    target: "main",
    layerId: "layer-cn",
    element: "name",
  });
});

it("updates only the selected layer marker position", () => {
  const next = setElementPosition(document, "main.holiday.layer-cn.holiday-marker", position);
  expect(findLayer(next, "layer-cn").main.holidayMarker.marker.position).toEqual(position);
  expect(findLayer(next, "layer-jp")).toBe(findLayer(document, "layer-jp"));
});
```

- [ ] **Step 2: Run focused editor-model tests and verify failure**

Run: `npm test -- src/editor/model/holidaySemanticId.test.ts src/editor/model/templateBindings.test.ts src/editor/interaction/drag.test.ts src/editor/selection/hitTargets.test.ts`

Expected: FAIL because semantic IDs are still fixed country strings.

- [ ] **Step 3: Define dynamic IDs**

```ts
export type HolidayLayerElement =
  | "name"
  | "holiday-marker"
  | "workday-marker"
  | "date-colors";

export type HolidaySemanticId =
  | `main.holiday.${string}.${HolidayLayerElement}`
  | `mini.holiday.${string}.${Exclude<HolidayLayerElement, "name">}`;
```

The parser must reject Mini name IDs and malformed strings.

- [ ] **Step 4: Route bindings through parsed layer IDs**

Update `getElementPosition`, `setElementPosition`, `getTypography`, `setTypography`, and marker getters/setters. Dynamic date-color IDs are editable but not positionable. Preserve the static weekday/date/month/grid branches.

```ts
const holidayTarget = parseHolidaySemanticId(semanticId);
if (holidayTarget) {
  const layer = getHolidayLayer(document.holidayLayers, holidayTarget.layerId);
  return getHolidayElementPosition(layer, holidayTarget);
}
```

Setter branches call `updateHolidayLayer` and rebuild only the selected layer/style branch.

- [ ] **Step 5: Update dragging and selection**

Dynamic name/marker scene nodes must generate hit targets and use the same anchor-relative drag commits as current static elements. Do not introduce absolute client coordinates.

```ts
export type DragSession = Readonly<{
  semanticId: PositionableSemanticId;
  instanceKey: string;
  deltaX: number;
  deltaY: number;
}>;

export function applyDragCommit(document: EditorDocument, drag: DragSession): EditorDocument {
  const current = getElementPosition(document, drag.semanticId);
  return setElementPosition(document, drag.semanticId, {
    ...current,
    offsetX: Math.round((current.offsetX + drag.deltaX) * 100) / 100,
    offsetY: Math.round((current.offsetY + drag.deltaY) * 100) / 100,
  });
}
```

- [ ] **Step 6: Run editor-model tests**

Run: `npm test -- src/editor/model src/editor/interaction src/editor/selection`

Expected: PASS.

- [ ] **Step 7: Commit dynamic editor semantics**

```bash
git add src/editor/model src/editor/interaction src/editor/selection src/rendering/scene/types.ts
git commit -m "refactor: support dynamic holiday layer selections"
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
- Modify: `src/editor/state/uiStore.ts`
- Modify: `src/editor/state/documentStore.test.ts`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Consumes: dynamic semantic IDs, global calendar metadata, document holiday-layer helpers.
- Produces: ordered expandable layer tree and Main/Mini-specific inspector.

- [ ] **Step 1: Add model-level tests for add, toggle, move, remove, and rebind**

```ts
it("rebinds a missing layer only to a calendar unused by this template", () => {
  expect(() => rebindHolidayLayer(layers, "missing-layer", "already-used-calendar")).toThrow();
  expect(rebindHolidayLayer(layers, "missing-layer", "custom-calendar")[0].calendarId)
    .toBe("custom-calendar");
});
```

Keep reordering behavior testable outside React; do not add visual snapshot tests.

- [ ] **Step 2: Extract and implement `HolidayLayerTree`**

Render calendar name, enabled state, expand/collapse, missing-data state, drag handle, keyboard up/down actions, remove, and add-from-library. Filter the add picker so one calendar cannot appear twice in a template.

```tsx
const availableCalendars = calendars.filter(
  (calendar) => !layers.some((layer) => layer.calendarId === calendar.id),
);

return layers.map((layer) => (
  <HolidayLayerRow
    key={layer.id}
    layer={layer}
    calendar={calendarById.get(layer.calendarId) ?? null}
    onMove={(direction) => onChange(moveHolidayLayer(layers, layer.id, direction))}
    onToggle={() => onChange(updateHolidayLayer(layers, layer.id, (current) => ({ ...current, enabled: !current.enabled })))}
  />
));
```

- [ ] **Step 3: Render Main/Mini child entries**

Main children: name, holiday marker, workday marker, date colors. Mini children: holiday marker, workday marker, date colors. Never render a Mini name entry.

```ts
const elements: readonly HolidayLayerElement[] = activeTemplate === "main"
  ? ["name", "holiday-marker", "workday-marker", "date-colors"]
  : ["holiday-marker", "workday-marker", "date-colors"];
```

- [ ] **Step 4: Implement the dynamic inspector**

Route dynamic IDs to `HolidayLayerInspector`. Reuse `PositionInspector`, `TypographyInspector`, and `MarkerInspector`; add `HolidayDateColorInspector` with:

```ts
type HolidayDateColorInspectorProps = {
  value: HolidayDateColors;
  onChange: (next: HolidayDateColors) => void;
};
```

The Main name branch includes a `showName` toggle. Both targets include separate enabled toggles for holiday/workday markers. Only show fields applicable to the active marker type. Updating image assets continues to use the persistent asset store.

- [ ] **Step 5: Preserve canvas selection and missing-data editing**

Rendered dynamic nodes select their layer child. A layer with no current-year instances remains selectable from the tree and editable in the inspector.

```tsx
<button
  type="button"
  onClick={() => setSelection({
    semanticId: buildHolidaySemanticId(activeTemplate, layer.id, element),
    instanceKey: `${layer.id}:${element}:default`,
  })}
>
  {label}
</button>
```

- [ ] **Step 6: Run editor behavior and i18n tests**

Run: `npm test -- src/editor src/shared/i18n/i18n.test.ts`

Expected: PASS; no tests assert overlap warnings because none exist.

- [ ] **Step 7: Commit the dynamic editor UI**

```bash
git add src/editor src/shared/i18n
git commit -m "feat: edit ordered holiday layers in templates"
```

---

### Task 9: Project/template schemas and full-library bundles

**Files:**
- Modify: `src/persistence/schema/projectSnapshot.ts`
- Modify: `src/persistence/schema/templateSnapshot.ts`
- Modify: `src/persistence/schema/validation.ts`
- Modify: `src/persistence/schema/snapshot.test.ts`
- Modify: `src/persistence/operations/projectOperations.ts`
- Modify: `src/persistence/operations/operations.test.ts`
- Modify: `src/persistence/bundle/manifest.ts`
- Modify: `src/persistence/bundle/exportBundle.ts`
- Modify: `src/persistence/bundle/importBundle.ts`
- Modify: `src/persistence/bundle/bundle.test.ts`
- Modify: `src/persistence/assets/referencedAssets.ts`
- Modify: `src/persistence/assets/remapAssets.ts`
- Modify: `src/persistence/assets/assets.test.ts`
- Modify: `src/persistence/components/PersistenceControls.tsx`

**Interfaces:**
- Project snapshot no longer contains holiday datasets.
- Project bundle contains `holiday-library.json`; template bundle does not.
- Bundle import returns conflict summary counts.

- [ ] **Step 1: Rewrite snapshot tests for the clean schema**

```ts
const project: ProjectSnapshotV1 = {
  version: 1,
  type: "project",
  id: "project-1",
  name: "2027 Calendar",
  createdAt: now,
  updatedAt: now,
  targetYear: 2027,
  document: createDefaultEditorDocument(),
};

expect("chinaHolidayDataset" in project).toBe(false);
expect("japanHolidayDataset" in project).toBe(false);
```

- [ ] **Step 2: Rewrite bundle tests before implementation**

Project roundtrip must assert that all calendars—including one unused by the project—and their coverage/sync states arrive in the target DB. Template roundtrip must assert that `holiday-library.json` is absent. Add a conflict fixture where target manual data wins and the result reports one skipped conflict.

```ts
expect((await targetHolidayRepo.getSnapshot()).calendars.map((calendar) => calendar.id))
  .toContain("unused-custom-calendar");
expect(projectZip.file("holiday-library.json")).not.toBeNull();
expect(templateZip.file("holiday-library.json")).toBeNull();
expect(importResult.holidayMerge?.skippedManualConflicts).toBe(1);
```

- [ ] **Step 3: Run snapshot/bundle tests and verify failure**

Run: `npm test -- src/persistence/schema/snapshot.test.ts src/persistence/bundle/bundle.test.ts`

Expected: FAIL because snapshots still embed fixed datasets and bundles omit the global library.

- [ ] **Step 4: Remove project-owned holiday data**

Delete `chinaHolidayDataset` and `japanHolidayDataset` from the project schema and `ProjectOperations`. Project load updates only project identity, target year, and document.

```ts
export type ProjectSnapshotV1 = Readonly<{
  version: 1;
  type: "project";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targetYear: number;
  document: EditorDocument;
}>;
```

- [ ] **Step 5: Make asset traversal dynamic**

`collectReferencedAssetIds` and `remapDocumentAssetIds` must iterate every Main/Mini holiday-layer marker and process image assets. Delete fixed `chinaMarkers` branches.

```ts
for (const layer of document.holidayLayers) {
  for (const configured of [
    layer.main.holidayMarker,
    layer.main.workdayMarker,
    layer.mini.holidayMarker,
    layer.mini.workdayMarker,
  ]) {
    if (configured.marker.type === "image") assetIds.add(configured.marker.assetId);
  }
}
```

- [ ] **Step 6: Version the bundle manifest and embed the full library for projects**

Use a discriminated manifest version `2`. Project bundles write validated `holiday-library.json`; template bundles do not. Display the fixed export notice from the spec in `PersistenceControls`.

```ts
const bundleManifestSchema = z.discriminatedUnion("type", [
  z.object({
    format: z.literal("monthloom-bundle"),
    version: z.literal(2),
    type: z.literal("project"),
    holidayLibraryFilename: z.literal("holiday-library.json"),
    exportedAt: z.string(),
    generator: z.string(),
    assets: z.array(bundleAssetEntrySchema),
  }),
  z.object({
    format: z.literal("monthloom-bundle"),
    version: z.literal(2),
    type: z.literal("template"),
    exportedAt: z.string(),
    generator: z.string(),
    assets: z.array(bundleAssetEntrySchema),
  }),
]);
```

- [ ] **Step 7: Implement non-destructive library merge**

Create and test a pure merge function:

```ts
export function mergeHolidayLibraries(
  local: HolidayLibrarySnapshot,
  incoming: HolidayLibrarySnapshot,
): { snapshot: HolidayLibrarySnapshot; summary: HolidayLibraryMergeSummary };
```

```ts
export type HolidayLibraryMergeSummary = Readonly<{
  addedCalendars: number;
  addedRecords: number;
  skippedManualConflicts: number;
}>;
```

New IDs/records are added; local metadata, local sync state, and local manual overrides win for matching calendar IDs. Conflicting incoming manual edits are skipped and counted. Save assets, project, and merged holiday tables in one `rw` transaction.

- [ ] **Step 8: Run persistence tests**

Run: `npm test -- src/persistence`

Expected: PASS, including atomic rollback and dynamic marker asset remapping.

- [ ] **Step 9: Commit schemas and bundles**

```bash
git add src/persistence
git commit -m "feat: bundle the global holiday library with projects"
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
- Modify: `src/preview/fullYear/calendarSet.ts`
- Modify: `src/export/components/BatchExportPanel.tsx`
- Modify: `src/export/formal/monthSet.ts`
- Modify: `src/shared/i18n/types.ts`
- Modify: `src/shared/i18n/locales/zh.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Workspace store retains project identity/name and target year only.
- App derives `holidayIndex` and coverage diagnostics from global snapshot plus `document.holidayLayers`.
- Editor, gallery, and export share that resolved index.

- [ ] **Step 1: Rewrite workspace tests for the final ownership model**

```ts
it("keeps holiday records out of project workspace state", () => {
  const state = useWorkspaceStore.getState();
  expect("chinaHolidayDataset" in state).toBe(false);
  expect("japanHolidayDataset" in state).toBe(false);
});
```

Add a test that target-year changes recompute required coverage without mutating the library.

- [ ] **Step 2: Hydrate the global library once in `App`**

Call `useHolidayLibraryStore.getState().hydrate()` from an app-level effect. Derive:

```ts
const holidayIndex = useMemo(
  () => resolveHolidayIndex({ library: holidayLibrary, layers: document.holidayLayers }),
  [holidayLibrary, document.holidayLayers],
);
```

- [ ] **Step 3: Replace fixed workspace diagnostics**

`getWorkspaceHolidayDiagnostics` now receives target year, library, and enabled layers. It calculates the required `Y-1 Dec` through `Y+1 Feb` range and returns diagnostics per referenced calendar.

```ts
export function getWorkspaceHolidayDiagnostics(args: {
  targetYear: number;
  library: HolidayLibrarySnapshot;
  layers: readonly HolidayLayer[];
}): readonly HolidayDiagnostic[] {
  const requiredRange = calculateRequiredHolidayRange(args.targetYear);
  return args.layers
    .filter((layer) => layer.enabled)
    .flatMap((layer) => diagnosticsForReferencedCalendar(args.library, layer.calendarId, requiredRange));
}
```

- [ ] **Step 4: Pass one resolved index through editor, preview, and export**

Editor month generation, `FullYearPreview`, and `BatchExportPanel` must consume the same `holidayIndex`. Pass `document.holidayLayers` into all render/font requirement functions.

```tsx
<TemplateEditor calendar={editorCalendar} assetResolver={persistentAssetStore} />
<FullYearPreview
  targetYear={targetYear}
  holidayIndex={holidayIndex}
  coverageDiagnostics={diagnostics}
  assetResolver={persistentAssetStore}
/>
<BatchExportPanel holidayIndex={holidayIndex} coverageDiagnostics={diagnostics} />
```

Change `BatchExportPanelProps` accordingly instead of reading holiday data from `workspaceStore`.

- [ ] **Step 5: Remove legacy upload controls and fixed workspace fields**

Delete the two fixed file inputs and all China/Japan workspace setters. The global `HolidayLibraryPanel` is the only data-management UI.

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

- [ ] **Step 6: Run integration tests**

Run: `npm test -- src/app src/workspace src/preview src/export`

Expected: PASS with target-year switching, non-blocking coverage warnings, and exactly 28 formal outputs.

- [ ] **Step 7: Run the first full integration build**

Run: `npm run build`

Expected: PASS. Resolve every temporary compile break caused by switching the domain/render interfaces; do not add legacy adapters to make the build pass.

- [ ] **Step 8: Commit application integration**

```bash
git add src/app src/workspace src/preview src/export src/shared/i18n
git commit -m "refactor: consume the global holiday SSOT everywhere"
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
- Modify: relevant `src/verification/**` fixtures or remove obsolete fixed-country verification views

**Interfaces:**
- Final source contains no business-significant fixed China/Japan template, workspace, renderer, or snapshot slots.
- Provider names remain only in built-in calendar metadata, sync adapters, and provider-specific tests.

- [ ] **Step 1: Scan for every legacy fixed-field reference**

Run:

```bash
rg -n "chinaHoliday|japanHoliday|chinaMarkers|holidayDot|workdayDot|chinaHolidayDataset|japanHolidayDataset" src
```

Expected before cleanup: remaining references in old types/tests/fixtures. Classify each result as provider-adapter metadata or a legacy business slot; only provider-adapter references may remain.

- [ ] **Step 2: Remove legacy template fields and colors**

Delete `chinaHolidayName`, `japanHolidayName`, `chinaMarkers`, Mini fixed dots, and `japanHoliday` base colors. Delete fixed font IDs and inspector labels that no longer have semantic meaning.

```ts
export type CalendarBaseColors = Readonly<{
  default: string;
  sunday: string;
  saturday: string;
}>;
```

Keep each template's existing canvas, weekday, date, and grid fields unchanged; replace its `colors` field with `CalendarBaseColors` and remove every fixed holiday field listed above.

- [ ] **Step 3: Update all fixtures and verification views**

Build fixtures with `HolidayLibrarySnapshot + HolidayLayer[] + resolveHolidayIndex`. Keep verification cases for adjacent-month opacity, two calendars on one date, workdays, dynamic markers, and 28-file export.

```ts
const holidayIndex = resolveHolidayIndex({
  library: PHASE_FIXTURE_HOLIDAY_LIBRARY,
  layers: PHASE_FIXTURE_HOLIDAY_LAYERS,
});
const calendar = generateCalendarMonth(2027, 5, holidayIndex);
```

- [ ] **Step 4: Rewrite user documentation**

`holiday-json.md` documents Monthloom JSON, built-in provider sync/import, manual editing, coverage, and manual priority. `backup-and-recovery.md` states that project bundles contain the entire holiday library while templates contain only layer design.

```markdown
# Managing Holiday Calendars

## Built-in China and Japan synchronization
## Manual records and overrides
## Monthloom holiday JSON
## Confirmed, unconfirmed, and unknown coverage
## Why manual changes survive synchronization
```

- [ ] **Step 5: Run the fixed-field scan again**

Run:

```bash
rg -n "chinaHoliday|japanHoliday|chinaMarkers|holidayDot|workdayDot|chinaHolidayDataset|japanHolidayDataset" src
```

Expected: no results except provider-specific adapter/test names whose source identity is intentionally China or Japan.

- [ ] **Step 6: Run formatting-free repository verification**

Run: `npm test`

Expected: all Vitest files pass.

Run: `npm run build`

Expected: TypeScript and Vite production build pass.

- [ ] **Step 7: Verify the working-tree diff contains no compatibility layer**

Run:

```bash
rg -n "legacy|migrate|migration|version === 0|chinaHolidayDataset|japanHolidayDataset" src
git diff --check
```

Expected: no holiday compatibility code, and `git diff --check` produces no output.

- [ ] **Step 8: Commit final cleanup and docs**

```bash
git add src docs/user
git commit -m "docs: finalize dynamic holiday library workflow"
```

---

## Final Verification

- [ ] Run: `npm test`

Expected: all tests pass.

- [ ] Run: `npm run build`

Expected: production build succeeds.

- [ ] Run the formal-scope focused tests:

```bash
npm test -- src/domain/calendar/monthSequence.test.ts src/export/formal src/preview/fullYear/calendarSet.test.ts
```

Expected: 13 Main, 15 Mini, and 28 total SVG documents remain invariant.

- [ ] Run the final architecture scans:

```bash
rg -n "chinaHolidayDataset|japanHolidayDataset|main\.chinaHoliday|main\.japanHoliday|mini\.holidayDot|mini\.workdayDot" src
rg -n "new Date\([^)]*,[^)]*,[^)]*\)" src/domain src/workspace src/rendering
git status --short
```

Expected: no fixed-country business slots, no browser-local calendar arithmetic, and only intentional implementation changes in the working tree.
