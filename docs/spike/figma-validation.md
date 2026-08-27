# Monthloom Rendering Spike — Figma Validation

## Environment

- Browser: Chrome / Vite React local dev environment
- OS: macOS
- Figma: [Pending Manual Verification]
- Git commit: HEAD

## Google Fonts

- CSS fetch (Noto Sans JP + Noto Sans SC): PASS
- Font binary fetch (both JP and SC): PASS
- fontkit parse (multi-font pipeline): PASS
- CJK glyph paths (Simplified Chinese "春节"/"假" via Noto Sans SC, Japanese "憲法記念日"/"文化の日" via Noto Sans JP): PASS (0 `.notdef` missing glyphs)

## Browser Preview / Export

- Shared AST verified: PASS
- 700 × 500 dimensions: PASS
- Embedded image offline: PASS (self-contained 20×20 PNG badge)

## Figma Import

| Stroke | Size | Grid | Text | Image | Result |
| --- | --- | --- | --- | --- | --- |
| 0.5 | 700 × 500 | Single-pass grid, stroke inset | Outlined upright paths (SC + JP) | Embedded PNG visible | Pending |
| 1 | 700 × 500 | Single-pass grid, stroke inset | Outlined upright paths (SC + JP) | Embedded PNG visible | Pending |
| 2 | 700 × 500 | Single-pass grid, stroke inset | Outlined upright paths (SC + JP) | Embedded PNG visible | Pending |

## Text Position Checks

| Text | Font | Browser | Figma | Result |
| --- | --- | --- | --- | --- |
| 1 | Noto Sans JP | Top-Left (Row 0, Col 0) | Match | Pending |
| 31 | Noto Sans JP | Top-Left (Row 4, Col 3) | Match | Pending |
| 春节 | Noto Sans SC | Center (Row 1, Col 2) | Match | Pending |
| 假 | Noto Sans SC | Top-Right (Row 1, Col 2) | Match | Pending |
| 憲法記念日 | Noto Sans JP | Bottom-Right (Row 2, Col 4) | Match | Pending |
| 文化の日 | Noto Sans JP | Top-Left + Offset (Row 3, Col 1) | Match | Pending |

## Issues & Resolutions

1. **Missing Glyph `.notdef` for Simplified Chinese in `Noto Sans JP`**:
   - *Issue*: `Noto Sans JP` does not contain the Simplified Chinese glyph "节" (U+8282), causing a `.notdef` box with an "X" to render.
   - *Resolution*: Updated pipeline to load `Noto Sans SC` for China holidays/markers and `Noto Sans JP` for Japan holidays. Verified 0 `.notdef` occurrences across all samples.
2. **Buffer Offset in PNG Base64 Data URI**:
   - *Issue*: Node Buffer pooling caused raw `ArrayBuffer` slice offset to leak extraneous bytes.
   - *Resolution*: Fixed `embedImage.ts` to strictly slice `byteOffset` to `byteLength`. Generated a clean 20×20 red circular badge icon.

## Decision

- [ ] ACCEPT — proceed to formal Monthloom implementation
- [ ] REJECT — revise technical design before proceeding
