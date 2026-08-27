# Monthloom Phase 2 — Template Model + Layout Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Monthloom's production Template Model and Layout Engine so Main and Mini calendar data can be converted into deterministic semantic Render Scenes using configurable Grid/Cell geometry, Anchor + Offset positioning, typography inputs, holiday markers, dots, border geometry, and adjacent-month opacity.

**Architecture:** Production layout must remain pure and renderer-independent. Template data defines design rules; Calendar Domain supplies dates and holiday state; the Layout Engine converts those inputs into semantic positioned nodes without generating SVG XML or React elements. Text placement delegates metric calculations to a narrow text-measurement interface so Phase 2 can be tested deterministically and Phase 3 can later connect the real font engine.

**Tech Stack:** TypeScript, Vitest. Reuse Phase 1 Calendar Domain. No new runtime dependency is required for this phase.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- Do not extend or import production logic from `src/spike/`.
- Do not implement SVG serialization, React SVG Preview, outlined glyph paths, Editable SVG, Editor, Zustand, Dexie, ZIP export, or full-year Page Preview in this phase.
- Main and Mini templates are independent models even when they reuse small shared types.
- Templates store semantic design rules, never per-month or per-date absolute coordinates.
- `Cell` is the positioning coordinate system.
- Version 1 has no Padding Layer.
- Element positioning is always `Anchor + offsetX + offsetY`.
- Main and Mini must both support 4 / 5 / 6 calendar rows without changing template values.
- Main Weekday Row has no border.
- Main Date Grid has one outer border plus non-duplicated internal lines.
- User-configured Main/Mini width and height are logical final View dimensions.
- Border stroke must remain inside those logical View dimensions.
- Main adjacent-month opacity applies to date-related content only, never Grid border or Weekday content.
- Mini adjacent-month Cells exist but render no date content.
- Color priority is: Japanese Holiday → Sunday → Saturday → default.
- Main China holiday/workday markers and names remain independent semantic elements.
- Main Japan holiday name is a separate semantic element.
- Mini China holiday/workday states render configurable dots only.
- Mini does not render Japan holiday names.
- Layout Engine must not know Google Fonts, fontkit, SVG XML, React, Figma, or third-party holiday schemas.
- Use a deterministic injected text-measurement abstraction rather than browser `<text>` metrics.
- Prefer simple data structures and pure functions over classes unless a class clearly reduces complexity.

---

# 1. Target Production File Structure

```text
src/
  domain/
    template/
      primitives.ts
      font.ts
      mainTemplate.ts
      miniTemplate.ts
      defaults.ts
      template.test.ts

  rendering/
    scene/
      types.ts

    layout/
      geometry.ts
      geometry.test.ts
      anchors.ts
      anchors.test.ts
      colorRules.ts
      colorRules.test.ts
      textMetrics.ts
      textMetrics.test.ts
      mainLayout.ts
      mainLayout.test.ts
      miniLayout.ts
      miniLayout.test.ts
      layout.integration.test.ts
```

Responsibilities:

- `template/primitives.ts`: Anchor, Position, Typography, MarkerTemplate, DotTemplate.
- `template/font.ts`: Font descriptor/reference types only.
- `template/mainTemplate.ts`: Main template shape.
- `template/miniTemplate.ts`: Mini template shape.
- `template/defaults.ts`: One usable default Main/Mini template for tests and initial product bootstrap.
- `scene/types.ts`: semantic Render Scene node types; no SVG-specific representation.
- `layout/geometry.ts`: View/row/cell/grid geometry.
- `layout/anchors.ts`: generic anchor-point calculation for rectangles.
- `layout/colorRules.ts`: deterministic date color precedence.
- `layout/textMetrics.ts`: renderer-independent typography-box placement interface.
- `layout/mainLayout.ts`: CalendarMonth + MainTemplate → RenderScene.
- `layout/miniLayout.ts`: CalendarMonth + MiniTemplate → RenderScene.
- `layout.integration.test.ts`: production domain-to-layout end-to-end assertions.

---

# Task 1: Define Shared Template Primitives

**Files:**
- Create: `src/domain/template/primitives.ts`
- Create: `src/domain/template/font.ts`
- Create: `src/domain/template/template.test.ts`

**Interfaces:**
- Produces:

```ts
export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Position = Readonly<{
  anchor: Anchor;
  offsetX: number;
  offsetY: number;
}>;

export type FontSource =
  | Readonly<{
      type: "google";
      family: string;
    }>
  | Readonly<{
      type: "local";
      assetId: string;
    }>;

export type FontDescriptor = Readonly<{
  family: string;
  weight: number;
  style: "normal" | "italic";
  source: FontSource;
}>;

export type Typography = Readonly<{
  fontId: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  color: string;
  opacity: number;
}>;

export type TextElementTemplate = Readonly<{
  position: Position;
  typography: Typography;
}>;

export type TextMarkerTemplate = Readonly<{
  type: "text";
  value: string;
  position: Position;
  typography: Typography;
}>;

export type ImageMarkerTemplate = Readonly<{
  type: "image";
  assetId: string;
  position: Position;
  width: number;
  height: number;
  opacity: number;
}>;

export type MarkerTemplate = TextMarkerTemplate | ImageMarkerTemplate;

export type DotTemplate = Readonly<{
  position: Position;
  size: number;
  color: string;
  opacity: number;
}>;
```

- [ ] **Step 1: Write type-level construction tests**

Create `template.test.ts` with valid example objects for:

```text
Position
Typography
Text marker
Image marker
Dot
Google Font
Local Font
```

Use `satisfies` so TypeScript checks exact intent.

- [ ] **Step 2: Add negative compile expectations only where useful**

Use `// @ts-expect-error` for examples such as:

```text
anchor: "middle"
marker.type: "svg"
font.style: "oblique"
```

Do not turn this file into exhaustive compile-time testing.

- [ ] **Step 3: Implement primitives and font types**

Keep these files data-only. No validation library or helper functions yet.

- [ ] **Step 4: Run tests and build**

```bash
npm test -- src/domain/template/template.test.ts
npm test
npm run build
```

Expected:

```text
Template primitive tests pass.
Existing Phase 1 and Spike tests remain green.
Build succeeds.
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/template
git commit -m "feat: define template primitives"
```

---

# Task 2: Define Main and Mini Template Models

**Files:**
- Create: `src/domain/template/mainTemplate.ts`
- Create: `src/domain/template/miniTemplate.ts`
- Create: `src/domain/template/defaults.ts`
- Modify: `src/domain/template/template.test.ts`

**Interfaces:**
- Produces:

```ts
export type MainTemplate = Readonly<{
  width: number;
  height: number;

  weekdayRow: Readonly<{
    height: number;
    weekday: TextElementTemplate;
  }>;

  dateGrid: Readonly<{
    borderWidth: number;
    borderColor: string;
  }>;

  date: TextElementTemplate;
  chinaHolidayName: TextElementTemplate;
  japanHolidayName: TextElementTemplate;

  chinaMarkers: Readonly<{
    holiday: MarkerTemplate;
    workday: MarkerTemplate;
  }>;

  colors: Readonly<{
    default: string;
    sunday: string;
    saturday: string;
    japanHoliday: string;
  }>;

  adjacentMonthOpacity: number;
}>;

export type MiniTemplate = Readonly<{
  width: number;
  height: number;

  monthRow: Readonly<{
    height: number;
    label: TextElementTemplate;
  }>;

  weekdayRow: Readonly<{
    height: number;
    weekday: TextElementTemplate;
  }>;

  date: TextElementTemplate;

  markers: Readonly<{
    holidayDot: DotTemplate;
    workdayDot: DotTemplate;
  }>;

  colors: Readonly<{
    default: string;
    sunday: string;
    saturday: string;
    japanHoliday: string;
  }>;
}>;

export const DEFAULT_MAIN_TEMPLATE: MainTemplate;
export const DEFAULT_MINI_TEMPLATE: MiniTemplate;
```

- [ ] **Step 1: Add tests for template separation**

Assert that Main contains:

```text
border
adjacentMonthOpacity
China marker
China holiday name
Japan holiday name
```

and Mini contains:

```text
month row
weekday row
date
holiday dot
workday dot
```

but not Main-specific fields.

- [ ] **Step 2: Implement Main and Mini types**

Do not create a giant shared `CalendarTemplate`.

Share only small primitive types.

- [ ] **Step 3: Add usable defaults**

Defaults only need to be internally consistent, not visually final.

Suggested values:

```text
Main:
width = 700
height = 500
weekdayRow.height = 50
dateGrid.borderWidth = 1
adjacentMonthOpacity = 0.6

Mini:
width = 280
height = 210
monthRow.height = 30
weekdayRow.height = 30
```

Use separate typography defaults for:

```text
Weekday
Date
Chinese Holiday
Japanese Holiday
Mini Month Label
```

Do not force all text to share one typography object reference.

- [ ] **Step 4: Guard obvious invalid default values through tests**

Assert:

```text
width > 0
height > 0
row heights >= 0
row heights < view height
border width >= 0
opacity between 0 and 1
```

This phase does not require a full runtime template validator.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/domain/template/template.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/template
git commit -m "feat: define main and mini templates"
```

---

# Task 3: Define Renderer-independent Semantic Render Scene

**Files:**
- Create: `src/rendering/scene/types.ts`

**Interfaces:**
- Produces:

```ts
export type SemanticElementId =
  | "main.weekday"
  | "main.date"
  | "main.chinaHolidayName"
  | "main.japanHolidayName"
  | "main.chinaHolidayMarker"
  | "main.chinaWorkdayMarker"
  | "main.grid"
  | "mini.monthLabel"
  | "mini.weekday"
  | "mini.date"
  | "mini.holidayDot"
  | "mini.workdayDot";

export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type SceneTextNode = Readonly<{
  kind: "text";
  semanticId: SemanticElementId;
  text: string;
  cell: Rect;
  position: Position;
  typography: Typography;
  color: string;
  opacity: number;
}>;

export type SceneImageNode = Readonly<{
  kind: "image";
  semanticId: SemanticElementId;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}>;

export type SceneDotNode = Readonly<{
  kind: "dot";
  semanticId: SemanticElementId;
  cx: number;
  cy: number;
  radius: number;
  color: string;
  opacity: number;
}>;

export type SceneLineNode = Readonly<{
  kind: "line";
  semanticId: SemanticElementId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}>;

export type SceneRectNode = Readonly<{
  kind: "rect";
  semanticId: SemanticElementId;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}>;

export type RenderNode =
  | SceneTextNode
  | SceneImageNode
  | SceneDotNode
  | SceneLineNode
  | SceneRectNode;

export type RenderScene = Readonly<{
  width: number;
  height: number;
  nodes: readonly RenderNode[];
}>;
```

- [ ] **Step 1: Create the scene types**

Keep them renderer-independent.

Do not add:

```text
SVG path data
XML attributes
React elements
fontkit glyph objects
DOM references
```

- [ ] **Step 2: Verify production boundary**

Run:

```bash
grep -R "fontkit\|react\|<svg\|pathData" src/rendering/scene || true
```

Expected:

```text
No renderer-specific dependency.
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/rendering/scene
git commit -m "feat: define semantic render scene"
```

---

# Task 4: Implement Grid and Cell Geometry

**Files:**
- Create: `src/rendering/layout/geometry.ts`
- Create: `src/rendering/layout/geometry.test.ts`

**Interfaces:**
- Produces:

```ts
export type GridGeometry = Readonly<{
  bounds: Rect;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  cells: readonly Rect[];
}>;

export function createGridGeometry(args: {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
}): GridGeometry;

export function buildGridBorderNodes(args: {
  bounds: Rect;
  columns: number;
  rows: number;
  strokeWidth: number;
  strokeColor: string;
  semanticId: "main.grid";
}): readonly RenderNode[];
```

- [ ] **Step 1: Write 7×4 / 7×5 / 7×6 geometry tests**

For:

```text
width = 700
height = 420
```

assert:

```text
7 columns → cellWidth = 100

4 rows → 105
5 rows → 84
6 rows → 70
```

Assert exact cell count:

```text
28 / 35 / 42
```

- [ ] **Step 2: Implement `createGridGeometry`**

Cells must be row-major:

```text
row 0 col 0
row 0 col 1
...
```

No border or padding adjustment belongs in Cell geometry.

- [ ] **Step 3: Write border tests for 0.5 / 1 / 2**

For each stroke width, assert:

- One outer rect.
- Six vertical lines.
- `rows - 1` horizontal lines.
- Outer border path is inset by `strokeWidth / 2`.
- No duplicate internal lines.

- [ ] **Step 4: Implement border node generation**

Outer rect:

```text
x + s/2
y + s/2
width - s
height - s
```

Internal lines remain at logical column/row boundaries.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/rendering/layout/geometry.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/rendering/layout/geometry.ts src/rendering/layout/geometry.test.ts
git commit -m "feat: add calendar grid geometry"
```

---

# Task 5: Implement Nine-point Anchor Geometry

**Files:**
- Create: `src/rendering/layout/anchors.ts`
- Create: `src/rendering/layout/anchors.test.ts`

**Interfaces:**
- Produces:

```ts
export type Point = Readonly<{
  x: number;
  y: number;
}>;

export function getAnchorPoint(
  rect: Rect,
  anchor: Anchor,
): Point;

export function applyOffset(
  point: Point,
  position: Position,
): Point;
```

- [ ] **Step 1: Write all nine anchor tests**

For:

```text
rect = { x: 10, y: 20, width: 100, height: 60 }
```

expected:

```text
top-left      = 10,20
top-center    = 60,20
top-right     = 110,20
center-left   = 10,50
center        = 60,50
center-right  = 110,50
bottom-left   = 10,80
bottom-center = 60,80
bottom-right  = 110,80
```

- [ ] **Step 2: Implement anchors with horizontal/vertical decomposition**

Avoid nine unrelated calculations.

- [ ] **Step 3: Test offsets**

Example:

```text
anchor = center
offsetX = 14
offsetY = -8
```

expected:

```text
74,42
```

- [ ] **Step 4: Run tests/build**

```bash
npm test -- src/rendering/layout/anchors.test.ts
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/rendering/layout/anchors.ts src/rendering/layout/anchors.test.ts
git commit -m "feat: add nine point anchor geometry"
```

---

# Task 6: Implement Date Color Priority

**Files:**
- Create: `src/rendering/layout/colorRules.ts`
- Create: `src/rendering/layout/colorRules.test.ts`

**Interfaces:**
- Produces:

```ts
export type CalendarColors = Readonly<{
  default: string;
  sunday: string;
  saturday: string;
  japanHoliday: string;
}>;

export function resolveDateColor(
  cell: CalendarCell,
  colors: CalendarColors,
): string;
```

- [ ] **Step 1: Write precedence tests**

Cover:

```text
normal weekday → default
Sunday → sunday
Saturday → saturday
Japanese Holiday weekday → japanHoliday
Japanese Holiday Saturday → japanHoliday
Japanese Holiday Sunday → japanHoliday
China holiday only → normal weekday/weekend rule
China workday only → normal weekday/weekend rule
```

China status does not override date text color.

- [ ] **Step 2: Implement exact precedence**

```text
if japan holiday → japanHoliday
else if Sunday → sunday
else if Saturday → saturday
else default
```

- [ ] **Step 3: Run tests/build**

```bash
npm test -- src/rendering/layout/colorRules.test.ts
npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/rendering/layout/colorRules.ts src/rendering/layout/colorRules.test.ts
git commit -m "feat: add calendar color rules"
```

---

# Task 7: Define Renderer-independent Text Measurement Contract

**Files:**
- Create: `src/rendering/layout/textMetrics.ts`
- Create: `src/rendering/layout/textMetrics.test.ts`

**Interfaces:**
- Produces:

```ts
export type TextMetrics = Readonly<{
  width: number;
  ascent: number;
  descent: number;
}>;

export interface TextMeasurer {
  measure(text: string, typography: Typography): TextMetrics;
}

export type PositionedText = Readonly<{
  originX: number;
  baselineY: number;
  metrics: TextMetrics;
}>;

export function positionText(args: {
  text: string;
  cell: Rect;
  position: Position;
  typography: Typography;
  measurer: TextMeasurer;
}): PositionedText;
```

- [ ] **Step 1: Write deterministic tests using fake metrics**

Fake measurer:

```ts
const measurer: TextMeasurer = {
  measure: () => ({
    width: 40,
    ascent: 16,
    descent: -4,
  }),
};
```

Test:

```text
top-left
center
bottom-right
```

using the exact formulas validated in the Rendering Spike.

- [ ] **Step 2: Implement positioning**

Use the typography box:

```text
top = baseline - ascent
bottom = baseline - descent
```

Do not use ink bounds.

- [ ] **Step 3: Keep font engine outside this module**

No `fontkit` import is allowed.

Phase 3 will provide a production `TextMeasurer` implementation backed by resolved font resources.

- [ ] **Step 4: Run tests/build**

```bash
npm test -- src/rendering/layout/textMetrics.test.ts
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/rendering/layout/textMetrics.ts src/rendering/layout/textMetrics.test.ts
git commit -m "feat: add renderer independent text positioning"
```

---

# Task 8: Implement Main Layout

**Files:**
- Create: `src/rendering/layout/mainLayout.ts`
- Create: `src/rendering/layout/mainLayout.test.ts`

**Interfaces:**
- Consumes:
  - `CalendarMonth`
  - `MainTemplate`
  - `TextMeasurer`
  - geometry/anchor/color helpers
- Produces:

```ts
export function layoutMain(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  textMeasurer: TextMeasurer;
  weekdays?: readonly string[];
}): RenderScene;
```

Default weekdays:

```text
Sun Mon Tue Wed Thu Fri Sat
```

- [ ] **Step 1: Write geometry test for a 5-week Main**

For:

```text
width = 700
height = 500
weekdayRowHeight = 50
weekCount = 5
```

assert:

```text
Date Grid:
x = 0
y = 50
width = 700
height = 450

cellWidth = 100
dateRowHeight = 90
```

- [ ] **Step 2: Render seven Weekday semantic text nodes**

Each Weekday uses the same semantic ID:

```text
main.weekday
```

but occupies a different weekday Cell/rect.

No weekday border nodes.

- [ ] **Step 3: Render Main Grid border nodes**

Use only `buildGridBorderNodes`.

Do not create Cell border nodes.

- [ ] **Step 4: Render date text for all visible Cells**

Main must render:

```text
current-month dates
+
adjacent-month dates
```

No zero padding.

Each date node:

```text
semanticId = main.date
text = String(date.day)
color = resolveDateColor(...)
```

- [ ] **Step 5: Apply adjacent-month opacity correctly**

For `inCurrentMonth === false`:

```text
date node opacity
= typography.opacity * adjacentMonthOpacity
```

The same multiplier applies to:

```text
China marker
China holiday name
Japan holiday name
```

Do not apply it to:

```text
Main Grid
Weekday
```

- [ ] **Step 6: Render China holiday/workday marker**

For:

```text
cell.holiday?.china?.type
```

select independently:

```text
holiday marker
workday marker
```

Text marker:

```text
SceneTextNode
```

Image marker:

```text
SceneImageNode
```

Use Cell + Marker Position for geometry.

Do not hardcode the visible marker text to `假` or `班`; use `TextMarkerTemplate.value`.

- [ ] **Step 7: Render China holiday name**

Only render when:

```text
cell.holiday?.china?.name
```

exists.

Use semantic ID:

```text
main.chinaHolidayName
```

- [ ] **Step 8: Render Japan holiday name**

Only render when:

```text
cell.holiday?.japan?.name
```

exists.

Use semantic ID:

```text
main.japanHolidayName
```

Date color must already be Japan-holiday color.

- [ ] **Step 9: Assert China + Japan coexistence**

Create one test Cell where both exist.

Expected semantic content:

```text
date
China marker
China holiday name
Japan holiday name
```

No element suppresses another.

- [ ] **Step 10: Assert adjacent holiday behavior**

For an adjacent-month Cell containing:

```text
Japan holiday
China holiday/workday
```

assert:

```text
correct date color
all relevant semantic elements exist
all date-related nodes receive adjacent opacity multiplier
Grid remains opacity 1 / unchanged
```

- [ ] **Step 11: Add 4 / 5 / 6-row geometry assertions**

Use Phase 1 months:

```text
2026-02 → 4
2027-02 → 5
2027-05 → 6
```

All layouts must preserve:

```text
scene.width = template.width
scene.height = template.height
```

- [ ] **Step 12: Run tests/build**

```bash
npm test -- src/rendering/layout/mainLayout.test.ts
npm test
npm run build
```

- [ ] **Step 13: Commit**

```bash
git add src/rendering/layout/mainLayout.ts src/rendering/layout/mainLayout.test.ts
git commit -m "feat: layout main calendar scene"
```

---

# Task 9: Implement Mini Layout

**Files:**
- Create: `src/rendering/layout/miniLayout.ts`
- Create: `src/rendering/layout/miniLayout.test.ts`

**Interfaces:**
- Consumes:
  - `CalendarMonth`
  - `MiniTemplate`
  - `TextMeasurer`
- Produces:

```ts
export function layoutMini(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  textMeasurer: TextMeasurer;
  weekdays?: readonly string[];
}): RenderScene;
```

Default weekdays:

```text
S M T W T F S
```

- [ ] **Step 1: Write Mini row geometry test**

For:

```text
width = 280
height = 210
monthRow = 30
weekdayRow = 30
weekCount = 5
```

assert:

```text
Date Grid y = 60
Date Grid height = 150
cellWidth = 40
dateRowHeight = 30
```

- [ ] **Step 2: Render Month Label**

Format:

```text
YYYY-M
```

Examples:

```text
2027-5
2028-1
```

No zero padding.

Use semantic ID:

```text
mini.monthLabel
```

Use template Anchor + Offset.

- [ ] **Step 3: Render weekday labels**

Default:

```text
S M T W T F S
```

No borders.

- [ ] **Step 4: Keep adjacent Cells empty**

For:

```text
inCurrentMonth === false
```

do not render:

```text
date
holiday/workday dots
```

The Cell geometry still exists internally for positioning current-month Cells.

- [ ] **Step 5: Render current-month date color rules**

Use the exact same priority:

```text
Japan holiday
→ Sunday
→ Saturday
→ default
```

Do not render Japan holiday names.

- [ ] **Step 6: Render China dots**

If:

```text
china.type === "holiday"
```

render:

```text
mini.holidayDot
```

If:

```text
china.type === "workday"
```

render:

```text
mini.workdayDot
```

Geometry:

```text
anchor point from cell
+ offset
```

Interpret:

```text
size = diameter
radius = size / 2
```

- [ ] **Step 7: Assert Japan holiday + China dot coexistence**

If one current-month date is both:

```text
Japanese holiday
China holiday/workday
```

expected:

```text
date uses Japan holiday color
China dot still renders
```

- [ ] **Step 8: Add 4 / 5 / 6-row tests**

Assert scene dimensions never change with row count.

- [ ] **Step 9: Run tests/build**

```bash
npm test -- src/rendering/layout/miniLayout.test.ts
npm test
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/rendering/layout/miniLayout.ts src/rendering/layout/miniLayout.test.ts
git commit -m "feat: layout mini calendar scene"
```

---

# Task 10: Verify End-to-end Domain → Layout Behavior

**Files:**
- Create: `src/rendering/layout/layout.integration.test.ts`

**Interfaces:**
- Consumes:
  - Phase 1 holiday adapters/index/calendar generation
  - Phase 2 default templates/layout functions
- Produces no new production abstraction.

- [ ] **Step 1: Build one normalized holiday fixture through real adapters**

Use:

```text
China holiday
China workday
Japan holiday
one date where China + Japan coexist
```

Build:

```text
raw JSON
→ adapters
→ HolidayIndex
→ CalendarMonth
```

- [ ] **Step 2: Layout one Main month**

Assert semantic node presence rather than SVG details.

Verify:

```text
7 weekday nodes
1 grid border group worth of rect/lines
all visible date nodes
China marker
China holiday name
Japan holiday name
adjacent dates
adjacent opacity
correct colors
```

- [ ] **Step 3: Layout the same month as Mini**

Verify:

```text
Month Label
7 weekday labels
only current-month date nodes
no adjacent date content
no Japan holiday names
China dots
correct colors
```

- [ ] **Step 4: Verify template changes affect all Cells uniformly**

Clone the Main template with:

```text
date.typography.fontSize changed
date.position.offsetX changed
```

Generate a new scene.

Assert all `main.date` nodes reflect the same updated semantic template rules.

Do not add per-date overrides.

- [ ] **Step 5: Verify there are no renderer dependencies**

Run:

```bash
grep -R "fontkit\|react\|serializeSvg\|SvgPreview\|<svg" src/rendering/layout src/domain/template || true
```

Expected:

```text
No production Template/Layout dependency on fontkit, React, or SVG serialization.
```

- [ ] **Step 6: Run complete automated verification**

```bash
npm test
npm run build
```

Expected:

```text
All Phase 2 tests pass.
All Phase 1 tests pass.
Rendering Spike tests remain green.
Build succeeds.
```

- [ ] **Step 7: Commit**

```bash
git add src/rendering/layout/layout.integration.test.ts
git commit -m "test: verify template layout integration"
```

---

# Phase 2 Acceptance Gate

Do not begin Phase 3 — Production SVG Renderer until all required items below pass.

## Template Model

- [ ] Main and Mini templates are separate types.
- [ ] Shared primitives are limited to Position/Typography/Marker/Font-style data.
- [ ] Templates contain semantic design rules only.
- [ ] No date-specific or month-specific absolute layout overrides exist.
- [ ] Main contains border, adjacent opacity, China marker/name, Japan name.
- [ ] Mini contains Month Row, Weekday Row, Date and China dots.
- [ ] Mini does not inherit Main rendering behavior through a giant generic template.

## Geometry

- [ ] Main and Mini support 4 / 5 / 6 rows.
- [ ] Grid width is always divided into exactly 7 logical columns.
- [ ] Remaining Date Grid height is divided equally by actual week count.
- [ ] Cell geometry is independent of border width.
- [ ] Outer stroke is inset by `strokeWidth / 2`.
- [ ] Internal grid lines are generated once.
- [ ] Scene width/height always equal configured template width/height.

## Anchor + Text Placement

- [ ] All nine Anchors are implemented.
- [ ] Offset is applied relative to the selected Anchor.
- [ ] Text placement uses injected metrics.
- [ ] Typography box uses width/ascent/descent.
- [ ] Layout does not import fontkit or browser text APIs.
- [ ] The same template works across 4 / 5 / 6-row months.

## Main

- [ ] Weekday Row is borderless.
- [ ] Date Grid has the configured border.
- [ ] Adjacent dates render.
- [ ] Adjacent dates retain Sunday/Saturday/Japan holiday colors.
- [ ] Adjacent date-related content receives adjacent opacity.
- [ ] Grid and Weekday content do not receive adjacent opacity.
- [ ] China holiday marker renders.
- [ ] China workday marker renders.
- [ ] Marker text is template-defined, not hardcoded.
- [ ] Image marker geometry is supported.
- [ ] China holiday name renders independently.
- [ ] Japan holiday name renders independently.
- [ ] China and Japan content can coexist in one Cell.

## Mini

- [ ] Month Label format is `YYYY-M`.
- [ ] Month Row is borderless.
- [ ] Weekday Row is borderless.
- [ ] Date Grid is borderless.
- [ ] Adjacent Cells render no date content.
- [ ] Japanese Holiday changes date color.
- [ ] Japanese Holiday name does not render.
- [ ] China holiday dot renders.
- [ ] China workday dot renders.
- [ ] Dot size means diameter and maps to `radius = size / 2`.

## Architecture

- [ ] Calendar Domain has not gained rendering dependencies.
- [ ] Template Model has no React/SVG/fontkit dependency.
- [ ] Layout Engine has no React/SVG serialization/fontkit dependency.
- [ ] Render Scene contains semantic rendering data, not SVG XML.
- [ ] No production code imports from `src/spike/`.
- [ ] No Editor, persistence, Page Preview, or ZIP functionality was added.

## Verification

- [ ] Phase 2 unit tests pass.
- [ ] Layout integration test passes.
- [ ] Phase 1 tests remain green.
- [ ] Rendering Spike tests remain green.
- [ ] `npm run build` succeeds.

## Decision

If all acceptance items pass:

```text
Phase 2 — Template Model + Layout Engine
→ ACCEPT
→ Proceed to Phase 3 — Production SVG Renderer
```

If any geometry, template-scope, semantic-element, or dependency-boundary invariant fails:

```text
Phase 2
→ REJECT
→ Fix Layout/Template behavior before introducing SVG materialization
```
