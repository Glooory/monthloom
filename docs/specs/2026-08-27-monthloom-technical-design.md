# Monthloom Technical Design

## 1. Document Status

- Project: **Monthloom**
- Purpose: Technical architecture and implementation design
- Scope: First production version of Monthloom
- Deployment target: **GitHub Pages**
- Application type: **Client-only static Web application**
- Primary output: **Main / Mini SVG**
- Non-goal: Figma replacement, general-purpose vector editor, cloud collaboration

This document reflects the currently confirmed product requirements and the technical decisions made for the first implementation. When later implementation findings conflict with this document, the design should be updated explicitly rather than silently diverging in code.

---

## 2. Engineering Goals

Monthloom should optimize for:

1. Simple implementation
2. Clear module boundaries
3. Reliable SVG geometry
4. Preview / export consistency
5. High-fidelity text rendering
6. Easy template adjustment
7. Easy maintenance
8. Static deployment
9. No unnecessary backend or infrastructure
10. No general-purpose editor abstractions unless required by calendar-specific behavior

The most important architectural principle is:

> **Calendar data, layout calculation, rendering representation, preview, and SVG export must be separated, while Preview and Export must reuse the same layout and rendering result as much as possible.**

---

## 3. Key Architecture Decisions

### 3.1 Client-only application

Monthloom will be implemented as:

```text
Vite
+ React
+ TypeScript
+ Browser APIs
```

The application must build into static files and deploy directly to GitHub Pages.

It must not require:

- Node.js server
- SSR
- Server Actions
- Serverless Functions
- Database server
- User account
- Private API key
- Cloud storage

If a future feature requires a backend, it should be treated as a deliberate architectural change rather than an incremental implementation detail.

---

### 3.2 React is not the rendering source of truth

React is responsible for:

- Application shell
- Template Editor UI
- Inspector
- Preview presentation
- User interaction
- Selection overlays
- Local state integration

React components should **not** contain the authoritative layout algorithm.

The authoritative pipeline is:

```text
Calendar Data
+
Holiday Data
+
Template
+
Resolved Resources
        ↓
Layout Engine
        ↓
Render Scene
        ↓
SVG Materializer
        ↓
SVG AST
       ↙   ↘
Preview     Serializer
              ↓
             SVG
```

The exported SVG should not be reconstructed independently from the React DOM.

---

### 3.3 Preview and export share one rendering pipeline

The default Preview should use the same outlined glyph geometry used by the default Outlined SVG export.

Therefore:

```text
Preview Text
=
Font shaping
→ Glyph paths
→ SVG paths
```

and:

```text
Outlined Export Text
=
same shaping
→ same glyph paths
→ same SVG paths
```

This is one of the most important decisions in Monthloom.

It greatly reduces differences caused by browser text layout, local fonts, SVG baseline behavior, and Figma font availability.

---

## 4. High-level Architecture

```text
┌─────────────────────────────┐
│          React App          │
│                             │
│ Editor / Inspector / UI     │
│ Full-year Preview           │
└──────────────┬──────────────┘
               │
               │ modifies
               ▼
┌─────────────────────────────┐
│        Document State       │
│ Year / Templates / Layout   │
│ Holiday Data / Assets       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Calendar Core        │
│ Month / weeks / dates       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Layout Engine         │
│ Grid / Cell / Anchor        │
│ Text placement / Marker     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Render Scene         │
│ Semantic render nodes       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      SVG Materializer       │
│ outlined / editable text    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│           SVG AST           │
└───────────┬─────────────────┘
            │
      ┌─────┴─────┐
      ▼           ▼
React Preview   SVG Serializer
                    │
                    ▼
                SVG / ZIP
```

---

## 5. Module Boundaries

Recommended source structure:

```text
src/
  app/

  domain/
    calendar/
    holiday/
    template/

  rendering/
    layout/
    scene/
    svg/
    text/

  resources/
    fonts/
    images/

  editor/
    selection/
    interaction/
    inspector/
    history/

  preview/
    page-layout/

  persistence/
    repositories/
    migrations/

  export/
    svg/
    zip/

  shared/
```

This is a source-level modular structure only.

Do **not** turn the project into a monorepo or multiple packages in the first version.

---

# 6. Calendar Core

## 6.1 Responsibility

Calendar Core answers questions such as:

- Which weekday does a month start on?
- Does a month occupy 4, 5, or 6 calendar weeks?
- Which dates belong to each cell?
- Which cells belong to adjacent months?
- What is the previous / next month?

Calendar Core must not know:

- SVG
- React
- Fonts
- Anchors
- Pixel coordinates
- Inspector
- Figma
- Timor JSON
- holidays-jp JSON

---

## 6.2 Date representation

Do not use browser-local `Date` objects as domain values.

Use a date-only model:

```ts
type LocalDate = {
  year: number
  month: number
  day: number
}
```

All date utility functions should be centralized.

Examples:

```ts
daysInMonth(date)
dayOfWeek(date)
addDays(date, delta)
compareDate(a, b)
toISODate(date)
```

Internal implementation may use UTC-based JavaScript `Date`, but `Date` should not leak into domain APIs.

This avoids timezone-related date changes.

---

## 6.3 Calendar month model

```ts
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

type CalendarCell = {
  date: LocalDate
  dayOfWeek: DayOfWeek
  inCurrentMonth: boolean
  holiday?: HolidayInfo
}

type CalendarWeek = CalendarCell[]

type CalendarMonth = {
  year: number
  month: number
  weekCount: 4 | 5 | 6
  weeks: CalendarWeek[]
}
```

Calendar Core always generates the complete rectangular calendar grid.

Main rendering uses adjacent-month cells.

Mini rendering leaves adjacent-month cells visually empty.

This avoids having two separate calendar algorithms.

---

# 7. Holiday Architecture

## 7.1 Internal model

Renderer and Calendar Core must not depend on third-party JSON formats.

Normalized model:

```ts
type HolidayInfo = {
  china?: {
    type: "holiday" | "workday"
    name?: string
  }

  japan?: {
    name: string
  }
}
```

Lookup representation:

```ts
type HolidayIndex = Map<string, HolidayInfo>
```

where key is ISO date:

```text
YYYY-MM-DD
```

---

## 7.2 Adapter boundary

Each source has an adapter:

```ts
interface HolidayAdapter<Raw> {
  parse(raw: Raw): HolidayDataset
}
```

Example implementations:

```text
ChinaTimorHolidayAdapter
JapanHolidaysJpAdapter
```

Output:

```ts
type HolidayDataset = {
  entries: HolidayEntry[]
  coverage: DateCoverage
  diagnostics: HolidayDiagnostic[]
}
```

The adapter handles:

- Third-party schema validation
- Date parsing
- Holiday/workday conversion
- Name extraction
- Source-specific errors

Calendar Core only receives normalized data.

---

## 7.3 Coverage validation

Missing JSON entries must not automatically mean "not a holiday".

The application must calculate the actual date range needed by rendering.

Required dates include:

- Previous-month adjacent dates in the first Main page
- Target year Main months
- Next year January Main
- Mini previous December
- Mini next January
- Adjacent dates visible in Main
- Temporary next-year February Mini for the last page Preview

The required range should be calculated from generated calendar data instead of hardcoded assumptions.

The UI must warn clearly when imported holiday data does not cover the required range.

Monthloom must not guess missing holiday information.

---

# 8. Template Model

## 8.1 Core principle

Templates contain **design rules**, not month-specific rendered positions.

Do not store:

```text
2027-05-17 → x: 123, y: 456
```

Store semantic element layout:

```text
Date
→ anchor: top-left
→ offsetX: 14
→ offsetY: 10
```

---

## 8.2 Position

```ts
type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

type Position = {
  anchor: Anchor
  offsetX: number
  offsetY: number
}
```

A Cell is the coordinate system.

No Padding Layer exists in version 1.

---

## 8.3 Font model

```ts
type FontSource =
  | {
      type: "google"
      family: string
    }
  | {
      type: "local"
      assetId: string
    }

type FontDescriptor = {
  family: string
  weight: number
  style: "normal" | "italic"
  source: FontSource
}
```

Templates should refer to a reusable font resource by ID where practical.

---

## 8.4 Typography

```ts
type Typography = {
  fontId: string
  fontSize: number
  fontWeight: number
  fontStyle: "normal" | "italic"
  letterSpacing: number
  color: string
  opacity: number
}

type TextElementTemplate = {
  position: Position
  typography: Typography
}
```

---

## 8.5 Marker

```ts
type TextMarker = {
  type: "text"
  value: string
  position: Position
  typography: Typography
}

type ImageMarker = {
  type: "image"
  assetId: string
  position: Position
  width: number
  height: number
}

type MarkerTemplate = TextMarker | ImageMarker

type DotTemplate = {
  position: Position
  size: number
  color: string
  opacity: number
}
```

China holiday and China workday markers are configured independently.

Marker `size`, `position`, and `offset` must remain template-configurable. For image markers, size is represented by `width` / `height`.

---

# 9. Main Template

Conceptual model:

```ts
type MainTemplate = {
  width: number
  height: number

  weekdayRow: {
    height: number
    weekday: TextElementTemplate
  }

  dateGrid: {
    borderWidth: number
    borderColor: string
  }

  date: TextElementTemplate

  chinaHolidayName: TextElementTemplate

  japanHolidayName: TextElementTemplate

  chinaMarkers: {
    holiday: MarkerTemplate
    workday: MarkerTemplate
  }

  colors: {
    default: string
    sunday: string
    saturday: string
    japanHoliday: string
  }

  adjacentMonthOpacity: number
}
```

Color priority:

```text
Japanese Holiday
→ red

else Sunday
→ red

else Saturday
→ blue

else
→ default
```

Adjacent month opacity is applied to the complete date-related content group for that Cell, including:

- Date number
- China holiday/workday Marker
- China holiday name
- Japan holiday name

The normal Sunday / Saturday / Japanese Holiday color rules are evaluated first; adjacent-month opacity is an additional visual state.

It must not affect Weekday content or Grid border.

The Main Weekday Row has no border. Only the Main Date Grid has border by default.

---

# 10. Mini Template

Mini is a separate template, not a scaled Main.

Conceptual model:

```ts
type MiniTemplate = {
  width: number
  height: number

  monthRow: {
    height: number
    label: TextElementTemplate
  }

  weekdayRow: {
    height: number
    weekday: TextElementTemplate
  }

  dateGrid: {
    date: TextElementTemplate
  }

  markers: {
    holidayDot: DotTemplate
    workdayDot: DotTemplate
  }

  colors: {
    default: string
    sunday: string
    saturday: string
    japanHoliday: string
  }
}
```

Month label format:

```text
YYYY-M
```

No zero padding.

Month Label defaults to left alignment, while its Anchor + Offset remains configurable.

Mini Month Row, Weekday Row, and Date Grid are borderless by default.

Mini does not render adjacent month date content.

Mini date color priority is:

```text
Japanese Holiday
→ red

else Sunday
→ red

else Saturday
→ blue

else
→ default
```

Mini does not render Japanese holiday names.

China `holiday` / `workday` states are represented by independently configurable dots, conventionally red for holiday and blue for workday.

---

# 11. Layout Engine

## 11.1 Responsibility

Layout Engine converts:

```text
Calendar Month
+
Template
```

into semantic positioned render nodes.

It calculates:

- View geometry
- Weekday row
- Month row
- Date Grid
- Cell rectangles
- Date row height
- Anchors
- Element positions
- Opacity groups
- Marker locations
- Border lines

It does not serialize XML.

---

## 11.2 Main geometry

```text
dateGridHeight
=
mainHeight - weekdayRowHeight

dateRowHeight
=
dateGridHeight / actualWeekCount

cellWidth
=
mainWidth / 7
```

Grid always fills the configured Main size.

---

## 11.3 Mini geometry

```text
dateGridHeight
=
miniHeight
- monthRowHeight
- weekdayRowHeight

dateRowHeight
=
dateGridHeight / actualWeekCount

cellWidth
=
miniWidth / 7
```

---

# 12. Render Scene

The Render Scene is semantic and independent from React.

Example types:

```ts
type RenderNode =
  | GroupNode
  | TextNode
  | ImageNode
  | PathNode
  | LineNode
  | RectNode

type TextNode = {
  kind: "text"
  semanticId: SemanticElementId
  text: string
  x: number
  baselineY: number
  font: ResolvedFont
  typography: Typography
  opacity: number
}
```

`semanticId` identifies design semantics such as:

```text
main.date
main.weekday
main.chinaHolidayName
main.japanHolidayName
main.chinaHolidayMarker
mini.date
mini.monthLabel
mini.weekday
mini.holidayDot
```

This allows Editor selection to map rendered objects back to template properties.

---

# 13. Text Engine

## 13.1 Recommended library

Use:

```text
fontkit
```

for:

- TTF
- OTF
- WOFF
- WOFF2
- Glyph metrics
- Glyph layout
- Kerning
- Glyph SVG path generation

Do not introduce HarfBuzz in version 1 unless an actual shaping issue appears that fontkit cannot handle.

---

## 13.2 Text layout model

Do not rely on SVG `dominant-baseline` as the authoritative positioning mechanism.

Shape text first:

```text
text
→ glyph run
→ glyph positions
→ advance width
→ ascent / descent
```

The anchor operates against a stable typographic layout box.

Conceptually:

```text
width = glyph run advance width

top = baseline - ascent

bottom = baseline - descent
```

The anchor is applied to this typographic box.

Actual glyph ink bounding boxes are useful for:

- Selection
- Debugging
- Hit testing

but should not define the normal anchor layout.

This prevents visually different characters such as:

```text
1
7
31
春节
憲法記念日
```

from changing the semantic positioning rule.

---

## 13.3 Anchor calculation

For a Cell:

```text
cellX
cellY
cellWidth
cellHeight
```

first calculate the requested anchor point.

Example:

```text
top-left
→ (cellX, cellY)

center
→ (
    cellX + cellWidth / 2,
    cellY + cellHeight / 2
  )
```

Then apply:

```text
offsetX
offsetY
```

Then calculate the glyph run baseline from the requested anchor.

Example `top-left`:

```text
originX = anchorX + offsetX
baselineY = anchorY + offsetY + ascent
```

Example `center`:

```text
originX =
  anchorX
  + offsetX
  - textWidth / 2

baselineY =
  anchorY
  + offsetY
  + (ascent + descent) / 2
```

All positioning should be implemented in one tested text-layout module.

---

# 14. SVG Border and Stroke Geometry

## 14.1 Logical geometry

Stroke width must not change the logical Calendar Grid dimensions.

For a View:

```text
width = W
height = H
```

the final SVG dimensions and viewBox remain:

```text
0 0 W H
```

---

## 14.2 Outer border

SVG stroke is centered on the path.

For stroke width `s`, draw the border rectangle at:

```text
x = s / 2
y = s / 2

width = W - s
height = H - s
```

This keeps the rendered stroke within:

```text
0 → W
0 → H
```

---

## 14.3 Internal grid lines

Do not draw four borders for each Cell.

Instead draw:

- One outer border
- Six vertical internal lines
- `weekCount - 1` horizontal internal lines

Each grid line is drawn once.

This prevents doubled line weight.

---

# 15. SVG AST

The SVG Materializer converts Render Scene nodes into an SVG-specific AST.

Example:

```ts
type SvgNode =
  | SvgGroup
  | SvgPath
  | SvgText
  | SvgImage
  | SvgLine
  | SvgRect
```

This AST becomes the single source for:

```text
Preview
Export
```

React maps it to SVG elements.

Serializer maps it to XML.

---

# 16. Outlined and Editable SVG

The Layout Engine is shared.

The Render Scene is shared.

Only text materialization changes.

### Outlined

```text
TextNode
→ Glyph run
→ SVG Path nodes
```

### Editable

```text
TextNode
→ SVG <text>
```

Everything else is identical:

- Geometry
- Grid
- Marker
- Image
- Color
- Opacity
- Coordinates
- ViewBox

Outlined is the default export mode.

Editable mode does not promise exact visual consistency in every Figma/font environment.

---

# 17. Images and Assets

## 17.1 Asset reference

Templates store:

```ts
{
  assetId: string
}
```

rather than:

```text
blob:
data:
http:
```

---

## 17.2 Preview

```text
assetId
→ Blob
→ Object URL
→ SVG image href
```

---

## 17.3 Export

```text
assetId
→ Blob
→ data URI
→ SVG image href
```

Final SVG files must be self-contained.

If user-uploaded SVG assets are allowed, imported SVG should be checked for remote references.

An SVG Marker that internally loads an external image is not actually self-contained.

---

# 18. Google Fonts

## 18.1 Font resource pipeline

Recommended pipeline:

```text
FontDescriptor
      ↓
Google Font Provider
      ↓
Google Fonts CSS2
      ↓
Resolved WOFF2 URL
      ↓
ArrayBuffer
      ↓
fontkit
      ↓
ResolvedFont
      ↓
IndexedDB cache
```

Template stores stable font identity such as:

```text
family
weight
style
source
```

It should not store a transient Google CDN URL as the canonical font identity.

---

## 18.2 Character subsetting

When practical, collect the characters required by the current document:

- `0-9`
- Weekday text
- Month labels
- Holiday names
- Marker text

Use the Google Fonts `text=` mechanism when useful to reduce downloaded font size.

This is an optimization, not a correctness dependency.

The initial implementation may start with full resolved web font files if that makes the first font pipeline simpler.

---

## 18.3 Cache

Font binary data should be cached in IndexedDB.

Key should include at minimum:

```text
provider
family
weight
style
resolved font identity/version if available
```

Do not rely solely on browser HTTP cache because Font Engine needs binary access.

---

# 19. Editor Architecture

## 19.1 Semantic selection

Clicking a rendered item selects a design semantic:

```text
2027-05-17
→ Date

Sun
→ Weekday

春节
→ China Holiday Name
```

It does not select an individual calendar instance for style override.

---

## 19.2 Editor overlays

Selection visuals should be separate from exported SVG.

Editor overlay may contain:

- Selection bounds
- Anchor indicator
- Drag handles
- Debug bounds

These must never enter final export.

---

# 20. Drag Interaction

Use native Pointer Events.

Do not introduce a general drag library unless an actual interaction requirement appears that Pointer Events cannot handle cleanly.

Flow:

```text
pointerdown
→ setPointerCapture

pointermove
→ convert screen coordinate to SVG coordinate
→ calculate delta
→ update transient drag state

pointerup
→ commit one template change
→ clear transient state
```

During drag:

```text
effectivePosition
=
templatePosition
+
transientDelta
```

One drag gesture should create one Undo history entry.

Anchor should remain unchanged while dragging.

Anchor changes should be explicit through the Anchor UI or Inspector.

---

# 21. Undo / Redo

Recommended:

```text
Zustand
+
zundo
```

Undo history should track persistent document changes.

Do not track:

- Hover
- Current pointer position
- Selection
- Temporary drag delta
- Inspector focus
- UI panel state

An Undo operation should correspond to a meaningful document edit.

Examples:

```text
Change Date font size
Move Japan Holiday Name
Change weekday row height
Change Main border color
```

---

# 22. State Management

Use two conceptual stores.

## 22.1 Document Store

Contains:

```text
targetYear
Main Template
Mini Template
Page Preview Layout
Holiday datasets
Asset references
Font references
Background reference
```

Persistent edits live here.

---

## 22.2 Editor UI Store

Contains:

```text
selected semantic element
drag session
hover state
active inspector section
preview zoom
temporary UI state
```

This store does not participate in document persistence or Undo history.

---

# 23. Persistence

## 23.1 IndexedDB

Use:

```text
Dexie
```

Recommended storage categories:

```text
projects
templates
assets
fontCache
```

---

## 23.2 Schema version

Every persistent document/template must contain:

```ts
schemaVersion: number
```

Persistent data should be validated on load.

Use:

```text
Zod
```

for:

- Template validation
- Project validation
- Imported holiday data validation
- Import/export format validation

When the schema evolves, use explicit migrations.

---

## 23.3 Template export/import

IndexedDB must not be the only long-term storage mechanism.

Support a portable template/project export format.

Possible first format:

```text
.monthloom
```

implemented as a ZIP containing:

```text
manifest.json
template.json
assets/
```

Alternatively, the first implementation can start with JSON when no embedded image assets are present.

Long-term, ZIP is preferable because Marker images and other assets need to travel with the template.

Purpose:

- Backup
- Browser migration
- Computer migration
- Reuse next year
- Recovery after browser data deletion

This is not cloud synchronization.

---

# 24. Page Preview

## 24.1 Structure

Render 13 pages vertically:

```text
Y-1
Y-2
...
Y-12
Y+1-1
```

Each page contains:

```text
Background
+
Main
+
Previous Mini
+
Next Mini
```

The last page may calculate:

```text
Y+1 February Mini
```

for Preview only.

It is not part of formal Mini SVG output.

---

## 24.2 Page layout model

At minimum:

```ts
type PageLayout = {
  width: number
  height: number
  padding: number
  leftColumnRatio: number
  columnGap: number
  miniHeightRatio: number
  miniGap: number
}
```

---

## 24.3 Main Preview scaling

The Page Preview must not distort Main geometry.

Recommended rule:

```text
availableMainWidth
=
contentWidth
- leftColumnWidth
- columnGap

scale
=
availableMainWidth / mainTemplate.width
```

Main is scaled uniformly.

Rendered height:

```text
mainTemplate.height * scale
```

If it exceeds page content height, show a layout warning rather than non-uniformly stretching the calendar.

---

## 24.4 Mini Preview scaling

Each Mini is placed inside the configured left-column Mini slot.

Use uniform `contain` behavior.

Do not stretch Mini non-uniformly.

---

## 24.5 Background

Background is only part of Page Preview.

Rendering rule:

```text
preserve aspect ratio
center
cover
clip overflow
```

Background does not enter formal Main/Mini SVG export.

---

# 25. Preview Performance

13 pages do not justify Canvas, WebGL, or virtualization by default.

Expected scene size is manageable for browser SVG.

Use memoization for:

- CalendarMonth
- Holiday lookup
- Font resolution
- Text shaping
- Glyph path
- Main render result
- Mini render result

Especially cache repeated text such as:

```text
1
2
...
31
Sun
Mon
...
```

Use `requestAnimationFrame` throttling for pointer-move driven preview updates.

Do not introduce a Web Worker in version 1.

A Worker may be added later specifically for large outlined ZIP export if profiling shows UI blocking.

---

# 26. ZIP Export

Use:

```text
JSZip
```

Formal output:

```text
Monthloom-2027.zip

main/
  2027-1.svg
  2027-2.svg
  ...
  2028-1.svg

mini/
  2026-12.svg
  2027-1.svg
  ...
  2028-1.svg
```

Total:

```text
13 Main SVG
14 Mini SVG
```

Month numbers are not zero-padded.

A 27-file ZIP does not require streaming ZIP architecture.

---

# 27. GitHub Pages Deployment

## 27.1 Build

Use:

```text
Vite
```

Application output is static.

---

## 27.2 Base path

GitHub Pages project deployment may use:

```text
https://USERNAME.github.io/monthloom/
```

Vite `base` must therefore support a repository subpath.

Static assets should be referenced through Vite-aware imports rather than hardcoded root URLs.

Avoid:

```text
/assets/foo.svg
```

Prefer build-resolved assets.

---

## 27.3 Routing

Version 1 should remain a single-page application without application-level routing if no real requirement exists.

This avoids unnecessary GitHub Pages history fallback complexity.

If routing becomes necessary later, evaluate Hash Router before adding a custom Pages fallback solution.

---

## 27.4 Secrets

A GitHub Pages application cannot safely contain private API keys.

No secret should be embedded in:

```text
source code
build variables shipped to browser
JavaScript bundle
public static assets
```

Current Monthloom requirements do not need private credentials.

---

# 28. Recommended Technology Choices

| Area | Decision |
|---|---|
| Build | Vite |
| UI | React |
| Language | TypeScript |
| Calendar Core | Custom |
| Layout Engine | Custom |
| SVG Scene / AST | Custom |
| SVG serializer | Custom small serializer |
| Preview | React SVG adapter |
| Font parsing / shaping | fontkit |
| State | Zustand |
| Undo / Redo | zundo |
| Nested immutable updates | Immer where useful |
| Persistence | IndexedDB |
| IndexedDB wrapper | Dexie |
| Validation | Zod |
| ZIP | JSZip |
| Drag | Native Pointer Events |
| Deployment | GitHub Pages |
| Canvas | No |
| Fabric.js | No |
| Konva | No |
| Redux | No |
| Next.js | No |
| Backend | No |
| Web Worker | Not initially |
| HarfBuzz | Not initially |

---

# 29. Major Technical Risks

## Risk 1 — Font loading and outlining

Need to verify:

```text
Google Fonts
→ CSS
→ WOFF2
→ ArrayBuffer
→ fontkit
→ Chinese/Japanese glyph
→ SVG path
```

This is the largest technical uncertainty.

---

## Risk 2 — Font metrics

Need to confirm:

- Ascent / descent behavior
- Font units → SVG units
- Kerning
- Glyph positioning
- Multi-character Japanese and Chinese text
- Number alignment

Anchor rules should be validated against actual expected layout.

---

## Risk 3 — Figma SVG import

Browser SVG correctness does not automatically guarantee ideal Figma import.

Need to test:

- Path positions
- `viewBox`
- Width/height
- Nested opacity
- Embedded image
- Clip behavior
- Text mode
- Outline mode

---

## Risk 4 — Stroke bounding geometry

Need specific tests for:

```text
strokeWidth = 0.5
strokeWidth = 1
strokeWidth = 2
```

Final rendered dimensions must remain exactly equal to configured View size.

---

## Risk 5 — Preview / export divergence

Prevent by architecture:

```text
single Layout Engine
single Render Scene
single SVG Materializer
single SVG AST
```

Do not build a second export renderer later.

---

# 30. Rendering Spike

Before formal application implementation, build a deliberately small throwaway Rendering Spike.

It should not contain:

- Full Editor
- Zustand
- IndexedDB
- Holiday importer UI
- 13 pages
- Production component architecture

It only validates the risky rendering chain.

---

## 30.1 Spike sample

Generate one SVG containing:

```text
Sun Mon Tue Wed Thu Fri Sat

7 × 5 grid

1
31
春节
憲法記念日

China text marker

Embedded image marker
```

Use:

- One Google Font with Latin/numbers
- One Chinese/Japanese-compatible Google Font
- Multiple anchors
- Non-integer stroke if useful

---

## 30.2 Spike success criteria

Verify:

### Font

- WOFF2 can be obtained in browser
- fontkit can parse it
- CJK glyphs exist
- Text can be shaped
- Glyph paths can be generated

### Geometry

- SVG dimensions are exact
- Outer border does not exceed viewBox
- Internal lines do not double
- 7 columns remain correctly aligned
- Anchor layout is predictable

### Preview parity

- Browser Preview and exported SVG use the same path data

### Images

- Image Marker is embedded
- Exported SVG works without network access

### Figma

Import exported SVG into Figma and confirm:

- Exact dimensions
- Text outline visual position
- Grid weight
- Marker image
- No missing resources
- No unexpected clipping

---

# 31. Implementation Phases

## Phase 0 — Rendering Spike

Implement only:

```text
Google Font loading
fontkit
Font Metrics
Anchor positioning
Text Outline
SVG AST
SVG serialization
Grid/stroke
Embedded image
Figma validation
```

Purpose:

> Remove the largest technical uncertainties before building application architecture around them.

---

## Phase 1 — Calendar Domain

Implement:

```text
LocalDate
Date utilities
CalendarMonth
4 / 5 / 6 week calculation
Adjacent dates
Holiday internal model
China Adapter
Japan Adapter
Coverage calculation
Coverage warnings
```

This phase should have strong unit test coverage.

---

## Phase 2 — Template + Layout Engine

Implement:

```text
Anchor
Position
Typography
Marker model
MainTemplate
MiniTemplate
Main layout
Mini layout
Cell geometry
Render Scene
Text layout integration
```

No full Editor yet.

---

## Phase 3 — Production SVG Renderer

Implement:

```text
SvgAst
React SVG adapter
SVG serializer
Outlined mode
Editable mode
Self-contained image export
Main SVG
Mini SVG
```

At the end of this phase Monthloom should already be capable of producing real usable SVG files.

This is the first functional product milestone.

---

## Phase 4 — Template Editor

Implement:

```text
Semantic selection
Selection overlay
Anchor control
Inspector
Drag
Weekday row resize
Zustand
zundo
Undo / Redo
```

Do not implement general vector-editor features.

---

## Phase 5 — Full-year Page Preview

Implement:

```text
13 vertical pages
Page layout
Previous Mini
Next Mini
Temporary Y+1 February Mini
Background image
Preview scaling
Layout warnings
Memoization
```

---

## Phase 6 — Persistence and Batch Export

Implement:

```text
Dexie
Project save/load
Template save/load
Assets
Font cache
Schema version
Migration
Template import/export
13 Main SVG export
14 Mini SVG export
ZIP
```

---

## Phase 7 — GitHub Pages Delivery

Implement:

```text
Vite base configuration
GitHub Actions build
GitHub Pages deployment
Static asset verification
Production font loading verification
IndexedDB verification
Export verification under deployed origin
```

---

# 32. What Not to Build

Do not build the following in version 1:

```text
General scene editor
Plugin architecture
Layer panel
Arbitrary layers
Generic vector primitives
Canvas renderer
WebGL renderer
General Auto Layout
Smart Guides
Multi-select
Masks
Component system
Cloud sync
Authentication
Collaboration
CRDT
Backend
Database server
Generic event bus
Dependency injection framework
Complex command framework
Font server
PNG/PDF production pipeline
```

If any of these becomes necessary later, it should be justified by a concrete Monthloom requirement.

---

# 33. Architectural Invariants

The following rules should be treated as implementation constraints.

### Invariant 1

```text
Calendar Core must not depend on SVG or React.
```

### Invariant 2

```text
Third-party holiday schemas must not enter Calendar Core.
```

### Invariant 3

```text
Template stores semantic layout rules, not month-instance coordinates.
```

### Invariant 4

```text
Layout Engine is the only authoritative geometry calculation layer.
```

### Invariant 5

```text
Preview and Export must reuse the same Render Scene / SVG AST pipeline.
```

### Invariant 6

```text
Outlined Preview and Outlined Export use the same glyph path generation.
```

### Invariant 7

```text
Grid lines are drawn once; Cell borders are not independently duplicated.
```

### Invariant 8

```text
SVG final width/height equal configured View width/height.
```

### Invariant 9

```text
Editor selection represents semantic elements, not individual rendered dates.
```

### Invariant 10

```text
Month-specific design overrides do not exist.
```

### Invariant 11

```text
Formal Main/Mini SVG files must be self-contained.
```

### Invariant 12

```text
Main adjacent-month opacity applies only to date-related content, never to Grid border.
```

### Invariant 13

```text
The production application must remain statically deployable to GitHub Pages.
```

---

# 34. Final Recommended Architecture

```text
Architecture
→ Static Vite + React application
→ Pure Calendar Domain
→ Holiday Adapter boundary
→ Independent Template Models
→ Calendar-specific Layout Engine
→ Semantic Render Scene
→ Shared SVG Materializer / AST
→ React Preview Adapter
→ SVG Serializer
→ Client-only persistence and export


Core Data Models
→ LocalDate
→ CalendarMonth
→ CalendarCell
→ HolidayDataset
→ HolidayIndex
→ MainTemplate
→ MiniTemplate
→ Position = Anchor + Offset
→ FontDescriptor
→ AssetReference
→ RenderScene
→ SvgAst


Technology Choices
→ React
→ TypeScript
→ Vite
→ fontkit
→ Zustand
→ zundo
→ Immer
→ Dexie
→ Zod
→ JSZip
→ Pointer Events
→ Native SVG
→ GitHub Pages


Key Technical Risks
→ Google Fonts binary loading
→ fontkit WOFF2 / CJK pipeline
→ Font Metrics and baseline placement
→ SVG/Figma geometry differences
→ Stroke bounding
→ Preview/Export consistency


Implementation Order
→ Rendering Spike
→ Calendar Core
→ Template + Layout Engine
→ Production SVG Renderer
→ Template Editor
→ 13-page Preview
→ Persistence + Batch Export
→ GitHub Pages production verification
```

---

# 35. Next Step

The next engineering task should be the **Rendering Spike**.

Do not start with the Calendar Editor.

The Spike should first prove that the following chain is reliable:

```text
Google Font
→ Font binary
→ fontkit
→ Font Metrics
→ Anchor layout
→ Glyph path
→ Shared SVG AST
→ Browser Preview
→ Serialized SVG
→ Embedded image
→ Figma
```

Once this chain is validated, update this design only if the Spike reveals a concrete incompatibility, then proceed to the formal implementation plan.
