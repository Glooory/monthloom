# Monthloom Phase 4 — Template Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Monthloom's production calendar-specific Template Editor: semantic selection, Figma-like overlay interaction, nine-point Anchor visualization, drag-to-position using Anchor + Offset, precise Inspector controls, Main Weekday Row resizing, and document-level Undo/Redo.

**Architecture:** The Editor never edits rendered SVG coordinates directly. Canonical design state lives in a small Zustand document store; transient interaction state lives in a separate UI store. The editor derives effective templates during drag/resize, runs the existing production Layout → SVG pipeline, and overlays semantic hit targets/selection controls on top of the same SVG Preview. A central template-binding module maps semantic element IDs to template properties so Inspector, drag, Anchor changes, and Undo all modify the same semantic rules.

**Tech Stack:** React, TypeScript, Zustand, zundo, Immer, native Pointer Events, native SVG overlay, existing Phase 1–3 production modules, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- Do not implement the 13-page full-year Preview in this phase.
- Do not implement Dexie/IndexedDB persistence, template import/export, ZIP batch export, PNG/PDF output, cloud sync, or account features.
- Do not turn the Editor into a general-purpose vector editor.
- Do not add arbitrary layers, shape tools, multi-select, masks, smart guides, Auto Layout, components, or generic freeform transform handles.
- Selection is semantic: clicking a rendered date selects `Date`, not `2027-5-17` as a separately styled object.
- Design changes apply globally to the selected semantic template element.
- No month-specific or date-specific style override may be introduced.
- Drag changes only `Anchor + Offset`; it never stores canvas-absolute coordinates in the template.
- Drag keeps the current Anchor unchanged.
- Changing Anchor is explicit and should preserve the selected rendered instance's visual bounds as closely as the model allows.
- One complete drag gesture must create exactly one Undo history entry.
- One complete Weekday Row resize gesture must create exactly one Undo history entry.
- Inspector numeric/text edits should commit as one meaningful history entry per completed field edit, not one entry per keystroke.
- Undo history tracks document state only, never selection/hover/pointer/transient UI state.
- Layout Engine remains the geometry authority.
- SVG Materializer remains renderer-only and must not gain editor behavior.
- Production Preview continues to consume production `SvgDocument`.
- Editor overlay is not part of exported SVG.
- Production modules must not import `src/spike/`.
- Use native Pointer Events; do not add dnd-kit, interact.js, Konva, Fabric, or Canvas.
- Main and Mini remain independently editable templates.
- Font/asset data may be held in memory in this phase; persistence belongs to a later phase.
- The Editor must remain compatible with static GitHub Pages deployment.

---

# 1. Target Production File Structure

```text
src/
  editor/
    state/
      documentStore.ts
      documentStore.test.ts
      uiStore.ts

    model/
      types.ts
      templateBindings.ts
      templateBindings.test.ts
      effectiveDocument.ts
      effectiveDocument.test.ts

    selection/
      hitTargets.ts
      hitTargets.test.ts
      selection.ts

    interaction/
      pointerDelta.ts
      pointerDelta.test.ts
      anchorChange.ts
      anchorChange.test.ts
      drag.ts
      drag.test.ts
      weekdayResize.ts
      weekdayResize.test.ts
      keyboardShortcuts.ts
      keyboardShortcuts.test.ts

    fonts/
      useEditorFontEngine.ts

    assets/
      memoryAssetStore.ts
      memoryAssetStore.test.ts

    components/
      TemplateEditor.tsx
      EditorToolbar.tsx
      EditorCanvas.tsx
      EditorOverlay.tsx
      AnchorOverlay.tsx
      Inspector.tsx
      PositionInspector.tsx
      TypographyInspector.tsx
      ColorInspector.tsx
      BorderInspector.tsx
      MarkerInspector.tsx
      DotInspector.tsx
      editor.css

  rendering/
    scene/
      types.ts                 # modify only for stable editor instance/layout metadata if Phase 2 lacks it

  rendering/
    layout/
      mainLayout.ts            # modify only to populate editor metadata
      miniLayout.ts            # modify only to populate editor metadata
      tests...

  verification/
    phase4/
      fixture.ts
      Phase4Verification.tsx

docs/
  phase4/
    manual-validation.md
```

The existing Phase 3 SVG Renderer/Preview remains unchanged except for consuming any backward-compatible Scene metadata changes indirectly through the existing pipeline.

---

# Task 1: Add Document State and Undo-capable Store

**Files:**
- Create: `src/editor/state/documentStore.ts`
- Create: `src/editor/state/documentStore.test.ts`
- Create: `src/editor/state/uiStore.ts`
- Modify: `package.json`
- Modify: lockfile

**Interfaces:**
- Produces:

```ts
export type EditorDocument = Readonly<{
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  fontCatalog: FontCatalog;
}>;

export type DocumentStore = {
  document: EditorDocument;
  commitDocument(next: EditorDocument): void;
  replaceDocument(next: EditorDocument): void;
};

export const useDocumentStore: ...;

export type EditorSelection = Readonly<{
  semanticId: EditableSemanticId;
  instanceKey: string;
}>;

export type DragSession = Readonly<{
  semanticId: PositionableSemanticId;
  instanceKey: string;
  deltaX: number;
  deltaY: number;
}>;

export type WeekdayResizeSession = Readonly<{
  deltaY: number;
}>;

export type EditorUiState = {
  activeTemplate: "main" | "mini";
  selection: EditorSelection | null;
  drag: DragSession | null;
  weekdayResize: WeekdayResizeSession | null;
  ...
};
```

- [ ] **Step 1: Install state dependencies**

Run:

```bash
npm install zustand zundo immer
```

Use `temporal` from `zundo` for Undo/Redo history. Do not add Zustand persistence middleware.

- [ ] **Step 2: Define the minimal `EditorDocument`**

Start with:

```text
mainTemplate
miniTemplate
fontCatalog
```

Do not add holiday datasets, page layout, background, or persistence metadata in Phase 4.

- [ ] **Step 3: Create a default FontCatalog**

The default document must register concrete font IDs referenced by default templates.

Prefer separate font IDs for independently configurable semantic text families, for example:

```text
main.weekday
main.date
main.chinaHoliday
main.japanHoliday
main.marker
mini.monthLabel
mini.weekday
mini.date
```

They may initially point to Noto Sans / Noto Sans SC / Noto Sans JP.

- [ ] **Step 4: Write failing document history test**

Test:

```text
initial date offsetX = A
commit B
undo → A
redo → B
```

Access zundo history through:

```ts
useDocumentStore.temporal.getState().undo();
useDocumentStore.temporal.getState().redo();
```

- [ ] **Step 5: Implement document store**

Use zundo `temporal(...)`.

History must track only:

```text
document
```

Actions must not become meaningful historical state.

Set a practical history limit such as:

```text
100
```

- [ ] **Step 6: Distinguish commit vs replace**

`commitDocument(next)`:

```text
normal user edit
→ tracked by Undo
```

`replaceDocument(next)`:

```text
future load/reset style operation
→ replace current document
→ clear temporal history
```

If zundo's direct API makes an untracked replacement awkward, implement `replaceDocument` by setting the state and immediately clearing temporal history. Test the observed behavior.

- [ ] **Step 7: Create separate UI store**

Track only:

```text
activeTemplate
selection
hover
drag
weekday resize
optional preview scale/display state
```

No UI-store field participates in document Undo/Redo.

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/editor/state/documentStore.test.ts
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/editor/state
git commit -m "feat: add editor document history state"
```

Use the actual lockfile if the project does not use npm's lockfile.

---

# Task 2: Define Semantic Editor Bindings

**Files:**
- Create: `src/editor/model/types.ts`
- Create: `src/editor/model/templateBindings.ts`
- Create: `src/editor/model/templateBindings.test.ts`

**Interfaces:**
- Produces a finite set of editable semantic IDs:

```ts
export type EditableSemanticId =
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

export type PositionableSemanticId = Exclude<
  EditableSemanticId,
  "main.grid"
>;

export function getElementPosition(
  document: EditorDocument,
  semanticId: PositionableSemanticId,
): Position;

export function setElementPosition(
  document: EditorDocument,
  semanticId: PositionableSemanticId,
  position: Position,
): EditorDocument;
```

Also provide focused setters/getters for Inspector-editable properties rather than string property paths.

- [ ] **Step 1: Map every semantic ID to its template owner**

Examples:

```text
main.date
→ document.mainTemplate.date

main.chinaHolidayMarker
→ document.mainTemplate.chinaMarkers.holiday

main.chinaWorkdayMarker
→ document.mainTemplate.chinaMarkers.workday

mini.holidayDot
→ document.miniTemplate.markers.holidayDot
```

- [ ] **Step 2: Write round-trip Position tests**

For every positionable semantic ID:

```text
get old
set new
get → new
unrelated template fields unchanged
```

- [ ] **Step 3: Define focused typography access**

Provide:

```ts
export function getTypography(...): Typography | null;
export function setTypography(...): EditorDocument;
```

Typography exists for:

```text
main.weekday
main.date
main.chinaHolidayName
main.japanHolidayName
text-type Main markers
mini.monthLabel
mini.weekday
mini.date
```

Image markers and dots return `null`.

- [ ] **Step 4: Define calendar-color access**

Date semantic IDs use palette rules, not only their base typography color.

Provide explicit functions for:

```text
main.colors
mini.colors
```

Do not hide color precedence behind a generic string-path setter.

- [ ] **Step 5: Define border access**

Only:

```text
main.grid
```

maps to:

```text
borderWidth
borderColor
```

- [ ] **Step 6: Define marker/dot access**

Expose typed operations needed by Inspector:

```text
text marker value
marker type
image assetId
image width/height
marker opacity
dot size/color/opacity
```

When changing marker type:

```text
text → image
image → text
```

preserve its current Position.

Use simple default values for fields that do not exist in the old variant.

- [ ] **Step 7: Do not introduce generic path strings**

Avoid APIs such as:

```ts
setByPath(document, "mainTemplate.date.position.offsetX", 14)
```

The allowed semantic set is small enough to keep explicit.

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/editor/model/templateBindings.test.ts
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/editor/model
git commit -m "feat: bind semantic editor elements to templates"
```

---

# Task 3: Add Stable Editor Metadata and Hit Targets

**Files:**
- Modify if required: `src/rendering/scene/types.ts`
- Modify if required: `src/rendering/layout/mainLayout.ts`
- Modify if required: `src/rendering/layout/miniLayout.ts`
- Create: `src/editor/selection/hitTargets.ts`
- Create: `src/editor/selection/hitTargets.test.ts`
- Create: `src/editor/selection/selection.ts`
- Modify corresponding layout tests

**Interfaces:**
- Each selectable Scene node must expose enough renderer-independent metadata to identify:
  - semantic type
  - specific rendered instance
  - its Cell coordinate context when positionable

Preferred metadata:

```ts
type SceneEditorContext = Readonly<{
  instanceKey: string;
  cell: Rect;
  position: Position;
}>;
```

Text nodes may already contain `cell/position`; add only the missing stable `instanceKey`.

Image/dot nodes should carry equivalent editor context if they do not already.

Grid does not need a Cell context.

Produces:

```ts
export type EditorHitTarget = Readonly<{
  semanticId: PositionableSemanticId;
  instanceKey: string;
  bounds: Rect;
  cell: Rect;
  position: Position;
}>;

export function buildEditorHitTargets(
  scene: RenderScene,
): readonly EditorHitTarget[];
```

- [ ] **Step 1: Add stable instance keys in Layout**

Use deterministic keys such as:

```text
main.weekday:0
main.date:2027-05-01
main.chinaHolidayName:2027-05-01
main.japanHolidayName:2027-05-03
main.chinaHolidayMarker:2027-05-01
mini.monthLabel:2027-05
mini.weekday:0
mini.date:2027-05-01
mini.holidayDot:2027-05-01
```

Renderer must ignore these fields.

- [ ] **Step 2: Keep editor context renderer-independent**

Do not add DOM references or SVG element IDs.

- [ ] **Step 3: Write text hitbox tests**

For Scene text:

```text
originX = 100
baselineY = 80
width = 40
ascent = 16
descent = -4
```

expected typographic hit bounds:

```text
x = 100
y = 64
width = 40
height = 20
```

because:

```text
top = baseline - ascent
bottom = baseline - descent
```

- [ ] **Step 4: Define image hitbox**

Use exact image geometry.

- [ ] **Step 5: Define dot hitbox**

For:

```text
cx, cy, radius
```

bounds are:

```text
x = cx - radius
y = cy - radius
width = radius * 2
height = radius * 2
```

- [ ] **Step 6: Add minimum interaction hitbox size**

Very small dots/markers are difficult to click.

For interaction only, expand hit targets to a minimum of:

```text
12 × 12 scene units
```

centered on the visual bounds.

This expansion must not change rendered geometry.

- [ ] **Step 7: Run regression tests**

```bash
npm test -- src/editor/selection
npm test -- src/rendering/layout
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/rendering/scene src/rendering/layout src/editor/selection
git commit -m "feat: add semantic editor hit targets"
```

---

# Task 4: Implement Transient Effective Document Derivation

**Files:**
- Create: `src/editor/model/effectiveDocument.ts`
- Create: `src/editor/model/effectiveDocument.test.ts`

**Interfaces:**
- Produces:

```ts
export function createEffectiveDocument(args: {
  document: EditorDocument;
  drag: DragSession | null;
  weekdayResize: WeekdayResizeSession | null;
}): EditorDocument;
```

- [ ] **Step 1: Write drag derivation test**

Canonical:

```text
main.date offsetX = 14
offsetY = 10
```

Transient:

```text
deltaX = 5
deltaY = -3
```

Effective:

```text
offsetX = 19
offsetY = 7
```

Canonical document must remain unchanged.

- [ ] **Step 2: Implement drag derivation through semantic bindings**

Do not special-case Main Date inside the effective-document module.

Use `getElementPosition` / `setElementPosition`.

- [ ] **Step 3: Write Weekday resize derivation test**

Canonical Main weekday height:

```text
50
```

Transient delta:

```text
+12
```

Effective:

```text
62
```

Canonical remains `50`.

- [ ] **Step 4: Clamp Weekday Row height**

Clamp effective Main Weekday Row height to:

```text
0 <= height <= mainTemplate.height - 1
```

This preserves a positive Date Grid height.

- [ ] **Step 5: Run tests/build**

```bash
npm test -- src/editor/model/effectiveDocument.test.ts
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/model/effectiveDocument.ts src/editor/model/effectiveDocument.test.ts
git commit -m "feat: derive transient editor document"
```

---

# Task 5: Build the Editor Canvas and Semantic Selection Overlay

**Files:**
- Create: `src/editor/components/EditorCanvas.tsx`
- Create: `src/editor/components/EditorOverlay.tsx`
- Create: `src/editor/components/editor.css`
- Add component tests if current test setup supports stable SVG interaction testing

**Interfaces:**
- `EditorCanvas` consumes:
  - production `SvgDocument`
  - production `RenderScene`
  - current selection
  - selection callback

It renders:

```text
Production SvgPreview
+
separate editor-only SVG overlay
```

Both use the same ViewBox/dimensions.

- [ ] **Step 1: Render production Preview unchanged**

Use existing Phase 3:

```tsx
<SvgPreview document={document} />
```

Do not copy its renderer.

- [ ] **Step 2: Place an editor overlay above Preview**

Overlay root:

```tsx
<svg
  viewBox={`0 0 ${scene.width} ${scene.height}`}
  preserveAspectRatio="xMidYMid meet"
>
```

It must scale exactly with Preview.

- [ ] **Step 3: Render transparent hit targets**

For every `EditorHitTarget`, render an interaction element with:

```text
pointer events enabled
visual fill transparent
semantic data held in React props/state
```

Do not inject editor metadata into exported SVG.

- [ ] **Step 4: Click selects semantic element**

Clicking:

```text
2027-05-17 Date instance
```

stores:

```text
semanticId = main.date
instanceKey = main.date:2027-05-17
```

The Inspector later edits `main.date` globally.

- [ ] **Step 5: Selection highlight shows clicked instance**

Highlight the clicked target bounds so the user knows which rendered instance was used for interaction.

Selection highlight does not imply per-instance styling.

- [ ] **Step 6: Empty canvas clears selection**

Clicking the overlay background clears current selection.

Avoid accidental clearing when pointer events originate from a hit target.

- [ ] **Step 7: Verify semantic behavior**

Click two different Main dates sequentially.

Expected:

```text
same semanticId = main.date
different instanceKey
```

- [ ] **Step 8: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/editor/components
git commit -m "feat: add semantic editor selection"
```

---

# Task 6: Implement Nine-point Anchor Visualization and Anchor Change

**Files:**
- Create: `src/editor/interaction/anchorChange.ts`
- Create: `src/editor/interaction/anchorChange.test.ts`
- Create: `src/editor/components/AnchorOverlay.tsx`
- Modify: `src/editor/components/EditorOverlay.tsx`

**Interfaces:**
- Produces:

```ts
export function calculatePositionForAnchorChange(args: {
  cell: Rect;
  visualBounds: Rect;
  nextAnchor: Anchor;
}): Position;
```

The new Position keeps the selected instance's current visual bounds approximately stationary by aligning the new semantic anchor to the corresponding point on the current visual bounds.

- [ ] **Step 1: Write preserve-bounds anchor test**

Example:

```text
cell = { x: 0, y: 0, width: 100, height: 100 }
visualBounds = { x: 10, y: 20, width: 20, height: 10 }
nextAnchor = center
```

Visual-bounds center:

```text
20,25
```

Cell center:

```text
50,50
```

Expected next position:

```text
anchor = center
offsetX = -30
offsetY = -25
```

- [ ] **Step 2: Implement via `getAnchorPoint`**

Use the same Phase 2 anchor helper for both:

```text
visualBounds target point
cell base point
```

Then:

```text
offset = visualPoint - cellPoint
```

- [ ] **Step 3: Render nine Anchor points**

When a positionable element is selected, display the nine Anchor points inside its Cell.

Do not show them for `main.grid`.

- [ ] **Step 4: Distinguish active Anchor**

The currently configured Anchor must be visually distinguishable.

Do not encode a product color constant into domain/layout modules; editor CSS may style it.

- [ ] **Step 5: Clicking Anchor commits one document change**

Flow:

```text
clicked selected instance
→ current visual bounds
→ calculatePositionForAnchorChange
→ setElementPosition
→ commitDocument
```

- [ ] **Step 6: Verify no per-instance override**

After changing Anchor on one Date instance, select another Date.

It must report the same updated template Anchor.

- [ ] **Step 7: Run tests/build**

```bash
npm test -- src/editor/interaction/anchorChange.test.ts
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/editor/interaction/anchorChange.ts src/editor/interaction/anchorChange.test.ts src/editor/components
git commit -m "feat: add editor anchor controls"
```

---

# Task 7: Implement Drag-to-position with One History Entry

**Files:**
- Create: `src/editor/interaction/pointerDelta.ts`
- Create: `src/editor/interaction/pointerDelta.test.ts`
- Create: `src/editor/interaction/drag.ts`
- Create: `src/editor/interaction/drag.test.ts`
- Modify: `src/editor/components/EditorOverlay.tsx`

**Interfaces:**
- Produces:

```ts
export function clientDeltaToSceneDelta(args: {
  clientDeltaX: number;
  clientDeltaY: number;
  renderedWidth: number;
  renderedHeight: number;
  sceneWidth: number;
  sceneHeight: number;
}): Readonly<{ x: number; y: number }>;
```

Drag behavior:

```text
pointerdown
→ setPointerCapture
→ store starting client position + semantic selection

pointermove
→ calculate scene-space delta
→ update UI transient DragSession

pointerup
→ calculate final Position
→ commitDocument once
→ clear DragSession
```

- [ ] **Step 1: Test CSS-scaled coordinate conversion**

Example:

```text
scene = 700 × 500
rendered = 350 × 250
client delta = 10 × -5
```

expected scene delta:

```text
20 × -10
```

- [ ] **Step 2: Implement delta conversion**

Reject zero rendered width/height.

Do not use screen pixels directly as template offsets.

- [ ] **Step 3: Keep Anchor unchanged**

Drag updates only:

```text
offsetX += deltaX
offsetY += deltaY
```

Never auto-switch Anchor when crossing Cell center.

- [ ] **Step 4: Update only UI transient state during pointermove**

Canonical DocumentStore must not change during drag.

`createEffectiveDocument(...)` makes the Preview update live.

- [ ] **Step 5: Commit exactly once on pointerup**

Use the final drag delta to produce one new Position and call:

```text
commitDocument(...)
```

once.

- [ ] **Step 6: Cancel safely**

Handle:

```text
pointercancel
Escape during active drag
```

by clearing transient drag without committing.

- [ ] **Step 7: Write one-history-entry test**

Test at store/interaction-helper level:

```text
start
10 transient move updates
commit once
undo once
→ original position restored
```

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/editor/interaction
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/editor/interaction src/editor/components/EditorOverlay.tsx
git commit -m "feat: drag semantic template elements"
```

---

# Task 8: Implement Core Inspector Position and Typography Editing

**Files:**
- Create: `src/editor/components/Inspector.tsx`
- Create: `src/editor/components/PositionInspector.tsx`
- Create: `src/editor/components/TypographyInspector.tsx`
- Modify: `src/editor/components/editor.css`
- Add component tests

**Interfaces:**
- Inspector consumes current semantic selection and canonical `EditorDocument`.
- Completed field edits call `commitDocument(...)`.

- [ ] **Step 1: Show semantic Inspector title**

Examples:

```text
Date
Weekday
China Holiday Name
Japan Holiday Name
China Holiday Marker
Mini Month Label
```

Do not display selected concrete date as if it had independent styling.

An optional secondary line may show the clicked instance for orientation.

- [ ] **Step 2: Add Position controls**

For positionable semantics:

```text
Anchor
Offset X
Offset Y
```

Anchor UI should synchronize with the canvas AnchorOverlay.

- [ ] **Step 3: Use local draft values for numeric inputs**

Typing:

```text
1
14
140
```

must not create three history entries.

Commit on:

```text
blur
Enter
```

If Escape is pressed before commit, restore canonical value.

- [ ] **Step 4: Add Typography controls**

Where typography exists, support:

```text
Font family
Font weight
Font style
Font size
Letter spacing
Opacity
```

Font family edits update the descriptor referenced by the semantic element's `fontId`.

Weight/style edits must update both:

```text
FontDescriptor
Typography fontWeight/fontStyle
```

for all template uses of that same `fontId`, preserving Phase 3 face-consistency invariant.

- [ ] **Step 5: Keep font IDs stable during ordinary Inspector edits**

Changing:

```text
Noto Sans → Inter
```

should edit the existing descriptor for that semantic font ID, not create a new random font ID per keystroke.

- [ ] **Step 6: Use Google Fonts as the Phase 4 family source**

Inspector may use a plain family text input for the first version.

Do not build a Google Fonts catalog browser/search UI.

`source.type` remains `"google"` for these edits.

Local-font upload UI is not required in Phase 4.

- [ ] **Step 7: Surface font loading errors**

If an edited family/weight/style cannot resolve, show the production Font Engine error near Preview/Inspector.

Do not silently restore another font.

- [ ] **Step 8: Run component tests/build**

Verify:

```text
field displays canonical value
editing draft does not immediately commit
blur commits once
Enter commits once
Escape discards
```

Run:

```bash
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/editor/components
git commit -m "feat: add position and typography inspector"
```

---

# Task 9: Implement Color, Border, Marker, and Dot Inspector Sections

**Files:**
- Create: `src/editor/components/ColorInspector.tsx`
- Create: `src/editor/components/BorderInspector.tsx`
- Create: `src/editor/components/MarkerInspector.tsx`
- Create: `src/editor/components/DotInspector.tsx`
- Create: `src/editor/assets/memoryAssetStore.ts`
- Create: `src/editor/assets/memoryAssetStore.test.ts`
- Modify: `src/editor/components/Inspector.tsx`

**Interfaces:**
- Produces minimal in-memory image upload support:

```ts
export type MemoryAssetStore = {
  addImage(file: File): Promise<string>; // returns assetId
  resolve(assetId: string): Promise<BinaryAsset>;
};
```

- [ ] **Step 1: Implement Date color palette controls**

For:

```text
main.date
mini.date
```

show:

```text
Default
Sunday
Saturday
Japanese Holiday
```

Each edit updates the corresponding Main/Mini palette.

Do not replace dynamic date color rules with one static Date color.

- [ ] **Step 2: Implement ordinary text color editing**

For semantic text whose color comes from its own typography/template value, expose a single Color field.

Keep date palette and ordinary text color concepts separate.

- [ ] **Step 3: Implement Main Grid Border controls**

When `main.grid` is selected through Inspector/toolbar affordance, expose:

```text
Border Width
Border Color
```

Changing border width must flow through Phase 2 Layout and preserve exact View size.

- [ ] **Step 4: Implement Main Marker controls**

For holiday/workday marker:

```text
Type: text | image
Position
Opacity
```

Text mode:

```text
Value
Typography
```

Image mode:

```text
Image
Width
Height
```

Do not hardcode `假` / `班`.

- [ ] **Step 5: Add in-memory image upload**

Accept a browser `File`.

Generate a stable session asset ID such as:

```text
editor-image-<crypto.randomUUID()>
```

Store bytes + MIME type in memory.

Do not persist them.

The existing Phase 3 `AssetResolver` interface must be satisfied by this store.

- [ ] **Step 6: Revoke no longer needed Object URLs if any are created**

Prefer keeping raw bytes and using the production resolver rather than storing a permanent object URL in templates.

Template stores only `assetId`.

- [ ] **Step 7: Implement Mini Dot controls**

Expose:

```text
Size
Color
Opacity
Position
```

Remember:

```text
size = diameter
```

- [ ] **Step 8: Run tests/build**

```bash
npm test -- src/editor/assets/memoryAssetStore.test.ts
npm test
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/editor/assets src/editor/components
git commit -m "feat: edit calendar colors borders and markers"
```

---

# Task 10: Implement Main Weekday Row Resize Handle

**Files:**
- Create: `src/editor/interaction/weekdayResize.ts`
- Create: `src/editor/interaction/weekdayResize.test.ts`
- Modify: `src/editor/components/EditorOverlay.tsx`

**Interfaces:**
- Main Editor shows one horizontal resize handle at:

```text
y = mainTemplate.weekdayRow.height
```

- [ ] **Step 1: Write resize math test**

Canonical:

```text
height = 50
pointer delta scene Y = +20
```

effective:

```text
70
```

Negative values clamp to `0`.

Values reaching/exceeding Main height clamp to:

```text
main.height - 1
```

- [ ] **Step 2: Render resize handle only for Main**

Mini does not gain draggable row-height handles in Phase 4.

Mini row heights remain editable by Inspector only if such controls already exist; do not add an unrequested complex resize UI.

- [ ] **Step 3: Use pointer capture and transient state**

During pointermove:

```text
UI weekdayResize.deltaY changes
canonical document unchanged
effective document rerenders
```

- [ ] **Step 4: Commit once on pointerup**

Commit final:

```text
mainTemplate.weekdayRow.height
```

once.

- [ ] **Step 5: Cancel without commit**

Support pointer cancel / Escape.

- [ ] **Step 6: Verify Date Grid responds immediately**

Changing Weekday Row height must cause existing Phase 2 Layout to recalculate:

```text
dateGridHeight
dateRowHeight
Cell geometry
```

No Editor-specific row layout formula should be introduced.

- [ ] **Step 7: Run tests/build**

```bash
npm test -- src/editor/interaction/weekdayResize.test.ts
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/editor/interaction/weekdayResize.ts src/editor/interaction/weekdayResize.test.ts src/editor/components/EditorOverlay.tsx
git commit -m "feat: resize main weekday row"
```

---

# Task 11: Add Undo/Redo UI and Keyboard Shortcuts

**Files:**
- Create: `src/editor/components/EditorToolbar.tsx`
- Create: `src/editor/interaction/keyboardShortcuts.ts`
- Create: `src/editor/interaction/keyboardShortcuts.test.ts`
- Modify: `src/editor/components/TemplateEditor.tsx`

**Interfaces:**
- Toolbar buttons:

```text
Undo
Redo
Main
Mini
```

- Keyboard:

```text
macOS:
Cmd+Z → Undo
Cmd+Shift+Z → Redo

Windows/Linux:
Ctrl+Z → Undo
Ctrl+Shift+Z → Redo
```

- [ ] **Step 1: Add reactive canUndo/canRedo state**

Use zundo temporal history.

Buttons must disable when the relevant history list is empty.

- [ ] **Step 2: Add Undo/Redo buttons**

Buttons act only on DocumentStore history.

Selection remains semantic UI state.

- [ ] **Step 3: Add keyboard shortcut helper**

Normalize:

```text
metaKey || ctrlKey
key === "z"
shiftKey
```

- [ ] **Step 4: Do not steal text-input native editing shortcuts**

If event target is:

```text
input
textarea
contenteditable
```

do not trigger document Undo/Redo.

This prevents Ctrl/Cmd+Z from unexpectedly undoing the whole template while editing a field draft.

- [ ] **Step 5: Clear transient interactions before Undo/Redo**

If a drag or resize is active, cancel it before executing history navigation.

- [ ] **Step 6: Add history-behavior tests**

Verify:

```text
Inspector commit → Undo → restored
Drag commit → one Undo restores original
Resize commit → one Undo restores original
Redo re-applies
selection changes create no history
active Main/Mini tab changes create no history
```

- [ ] **Step 7: Run tests/build**

```bash
npm test -- src/editor/interaction/keyboardShortcuts.test.ts
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/editor/components/EditorToolbar.tsx src/editor/interaction/keyboardShortcuts.ts src/editor/interaction/keyboardShortcuts.test.ts
git commit -m "feat: add template editor undo redo"
```

---

# Task 12: Build Production Template Editor Orchestration

**Files:**
- Create: `src/editor/fonts/useEditorFontEngine.ts`
- Create: `src/editor/components/TemplateEditor.tsx`
- Modify: supporting editor components as required

**Interfaces:**
- `TemplateEditor` consumes a production CalendarMonth for Main/Mini editing and existing holiday data.
- It derives:
  - canonical document
  - transient effective document
  - resolved font engine
  - RenderScene
  - SvgDocument
  - hit targets

- [ ] **Step 1: Implement stable font-requirement key**

The Editor must not refetch/reparse fonts during every offset drag.

Build a stable key from:

```text
FontCatalog concrete descriptors
+
required characters per fontId
```

Position, color, opacity, border, and row-height edits must not change this key unless they actually affect required text/font descriptors.

- [ ] **Step 2: Implement `useEditorFontEngine`**

Flow:

```text
calendar/template text requirements
+ font catalog
→ stable key
→ async resolveFontEngine
→ cache current resolved engine
```

Expose:

```text
loading
engine
error
```

Keep only in-memory cache.

- [ ] **Step 3: Derive effective document during drag/resize**

Use:

```text
canonical document
+
UI transient state
→ createEffectiveDocument
```

Render from effective templates.

- [ ] **Step 4: Produce RenderScene with resolved engine**

Main:

```text
layoutMain({
  calendar,
  template: effective.mainTemplate,
  textMeasurer: engine
})
```

Mini equivalent.

- [ ] **Step 5: Materialize Outlined SVG for editor Preview**

Use:

```text
mode = outlined
```

for the Template Editor.

Do not expose Editable mode inside the editing canvas in Phase 4.

- [ ] **Step 6: Render EditorCanvas + Inspector + Toolbar**

Basic structure:

```text
Toolbar

┌───────────────────────────┬──────────────┐
│                           │              │
│ Editor Canvas             │ Inspector    │
│                           │              │
└───────────────────────────┴──────────────┘
```

Do not implement Page Editor.

- [ ] **Step 7: Main/Mini switching**

Toolbar switches:

```text
Main Template
Mini Template
```

This is UI state only.

Switching must not create Undo history.

- [ ] **Step 8: Keep a deterministic editing month**

For Phase 4 verification, accept the `CalendarMonth` from the parent/harness.

Do not invent production Month Switcher behavior in the editor yet.

- [ ] **Step 9: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/editor
git commit -m "feat: assemble production template editor"
```

---

# Task 13: Build Phase 4 Verification Harness

**Files:**
- Create: `src/verification/phase4/fixture.ts`
- Create: `src/verification/phase4/Phase4Verification.tsx`
- Create: `docs/phase4/manual-validation.md`
- Modify application entry only enough to expose this harness

**Interfaces:**
- Uses only production Phase 1–4 modules.
- Provides representative visible instances for every semantic element that needs click/drag/Inspector validation.

- [ ] **Step 1: Create a representative Main fixture**

Choose/generated month data so the rendered scene visibly contains:

```text
normal weekday date
Sunday
Saturday
Japan holiday
China holiday
China workday
China + Japan same date
China holiday name
Japan holiday name
text marker
image marker where practical
adjacent-month date
```

If one real month cannot contain every state, create a deterministic normalized fixture CalendarMonth solely for editor verification.

Do not add fake behavior to production Calendar Core.

- [ ] **Step 2: Create representative Mini fixture**

Must contain:

```text
Month Label
Weekdays
normal dates
Sunday/Saturday
Japan holiday
China holiday dot
China workday dot
empty adjacent Cells
```

- [ ] **Step 3: Verify semantic selection**

Manual checks:

```text
click Date 1
click Date 31
→ Inspector title remains Date
```

Same for weekday/holiday name/marker.

- [ ] **Step 4: Verify drag**

Drag Date by a visible amount.

Check:

```text
Anchor unchanged
Offset changes
all Date instances move consistently
Undo once restores all
Redo once reapplies
```

- [ ] **Step 5: Verify Anchor change**

Select one Date and switch among:

```text
top-left
center
bottom-right
```

Check the selected instance does not unexpectedly jump far away; its visual bounds should remain approximately in place at the moment of Anchor change.

Then drag from the new Anchor and confirm behavior remains intuitive.

- [ ] **Step 6: Verify Inspector**

Manually edit:

```text
Offset X/Y
Font family
Font size
Font weight
Font style
Letter spacing
Opacity
Date color palette
Border width/color
Marker type/value/image/size
Dot size/color
```

Confirm each completed edit is global for that semantic template rule.

- [ ] **Step 7: Verify Weekday Row drag**

Drag Main Weekday Row boundary.

Confirm:

```text
Weekday Row height changes
Date Grid uses remaining height
all Date rows stay equal
Main overall size stays unchanged
Undo once restores original height
```

- [ ] **Step 8: Verify Main/Mini isolation**

Change Main Date font size.

Mini Date font size must remain unchanged.

Change Mini Date position.

Main Date position must remain unchanged.

- [ ] **Step 9: Verify Undo/Redo history quality**

Perform:

```text
one drag
one font-size edit
one border edit
one weekday resize
```

Undo four times.

Expected reverse order:

```text
resize
border
font size
drag
```

Selection/tab changes should not appear as history steps.

- [ ] **Step 10: Create validation document**

Create:

```markdown
# Monthloom Phase 4 Manual Validation

## Environment

- Browser:
- OS:
- Git commit:
- GitHub Pages URL:

## Selection

- Date semantic selection: PASS/FAIL
- Weekday semantic selection: PASS/FAIL
- China Holiday Name selection: PASS/FAIL
- Japan Holiday Name selection: PASS/FAIL
- Marker selection: PASS/FAIL
- Dot selection: PASS/FAIL

## Drag

- Anchor remains unchanged: PASS/FAIL
- Offset changes correctly: PASS/FAIL
- All semantic instances update: PASS/FAIL
- One Undo restores drag: PASS/FAIL
- Escape/pointer cancel does not commit: PASS/FAIL

## Anchor

- Nine anchors visible: PASS/FAIL
- Current anchor identifiable: PASS/FAIL
- Anchor change preserves visual position reasonably: PASS/FAIL
- Anchor change is global semantic rule: PASS/FAIL

## Inspector

- Position: PASS/FAIL
- Typography: PASS/FAIL
- Font loading/error behavior: PASS/FAIL
- Date color palette: PASS/FAIL
- Border: PASS/FAIL
- Text Marker: PASS/FAIL
- Image Marker: PASS/FAIL
- Mini Dot: PASS/FAIL
- One completed field edit = one history step: PASS/FAIL

## Weekday Row Resize

- Live resize: PASS/FAIL
- Equal Date rows retained: PASS/FAIL
- View size unchanged: PASS/FAIL
- One Undo restores resize: PASS/FAIL

## Main / Mini Isolation

- Main edits do not modify Mini: PASS/FAIL
- Mini edits do not modify Main: PASS/FAIL

## Undo / Redo

- Buttons: PASS/FAIL
- Cmd/Ctrl+Z: PASS/FAIL
- Shift+Cmd/Ctrl+Z: PASS/FAIL
- Input native undo not stolen: PASS/FAIL
- Selection not in history: PASS/FAIL

## Rendering Regression

- Production Outlined Preview still correct: PASS/FAIL
- SVG export still correct after template edits: PASS/FAIL
- Figma spot check after edited template: PASS/FAIL

## Decision

- [ ] ACCEPT — proceed to Phase 5
- [ ] REJECT — revise Phase 4
```

- [ ] **Step 11: Run all automated verification**

```bash
npm test
npm run build
```

- [ ] **Step 12: Commit harness**

```bash
git add src/verification/phase4 docs/phase4 src/main.tsx
git commit -m "test: add phase 4 editor verification"
```

---

# Task 14: GitHub Pages and Architecture Boundary Verification

**Files:**
- Modify deployment config only if required
- Modify `docs/phase4/manual-validation.md` with actual results

- [ ] **Step 1: Verify no Editor dependency leaks downward**

Run:

```bash
grep -R "editor/" src/domain src/rendering/layout src/rendering/svg src/resources || true
```

Expected:

```text
No lower-level production module imports Editor.
```

- [ ] **Step 2: Verify Layout remains renderer-independent**

Run:

```bash
grep -R "fontkit\|SvgPreview\|serializeSvg\|materializeSvg\|zustand\|zundo" \
  src/rendering/layout src/domain/template src/domain/calendar || true
```

Expected:

```text
No forbidden dependency.
```

- [ ] **Step 3: Verify Production still does not import Spike**

```bash
grep -R "src/spike\|/spike/" \
  src/domain src/rendering src/resources src/editor || true
```

Expected:

```text
No production import.
```

- [ ] **Step 4: Deploy Phase 4 harness to GitHub Pages**

Check:

```text
Editor loads
fonts load
selection works
drag works
Inspector works
image upload works for current session
Undo/Redo works
```

- [ ] **Step 5: Perform one export regression after editing**

Change several template values, then export one Outlined Main SVG through the existing Phase 3 export path.

Confirm Preview and exported SVG still agree.

- [ ] **Step 6: Perform one Figma regression spot check**

Import the edited Outlined Main SVG.

This is not a full Phase 3 re-validation; check only:

```text
size
Grid
changed Date position/font
holiday text
marker
```

- [ ] **Step 7: Complete manual validation report**

Do not mark ACCEPT until the user has performed the manual interaction checks.

- [ ] **Step 8: Final automated verification**

```bash
npm test
npm run build
```

- [ ] **Step 9: Commit actual validation results**

```bash
git add docs/phase4/manual-validation.md
git commit -m "docs: record phase 4 editor validation"
```

---

# Phase 4 Acceptance Gate

Do not begin Phase 5 until all required items below pass.

## State Architecture

- [ ] Canonical Main/Mini/font state lives in DocumentStore.
- [ ] Transient drag/resize/selection state lives outside DocumentStore.
- [ ] Undo tracks document state only.
- [ ] Main/Mini tab state is not undoable.
- [ ] Selection state is not undoable.
- [ ] No persistence middleware was added.
- [ ] Document history limit is bounded.

## Semantic Selection

- [ ] Clicking a Date selects `main.date` / `mini.date`, not a per-date style object.
- [ ] Different Date instances share one semantic selection type.
- [ ] Weekday can be selected semantically.
- [ ] China Holiday Name can be selected.
- [ ] Japan Holiday Name can be selected.
- [ ] China Marker can be selected.
- [ ] Mini dots can be selected.
- [ ] Selection highlight identifies the clicked instance only visually.
- [ ] No month-specific override exists.

## Anchor

- [ ] Nine Anchor points are visible for selected positionable elements.
- [ ] Active Anchor is clear.
- [ ] Anchor change is explicit.
- [ ] Anchor change updates template Position.
- [ ] Anchor change does not create instance-specific state.
- [ ] Anchor change preserves selected instance visual position reasonably.

## Drag

- [ ] Drag uses Pointer Events.
- [ ] Client delta converts to scene-space delta.
- [ ] Drag does not modify canonical document on each pointermove.
- [ ] Live Preview uses transient effective document.
- [ ] Drag keeps Anchor unchanged.
- [ ] Pointerup commits exactly once.
- [ ] One Undo reverses one complete drag.
- [ ] Escape/pointercancel cancels without commit.

## Inspector

- [ ] Position is editable precisely.
- [ ] Font family is editable.
- [ ] Font size is editable.
- [ ] Font weight is editable.
- [ ] Font style is editable.
- [ ] Letter spacing is editable.
- [ ] Opacity is editable.
- [ ] Date palettes expose default/Sunday/Saturday/Japan Holiday separately.
- [ ] Main Border width/color are editable.
- [ ] China holiday/workday markers remain separately configurable.
- [ ] Marker text is not hardcoded.
- [ ] Text/Image marker switching works.
- [ ] Image Marker size is editable.
- [ ] Mini Dot size/color/position are editable.
- [ ] Field typing does not create one Undo entry per keystroke.
- [ ] Font resolution failures are explicit.

## Weekday Row Resize

- [ ] Main Weekday Row boundary can be dragged.
- [ ] Live resize updates Layout Engine output.
- [ ] Date Grid always uses remaining Main height.
- [ ] Date rows remain equal.
- [ ] Main View dimensions remain fixed.
- [ ] One resize gesture creates one history entry.

## Undo / Redo

- [ ] Undo button works.
- [ ] Redo button works.
- [ ] Cmd/Ctrl+Z works outside text inputs.
- [ ] Shift+Cmd/Ctrl+Z works outside text inputs.
- [ ] Native input undo is not stolen.
- [ ] Redo history clears appropriately after a new document edit.
- [ ] History order matches meaningful user actions.

## Rendering

- [ ] Editor uses production Layout Engine.
- [ ] Editor uses production Outlined SVG pipeline.
- [ ] Editor overlay is separate from exported SVG.
- [ ] SVG Materializer contains no editor logic.
- [ ] Existing Phase 3 Outlined export still works after edited templates.
- [ ] One Figma regression spot check passes.

## Main / Mini

- [ ] Main Template edits do not change Mini Template.
- [ ] Mini Template edits do not change Main Template.
- [ ] Editor can switch between Main and Mini.
- [ ] Switching does not alter document history.

## Architecture

- [ ] Domain does not import Editor.
- [ ] Layout does not import Editor/Zustand/zundo.
- [ ] SVG Renderer does not import Editor.
- [ ] Production code does not import Spike.
- [ ] No general vector-editor abstraction was introduced.
- [ ] No 13-page Preview, Dexie, ZIP, cloud, or collaboration functionality was added.

## Verification

- [ ] Phase 4 tests pass.
- [ ] Phase 3 tests remain green.
- [ ] Phase 2 tests remain green.
- [ ] Phase 1 tests remain green.
- [ ] Rendering Spike tests remain green.
- [ ] `npm run build` succeeds.
- [ ] GitHub Pages interaction check passes.
- [ ] User manual Editor validation passes.

## Decision

If all required semantic editing, interaction, history, rendering-regression, and architecture checks pass:

```text
Phase 4 — Template Editor
→ ACCEPT
→ Proceed to Phase 5 — Full-year Page Preview
```

If selection semantics, drag history, Anchor behavior, Inspector global scope, or production rendering boundaries fail:

```text
Phase 4
→ REJECT
→ Fix Editor behavior before adding the 13-page Preview
```
