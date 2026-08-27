# Monthloom Phase 5 — Full-year Page Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Monthloom's production 13-page full-year Preview that composes Background + Main + Previous Mini + Next Mini for every formal Main month, using configurable page layout, shared production SVG rendering, one preview-only next-year February Mini, layout warnings, and efficient reuse of calendars/fonts/Mini documents.

**Architecture:** Page Preview is a composition layer above the existing Calendar/Layout/SVG pipeline; it never reimplements Main/Mini rendering. Pure page-geometry code calculates slots and uniform scaling, a full-year preview model creates exactly 13 pages and 15 unique Mini months, and React composes already-rendered `SvgDocument`s into responsive page canvases. The full-year Preview subscribes to canonical committed document state, not transient pointermove state, so the Editor remains responsive while all 13 pages refresh immediately after a committed template edit.

**Tech Stack:** React, TypeScript, Zustand already present, existing Phase 1–4 production modules, native browser image/file APIs, Vitest, Testing Library. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- Do not implement Dexie/IndexedDB persistence, template/project import/export, ZIP batch export, PNG/PDF output, cloud sync, authentication, or collaboration.
- Do not build a Page Editor. Page layout is adjusted through simple numeric settings only.
- Page Preview is not a formal output format; formal outputs remain Main/Mini SVG.
- Background belongs only to Page Preview and must never enter Main/Mini RenderScene or SVG export.
- Full-year Preview contains exactly 13 pages: target year January through December plus next-year January.
- Every page contains exactly one Main, one Previous Mini, and one Next Mini.
- Formal Mini scope remains 14 months: previous December through next January.
- Next-year February is generated only for the last Page Preview's Next Mini and must not become a formal Mini output month.
- Main and Mini must continue through the existing production Calendar → Layout → SVG pipeline.
- Do not duplicate Main/Mini rendering logic inside Page Preview.
- Main Page placement uses the right-side available width as the width constraint and scales uniformly.
- Main must never be non-uniformly stretched.
- If width-based Main scaling makes its height exceed page content height, preserve the scale and surface a layout warning.
- Mini uses uniform `contain` scaling inside its configured left-column slot.
- Mini must never be non-uniformly stretched.
- Background uses preserve-aspect-ratio `cover`, centered, with overflow clipped.
- Page content uses configurable Page Width, Page Height, Padding, Left Column Ratio, Column Gap, Mini Height Ratio, and Mini Gap.
- Page Preview is a single vertical column, not a thumbnail grid and not a Month Switcher.
- Template changes must update all 13 pages after the document change is committed.
- Full-year Preview must not rerender all 13 pages on every transient Editor pointermove; transient drag/resize remains local to Editor Canvas until commit.
- Resolve one shared font engine for the complete full-year preview requirements rather than downloading/parsing fonts separately for every Main/Mini document.
- Render each unique Mini month at most once per preview generation and reuse the resulting `SvgDocument` on both pages where applicable.
- Do not introduce Canvas, WebGL, virtualization, or Web Workers unless profiling proves an actual problem. They are explicitly out of scope here.
- Production modules must not import `src/spike/`.
- GitHub Pages static deployment must continue to work.

---

# 1. Target Production File Structure

```text
src/
  domain/
    pagePreview/
      types.ts
      defaults.ts
      pageLayout.ts
      pageLayout.test.ts
      fullYearPages.ts
      fullYearPages.test.ts

  editor/
    state/
      documentStore.ts          # extend with pagePreview config
      documentStore.test.ts

    components/
      PagePreviewSettings.tsx   # simple settings, not a Page Editor

  preview/
    fullYear/
      calendarSet.ts
      calendarSet.test.ts
      fontRequirements.ts
      fontRequirements.test.ts
      renderDocuments.ts
      renderDocuments.test.ts
      background.ts
      background.test.ts
      PagePreview.tsx
      PagePreview.test.tsx
      FullYearPreview.tsx
      FullYearPreviewControls.tsx
      full-year-preview.css

  verification/
    phase5/
      fixture.ts
      Phase5Verification.tsx

docs/
  phase5/
    manual-validation.md
```

Reuse the existing Phase 4 in-memory image asset store/resolver for the Background asset. If its interface is too marker-specific, generalize only its naming/interface; do not add persistence.

---

# Task 1: Define Page Preview Configuration

**Files:**
- Create: `src/domain/pagePreview/types.ts`
- Create: `src/domain/pagePreview/defaults.ts`
- Create: `src/domain/pagePreview/pageLayout.test.ts`

**Interfaces:**
- Produces:

```ts
export type PageLayout = Readonly<{
  width: number;
  height: number;
  padding: number;
  leftColumnRatio: number;
  columnGap: number;
  miniHeightRatio: number;
  miniGap: number;
}>;

export type PagePreviewConfig = Readonly<{
  layout: PageLayout;
  backgroundAssetId?: string;
}>;

export const DEFAULT_PAGE_LAYOUT: PageLayout;
export const DEFAULT_PAGE_PREVIEW_CONFIG: PagePreviewConfig;
```

- [ ] **Step 1: Add default configuration tests**

Use a practical landscape default:

```ts
export const DEFAULT_PAGE_LAYOUT = {
  width: 1400,
  height: 900,
  padding: 40,
  leftColumnRatio: 0.3,
  columnGap: 30,
  miniHeightRatio: 0.28,
  miniGap: 24,
} as const;
```

Assert:

```text
width > 0
height > 0
padding >= 0
0 < leftColumnRatio < 1
columnGap >= 0
0 < miniHeightRatio <= 1
miniGap >= 0
```

These are bootstrap defaults, not a fixed product design.

- [ ] **Step 2: Create data-only types/defaults**

No React, CSS, SVG, DOM, or rendering imports.

- [ ] **Step 3: Run tests/build**

```bash
npm test -- src/domain/pagePreview/pageLayout.test.ts
npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/domain/pagePreview
git commit -m "feat: define page preview configuration"
```

---

# Task 2: Implement Deterministic Page Geometry and Scaling

**Files:**
- Create: `src/domain/pagePreview/pageLayout.ts`
- Modify: `src/domain/pagePreview/pageLayout.test.ts`

**Interfaces:**
- Produces:

```ts
export type Placement = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}>;

export type PageLayoutWarning = Readonly<{
  code:
    | "invalid-content-area"
    | "main-height-overflow"
    | "mini-stack-overflow";
  message: string;
}>;

export type PageGeometry = Readonly<{
  page: Rect;
  content: Rect;
  leftColumn: Rect;
  main: Placement;
  previousMiniSlot: Rect;
  nextMiniSlot: Rect;
  previousMini: Placement;
  nextMini: Placement;
  warnings: readonly PageLayoutWarning[];
}>;

export function calculatePageGeometry(args: {
  layout: PageLayout;
  mainSize: Readonly<{ width: number; height: number }>;
  miniSize: Readonly<{ width: number; height: number }>;
}): PageGeometry;
```

- [ ] **Step 1: Write content-area test**

For:

```text
page = 1400 × 900
padding = 40
```

expect:

```text
content.x = 40
content.y = 40
content.width = 1320
content.height = 820
```

- [ ] **Step 2: Write column geometry test**

With:

```text
leftColumnRatio = 0.3
columnGap = 30
```

expect:

```text
leftColumn.width = content.width * 0.3
main available width =
content.width - leftColumn.width - 30
```

The ratio applies to `content.width`, not raw Page width.

- [ ] **Step 3: Implement Main uniform width scaling**

Formula:

```text
mainScale
=
availableMainWidth / mainTemplate.width

renderedMainWidth
=
availableMainWidth

renderedMainHeight
=
mainTemplate.height * mainScale
```

Placement:

```text
x = content.x + leftColumn.width + columnGap
y = content.y
```

Do not use height to reduce scale.

- [ ] **Step 4: Add Main overflow warning**

If:

```text
renderedMainHeight > content.height
```

return:

```text
main-height-overflow
```

Keep the width-derived scale unchanged.

- [ ] **Step 5: Write Mini slot tests**

Define:

```text
miniSlotWidth = leftColumn.width
miniSlotHeight = content.height * miniHeightRatio
```

Previous slot starts:

```text
x = content.x
y = content.y
```

Next slot starts:

```text
x = content.x
y = content.y + miniSlotHeight + miniGap
```

- [ ] **Step 6: Implement Mini contain scaling**

For each slot:

```text
scale =
min(
  slot.width / mini.width,
  slot.height / mini.height
)
```

Rendered Mini is centered in its slot:

```text
x = slot.x + (slot.width - renderedWidth) / 2
y = slot.y + (slot.height - renderedHeight) / 2
```

- [ ] **Step 7: Add Mini stack overflow warning**

If:

```text
2 * miniSlotHeight + miniGap > content.height
```

return:

```text
mini-stack-overflow
```

Do not silently shrink slot ratios.

- [ ] **Step 8: Reject unusable content geometry**

If padding/ratio/gap creates:

```text
content.width <= 0
content.height <= 0
main available width <= 0
```

return or throw a deterministic configuration error as chosen by the existing project style.

Tests must lock the behavior.

- [ ] **Step 9: Run tests/build**

```bash
npm test -- src/domain/pagePreview/pageLayout.test.ts
npm test
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/domain/pagePreview
git commit -m "feat: calculate full year page geometry"
```

---

# Task 3: Build the Exact 13-page Preview Model

**Files:**
- Create: `src/domain/pagePreview/fullYearPages.ts`
- Create: `src/domain/pagePreview/fullYearPages.test.ts`

**Interfaces:**
- Consumes Phase 1 `YearMonth` / month sequence functions.
- Produces:

```ts
export type FullYearPageDefinition = Readonly<{
  pageIndex: number;
  label: string;
  mainMonth: YearMonth;
  previousMiniMonth: YearMonth;
  nextMiniMonth: YearMonth;
}>;

export function getFullYearPageDefinitions(
  targetYear: number,
): readonly FullYearPageDefinition[];
```

- [ ] **Step 1: Write exact 13-page test for 2027**

Assert length:

```text
13
```

First page:

```text
label = "2027-1"
main = 2027-1
previous = 2026-12
next = 2027-2
```

Twelfth page:

```text
main = 2027-12
previous = 2027-11
next = 2028-1
```

Final page:

```text
label = "2028-1"
main = 2028-1
previous = 2027-12
next = 2028-2
```

- [ ] **Step 2: Implement small YearMonth shifting helper if Phase 1 lacks one**

Prefer:

```ts
shiftYearMonth(month, delta)
```

in the Calendar Domain if it is generally useful.

Do not implement date math inside React components.

- [ ] **Step 3: Assert February is Preview-only**

Confirm:

```text
2028-2
```

appears as the final `nextMiniMonth`, but Phase 1:

```ts
getMiniMonths(2027)
```

still returns exactly 14 formal months and excludes 2028-2.

- [ ] **Step 4: Run tests/build**

```bash
npm test -- src/domain/pagePreview/fullYearPages.test.ts
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/pagePreview src/domain/calendar
git commit -m "feat: define 13 page preview sequence"
```

Stage Calendar files only if a shared YearMonth helper was actually added.

---

# Task 4: Generate and Reuse the Full Preview Calendar Set

**Files:**
- Create: `src/preview/fullYear/calendarSet.ts`
- Create: `src/preview/fullYear/calendarSet.test.ts`

**Interfaces:**
- Produces:

```ts
export type CalendarKey = `${number}-${number}`;

export type FullYearCalendarSet = Readonly<{
  pages: readonly FullYearPageDefinition[];
  mainCalendars: ReadonlyMap<CalendarKey, CalendarMonth>;
  miniCalendars: ReadonlyMap<CalendarKey, CalendarMonth>;
}>;

export function createFullYearCalendarSet(args: {
  targetYear: number;
  holidayIndex?: HolidayIndex;
}): FullYearCalendarSet;
```

- [ ] **Step 1: Write count test**

For 2027 expect:

```text
pages = 13
mainCalendars.size = 13
miniCalendars.size = 15
```

Unique Mini range:

```text
2026-12
2027-1 ... 2027-12
2028-1
2028-2
```

- [ ] **Step 2: Generate each unique CalendarMonth once**

Use a key like:

```text
`${year}-${month}`
```

Do not generate Previous/Next Mini calendars independently per Page.

- [ ] **Step 3: Preserve holiday enrichment**

Pass the same normalized `HolidayIndex` into all `generateCalendarMonth(...)` calls.

Adjacent Main Cells retain holiday data exactly as in Phase 1.

- [ ] **Step 4: Add page-reference test**

Every Page definition must reference keys present in:

```text
mainCalendars
miniCalendars
```

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/preview/fullYear/calendarSet.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/preview/fullYear/calendarSet.ts src/preview/fullYear/calendarSet.test.ts
git commit -m "feat: build full year preview calendars"
```

---

# Task 5: Merge Full-year Font Requirements and Resolve One Engine

**Files:**
- Create: `src/preview/fullYear/fontRequirements.ts`
- Create: `src/preview/fullYear/fontRequirements.test.ts`

**Interfaces:**
- Consumes Phase 3:
  - `collectMainFontText`
  - `collectMiniFontText`
  - `mergeFontTextRequirements`
- Produces:

```ts
export function collectFullYearPreviewFontRequirements(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
}): FontTextRequirements;
```

- [ ] **Step 1: Write requirements union test**

Assert requirements include text from:

```text
all 13 Main calendars
all 15 unique Mini calendars
Main adjacent dates
all holiday names actually rendered
final Preview-only 2028-2 Mini label/dates
```

- [ ] **Step 2: Do not duplicate per-page Mini requirements**

Iterate unique `miniCalendars.values()`.

- [ ] **Step 3: Reuse Phase 3 merge logic**

Do not invent a second font-character dedup algorithm.

- [ ] **Step 4: Verify one resolved engine can serve the entire preview**

Tests may use fake requirements/catalog. The production hook/task later will call:

```text
resolveFontEngine(...)
```

once per stable requirement/catalog key.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/preview/fullYear/fontRequirements.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/preview/fullYear/fontRequirements.ts src/preview/fullYear/fontRequirements.test.ts
git commit -m "feat: merge full year font requirements"
```

---

# Task 6: Render 13 Main and 15 Unique Mini Documents

**Files:**
- Create: `src/preview/fullYear/renderDocuments.ts`
- Create: `src/preview/fullYear/renderDocuments.test.ts`

**Interfaces:**
- Produces:

```ts
export type FullYearPreviewDocuments = Readonly<{
  main: ReadonlyMap<CalendarKey, SvgDocument>;
  mini: ReadonlyMap<CalendarKey, SvgDocument>;
}>;

export async function renderFullYearPreviewDocuments(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<FullYearPreviewDocuments>;
```

- [ ] **Step 1: Write exact render-count test**

Using injectable/fake layout/materialize functions if needed, prove:

```text
13 Main layouts/materializations
15 Mini layouts/materializations
```

not:

```text
13 Main + 26 independently rendered Mini instances
```

- [ ] **Step 2: Render Main using production pipeline**

For every unique Main calendar:

```text
layoutMain
→ materializeSvg(mode = outlined)
```

- [ ] **Step 3: Render Mini using production pipeline**

For every unique Mini calendar:

```text
layoutMini
→ materializeSvg(mode = outlined)
```

- [ ] **Step 4: Use one provided resolved font engine**

This function must not call Google Fonts itself.

Font loading is resolved once above it.

- [ ] **Step 5: Use one provided asset resolver**

Marker assets continue through the Phase 3 self-contained image pipeline.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/preview/fullYear/renderDocuments.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/preview/fullYear/renderDocuments.ts src/preview/fullYear/renderDocuments.test.ts
git commit -m "feat: render full year preview documents"
```

---

# Task 7: Add Preview-only Background Asset Support

**Files:**
- Create: `src/preview/fullYear/background.ts`
- Create: `src/preview/fullYear/background.test.ts`
- Modify minimally: Phase 4 memory asset store if needed

**Interfaces:**
- Produces:

```ts
export async function resolveBackgroundDataUri(args: {
  assetId?: string;
  assetResolver: AssetResolver;
}): Promise<string | null>;
```

- [ ] **Step 1: Reuse the existing in-memory AssetResolver**

Do not create another independent image registry.

Background should store only:

```text
backgroundAssetId
```

in document/config state.

- [ ] **Step 2: Resolve background to browser-displayable data URI**

Reuse Phase 3:

```text
binaryAssetToDataUri
```

No new Base64 implementation.

- [ ] **Step 3: Add missing-background behavior**

No `backgroundAssetId`:

```text
return null
```

The page preview remains usable without a background.

- [ ] **Step 4: Prove Background does not enter Main/Mini SVG**

Test:

1. Render a Main `SvgDocument`.
2. Change only Page Preview background asset.
3. Main serialized SVG remains byte-for-byte unchanged.

This is an important product boundary.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/preview/fullYear/background.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/preview/fullYear/background.ts src/preview/fullYear/background.test.ts src/editor/assets
git commit -m "feat: add page preview background resource"
```

Stage editor asset files only if they were actually generalized.

---

# Task 8: Extend Document State with Page Preview Configuration

**Files:**
- Modify: `src/editor/state/documentStore.ts`
- Modify: `src/editor/state/documentStore.test.ts`
- Create: `src/editor/components/PagePreviewSettings.tsx`

**Interfaces:**
- Extend canonical document with:

```ts
pagePreview: PagePreviewConfig;
```

- [ ] **Step 1: Add Page Preview config to default document**

Use:

```text
DEFAULT_PAGE_PREVIEW_CONFIG
```

- [ ] **Step 2: Write Undo/Redo test for Page Layout changes**

Example:

```text
leftColumnRatio 0.30
→ commit 0.34
→ Undo 0.30
→ Redo 0.34
```

Page settings are document edits.

- [ ] **Step 3: Build simple numeric settings UI**

Expose:

```text
Page Width
Page Height
Page Padding
Left Column Ratio
Column Gap
Mini Height Ratio
Mini Gap
```

This is not a Page Editor.

Use the same local-draft → blur/Enter commit behavior established in Phase 4 Inspector.

- [ ] **Step 4: Add Background upload/clear**

Use Phase 4 in-memory image asset store.

Flow:

```text
File
→ assetId
→ commit pagePreview.backgroundAssetId
```

Clear:

```text
backgroundAssetId = undefined
```

No persistence.

- [ ] **Step 5: Do not put targetYear into Undo history**

Target year is preview/workspace input, not a template geometry edit in this phase.

Keep it outside canonical DocumentStore.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/editor/state/documentStore.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/editor/state src/editor/components/PagePreviewSettings.tsx
git commit -m "feat: configure page preview layout"
```

---

# Task 9: Build a Single Responsive Page Preview Component

**Files:**
- Create: `src/preview/fullYear/PagePreview.tsx`
- Create: `src/preview/fullYear/PagePreview.test.tsx`
- Create: `src/preview/fullYear/full-year-preview.css`

**Interfaces:**
- Consumes:

```ts
type PagePreviewProps = {
  definition: FullYearPageDefinition;
  geometry: PageGeometry;
  mainDocument: SvgDocument;
  previousMiniDocument: SvgDocument;
  nextMiniDocument: SvgDocument;
  backgroundDataUri: string | null;
};
```

- [ ] **Step 1: Render label outside the page**

Example:

```text
2027-5
[page canvas]
```

The label is UI only and not part of the composed page.

- [ ] **Step 2: Render a responsive page canvas**

Use a CSS box with:

```text
width: 100%
aspect-ratio: pageWidth / pageHeight
position: relative
overflow: hidden
```

Do not make the browser render a 3508px-wide fixed canvas solely because logical Page units are large.

- [ ] **Step 3: Convert page-unit placements to percentages**

For any placement:

```text
left = x / pageWidth * 100%
top = y / pageHeight * 100%
width = width / pageWidth * 100%
height = height / pageHeight * 100%
```

Keep Page geometry calculations in the pure domain module.

- [ ] **Step 4: Render Background first**

Use:

```html
<img>
```

with:

```css
width: 100%;
height: 100%;
object-fit: cover;
object-position: center;
```

Background must not stretch.

- [ ] **Step 5: Render production Main SVG**

Place the existing production `SvgPreview` inside the computed Main placement.

CSS makes its root SVG fill the placement box.

No Main geometry is recalculated here.

- [ ] **Step 6: Render Previous and Next Mini SVG**

Place the two reused `SvgDocument`s inside their computed contained placements.

- [ ] **Step 7: Add component test for layering and document reuse**

Assert DOM ordering:

```text
background
main
previous mini
next mini
```

and that the component receives/previews already-built documents rather than calling Calendar/Layout functions itself.

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/preview/fullYear/PagePreview.test.tsx
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/preview/fullYear/PagePreview.tsx src/preview/fullYear/PagePreview.test.tsx src/preview/fullYear/full-year-preview.css
git commit -m "feat: compose responsive page preview"
```

---

# Task 10: Build the Single-column 13-page Full-year Preview

**Files:**
- Create: `src/preview/fullYear/FullYearPreview.tsx`
- Create: `src/preview/fullYear/FullYearPreviewControls.tsx`
- Modify: `src/preview/fullYear/full-year-preview.css`
- Add tests

**Interfaces:**
- `FullYearPreview` consumes canonical committed document state plus:

```ts
targetYear: number;
holidayIndex?: HolidayIndex;
coverageDiagnostics?: readonly HolidayDiagnostic[];
assetResolver: AssetResolver;
```

- [ ] **Step 1: Add a simple target-year input**

Provide an integer year input in `FullYearPreviewControls`.

For the production composition/harness, target year can live in local/workspace React state.

Do not put every keystroke into DocumentStore history.

- [ ] **Step 2: Build the calendar set with `useMemo`**

Dependencies:

```text
targetYear
holidayIndex identity/version
```

Do not regenerate calendars for page layout-only changes.

- [ ] **Step 3: Build merged full-year font requirements**

Dependencies:

```text
calendar set
Main Template text/font-affecting data
Mini Template text/font-affecting data
```

- [ ] **Step 4: Resolve one shared font engine**

Reuse/refactor the Phase 4 in-memory font-engine hook so it can accept a precomputed:

```text
FontCatalog
FontTextRequirements
```

Do not maintain separate Editor and Full-year implementations of Google Font loading.

- [ ] **Step 5: Render full-year documents asynchronously**

Use the one resolved engine and one asset resolver.

Protect React state from stale asynchronous results:

```text
start generation A
start generation B
A resolves after B
→ A must not overwrite B
```

Use a request/generation ID or effect cleanup flag.

- [ ] **Step 6: Calculate PageGeometry once per page-layout/template-size state**

All 13 pages share the same Main/Mini intrinsic template dimensions and PageLayout, so the PageGeometry is identical.

Do not recalculate it 13 independent ways.

- [ ] **Step 7: Render exactly 13 `PagePreview` components**

Single vertical flow:

```text
2027-1
[page]

2027-2
[page]

...

2028-1
[page]
```

No grid view.

No month switcher.

- [ ] **Step 8: Surface Page Layout warnings**

Show:

```text
main-height-overflow
mini-stack-overflow
invalid-content-area
```

near Page Preview settings.

Do not silently distort content to remove warnings.

- [ ] **Step 9: Surface Holiday coverage warnings when supplied**

Render existing Phase 1 diagnostics such as:

```text
holiday-coverage-gap
```

Do not create new holiday assumptions.

- [ ] **Step 10: Use canonical committed document state**

Full-year Preview must **not** subscribe to Phase 4 transient:

```text
drag
weekdayResize
```

During a pointer drag:

```text
Editor Canvas → live
13-page Preview → remains at last committed state
```

On pointerup commit:

```text
13-page Preview → update all pages
```

Add a unit/integration test around the effective/canonical boundary if practical.

- [ ] **Step 11: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 12: Commit**

```bash
git add src/preview/fullYear
git commit -m "feat: add 13 page full year preview"
```

---

# Task 11: Integrate Full-year Preview Below Template Editor

**Files:**
- Modify the current production application/editor composition
- Modify CSS/layout only as required

**Interfaces:**
- Final Phase 5 screen order:

```text
Template Editor
Page Preview Settings
Full-year Preview (13 pages)
```

- [ ] **Step 1: Keep Template Editor behavior unchanged**

Main/Mini Editor Canvas remains the Phase 4 interaction surface.

Do not turn each of the 13 pages into editable canvases.

- [ ] **Step 2: Share canonical templates/font catalog**

The 13 pages must consume the exact same committed:

```text
mainTemplate
miniTemplate
fontCatalog
```

as Editor.

- [ ] **Step 3: Verify template propagation**

Change:

```text
Main Date offset
Main Date font size
Mini Date color
```

through Phase 4 Editor.

After each commit, all relevant pages update.

- [ ] **Step 4: Verify Page settings do not alter Main/Mini templates**

Changing:

```text
Page Padding
Left Column Ratio
Background
```

must change only page composition.

Serializing a formal Main/Mini document before/after must remain unchanged when only Page config changes.

- [ ] **Step 5: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: integrate editor with full year preview"
```

Stage only files actually modified.

---

# Task 12: Build Phase 5 Verification Harness and Performance Evidence

**Files:**
- Create: `src/verification/phase5/fixture.ts`
- Create: `src/verification/phase5/Phase5Verification.tsx`
- Create: `docs/phase5/manual-validation.md`
- Modify app entry only enough to expose/use the Phase 5 experience

**Interfaces:**
- Uses production Phase 1–5 modules.
- Validates year 2027 so the Preview crosses into leap-year February 2028.

- [ ] **Step 1: Use target year 2027**

Expected:

```text
13 pages:
2027-1 ... 2027-12, 2028-1
```

Final Page:

```text
Previous Mini = 2027-12
Next Mini = 2028-2
```

- [ ] **Step 2: Include visible background fixture**

Use an image with obviously non-square proportions/details near its edges so `cover` cropping and centering are easy to inspect.

- [ ] **Step 3: Include holidays across boundaries**

Fixture should include some normalized holidays in:

```text
2026-12
2027
2028-1
2028-2
```

so Previous/Next Mini and final Page boundary can be visually checked.

- [ ] **Step 4: Add render-count instrumentation only in verification code**

Count one generation:

```text
Main docs = 13
Mini docs = 15
Pages = 13
```

Do not ship a generic telemetry framework.

- [ ] **Step 5: Verify committed-update behavior**

Manual sequence:

1. Start dragging Main Date.
2. While pointer remains down, Editor Canvas moves live.
3. Full-year Preview stays at committed state.
4. Release pointer.
5. All 13 pages update.

This is the intentional performance behavior.

- [ ] **Step 6: Verify no font refetch on position-only commit**

Using browser Network panel:

1. Load Preview and let fonts settle.
2. Clear Network.
3. Change Date `offsetX`.
4. Confirm 13 pages update.
5. Confirm no new Google Fonts CSS/WOFF2 request caused solely by position change.

- [ ] **Step 7: Verify font change does refetch/re-resolve appropriately**

Change one font family or concrete weight.

Expected:

```text
font pipeline resolves the changed face
Preview updates
```

- [ ] **Step 8: Verify 13-page DOM remains usable**

Scroll top to bottom.

No requirement for a formal FPS number.

Acceptance is:

```text
normal scrolling remains responsive
committed template changes complete without freezing the browser
no obvious runaway repeated font requests
```

If a clear performance problem exists, profile before introducing virtualization/Worker.

- [ ] **Step 9: Create manual validation document**

Create:

```markdown
# Monthloom Phase 5 Manual Validation

## Environment

- Browser:
- OS:
- Git commit:
- GitHub Pages URL:

## Page Count / Months

- 13 pages: PASS/FAIL
- First page = 2027-1: PASS/FAIL
- Last page = 2028-1: PASS/FAIL
- Final Previous Mini = 2027-12: PASS/FAIL
- Final Next Mini = 2028-2: PASS/FAIL
- Formal Mini sequence remains 14: PASS/FAIL

## Page Layout

- Padding: PASS/FAIL
- Left Column Ratio: PASS/FAIL
- Column Gap: PASS/FAIL
- Mini Height Ratio: PASS/FAIL
- Mini Gap: PASS/FAIL
- Main scales uniformly: PASS/FAIL
- Mini scales uniformly/contain: PASS/FAIL
- Overflow warnings: PASS/FAIL

## Background

- Preserves aspect ratio: PASS/FAIL
- Cover: PASS/FAIL
- Centered crop: PASS/FAIL
- Page clips overflow: PASS/FAIL
- Main/Mini SVG unaffected by background: PASS/FAIL

## Template Propagation

- Main edit updates 13 pages after commit: PASS/FAIL
- Mini edit updates all uses after commit: PASS/FAIL
- Main/Mini remain independent: PASS/FAIL
- Drag is live only in Editor until commit: PASS/FAIL

## Rendering Reuse

- Main documents generated = 13: PASS/FAIL
- Unique Mini documents generated = 15: PASS/FAIL
- One shared full-year font engine: PASS/FAIL
- Position-only edit causes no font refetch: PASS/FAIL

## Holiday Boundary

- Adjacent Main holiday state: PASS/FAIL
- Previous Mini boundary: PASS/FAIL
- Next Mini boundary: PASS/FAIL
- Preview-only 2028-2 holiday state: PASS/FAIL
- Coverage warning display: PASS/FAIL

## Regression

- Editor selection/drag still works: PASS/FAIL
- Undo/Redo still works: PASS/FAIL
- Main Outlined export still works: PASS/FAIL
- Mini Outlined export still works: PASS/FAIL

## Performance

- Vertical scrolling responsive: PASS/FAIL
- No obvious browser freeze after committed template edit: PASS/FAIL
- No repeated unnecessary font requests: PASS/FAIL

## Decision

- [ ] ACCEPT — proceed to Phase 6
- [ ] REJECT — revise Phase 5
```

- [ ] **Step 10: Run full automated verification**

```bash
npm test
npm run build
```

- [ ] **Step 11: Commit verification harness**

```bash
git add src/verification/phase5 docs/phase5
git commit -m "test: add phase 5 full year preview verification"
```

---

# Task 13: GitHub Pages and Architecture Boundary Verification

**Files:**
- Modify deployment config only if required
- Update `docs/phase5/manual-validation.md` with actual results

- [ ] **Step 1: Verify Page Preview does not leak downward**

Run:

```bash
grep -R "preview/fullYear\|pagePreview" \
  src/domain/calendar src/domain/holiday src/domain/template src/rendering/layout src/rendering/svg src/resources || true
```

Expected:

```text
No inappropriate lower-level dependency on Preview composition.
```

`domain/pagePreview` is allowed to depend on small shared geometry/domain types, but lower layers must not depend back on it.

- [ ] **Step 2: Verify Preview does not implement SVG rendering**

Search:

```bash
grep -R "fontkit\|serializeSvg\|glyph\|buildGridBorderNodes" \
  src/preview/fullYear || true
```

Expected:

```text
No duplicated font/glyph/grid renderer logic.
```

Using production `layoutMain`, `layoutMini`, `materializeSvg`, and `SvgPreview` is allowed.

- [ ] **Step 3: Verify no Production → Spike dependency**

```bash
grep -R "src/spike\|/spike/" \
  src/domain src/rendering src/resources src/editor src/preview || true
```

Expected:

```text
No production import.
```

- [ ] **Step 4: Deploy Phase 5 to GitHub Pages**

Verify:

```text
13 pages load
background loads
Google fonts load
scrolling works
template edits propagate
```

- [ ] **Step 5: Perform Main/Mini export regression**

After changing Page Layout and Background only:

```text
formal Main SVG unchanged
formal Mini SVG unchanged
```

After changing Template:

```text
formal SVG reflects Template edit
```

- [ ] **Step 6: Final automated verification**

```bash
npm test
npm run build
```

- [ ] **Step 7: Record actual validation results**

Do not mark Phase 5 ACCEPT before user manual validation.

- [ ] **Step 8: Commit evidence**

```bash
git add docs/phase5/manual-validation.md
git commit -m "docs: record phase 5 validation"
```

---

# Phase 5 Acceptance Gate

Do not begin Phase 6 until all required items below pass.

## Page Sequence

- [ ] Exactly 13 pages render.
- [ ] Pages are a single vertical column.
- [ ] Pages are target-year January–December plus next-year January.
- [ ] Every page has Main + Previous Mini + Next Mini.
- [ ] Final Page Next Mini is next-year February.
- [ ] Preview-only February does not enter the formal 14-Mini sequence.

## Page Geometry

- [ ] Page Width is configurable.
- [ ] Page Height is configurable.
- [ ] Page Padding is configurable.
- [ ] Left Column Ratio is configurable.
- [ ] Column Gap is configurable.
- [ ] Mini Height Ratio is configurable.
- [ ] Mini Gap is configurable.
- [ ] Main width equals the right-side available width.
- [ ] Main scales uniformly.
- [ ] Main height overflow warns instead of distorting.
- [ ] Mini uses uniform contain scaling.
- [ ] Mini placement is centered in each slot.
- [ ] Invalid/overflow layout conditions are explicit.

## Background

- [ ] One Background can be uploaded for Preview.
- [ ] Background preserves aspect ratio.
- [ ] Background uses cover.
- [ ] Background is centered.
- [ ] Overflow is clipped.
- [ ] Background is reused across all 13 pages.
- [ ] Background does not enter formal Main SVG.
- [ ] Background does not enter formal Mini SVG.

## Rendering Reuse

- [ ] Full-year Preview uses Phase 1 Calendar Core.
- [ ] Full-year Preview uses Phase 2 Layout Engine.
- [ ] Full-year Preview uses Phase 3 Outlined SVG Materializer/Preview.
- [ ] No second Main/Mini renderer exists.
- [ ] Exactly 13 unique Main documents are rendered.
- [ ] Exactly 15 unique Mini documents are rendered.
- [ ] Repeated Previous/Next Mini uses reuse the same document by month key.
- [ ] One merged full-year font requirement set is resolved.
- [ ] One resolved font engine serves one Preview generation.

## Editor Integration

- [ ] Full-year Preview uses canonical committed template state.
- [ ] Editor drag remains live in Editor Canvas.
- [ ] Full-year Preview does not rerender on every transient pointermove.
- [ ] Pointerup/committed edit updates all relevant pages.
- [ ] Main template edits propagate to all 13 Main instances.
- [ ] Mini template edits propagate to every corresponding Mini use.
- [ ] Page settings do not mutate Main/Mini templates.

## Holiday Boundary

- [ ] HolidayIndex is passed into every generated CalendarMonth.
- [ ] Main adjacent holiday state still renders.
- [ ] Previous December Mini works.
- [ ] Next January Mini works.
- [ ] Preview-only next February Mini works.
- [ ] Existing coverage diagnostics can be surfaced.
- [ ] No missing holiday data is guessed.

## Performance

- [ ] Fonts are not fetched separately 28 times.
- [ ] Position-only template edits do not trigger font refetch.
- [ ] Mini documents are not redundantly regenerated per page use.
- [ ] 13-page vertical scrolling is acceptably responsive.
- [ ] Committed template changes do not visibly freeze the browser.
- [ ] No Canvas/WebGL/virtualization/Worker was introduced without profiling evidence.

## Regression

- [ ] Phase 4 Editor selection works.
- [ ] Phase 4 Drag/Anchor works.
- [ ] Phase 4 Undo/Redo works.
- [ ] Phase 3 Main Outlined export works.
- [ ] Phase 3 Mini Outlined export works.
- [ ] Phase 1–4 automated tests remain green.
- [ ] `npm run build` succeeds.
- [ ] GitHub Pages deployment works.

## Decision

If all page composition, boundary-month, rendering-reuse, performance, and regression checks pass:

```text
Phase 5 — Full-year Page Preview
→ ACCEPT
→ Proceed to Phase 6 — Persistence + Batch Export
```

If page layout distorts Main/Mini, final February enters formal output scope, Background leaks into formal SVG, or full-year rendering duplicates the font/render pipeline:

```text
Phase 5
→ REJECT
→ Fix Page Preview composition before persistence/export work
```
