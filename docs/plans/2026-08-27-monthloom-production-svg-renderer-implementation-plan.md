# Monthloom Phase 3 — Production Font Engine + SVG Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Phase 2 semantic Render Scenes into production-quality Main/Mini SVG using real font binaries and metrics, shared SVG AST, Outlined and Editable text materialization, embedded image assets, React Preview, XML serialization, and single-file SVG export.

**Architecture:** Font resources are resolved before layout into a synchronous `ResolvedFontEngine` that implements Phase 2's `TextMeasurer` and can also shape/outline text. The Layout Engine remains the only geometry authority: it produces final text origins/baselines and resolved non-text geometry; the SVG Materializer only converts those resolved nodes into SVG AST. Preview and export consume the same `SvgDocument`; export never serializes the Preview DOM.

**Tech Stack:** TypeScript, React, Vitest, native SVG, `fontkit`, browser `fetch` / `Blob` / `ArrayBuffer`. Reuse existing Vite setup and Phase 1/2 modules. No new state-management or persistence library.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- Production code must not import from `src/spike/`.
- Do not implement Template Editor, Drag, Inspector, Zustand, Undo/Redo, Dexie/IndexedDB persistence, 13-page Page Preview, ZIP batch export, or PNG/PDF output in this phase.
- Calendar Core and Template Model must not gain SVG/fontkit dependencies.
- The Layout Engine remains the only authoritative geometry calculation layer.
- SVG Materializer must not recalculate Cell/Anchor layout.
- Production Preview and SVG Export must consume the same SVG AST.
- Default Preview uses Outlined rendering.
- Outlined SVG must contain glyph paths rather than `<text>`.
- Editable SVG retains `<text>` and does not guarantee identical rendering when the target environment lacks the configured font.
- Editable SVG must not introduce external `@font-face` or remote font URLs.
- Main/Mini image Marker resources must be embedded as data URIs in exported SVG.
- Formal exported SVG must not depend on application URLs, GitHub Pages URLs, Google Fonts URLs, or remote image URLs.
- Final SVG `width`, `height`, and `viewBox` must exactly match the source Render Scene dimensions.
- Grid/stroke geometry from Phase 2 must be passed through unchanged.
- Real text positioning must use the same metrics source for layout and outlining.
- Google Fonts production loading must request only the concrete family/weight/style required by a registered `fontId`.
- For Google Fonts CJK reliability, production loading must support `text=` subsetting with the actual required characters so one fetched face contains the text being outlined.
- Only in-memory font/asset caches are allowed in Phase 3; IndexedDB cache belongs to a later persistence phase.
- Keep the custom SVG AST and serializer deliberately small. Do not build a generic SVG framework.

---

# 1. Target Production File Structure

```text
src/
  resources/
    fonts/
      types.ts
      textRequirements.ts
      textRequirements.test.ts
      googleFonts.ts
      googleFonts.test.ts
      fontkitEngine.ts
      fontkitEngine.test.ts
      resolveFonts.ts
      resolveFonts.test.ts

    assets/
      types.ts
      dataUri.ts
      dataUri.test.ts

  rendering/
    scene/
      types.ts                    # modify: lock resolved text geometry boundary

    layout/
      mainLayout.ts               # modify only if needed to store resolved text geometry
      miniLayout.ts               # modify only if needed to store resolved text geometry
      mainLayout.test.ts
      miniLayout.test.ts

    svg/
      ast.ts
      document.ts
      serializer.ts
      serializer.test.ts
      materialize.ts
      materialize.test.ts
      SvgPreview.tsx
      SvgPreview.test.tsx
      exportSvg.ts
      exportSvg.test.ts

  verification/
    phase3/
      fixture.ts
      Phase3Verification.tsx
      phase3-verification.css

docs/
  phase3/
    manual-validation.md

public/
  phase3-marker.png
```

Responsibilities:

- `scene/types.ts`: final renderer-independent geometry, including resolved text origin/baseline.
- `textRequirements.ts`: collect/deduplicate actual characters needed per `fontId`.
- `googleFonts.ts`: build CSS2 request, parse font URL, fetch WOFF2 bytes.
- `fontkitEngine.ts`: production font parsing, measuring, shaping, and glyph outlining.
- `resolveFonts.ts`: resolve a font catalog into one synchronous in-memory engine.
- `assets/types.ts`: binary asset resolver interface only.
- `dataUri.ts`: bytes → self-contained data URI.
- `svg/ast.ts`: minimal production SVG AST.
- `materialize.ts`: RenderScene → SvgDocument in `outlined` or `editable` mode.
- `SvgPreview.tsx`: React-only adapter for SvgDocument.
- `serializer.ts`: SvgDocument → XML string.
- `exportSvg.ts`: XML string → downloadable SVG Blob/file action.
- `verification/phase3`: temporary/manual acceptance harness using only production modules.
- `manual-validation.md`: browser/GitHub Pages/Figma evidence.

---

# Task 1: Lock the Render Scene Text Geometry Boundary

**Files:**
- Modify: `src/rendering/scene/types.ts`
- Modify: `src/rendering/layout/mainLayout.ts`
- Modify: `src/rendering/layout/miniLayout.ts`
- Modify: corresponding Phase 2 tests

**Interfaces:**
- Consumes Phase 2 `positionText(...)`.
- Produces a `SceneTextNode` whose final text geometry is already resolved by Layout Engine:

```ts
export type SceneTextNode = Readonly<{
  kind: "text";
  semanticId: SemanticElementId;
  text: string;

  originX: number;
  baselineY: number;
  metrics: Readonly<{
    width: number;
    ascent: number;
    descent: number;
  }>;

  // Retained semantic positioning context for the later Editor.
  cell: Rect;
  position: Position;

  typography: Typography;
  color: string;
  opacity: number;
}>;
```

SVG Renderer must later use `originX` / `baselineY` directly.

- [ ] **Step 1: Inspect the actual Phase 2 scene type**

If Phase 2 already stores final `originX`, `baselineY`, and `metrics`, preserve the existing names and adjust this task to the actual equivalent interface.

If it stores only `cell + position`, proceed with the exact correction below.

Do not redesign unrelated scene nodes.

- [ ] **Step 2: Add failing tests proving Layout owns text position**

For one Main `main.date` node and one Mini `mini.date` node, assert that layout output contains deterministic:

```text
originX
baselineY
metrics.width
metrics.ascent
metrics.descent
```

using a fake `TextMeasurer`.

Example fake metrics:

```ts
const textMeasurer: TextMeasurer = {
  measure: () => ({
    width: 20,
    ascent: 16,
    descent: -4,
  }),
};
```

- [ ] **Step 3: Update Main/Mini layout to store `positionText(...)` output**

The flow must be:

```text
Cell
+ Template Position
+ Typography
+ TextMeasurer
    ↓
positionText(...)
    ↓
originX / baselineY / metrics
    ↓
SceneTextNode
```

Do not defer this calculation to SVG materialization.

- [ ] **Step 4: Retain `cell` and `position` semantic context**

Keep them on SceneTextNode because later Editor selection/Anchor visualization needs the semantic coordinate system.

Renderer must still ignore them for geometry.

- [ ] **Step 5: Run Phase 2 regression tests**

```bash
npm test -- src/rendering/layout
npm test
npm run build
```

Expected:

```text
All Phase 2 geometry/semantic tests remain green.
No SVG/fontkit dependency enters Layout.
Build succeeds.
```

- [ ] **Step 6: Commit**

```bash
git add src/rendering/scene src/rendering/layout
git commit -m "refactor: resolve text geometry in layout scene"
```

---

# Task 2: Define Font Catalog and Collect Actual Required Text

**Files:**
- Create: `src/resources/fonts/types.ts`
- Create: `src/resources/fonts/textRequirements.ts`
- Create: `src/resources/fonts/textRequirements.test.ts`

**Interfaces:**
- Consumes:
  - Phase 2 `FontDescriptor`
  - `MainTemplate`
  - `MiniTemplate`
  - `CalendarMonth`
- Produces:

```ts
export type FontCatalog = Readonly<Record<string, FontDescriptor>>;

export type FontTextRequirements = ReadonlyMap<string, string>;

export function collectMainFontText(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  weekdays?: readonly string[];
}): FontTextRequirements;

export function collectMiniFontText(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  weekdays?: readonly string[];
}): FontTextRequirements;

export function mergeFontTextRequirements(
  requirements: readonly FontTextRequirements[],
): FontTextRequirements;
```

- [ ] **Step 1: Write Main text-requirement test**

Use a CalendarMonth containing:

```text
date numbers
China holiday name
Japan holiday name
China holiday marker
China workday marker
```

Use a Main template where different semantic elements reference different `fontId`s.

Assert each `fontId` receives the exact characters it may render.

Main must include:

```text
Sun Mon Tue Wed Thu Fri Sat
all visible Main date numbers, including adjacent dates
China holiday/workday text marker values when the marker type is "text"
China holiday names
Japan holiday names
```

Image markers contribute no characters.

- [ ] **Step 2: Deduplicate by Unicode code point in stable order**

Implement a helper equivalent to:

```ts
function uniqueCharacters(text: string): string {
  return [...new Set(Array.from(text))].join("");
}
```

Do not deduplicate by UTF-16 code unit.

- [ ] **Step 3: Write Mini text-requirement test**

Mini must include:

```text
YYYY-M Month Label
S M T W T F S
current-month date numbers
```

Mini must not include:

```text
adjacent date numbers
Japan holiday names
China holiday names
```

Dots contribute no text.

- [ ] **Step 4: Implement requirement merging**

`mergeFontTextRequirements` must combine the character sets for the same `fontId`.

This will later allow batch-year export to resolve a font once for many months.

Do not implement batch export now.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/resources/fonts/textRequirements.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/resources/fonts
git commit -m "feat: collect font text requirements"
```

---

# Task 3: Implement Production Google Fonts Binary Provider

**Files:**
- Create: `src/resources/fonts/googleFonts.ts`
- Create: `src/resources/fonts/googleFonts.test.ts`

**Interfaces:**
- Produces:

```ts
export type GoogleFontFaceRequest = Readonly<{
  family: string;
  weight: number;
  style: "normal" | "italic";
  text: string;
}>;

export function buildGoogleFontsCssUrl(
  request: GoogleFontFaceRequest,
): string;

export function extractGoogleFontBinaryUrl(css: string): string;

export async function fetchGoogleFontBinary(
  request: GoogleFontFaceRequest,
  fetchImpl?: typeof fetch,
): Promise<ArrayBuffer>;
```

- [ ] **Step 1: Write CSS URL tests**

Normal face example:

```ts
const url = buildGoogleFontsCssUrl({
  family: "Noto Sans JP",
  weight: 400,
  style: "normal",
  text: "31春节憲法記念日",
});

expect(url).toContain("fonts.googleapis.com/css2");
expect(url).toContain("family=Noto+Sans+JP");
expect(url).toContain("wght@400");
expect(url).toContain("text=");
```

Italic requests must include the CSS2 italic axis.

- [ ] **Step 2: Implement CSS2 URL creation**

Use browser-safe URL construction.

The request must be scoped to:

```text
one family
one weight
one style
actual required text
```

Do not request an unspecified family-wide CSS document.

- [ ] **Step 3: Write font URL parser tests**

Test CSS such as:

```css
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/example.woff2) format('woff2');
}
```

Expected:

```text
https://fonts.gstatic.com/example.woff2
```

Malformed CSS must throw a descriptive production error.

- [ ] **Step 4: Implement binary fetch**

Pipeline:

```text
CSS2 URL
→ fetch CSS
→ parse font URL
→ fetch font
→ ArrayBuffer
```

Errors must identify:

```text
CSS fetch vs font fetch
HTTP status
family / weight / style
```

Do not retry automatically.

- [ ] **Step 5: Add mocked fetch test**

Use a fake `fetchImpl` to prove:

```text
CSS requested first
font URL requested second
returned bytes are the font response bytes
```

Unit tests must not depend on network.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/resources/fonts/googleFonts.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/resources/fonts/googleFonts.ts src/resources/fonts/googleFonts.test.ts
git commit -m "feat: load google font binaries"
```

---

# Task 4: Build the Production fontkit Engine

**Files:**
- Create: `src/resources/fonts/fontkitEngine.ts`
- Create: `src/resources/fonts/fontkitEngine.test.ts`

**Interfaces:**
- Produces a synchronous resolved engine after font bytes are loaded:

```ts
export type ResolvedFontFace = Readonly<{
  fontId: string;
  descriptor: FontDescriptor;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  internalFont: unknown;
}>;

export type GlyphPath = Readonly<{
  d: string;
  transform: string;
}>;

export class ResolvedFontEngine implements TextMeasurer {
  constructor(faces: ReadonlyMap<string, ResolvedFontFace>);

  measure(text: string, typography: Typography): TextMetrics;

  outline(args: {
    text: string;
    typography: Typography;
    originX: number;
    baselineY: number;
  }): readonly GlyphPath[];

  getDescriptor(fontId: string): FontDescriptor;
}

export function parseFontkitFace(args: {
  fontId: string;
  descriptor: FontDescriptor;
  bytes: ArrayBuffer;
}): ResolvedFontFace;
```

If the project prefers functions over a class, an equivalent immutable object API is acceptable. Do not expose raw fontkit objects outside this module.

- [ ] **Step 1: Add `fontkit` production dependency only if missing**

Check:

```bash
npm ls fontkit
```

If absent:

```bash
npm install fontkit
```

Do not import the Spike font adapter.

- [ ] **Step 2: Write fake-face measurement tests**

Use a fake/internal test face to validate scaling:

```text
unitsPerEm = 1000
ascent = 800
descent = -200
fontSize = 20
```

Expected:

```text
ascent = 16
descent = -4
```

- [ ] **Step 3: Include letter spacing in both measure and outline cursor math**

For a run of `n` glyphs:

```text
measured width
=
scaled shaped advances
+
max(0, n - 1) * letterSpacing
```

The outline glyph cursor must apply exactly the same spacing rule.

This parity is mandatory.

- [ ] **Step 4: Validate font face identity**

When typography requests a `fontId`:

- It must exist.
- `typography.fontWeight` must match the registered descriptor weight.
- `typography.fontStyle` must match the registered descriptor style.

Throw a descriptive configuration error on mismatch rather than silently loading another face.

- [ ] **Step 5: Implement fontkit parsing**

Read:

```text
unitsPerEm
ascent
descent
layout(text)
glyph path
glyph x/y offsets and advances
```

Hide fontkit-specific types behind `ResolvedFontFace`.

- [ ] **Step 6: Implement glyph outline transformation**

Reproduce the **already validated Rendering Spike font-coordinate transformation** in production code, but do not import Spike modules.

The resulting paths must:

```text
use Scene baselineY as the baseline
use Scene originX as the left text origin
apply fontSize / unitsPerEm scale
flip the font coordinate Y-axis correctly
apply shaped x/y offsets
apply shaped advances
apply configured letterSpacing
```

- [ ] **Step 7: Write a real-font browser-independent fixture test if a small fixture exists**

Do not commit a proprietary font.

If the repository already contains a test-safe open font fixture, use it.

Otherwise keep unit tests fake/deterministic and leave real Google Font parsing to the Phase 3 verification harness.

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/resources/fonts/fontkitEngine.test.ts
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/resources/fonts/fontkitEngine.ts src/resources/fonts/fontkitEngine.test.ts
git commit -m "feat: add production fontkit engine"
```

---

# Task 5: Resolve Font Catalog into an In-memory Engine

**Files:**
- Create: `src/resources/fonts/resolveFonts.ts`
- Create: `src/resources/fonts/resolveFonts.test.ts`

**Interfaces:**
- Consumes:
  - `FontCatalog`
  - `FontTextRequirements`
  - Google provider
  - an asset resolver for local fonts
- Produces:

```ts
export type BinaryAsset = Readonly<{
  bytes: ArrayBuffer;
  mimeType: string;
}>;

export interface BinaryAssetResolver {
  resolve(assetId: string): Promise<BinaryAsset>;
}

export async function resolveFontEngine(args: {
  catalog: FontCatalog;
  requirements: FontTextRequirements;
  assetResolver?: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
}): Promise<ResolvedFontEngine>;
```

- [ ] **Step 1: Write missing-font test**

If requirements reference:

```text
fontId = "date"
```

but catalog has no `"date"` entry, reject with a descriptive error.

- [ ] **Step 2: Resolve Google font sources**

For each required Google font:

```text
fontId
→ descriptor
→ requirement text
→ GoogleFontFaceRequest
→ font bytes
→ parseFontkitFace
```

- [ ] **Step 3: Resolve local font sources through `BinaryAssetResolver`**

For:

```ts
source: {
  type: "local",
  assetId: "font-123",
}
```

load bytes through the injected resolver.

Phase 3 does not persist fonts; this interface exists so later Dexie storage can satisfy it without changing renderer APIs.

- [ ] **Step 4: Add in-memory request cache**

Within one `resolveFontEngine` call, identical concrete font requests must not fetch twice.

Cache key must include:

```text
source identity
family
weight
style
required text
```

Do not add IndexedDB.

- [ ] **Step 5: Add mocked resolver tests**

Cover:

```text
Google source
local source
missing local resolver
missing fontId
two different fontIds using independent concrete faces
```

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/resources/fonts/resolveFonts.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/resources/fonts/resolveFonts.ts src/resources/fonts/resolveFonts.test.ts
git commit -m "feat: resolve production font resources"
```

---

# Task 6: Define Production SVG AST and Serializer

**Files:**
- Create: `src/rendering/svg/ast.ts`
- Create: `src/rendering/svg/document.ts`
- Create: `src/rendering/svg/serializer.ts`
- Create: `src/rendering/svg/serializer.test.ts`

**Interfaces:**
- Produces a minimal AST:

```ts
export type SvgPathNode = Readonly<{
  kind: "path";
  d: string;
  transform?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}>;

export type SvgTextNode = Readonly<{
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  fill: string;
  opacity: number;
}>;

export type SvgImageNode = Readonly<{
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  opacity: number;
}>;

export type SvgLineNode = ...;
export type SvgRectNode = ...;
export type SvgCircleNode = ...;

export type SvgGroupNode = Readonly<{
  kind: "group";
  opacity?: number;
  children: readonly SvgNode[];
}>;

export type SvgNode =
  | SvgPathNode
  | SvgTextNode
  | SvgImageNode
  | SvgLineNode
  | SvgRectNode
  | SvgCircleNode
  | SvgGroupNode;

export type SvgDocument = Readonly<{
  width: number;
  height: number;
  viewBox: string;
  children: readonly SvgNode[];
}>;

export function createSvgDocument(
  width: number,
  height: number,
  children: readonly SvgNode[],
): SvgDocument;

export function serializeSvg(document: SvgDocument): string;
```

- [ ] **Step 1: Write root-dimension serializer test**

For `700 × 500`, assert exact:

```xml
width="700"
height="500"
viewBox="0 0 700 500"
xmlns="http://www.w3.org/2000/svg"
```

- [ ] **Step 2: Write escaping tests**

Serializer must correctly escape:

```text
text content containing & < >
attribute values containing & " <
```

Do not use browser DOM serialization.

- [ ] **Step 3: Implement all node serializers**

Support only:

```text
group
path
text
image
line
rect
circle
```

No generic arbitrary tag API.

- [ ] **Step 4: Preserve numeric values exactly as provided**

Do not round coordinates globally.

Do not normalize stroke widths.

Do not modify path transforms.

- [ ] **Step 5: Add `<text>` serialization assertions**

Editable text must emit:

```text
x
y
font-family
font-size
font-weight
font-style
letter-spacing
fill
opacity
```

Text origin uses the already-resolved Scene `originX / baselineY`.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/rendering/svg/serializer.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/rendering/svg
git commit -m "feat: add production svg ast serializer"
```

---

# Task 7: Implement Self-contained Binary Asset Embedding

**Files:**
- Create: `src/resources/assets/types.ts`
- Create: `src/resources/assets/dataUri.ts`
- Create: `src/resources/assets/dataUri.test.ts`

**Interfaces:**
- Produces:

```ts
export type BinaryAsset = Readonly<{
  bytes: ArrayBuffer;
  mimeType: string;
}>;

export interface AssetResolver {
  resolve(assetId: string): Promise<BinaryAsset>;
}

export function binaryAssetToDataUri(asset: BinaryAsset): string;
```

If Task 5 already defines the same binary asset contract, move it here and import it from both font and SVG resource code. Do not duplicate interfaces.

- [ ] **Step 1: Write deterministic Base64 test**

Use:

```ts
new Uint8Array([137, 80, 78, 71]).buffer
```

with `image/png`.

Assert prefix:

```text
data:image/png;base64,
```

- [ ] **Step 2: Implement browser-safe conversion**

No Node-only Buffer dependency in production browser code.

- [ ] **Step 3: Reject invalid MIME types**

Require a non-empty MIME type.

Do not infer MIME from filename.

- [ ] **Step 4: Run tests/build**

```bash
npm test -- src/resources/assets/dataUri.test.ts
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/resources/assets
git commit -m "feat: embed binary svg assets"
```

---

# Task 8: Materialize Non-text Scene Nodes without Re-layout

**Files:**
- Create: `src/rendering/svg/materialize.ts`
- Create: `src/rendering/svg/materialize.test.ts`

**Interfaces:**
- Produces:

```ts
export type SvgTextMode = "outlined" | "editable";

export async function materializeSvg(args: {
  scene: RenderScene;
  mode: SvgTextMode;
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<SvgDocument>;
```

- [ ] **Step 1: Write root scene test**

Given:

```ts
scene.width = 700
scene.height = 500
```

assert materialized document:

```text
width = 700
height = 500
viewBox = "0 0 700 500"
```

- [ ] **Step 2: Materialize `SceneLineNode` verbatim**

Do not alter:

```text
x1/y1/x2/y2
stroke
strokeWidth
```

- [ ] **Step 3: Materialize `SceneRectNode` verbatim**

Do not perform another `strokeWidth / 2` inset here.

That was already handled by Layout geometry.

This is a critical no-double-adjustment assertion.

- [ ] **Step 4: Materialize `SceneDotNode` to `<circle>`**

Use:

```text
cx
cy
radius
color
opacity
```

unchanged.

- [ ] **Step 5: Materialize `SceneImageNode`**

Resolve:

```text
assetId
→ AssetResolver
→ BinaryAsset
→ data URI
```

Then emit image geometry exactly as Scene provides it.

- [ ] **Step 6: Add external-resource test**

Serialized output may contain the standard SVG namespace URL, but must not contain:

```text
href="http://
href="https://
src="
```

for materialized image resources.

- [ ] **Step 7: Run tests/build**

```bash
npm test -- src/rendering/svg/materialize.test.ts
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/rendering/svg/materialize.ts src/rendering/svg/materialize.test.ts
git commit -m "feat: materialize svg scene geometry"
```

---

# Task 9: Implement Outlined Text Materialization

**Files:**
- Modify: `src/rendering/svg/materialize.ts`
- Modify: `src/rendering/svg/materialize.test.ts`

**Interfaces:**
- Consumes `SceneTextNode.originX`, `baselineY`, `typography`, `color`, `opacity`.
- Consumes `ResolvedFontEngine.outline(...)`.
- Produces one SVG group/path sequence per semantic Scene text node.

- [ ] **Step 1: Write outlined-mode test with fake font engine**

Given one Scene text node:

```text
text = "31"
originX = 114
baselineY = 76
color = "#111"
opacity = 0.6
```

fake `fontEngine.outline` returns two glyph paths.

Assert:

```text
two path nodes exist
path `d` / transform come from font engine unchanged
fill = Scene color
opacity = Scene opacity
no SvgTextNode exists
```

- [ ] **Step 2: Implement outlined mode**

Call:

```ts
fontEngine.outline({
  text: node.text,
  typography: node.typography,
  originX: node.originX,
  baselineY: node.baselineY,
})
```

SVG Materializer must not call:

```text
getAnchorPoint
positionText
TextMeasurer.measure
```

- [ ] **Step 3: Add layout-vs-outline metric consistency assertion**

Using a real `ResolvedFontEngine` in the verification harness later:

```text
Layout text metrics
and
outline cursor
```

must come from the same loaded face.

Unit tests should at least prove materializer uses the supplied resolved origin without modification.

- [ ] **Step 4: Add opacity test for adjacent-month text**

If Scene says:

```text
opacity = 0.36
```

outlined glyphs must preserve `0.36` exactly.

Renderer does not know why the node is adjacent.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/rendering/svg/materialize.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/rendering/svg/materialize.ts src/rendering/svg/materialize.test.ts
git commit -m "feat: materialize outlined svg text"
```

---

# Task 10: Implement Editable Text Materialization

**Files:**
- Modify: `src/rendering/svg/materialize.ts`
- Modify: `src/rendering/svg/materialize.test.ts`

**Interfaces:**
- `mode: "editable"` converts Scene text to SVG `<text>` without changing layout origin.

- [ ] **Step 1: Write editable-mode test**

Given Scene text:

```text
originX = 114
baselineY = 76
fontId = "date"
fontSize = 20
fontWeight = 400
fontStyle = normal
letterSpacing = 1
color = #111
opacity = 0.6
```

and descriptor family:

```text
Noto Sans
```

expect one `SvgTextNode` with exactly those values.

- [ ] **Step 2: Resolve family through font engine**

Use:

```ts
fontEngine.getDescriptor(node.typography.fontId)
```

Do not embed a Google Fonts URL.

- [ ] **Step 3: Keep `x/y` equal to resolved Scene origin/baseline**

Do not reapply Anchor.

Do not use `text-anchor="middle"` or `dominant-baseline`.

The layout has already converted semantic Anchor to left-origin/alphabetic-baseline coordinates.

- [ ] **Step 4: Document Editable fidelity limitation in code comments only where necessary**

Editable mode depends on the target environment having a compatible font family/face.

Do not solve this by embedding remote font CSS.

- [ ] **Step 5: Assert mode separation**

For the same scene:

```text
outlined → paths, no text
editable → text, no glyph outline paths
```

Non-text nodes must be identical in both modes.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/rendering/svg/materialize.test.ts
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/rendering/svg/materialize.ts src/rendering/svg/materialize.test.ts
git commit -m "feat: add editable svg text mode"
```

---

# Task 11: Build React Preview and Single-file SVG Export

**Files:**
- Create: `src/rendering/svg/SvgPreview.tsx`
- Create: `src/rendering/svg/SvgPreview.test.tsx`
- Create: `src/rendering/svg/exportSvg.ts`
- Create: `src/rendering/svg/exportSvg.test.ts`

**Interfaces:**
- Produces:

```ts
export function SvgPreview(props: {
  document: SvgDocument;
  className?: string;
}): JSX.Element;

export function createSvgBlob(document: SvgDocument): Blob;

export function downloadSvg(args: {
  document: SvgDocument;
  filename: string;
}): void;
```

- [ ] **Step 1: Implement React AST adapter**

`SvgPreview` recursively maps AST nodes to native React SVG elements.

No geometry calculation is allowed.

- [ ] **Step 2: Add Preview test**

Create an `SvgDocument` containing:

```text
rect
line
circle
path
text
image
```

Render with Testing Library and assert corresponding DOM attributes.

- [ ] **Step 3: Implement Blob export**

Flow:

```text
SvgDocument
→ serializeSvg
→ Blob type "image/svg+xml;charset=utf-8"
```

- [ ] **Step 4: Implement download helper**

Use:

```text
URL.createObjectURL
temporary <a download>
click
URL.revokeObjectURL
```

The download filename is supplied by the caller.

- [ ] **Step 5: Prove export does not inspect Preview DOM**

Tests should call `createSvgBlob(document)` without rendering React.

There must be no DOM query/serialization dependency in `exportSvg.ts`.

- [ ] **Step 6: Run tests/build**

```bash
npm test -- src/rendering/svg
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/rendering/svg
git commit -m "feat: preview and export svg documents"
```

---

# Task 12: Add Production Main/Mini Render Orchestration Helpers

**Files:**
- Create: `src/rendering/svg/renderCalendarSvg.ts`
- Create: `src/rendering/svg/renderCalendarSvg.test.ts`

**Interfaces:**
- Produces convenience helpers for single-document generation while keeping reusable lower-level functions:

```ts
export async function renderMainSvgDocument(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  fontCatalog: FontCatalog;
  assetResolver: AssetResolver;
  mode: SvgTextMode;
  fetchImpl?: typeof fetch;
}): Promise<SvgDocument>;

export async function renderMiniSvgDocument(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  fontCatalog: FontCatalog;
  assetResolver: AssetResolver;
  mode: SvgTextMode;
  fetchImpl?: typeof fetch;
}): Promise<SvgDocument>;
```

- [ ] **Step 1: Implement Main orchestration**

Exact pipeline:

```text
Calendar + Main Template
→ collectMainFontText
→ resolveFontEngine
→ layoutMain(textMeasurer = resolved engine)
→ materializeSvg
→ SvgDocument
```

- [ ] **Step 2: Implement Mini orchestration**

Exact pipeline:

```text
Calendar + Mini Template
→ collectMiniFontText
→ resolveFontEngine
→ layoutMini(textMeasurer = resolved engine)
→ materializeSvg
→ SvgDocument
```

- [ ] **Step 3: Add mocked integration tests**

Use mocked Google `fetchImpl` and/or local font assets only if practical.

At minimum, mock the resource layer so tests verify orchestration order and output dimensions without network.

- [ ] **Step 4: Preserve reusable lower-level functions**

Do not hide:

```text
collect/merge requirements
resolveFontEngine
layoutMain/layoutMini
materializeSvg
```

Batch export later needs to resolve a merged yearly font set once rather than call the convenience helper 27 times.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/rendering/svg/renderCalendarSvg.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/rendering/svg/renderCalendarSvg.ts src/rendering/svg/renderCalendarSvg.test.ts
git commit -m "feat: render main and mini svg documents"
```

---

# Task 13: Build a Phase 3 Production Verification Harness

**Files:**
- Create: `src/verification/phase3/fixture.ts`
- Create: `src/verification/phase3/Phase3Verification.tsx`
- Create: `src/verification/phase3/phase3-verification.css`
- Create: `public/phase3-marker.png`
- Modify: application entry only enough to show the verification harness
- Create: `docs/phase3/manual-validation.md`

**Interfaces:**
- This harness imports production Phase 1/2/3 modules.
- Production modules must never import from the harness.
- It provides manual Preview + Export acceptance for:
  - Main
  - Mini
  - Outlined
  - Editable
  - 4/5/6-week sample months

- [ ] **Step 1: Create font catalog fixture**

Use concrete independent faces, preferably:

```text
English / Date / Mini Month Label:
Noto Sans

Chinese Holiday:
Noto Sans SC

Japanese Holiday:
Noto Sans JP
```

All should be concrete normal-weight faces first.

Do not add a font picker UI.

- [ ] **Step 2: Create holiday fixture through normalized domain data**

Include:

```text
Japanese holiday
China holiday
China workday
one same-day China + Japan case
one adjacent-month holiday case where practical
```

- [ ] **Step 3: Use real Phase 1 Calendar generation**

Provide selectable sample months:

```text
2026-02 → 4 weeks
2027-02 → 5 weeks
2027-05 → 6 weeks
```

- [ ] **Step 4: Use real production templates**

Start from `DEFAULT_MAIN_TEMPLATE` / `DEFAULT_MINI_TEMPLATE`.

Override only fixture font IDs and marker asset IDs as needed.

- [ ] **Step 5: Provide a memory/static `AssetResolver`**

Fetch `phase3-marker.png` using Vite-safe public path resolution, convert it to bytes, and expose it under a fixture `assetId`.

Do not add Dexie.

- [ ] **Step 6: Render production Outlined Preview by default**

The screen should show:

```text
Main Preview
Mini Preview
selected month
mode
font diagnostics / errors
```

Preview consumes returned `SvgDocument`.

- [ ] **Step 7: Add mode toggle**

Modes:

```text
Outlined
Editable
```

Do not maintain separate layout pipelines.

- [ ] **Step 8: Add four explicit export buttons**

```text
Export Main Outlined
Export Main Editable
Export Mini Outlined
Export Mini Editable
```

Suggested filenames:

```text
2027-5-main-outlined.svg
2027-5-main-editable.svg
2027-5-mini-outlined.svg
2027-5-mini-editable.svg
```

- [ ] **Step 9: Surface production font failures visibly**

If CSS/font binary/fontkit parsing fails, show the actual error.

Do not silently fall back to browser text in Outlined mode.

- [ ] **Step 10: Add manual validation document**

Create:

```markdown
# Monthloom Phase 3 Manual Validation

## Environment

- Browser:
- OS:
- Figma:
- Git commit:
- GitHub Pages URL:

## Production Font Pipeline

- Noto Sans: PASS/FAIL
- Noto Sans SC: PASS/FAIL
- Noto Sans JP: PASS/FAIL
- Outlined CJK paths: PASS/FAIL

## Main

| Month | Weeks | Preview | Size | Grid | Text | Adjacent | Markers |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| 2026-2 | 4 | | | | | | |
| 2027-2 | 5 | | | | | | |
| 2027-5 | 6 | | | | | | |

## Mini

| Month | Weeks | Preview | Size | Date Colors | Empty Adjacent | Dots |
| --- | ---: | --- | --- | --- | --- | --- |
| 2026-2 | 4 | | | | | |
| 2027-2 | 5 | | | | | |
| 2027-5 | 6 | | | | | |

## Export

- Main Outlined standalone/offline: PASS/FAIL
- Mini Outlined standalone/offline: PASS/FAIL
- Image Marker embedded: PASS/FAIL
- Outlined contains no `<text>`: PASS/FAIL
- Editable contains `<text>`: PASS/FAIL
- Export contains no remote image/font dependency: PASS/FAIL

## Figma

- Main Outlined size/position: PASS/FAIL
- Mini Outlined size/position: PASS/FAIL
- CJK paths: PASS/FAIL
- Grid stroke: PASS/FAIL
- Image Marker: PASS/FAIL
- Editable import: PASS/FAIL / informational

## Decision

- [ ] ACCEPT — proceed to Phase 4
- [ ] REJECT — revise Phase 3
```

- [ ] **Step 11: Run full automated verification**

```bash
npm test
npm run build
```

Expected:

```text
Phase 3 tests pass.
Phase 1/2 tests remain green.
Rendering Spike tests remain green.
Build succeeds.
```

- [ ] **Step 12: Commit verification harness**

```bash
git add src/verification public/phase3-marker.png docs/phase3 src/main.tsx
git commit -m "test: add phase 3 renderer verification"
```

---

# Task 14: Verify GitHub Pages and Production Dependency Boundaries

**Files:**
- Modify deployment config only if the current GitHub Pages workflow needs the Phase 3 production harness.
- Modify `docs/phase3/manual-validation.md` with observed results.

**Interfaces:**
- Produces evidence that production font/resource loading works under the real GitHub Pages origin.

- [ ] **Step 1: Check production dependency direction**

Run:

```bash
grep -R "fontkit\|googleFonts\|rendering/svg" src/domain src/rendering/layout || true
```

Expected:

```text
No fontkit/Google Fonts/SVG renderer dependency in Calendar Domain, Template Model, or Layout Engine.
```

- [ ] **Step 2: Check production code does not import Spike**

Run:

```bash
grep -R "src/spike\|/spike/" src/domain src/rendering src/resources || true
```

Expected:

```text
No production import from Spike.
```

- [ ] **Step 3: Check materializer does not re-layout**

Run a focused code review of:

```text
src/rendering/svg/materialize.ts
```

It must not import:

```text
anchors.ts
textMetrics.positionText
grid geometry calculation helpers
```

It may import Scene/SVG types, font engine, and asset utilities.

- [ ] **Step 4: Deploy current verification harness to GitHub Pages**

Use the existing Pages workflow.

Expected:

```text
Application assets resolve under repository base path.
Google Fonts CSS fetch succeeds.
Google font binary fetch succeeds.
fontkit parsing succeeds.
Outlined Main/Mini render.
```

- [ ] **Step 5: Export from deployed origin**

Export Main/Mini Outlined and Editable SVG from the GitHub Pages build.

Verify the exported files contain no GitHub Pages application URL.

- [ ] **Step 6: Complete manual-validation evidence**

Record actual browser/Figma results.

Do not mark Phase 3 accepted before the user performs the Figma/manual checks.

- [ ] **Step 7: Final automated check**

```bash
npm test
npm run build
```

Expected:

```text
All tests green and build succeeds.
```

- [ ] **Step 8: Commit only actual validation/document changes**

```bash
git add docs/phase3/manual-validation.md
git commit -m "docs: record phase 3 validation"
```

---

# Phase 3 Acceptance Gate

Do not begin the next phase until all required items below pass.

## Architecture

- [ ] Calendar Domain remains renderer-independent.
- [ ] Template Model remains fontkit/SVG-independent.
- [ ] Layout Engine remains SVG/fontkit-independent except through its existing `TextMeasurer` interface.
- [ ] Layout Engine produces final `originX / baselineY` for text.
- [ ] SVG Materializer does not recalculate Anchor/Cell layout.
- [ ] Production code does not import `src/spike/`.
- [ ] Preview and export consume the same `SvgDocument`.

## Font Engine

- [ ] Font catalog maps stable `fontId` to concrete `FontDescriptor`.
- [ ] Actual required characters are collected per font.
- [ ] Main collection includes adjacent dates and holiday/marker text.
- [ ] Mini collection excludes non-rendered adjacent/holiday-name text.
- [ ] Google Fonts uses actual text subset requests.
- [ ] Google font binary loads in local browser.
- [ ] Google font binary loads from GitHub Pages origin.
- [ ] `fontkit` parses Latin, Chinese, and Japanese production fonts.
- [ ] `measure` and `outline` use the same font face and letter-spacing rules.
- [ ] Missing font/mismatched face produces an explicit error.
- [ ] No silent fallback occurs in Outlined mode.

## Outlined SVG

- [ ] Outlined mode contains glyph `<path>` nodes.
- [ ] Outlined mode contains no semantic text as SVG `<text>`.
- [ ] Glyph position uses Scene `originX / baselineY` unchanged.
- [ ] Chinese text outlines correctly.
- [ ] Japanese text outlines correctly.
- [ ] Numeric/English text outlines correctly.
- [ ] Adjacent opacity is preserved exactly.
- [ ] Outlined SVG opens offline with the same text appearance.

## Editable SVG

- [ ] Editable mode retains `<text>`.
- [ ] `x/y` equal Scene origin/baseline.
- [ ] Font family/size/weight/style/letter-spacing are serialized.
- [ ] Editable SVG contains no external Google font URL.
- [ ] Known environment-dependent fidelity limitation is accepted.
- [ ] Non-text geometry is identical between Editable and Outlined modes.

## SVG Geometry

- [ ] Root width/height exactly equal Scene width/height.
- [ ] ViewBox is exactly `0 0 width height`.
- [ ] Materializer does not apply stroke inset a second time.
- [ ] Main Grid outer/internal lines remain correct.
- [ ] Mini remains borderless.
- [ ] 4-week Main/Mini size is stable.
- [ ] 5-week Main/Mini size is stable.
- [ ] 6-week Main/Mini size is stable.

## Assets

- [ ] Image Marker resolves by `assetId`.
- [ ] Export embeds image as data URI.
- [ ] Outlined SVG image works offline.
- [ ] Export contains no remote image dependency.
- [ ] Asset resource coordinates match Scene exactly.

## Preview / Export

- [ ] Production Preview renders the shared SVG AST.
- [ ] Export serializes the same SVG AST.
- [ ] Export never serializes Preview DOM.
- [ ] Browser Preview and standalone exported Outlined SVG visually match.

## Figma

- [ ] Main Outlined imports at exact configured size.
- [ ] Mini Outlined imports at exact configured size.
- [ ] Grid stroke remains correct.
- [ ] Latin/numeric outlined text remains correctly positioned.
- [ ] Chinese outlined text remains correctly positioned.
- [ ] Japanese outlined text remains correctly positioned.
- [ ] Image Marker survives import.
- [ ] No unexplained clipping or systematic translation occurs.
- [ ] Editable import behavior is inspected, but pixel-perfect parity is not required.

## Verification

- [ ] Phase 3 tests pass.
- [ ] Phase 2 tests remain green.
- [ ] Phase 1 tests remain green.
- [ ] Rendering Spike tests remain green.
- [ ] `npm run build` succeeds.
- [ ] GitHub Pages runtime verification passes.
- [ ] User has completed manual/Figma validation.

## Decision

If all required Outlined/font/geometry/self-contained/Figma checks pass:

```text
Phase 3 — Production Font Engine + SVG Renderer
→ ACCEPT
→ Proceed to the next product phase
```

If any core font, text-position, SVG geometry, self-contained asset, or Figma-import assumption fails:

```text
Phase 3
→ REJECT
→ Record exact reproducible evidence
→ Fix the production renderer/font boundary
→ Re-run affected acceptance checks
```

Do not work around a failed rendering invariant in the future Editor or Page Preview layers.
