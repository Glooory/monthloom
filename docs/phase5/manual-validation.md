# Monthloom Phase 5 Manual Validation

## Environment

- Browser:
- OS:
- Git commit:
- Local URL: http://localhost:5173/

## Page Count / Months

- 13 pages (single vertical flow): PASS/FAIL
- First page = 2027-1: PASS/FAIL
- Last page = 2028-1: PASS/FAIL
- Final Previous Mini = 2027-12: PASS/FAIL
- Final Next Mini = 2028-2 (leap-year February): PASS/FAIL
- Formal Mini sequence is 15 (includes 2028-2 in formal scope): PASS/FAIL

## Page Layout

- Page Width / Height configurable: PASS/FAIL
- Padding configurable: PASS/FAIL
- Left Column Ratio configurable: PASS/FAIL
- Column Gap configurable: PASS/FAIL
- Mini Height Ratio configurable: PASS/FAIL
- Mini Gap configurable: PASS/FAIL
- Main scales uniformly based on available width: PASS/FAIL
- Mini scales uniformly with contain centered in slot: PASS/FAIL
- Overflow warnings surfaced (main-height-overflow / mini-stack-overflow): PASS/FAIL

## Background

- Upload background image: PASS/FAIL
- Preserves aspect ratio with object-fit cover: PASS/FAIL
- Centered crop: PASS/FAIL
- Page canvas clips overflow: PASS/FAIL
- Clear background resets to clean background: PASS/FAIL
- Formal Main/Mini SVG unaffected by background: PASS/FAIL

## Template Propagation

- Main edit in Editor updates all 13 pages after commit (pointerup/Enter/blur): PASS/FAIL
- Mini edit in Editor updates all 15 mini uses after commit: PASS/FAIL
- Main and Mini templates remain independent: PASS/FAIL
- Drag is live only in Editor canvas until pointerup commit: PASS/FAIL

## Rendering Reuse

- Main documents generated = exactly 13: PASS/FAIL
- Unique Mini documents generated = exactly 15: PASS/FAIL
- One shared full-year font engine resolved: PASS/FAIL
- Position/color-only edits cause no Google Fonts refetch: PASS/FAIL

## Holiday Boundary

- Adjacent Main holiday state renders: PASS/FAIL
- Previous December Mini works (2026-12): PASS/FAIL
- Next January Mini works (2028-1): PASS/FAIL
- Next February Mini works (2028-2): PASS/FAIL
- Coverage diagnostic banner displays: PASS/FAIL

## Regression

- Editor selection, drag, and anchor changes still work: PASS/FAIL
- Undo/Redo still works: PASS/FAIL
- Main & Mini outlined SVG rendering works: PASS/FAIL
- Production build succeeds: PASS/FAIL

## Performance

- Vertical scrolling through 13 pages is smooth and responsive: PASS/FAIL
- No obvious browser freeze after committed template edit: PASS/FAIL
- No repeated runaway font requests in Network tab: PASS/FAIL

## Decision

- [ ] ACCEPT — proceed to Phase 6
- [ ] REJECT — revise Phase 5
