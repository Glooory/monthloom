# Monthloom Rendering Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deliberately small browser-based Rendering Spike that proves Monthloom can load Google Font binaries, shape and outline Latin/CJK text with `fontkit`, position text using Anchor + Offset + font metrics, render exact-size SVG grids, embed image assets, reuse one SVG AST for Preview and Export, and survive import into Figma.

**Architecture:** The Spike is intentionally not the Monthloom production architecture. It contains only a small test-data → render-scene-ish data → SVG AST → React Preview / XML Serializer pipeline, with font and geometry helpers isolated enough to validate technical assumptions. No Calendar Core, Editor, state management, persistence, holiday adapters, or 13-page preview should be implemented here.

**Tech Stack:** Vite, React, TypeScript, native SVG, `fontkit`, Vitest, Testing Library only where DOM testing is actually useful.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- The Spike must run entirely in the browser and remain statically deployable to GitHub Pages.
- Do not add a backend, SSR, serverless functions, database server, authentication, or private API keys.
- React must not independently calculate export geometry.
- Preview and export must consume the same SVG AST.
- Outlined text must be generated from font data rather than browser `<text>` layout.
- Final exported SVG must be self-contained.
- Outer stroke must stay inside the configured SVG width/height.
- Internal grid lines must be drawn once, never duplicated per Cell.
- Do not add Zustand, zundo, Dexie, Zod, JSZip, React Router, Canvas, Fabric.js, Konva, HarfBuzz, or Web Workers to the Spike.
- Do not generalize this into a reusable vector-editing framework.
- Spike code may be thrown away after validation.

---

## 1. Target File Structure

Create the following focused structure:

```text
monthloom/
  src/
    spike/
      App.tsx
      spike.css
      testData.ts

      svg/
        ast.ts
        serializeSvg.ts
        SvgPreview.tsx
        svgDocument.ts

      geometry/
        gridGeometry.ts

      fonts/
        googleFonts.ts
        fontkitAdapter.ts
        textLayout.ts

      assets/
        embedImage.ts

      render/
        buildSpikeSvg.ts

    main.tsx

  src/spike/svg/
    serializeSvg.test.ts
    svgDocument.test.ts

  src/spike/geometry/
    gridGeometry.test.ts

  src/spike/fonts/
    textLayout.test.ts
    googleFonts.test.ts

  src/spike/assets/
    embedImage.test.ts

  public/
    spike-marker.png

  docs/
    spike/
      figma-validation.md

  vite.config.ts
  package.json
```

Responsibilities:

- `ast.ts`: Minimal SVG AST types only.
- `serializeSvg.ts`: Convert the AST into SVG XML.
- `SvgPreview.tsx`: Render exactly the same AST as React SVG elements.
- `svgDocument.ts`: Construct the root `<svg>` metadata and viewBox.
- `gridGeometry.ts`: Exact outer border and single-pass internal grid line geometry.
- `googleFonts.ts`: Resolve Google Fonts CSS into a font binary URL and fetch bytes.
- `fontkitAdapter.ts`: Parse bytes with fontkit and expose a narrow font interface to the Spike.
- `textLayout.ts`: Anchor + Offset + font-metric text placement.
- `embedImage.ts`: Convert an image Blob/ArrayBuffer into an embedded data URI.
- `buildSpikeSvg.ts`: Assemble the test scene into one SVG AST.
- `App.tsx`: Show Preview, diagnostics, stroke selector, and Export button.
- `figma-validation.md`: Manual Figma acceptance checklist and observed results.

---

# Task 1: Scaffold the Browser Spike

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/spike/App.tsx`
- Create: `src/spike/spike.css`
- Create: `src/spike/testData.ts`
- Create: `public/spike-marker.png`

**Interfaces:**
- Produces: A Vite React TypeScript application that runs locally and can later deploy under a GitHub Pages repository subpath.
- Produces: `SPIKE_VIEW_WIDTH = 700`, `SPIKE_VIEW_HEIGHT = 500`, `SPIKE_WEEKDAY_HEIGHT = 50` from `testData.ts`.

- [ ] **Step 1: Initialize the Vite React TypeScript project**

Run:

```bash
npm create vite@latest . -- --template react-ts
npm install
```

Expected:

```text
Vite React TypeScript project created successfully.
```

- [ ] **Step 2: Add Spike dependencies**

Run:

```bash
npm install fontkit
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected:

```text
package.json contains fontkit and Vitest-related development dependencies.
```

- [ ] **Step 3: Add test scripts**

Set `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Configure Vite for GitHub Pages-compatible base paths**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/monthloom/" : "/",
  test: {
    environment: "jsdom",
  },
});
```

If the actual GitHub repository name is not `monthloom`, replace `/monthloom/` with the real repository path before deployment.

- [ ] **Step 5: Define Spike constants and sample strings**

Create `src/spike/testData.ts`:

```ts
export const SPIKE_VIEW_WIDTH = 700;
export const SPIKE_VIEW_HEIGHT = 500;
export const SPIKE_WEEKDAY_HEIGHT = 50;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const SAMPLE_TEXTS = {
  singleDigit: "1",
  doubleDigit: "31",
  chinese: "春节",
  japanese: "憲法記念日",
  japaneseShort: "文化の日",
  marker: "假",
} as const;
```

- [ ] **Step 6: Create the minimal Spike screen**

`src/spike/App.tsx` should initially render:

```tsx
export function App() {
  return (
    <main>
      <h1>Monthloom Rendering Spike</h1>
      <p>Rendering pipeline not connected yet.</p>
    </main>
  );
}
```

- [ ] **Step 7: Wire the application entry**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./spike/App";
import "./spike/spike.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Run the application**

Run:

```bash
npm run dev
```

Expected:

```text
The browser shows “Monthloom Rendering Spike”.
```

- [ ] **Step 9: Verify production build**

Run:

```bash
npm run build
```

Expected:

```text
Build completes without TypeScript or Vite errors.
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: scaffold rendering spike"
```

---

# Task 2: Create a Minimal Shared SVG AST

**Files:**
- Create: `src/spike/svg/ast.ts`
- Create: `src/spike/svg/serializeSvg.ts`
- Create: `src/spike/svg/serializeSvg.test.ts`
- Create: `src/spike/svg/SvgPreview.tsx`
- Create: `src/spike/svg/svgDocument.ts`
- Create: `src/spike/svg/svgDocument.test.ts`

**Interfaces:**
- Produces: `SvgNode`, `SvgDocument`.
- Produces: `serializeSvg(document: SvgDocument): string`.
- Produces: `<SvgPreview document={document} />`.
- Produces: `createSvgDocument(width, height, children): SvgDocument`.

- [ ] **Step 1: Write AST types**

Create `src/spike/svg/ast.ts`:

```ts
export type SvgAttributes = {
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type SvgGroup = {
  kind: "group";
  opacity?: number;
  children: SvgNode[];
};

export type SvgPath = SvgAttributes & {
  kind: "path";
  d: string;
  transform?: string;
};

export type SvgLine = SvgAttributes & {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SvgRect = SvgAttributes & {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SvgImage = {
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  opacity?: number;
};

export type SvgNode = SvgGroup | SvgPath | SvgLine | SvgRect | SvgImage;

export type SvgDocument = {
  width: number;
  height: number;
  viewBox: string;
  children: SvgNode[];
};
```

Do not add `<text>` yet. The Spike's default rendering target is outlined paths.

- [ ] **Step 2: Write failing serializer test**

Create `src/spike/svg/serializeSvg.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { serializeSvg } from "./serializeSvg";
import type { SvgDocument } from "./ast";

describe("serializeSvg", () => {
  it("serializes exact dimensions and viewBox", () => {
    const document: SvgDocument = {
      width: 700,
      height: 500,
      viewBox: "0 0 700 500",
      children: [],
    };

    const svg = serializeSvg(document);

    expect(svg).toContain('width="700"');
    expect(svg).toContain('height="500"');
    expect(svg).toContain('viewBox="0 0 700 500"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
```

- [ ] **Step 3: Run test and verify failure**

Run:

```bash
npm test -- src/spike/svg/serializeSvg.test.ts
```

Expected:

```text
FAIL because serializeSvg does not exist.
```

- [ ] **Step 4: Implement XML escaping and serializer**

Implement `serializeSvg.ts` with explicit handling for:

```text
group
path
line
rect
image
```

The serializer must:

- Escape attribute values.
- Emit `xmlns`.
- Emit exact numeric width/height/viewBox.
- Preserve numeric opacity and stroke width.
- Never use the browser DOM as the export source.

- [ ] **Step 5: Run serializer tests**

Run:

```bash
npm test -- src/spike/svg/serializeSvg.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 6: Test SVG document construction**

Create `svgDocument.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSvgDocument } from "./svgDocument";

describe("createSvgDocument", () => {
  it("uses configured dimensions as the document viewBox", () => {
    expect(createSvgDocument(700, 500, [])).toEqual({
      width: 700,
      height: 500,
      viewBox: "0 0 700 500",
      children: [],
    });
  });
});
```

- [ ] **Step 7: Implement `createSvgDocument`**

```ts
import type { SvgDocument, SvgNode } from "./ast";

export function createSvgDocument(
  width: number,
  height: number,
  children: SvgNode[],
): SvgDocument {
  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children,
  };
}
```

- [ ] **Step 8: Implement React AST adapter**

`SvgPreview.tsx` must recursively convert each `SvgNode` to native React SVG elements.

Root:

```tsx
<svg
  width={document.width}
  height={document.height}
  viewBox={document.viewBox}
  xmlns="http://www.w3.org/2000/svg"
>
  {document.children.map(renderNode)}
</svg>
```

Do not calculate geometry here.

- [ ] **Step 9: Run all tests and build**

```bash
npm test
npm run build
```

Expected:

```text
All tests pass and production build succeeds.
```

- [ ] **Step 10: Commit**

```bash
git add src/spike/svg
git commit -m "feat: add shared svg ast pipeline"
```

---

# Task 3: Prove Exact Grid and Stroke Geometry

**Files:**
- Create: `src/spike/geometry/gridGeometry.ts`
- Create: `src/spike/geometry/gridGeometry.test.ts`

**Interfaces:**
- Produces:

```ts
type GridGeometryOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  strokeWidth: number;
};

function buildGridGeometry(options: GridGeometryOptions): SvgNode[];
```

- [ ] **Step 1: Write failing geometry tests**

Cover all three widths:

```ts
const strokeWidths = [0.5, 1, 2];
```

For each width, assert:

- One outer `rect`.
- `columns - 1` vertical lines.
- `rows - 1` horizontal lines.
- Outer rectangle starts at `strokeWidth / 2`.
- Outer rectangle size is reduced by exactly `strokeWidth`.
- No line lies outside the requested `x..x+width`, `y..y+height`.

Example:

```ts
it.each([0.5, 1, 2])(
  "keeps a %s px outer stroke inside the configured bounds",
  (strokeWidth) => {
    const nodes = buildGridGeometry({
      x: 0,
      y: 50,
      width: 700,
      height: 450,
      columns: 7,
      rows: 5,
      strokeWidth,
    });

    const border = nodes[0];
    expect(border).toMatchObject({
      kind: "rect",
      x: strokeWidth / 2,
      y: 50 + strokeWidth / 2,
      width: 700 - strokeWidth,
      height: 450 - strokeWidth,
    });
  },
);
```

- [ ] **Step 2: Run test and verify failure**

```bash
npm test -- src/spike/geometry/gridGeometry.test.ts
```

Expected:

```text
FAIL because buildGridGeometry is not defined.
```

- [ ] **Step 3: Implement grid geometry**

Rules:

```text
cellWidth = width / columns
cellHeight = height / rows
```

Outer border:

```text
x + strokeWidth / 2
y + strokeWidth / 2
width - strokeWidth
height - strokeWidth
```

Internal vertical lines:

```text
x + cellWidth * columnIndex
```

Internal horizontal lines:

```text
y + cellHeight * rowIndex
```

Each internal line appears exactly once.

- [ ] **Step 4: Assert exact line counts**

Add assertions:

```text
1 outer rect
6 vertical lines for 7 columns
4 horizontal lines for 5 rows
11 total geometry nodes
```

- [ ] **Step 5: Run tests**

```bash
npm test -- src/spike/geometry/gridGeometry.test.ts
```

Expected:

```text
PASS for strokeWidth 0.5, 1, and 2.
```

- [ ] **Step 6: Commit**

```bash
git add src/spike/geometry
git commit -m "feat: validate svg grid geometry"
```

---

# Task 4: Validate Google Fonts Binary Loading

**Files:**
- Create: `src/spike/fonts/googleFonts.ts`
- Create: `src/spike/fonts/googleFonts.test.ts`

**Interfaces:**
- Produces:

```ts
type GoogleFontRequest = {
  family: string;
  weight: number;
  style: "normal" | "italic";
  text?: string;
};

async function fetchGoogleFontBytes(
  request: GoogleFontRequest,
): Promise<ArrayBuffer>;
```

- [ ] **Step 1: Implement CSS URL construction as a pure function**

Expose:

```ts
export function buildGoogleFontsCssUrl(
  request: GoogleFontRequest,
): string;
```

Requirements:

- Use Google Fonts CSS2.
- Encode family safely.
- Include weight/style.
- Include `text=` only when provided.

The Spike should request at least:

```text
Noto Sans
Noto Sans JP
```

- [ ] **Step 2: Write URL construction tests**

Test:

```ts
expect(
  buildGoogleFontsCssUrl({
    family: "Noto Sans JP",
    weight: 400,
    style: "normal",
    text: "31春节憲法記念日",
  }),
).toContain("family=Noto+Sans+JP");
```

Also verify the sample text is URL encoded.

- [ ] **Step 3: Implement CSS parsing**

Expose:

```ts
export function extractFontUrl(css: string): string;
```

Test using a fixed CSS fixture containing:

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

If no `src url(...)` exists, throw a descriptive error.

- [ ] **Step 4: Implement browser fetch pipeline**

`fetchGoogleFontBytes`:

```text
request
→ CSS URL
→ fetch CSS
→ extract binary URL
→ fetch binary
→ ArrayBuffer
```

For non-2xx responses, throw errors including:

```text
resource type
HTTP status
URL origin
```

Do not include retries in the Spike.

- [ ] **Step 5: Add a manual diagnostics call in App**

The browser UI should show:

```text
Font CSS: loaded / failed
Font binary: <byte count>
```

for `Noto Sans JP`.

This is an integration probe, not a unit test.

- [ ] **Step 6: Verify locally in a real browser**

Run:

```bash
npm run dev
```

Expected:

```text
Noto Sans JP font bytes are fetched successfully.
```

If browser CORS prevents font binary access, stop the Spike and document the exact failure before building text layout.

- [ ] **Step 7: Run tests and build**

```bash
npm test
npm run build
```

Expected:

```text
All pure parsing tests pass.
Build succeeds.
```

- [ ] **Step 8: Commit**

```bash
git add src/spike/fonts src/spike/App.tsx
git commit -m "feat: load google font binaries"
```

---

# Task 5: Parse Fonts and Generate Glyph Paths

**Files:**
- Create: `src/spike/fonts/fontkitAdapter.ts`
- Create: `src/spike/fonts/textLayout.ts`
- Create: `src/spike/fonts/textLayout.test.ts`

**Interfaces:**
- Produces:

```ts
type SpikeFont = {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  layout(text: string): SpikeGlyphRun;
};

type SpikeGlyphRun = {
  glyphs: SpikeGlyph[];
  advanceWidth: number;
};

type SpikeGlyph = {
  id: number;
  advanceWidth: number;
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
  pathData: string;
};

function parseFont(bytes: ArrayBuffer): SpikeFont;
```

- [ ] **Step 1: Wrap fontkit behind a narrow adapter**

`fontkitAdapter.ts` may import `fontkit`, but callers must not depend directly on fontkit object shapes.

Convert fontkit's font/glyph/run data into the Spike interfaces above.

The adapter must expose:

```text
unitsPerEm
ascent
descent
glyph IDs
glyph advances
glyph offsets
glyph SVG path data
```

- [ ] **Step 2: Add browser diagnostics**

For:

```text
1
31
春节
憲法記念日
```

show:

```text
glyph count
glyph IDs
advance width
unitsPerEm
ascent
descent
```

in the Spike page.

If any CJK string maps to missing-glyph `.notdef` behavior, stop and document the actual font-resolution problem instead of hiding it.

- [ ] **Step 3: Define font-unit scaling**

Create:

```ts
export function fontScale(font: SpikeFont, fontSize: number): number {
  return fontSize / font.unitsPerEm;
}
```

All metrics and path coordinates must use this scale consistently.

- [ ] **Step 4: Write deterministic metric tests with a fake font**

Do not make unit tests download Google Fonts.

Create a fake `SpikeFont` where:

```text
unitsPerEm = 1000
ascent = 800
descent = -200
```

and verify:

```text
fontSize = 20
scaled ascent = 16
scaled descent = -4
```

- [ ] **Step 5: Run unit tests**

```bash
npm test -- src/spike/fonts/textLayout.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 6: Verify actual glyph paths in browser**

Render at least one real fontkit-generated path for:

```text
31
春节
憲法記念日
```

Do not use browser `<text>` for these samples.

Expected:

```text
All samples visibly render as SVG path geometry.
```

- [ ] **Step 7: Commit**

```bash
git add src/spike/fonts
git commit -m "feat: outline font glyphs with fontkit"
```

---

# Task 6: Implement Anchor + Offset + Font Metrics

**Files:**
- Modify: `src/spike/fonts/textLayout.ts`
- Modify: `src/spike/fonts/textLayout.test.ts`

**Interfaces:**
- Produces:

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
  | "bottom-right";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Position = {
  anchor: Anchor;
  offsetX: number;
  offsetY: number;
};

type PositionedGlyphRun = {
  originX: number;
  baselineY: number;
  width: number;
  ascent: number;
  descent: number;
  paths: SvgPath[];
};

function layoutOutlinedText(args: {
  text: string;
  font: SpikeFont;
  fontSize: number;
  cell: Rect;
  position: Position;
}): PositionedGlyphRun;
```

- [ ] **Step 1: Write `top-left` failing test**

Using:

```text
cell = { x: 100, y: 50, width: 200, height: 100 }
fontSize = 20
scaled ascent = 16
scaled descent = -4
offset = { x: 14, y: 10 }
```

Expected:

```text
originX = 114
baselineY = 76
```

because:

```text
50 + 10 + 16 = 76
```

- [ ] **Step 2: Implement `top-left`**

Calculate:

```text
anchorX = cell.x
anchorY = cell.y
originX = anchorX + offsetX
baselineY = anchorY + offsetY + ascent
```

- [ ] **Step 3: Add center test**

For text width `40`, same font metrics, and:

```text
cell center = (200, 100)
offset = (0, 0)
```

Expected:

```text
originX = 180
baselineY = 106
```

because:

```text
baselineY
= centerY + (ascent + descent) / 2
= 100 + (16 + -4) / 2
= 106
```

- [ ] **Step 4: Add bottom-right test**

Derive placement from the typographic box, not ink bounds.

For:

```text
cell right = 300
cell bottom = 150
text width = 40
descent = -4
offset = (-10, -8)
```

Expected:

```text
originX = 250
baselineY = 138
```

because the text typographic bottom must land at:

```text
150 - 8 = 142
```

and:

```text
baselineY - descent = 142
baselineY - (-4) = 142
baselineY = 138
```

- [ ] **Step 5: Implement all nine anchors**

Do this through horizontal and vertical anchor helpers rather than nine unrelated branches.

Horizontal modes:

```text
left
center
right
```

Vertical modes:

```text
top
center
bottom
```

- [ ] **Step 6: Generate translated/scaled path nodes**

Convert each glyph path from font units into SVG coordinates using one consistent transform.

The implementation must account for the font coordinate system's Y direction. Confirm visually that glyphs are upright.

Do not manually rewrite path commands.

- [ ] **Step 7: Add Spike debug geometry**

For selected samples, draw temporary:

```text
Cell rect
Anchor point
Typographic box
Baseline
Glyph paths
```

Use distinguishable line styles or opacity, but do not let debug geometry enter the export used for the final Figma acceptance test.

- [ ] **Step 8: Visually validate three anchors**

Display the same sample text in:

```text
top-left
center
bottom-right
```

Expected:

```text
Anchor behavior is predictable for “1”, “31”, “春节”, and “憲法記念日”.
```

- [ ] **Step 9: Run tests**

```bash
npm test -- src/spike/fonts/textLayout.test.ts
```

Expected:

```text
All anchor calculations pass.
```

- [ ] **Step 10: Commit**

```bash
git add src/spike/fonts
git commit -m "feat: validate anchor based text layout"
```

---

# Task 7: Embed Image Marker as a Self-contained Resource

**Files:**
- Create: `src/spike/assets/embedImage.ts`
- Create: `src/spike/assets/embedImage.test.ts`
- Use: `public/spike-marker.png`

**Interfaces:**
- Produces:

```ts
function arrayBufferToDataUri(
  bytes: ArrayBuffer,
  mimeType: string,
): string;
```

- [ ] **Step 1: Write failing data-URI test**

Use a tiny deterministic byte array:

```ts
const bytes = new Uint8Array([137, 80, 78, 71]).buffer;
```

Assert:

```text
data:image/png;base64,
```

prefix exists and no `http://` / `https://` appears.

- [ ] **Step 2: Implement browser-safe base64 conversion**

Implement `arrayBufferToDataUri`.

The result must be directly usable as:

```tsx
<image href={dataUri} />
```

and serializable unchanged.

- [ ] **Step 3: Load the actual Spike marker in browser**

Resolve `spike-marker.png` through Vite-safe asset addressing and fetch its bytes.

Convert to:

```text
data:image/png;base64,...
```

before constructing the SVG AST.

- [ ] **Step 4: Add it to Preview AST**

Use one `SvgImage` node with fixed test geometry, for example:

```text
x = 620
y = 65
width = 20
height = 20
```

- [ ] **Step 5: Export and verify URL absence**

After serialization, assert manually or with a helper:

```text
serialized SVG contains `data:image/png;base64,`
serialized SVG contains no marker `http://` or `https://` URL
```

The SVG namespace itself is allowed to contain `http://www.w3.org/2000/svg`; do not treat that as an external dependency.

- [ ] **Step 6: Run tests**

```bash
npm test -- src/spike/assets/embedImage.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 7: Commit**

```bash
git add src/spike/assets public/spike-marker.png
git commit -m "feat: embed image marker in svg"
```

---

# Task 8: Assemble the Shared Preview / Export Rendering Pipeline

**Files:**
- Create: `src/spike/render/buildSpikeSvg.ts`
- Modify: `src/spike/App.tsx`
- Modify: `src/spike/spike.css`

**Interfaces:**
- Consumes:
  - `buildGridGeometry(...)`
  - `layoutOutlinedText(...)`
  - `arrayBufferToDataUri(...)`
  - `createSvgDocument(...)`
  - `SvgPreview`
  - `serializeSvg(...)`
- Produces:

```ts
async function buildSpikeSvg(strokeWidth: number): Promise<SvgDocument>;
```

- [ ] **Step 1: Define fixed Spike geometry**

Use:

```text
SVG width = 700
SVG height = 500
Weekday row height = 50

Date Grid:
x = 0
y = 50
width = 700
height = 450
columns = 7
rows = 5
```

This creates:

```text
cell width = 100
date row height = 90
```

- [ ] **Step 2: Add weekday samples**

Render:

```text
Sun Mon Tue Wed Thu Fri Sat
```

as outlined paths centered over each column.

Do not use `<text>`.

- [ ] **Step 3: Add numeric samples**

Place:

```text
1
31
```

in different cells with `top-left` anchors.

- [ ] **Step 4: Add CJK samples**

Place:

```text
春节
憲法記念日
文化の日
```

in separate Cells.

At least one CJK sample must use `center`, and one must use `bottom-right`.

- [ ] **Step 5: Add text marker**

Render:

```text
假
```

as an outlined glyph path.

- [ ] **Step 6: Add embedded image marker**

Use the data URI produced in Task 7.

- [ ] **Step 7: Expose stroke controls**

Spike UI should allow switching:

```text
0.5
1
2
```

The control may be plain buttons or a `<select>`.

Changing it rebuilds the same AST pipeline.

- [ ] **Step 8: Render Preview from `SvgDocument`**

`App.tsx` must render:

```tsx
<SvgPreview document={document} />
```

No SVG geometry calculations are allowed inside `App.tsx`.

- [ ] **Step 9: Export from the same `SvgDocument`**

Export button:

```text
same SvgDocument
→ serializeSvg
→ Blob
→ object URL
→ download
```

Do not inspect or serialize the Preview DOM.

Suggested filename:

```text
monthloom-rendering-spike-stroke-1.svg
```

- [ ] **Step 10: Add diagnostic text outside the SVG**

Show:

```text
SVG size: 700 × 500
viewBox: 0 0 700 500
stroke: <selected>
font bytes: <count>
font unitsPerEm: <value>
font ascent: <value>
font descent: <value>
```

This diagnostic HTML is not part of the SVG.

- [ ] **Step 11: Run test suite and production build**

```bash
npm test
npm run build
```

Expected:

```text
All tests pass.
Production build succeeds.
```

- [ ] **Step 12: Manually compare Preview and exported SVG**

Open the exported SVG in a separate browser tab.

Expected:

```text
The outlined glyphs, grid geometry, and marker placement visually match the embedded Preview.
```

- [ ] **Step 13: Commit**

```bash
git add src/spike
git commit -m "feat: assemble rendering spike pipeline"
```

---

# Task 9: Validate GitHub Pages Runtime Behavior

**Files:**
- Create or modify: `.github/workflows/deploy-pages.yml`
- Modify if needed: `vite.config.ts`

**Interfaces:**
- Produces: A deployed Spike at the repository's GitHub Pages URL.
- Validates: Google Fonts binary access and export under the actual production origin.

- [ ] **Step 1: Add GitHub Pages deployment workflow**

Use a standard Actions workflow that:

```text
checkout
→ setup Node
→ npm ci
→ npm run build
→ upload `dist`
→ deploy Pages
```

Use the official GitHub Pages Actions for artifact upload and deployment.

- [ ] **Step 2: Confirm the repository base path**

For repository:

```text
monthloom
```

production base should be:

```text
/monthloom/
```

Do not hardcode root-relative application asset paths.

- [ ] **Step 3: Deploy the Spike**

Push the branch or workflow trigger required by the repository.

Expected:

```text
GitHub Pages deployment succeeds.
```

- [ ] **Step 4: Validate font loading on GitHub Pages**

Open the deployed page.

Expected:

```text
Noto Sans JP CSS loads.
Font binary is readable as ArrayBuffer.
fontkit parses it.
Outlined Latin/CJK samples render.
```

If local succeeds but GitHub Pages fails, record:

```text
request URL
response status
browser console CORS error
browser name/version
```

and stop before treating the font pipeline as accepted.

- [ ] **Step 5: Validate export on GitHub Pages**

Export SVG from the deployed app.

Expected:

```text
Downloaded SVG opens correctly.
No application path dependency remains in the SVG.
Embedded image is visible.
```

- [ ] **Step 6: Commit deployment configuration**

```bash
git add .github/workflows/deploy-pages.yml vite.config.ts
git commit -m "ci: deploy rendering spike to github pages"
```

---

# Task 10: Perform Figma Acceptance Validation

**Files:**
- Create: `docs/spike/figma-validation.md`

**Interfaces:**
- Consumes: Exported SVGs for stroke widths `0.5`, `1`, and `2`.
- Produces: A written PASS/FAIL record that determines whether the Rendering Spike is accepted.

- [ ] **Step 1: Export three SVG files**

Export:

```text
monthloom-rendering-spike-stroke-0.5.svg
monthloom-rendering-spike-stroke-1.svg
monthloom-rendering-spike-stroke-2.svg
```

- [ ] **Step 2: Verify standalone browser behavior**

For each file:

1. Disconnect network access or use browser offline mode.
2. Open the SVG directly.
3. Verify glyph paths display.
4. Verify image marker displays.
5. Verify no external font request occurs.
6. Verify no external image request occurs.

Record PASS/FAIL.

- [ ] **Step 3: Import each SVG into Figma**

For each SVG, record:

```text
Imported width
Imported height
Grid appearance
Outlined text appearance
Image marker appearance
Unexpected clipping
Unexpected displacement
```

Acceptance target:

```text
Width = 700
Height = 500
```

- [ ] **Step 4: Compare key text positions**

Check at least:

```text
1
31
春节
憲法記念日
```

against browser Preview.

Record whether there is any visible displacement after Figma import.

Do not accept unexplained systematic displacement.

- [ ] **Step 5: Check stroke behavior**

For `0.5`, `1`, and `2`:

- Outer border stays within the imported 700 × 500 frame.
- Internal lines appear once.
- No double-weight Cell boundaries.
- No unexpected clipping at the edges.

- [ ] **Step 6: Write the validation report**

`docs/spike/figma-validation.md` should contain:

```markdown
# Monthloom Rendering Spike — Figma Validation

## Environment

- Browser:
- OS:
- Figma:
- Git commit:

## Google Fonts

- CSS fetch: PASS/FAIL
- Font binary fetch: PASS/FAIL
- fontkit parse: PASS/FAIL
- CJK glyph path: PASS/FAIL

## Browser Preview / Export

- Shared AST verified: PASS/FAIL
- 700 × 500 dimensions: PASS/FAIL
- Embedded image offline: PASS/FAIL

## Figma Import

| Stroke | Size | Grid | Text | Image | Result |
| --- | --- | --- | --- | --- | --- |
| 0.5 | | | | | |
| 1 | | | | | |
| 2 | | | | | |

## Text Position Checks

| Text | Browser | Figma | Result |
| --- | --- | --- | --- |
| 1 | | | |
| 31 | | | |
| 春节 | | | |
| 憲法記念日 | | | |

## Issues Found

Document exact reproducible issues here.

## Decision

- [ ] ACCEPT — proceed to formal Monthloom implementation
- [ ] REJECT — revise technical design before proceeding
```

- [ ] **Step 7: Commit validation evidence**

```bash
git add docs/spike/figma-validation.md
git commit -m "docs: record rendering spike validation"
```

---

# Final Spike Acceptance Gate

Do **not** begin formal Monthloom Phase 1 until all required items below pass.

## Font

- [ ] Google Fonts CSS can be fetched in the deployed GitHub Pages app.
- [ ] The selected font binary can be fetched as `ArrayBuffer`.
- [ ] `fontkit` parses the font in the browser.
- [ ] Latin glyphs render as SVG paths.
- [ ] Chinese glyphs render as SVG paths.
- [ ] Japanese glyphs render as SVG paths.
- [ ] Required glyphs are not silently replaced with `.notdef`.

## Text Layout

- [ ] Font units scale consistently to configured font size.
- [ ] `top-left` Anchor behaves as defined.
- [ ] `center` Anchor behaves as defined.
- [ ] `bottom-right` Anchor behaves as defined.
- [ ] Text position uses typographic metrics rather than SVG browser baseline heuristics.
- [ ] Glyph paths are upright and correctly positioned.

## SVG Geometry

- [ ] SVG root is exactly `700 × 500`.
- [ ] `viewBox` is exactly `0 0 700 500`.
- [ ] `0.5` stroke stays inside the bounds.
- [ ] `1` stroke stays inside the bounds.
- [ ] `2` stroke stays inside the bounds.
- [ ] Internal grid lines are not duplicated.

## Preview / Export

- [ ] Preview and export consume the same `SvgDocument`.
- [ ] Export does not serialize the Preview DOM.
- [ ] Exported glyph path data visually matches Preview.
- [ ] Exported SVG works as a standalone file.

## Assets

- [ ] Image Marker is embedded as data.
- [ ] Image Marker works offline.
- [ ] Image Marker survives Figma import.

## Figma

- [ ] Imported SVG remains `700 × 500`.
- [ ] Grid remains visually correct.
- [ ] Outlined Latin text remains correctly positioned.
- [ ] Outlined Chinese text remains correctly positioned.
- [ ] Outlined Japanese text remains correctly positioned.
- [ ] No unexplained clipping or translation occurs.

## Decision Rule

If every required item passes:

```text
Rendering Spike
→ ACCEPT
→ Proceed to formal Monthloom implementation planning / Phase 1
```

If any core font, geometry, self-contained asset, or Figma-import requirement fails:

```text
Rendering Spike
→ REJECT
→ Record exact evidence
→ Revise Monthloom Technical Design
→ Re-run only the affected Spike tasks
```

Do not patch around a failed technical assumption inside the production Monthloom codebase.
