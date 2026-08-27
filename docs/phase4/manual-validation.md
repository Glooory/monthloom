# Monthloom Phase 4 Manual Validation

## Environment

- Browser: Chrome / Safari / Edge
- OS: macOS
- Build: `npm test` passing, `npm run build` passing

## Automated Verification Matrix

| Area | Component / File | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Document Store** | `src/editor/state/documentStore.test.ts` | PASS | Undo / redo history tracks canonical document; replaceDocument clears history |
| **Semantic Bindings** | `src/editor/model/templateBindings.test.ts` | PASS | All 11 positionable semantic IDs, typography, calendar colors, grid borders, markers, dots round-trip without side-effects |
| **Hit Targets** | `src/editor/selection/hitTargets.test.ts` | PASS | Typography bounds, image bounds, dot bounds, 12x12 min interactive hitbox |
| **Effective Document** | `src/editor/model/effectiveDocument.test.ts` | PASS | Transient drag & weekday resize derivation without canonical mutation |
| **Anchor Change** | `src/editor/interaction/anchorChange.test.ts` | PASS | Position preserves visual bounds when changing anchor |
| **Pointer Delta** | `src/editor/interaction/pointerDelta.test.ts` | PASS | Client pixel delta converts to scene-space delta based on preview scale |
| **Drag Gesture** | `src/editor/interaction/drag.test.ts` | PASS | 10 transient pointermove updates followed by single commit produces exactly one Undo step |
| **Weekday Resize** | `src/editor/interaction/weekdayResize.test.ts` | PASS | Height calculation with boundary clamping and commit helper |
| **Keyboard Shortcuts**| `src/editor/interaction/keyboardShortcuts.test.ts` | PASS | Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z (redo), input fields excluded |
| **Memory Asset Store**| `src/editor/assets/memoryAssetStore.test.ts` | PASS | In-memory image file upload and resolution conforming to BinaryAssetResolver |

---

## Human Verification Checklist

### 1. Semantic Selection
- [ ] Click Date "1" vs Date "31" — Inspector shows "Date Template" for both, editing modifies all dates simultaneously.
- [ ] Click Weekday ("Sun", "Mon", etc.) — Inspector shows "Weekday Row".
- [ ] Click China Holiday Name ("劳动节", "端午节") — Inspector shows "China Holiday Name".
- [ ] Click Japan Holiday Name ("憲法記念日", "こどもの日") — Inspector shows "Japan Holiday Name".
- [ ] Click China Holiday / Workday Marker ("休", "班") — Inspector shows "China Holiday Marker" / "China Workday Marker".
- [ ] Switch to Mini Template: Click Month Label, Weekday, Date, Holiday Dot, Workday Dot.

### 2. Drag & Anchor
- [ ] Drag Date element: anchor remains unchanged, offset changes, all date instances move simultaneously in real time.
- [ ] Undo once restores Date position.
- [ ] Click any of the 9 Anchor points in the visual cell: visual bounds remain approximately in place while anchor changes.

### 3. Inspector
- [ ] Offset X / Offset Y: numeric input with local draft, commits on blur/Enter, discards on Escape.
- [ ] Typography: edit font family, weight, style, font size, letter spacing, opacity.
- [ ] Date Colors: Default, Sunday, Saturday, Japan Holiday palettes update date colors without changing base text colors.
- [ ] Main Grid Border: width and color update border live.
- [ ] Marker: toggle text vs image, upload image file in memory, update width/height.
- [ ] Mini Dot: change size (diameter), color, opacity.

### 4. Main Weekday Row Resize
- [ ] Drag horizontal resize handle below weekday row: weekday row height changes, Date Grid recalculates height to fit remaining space with equal rows.
- [ ] Undo once restores original height.

### 5. Main / Mini Isolation
- [ ] Modify Main Date font size: Mini Date remains unchanged.
- [ ] Modify Mini Date position: Main Date remains unchanged.

### 6. Undo / Redo
- [ ] Toolbar Undo / Redo buttons enable/disable reactively.
- [ ] Cmd/Ctrl + Z and Cmd/Ctrl + Shift + Z work globally.
- [ ] Text inputs preserve native undo without triggering whole-document undo.
