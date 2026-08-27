# Monthloom Phase 7 — GitHub Pages Delivery + Final Product Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Monthloom as a production-ready static application on GitHub Pages, remove verification-only scaffolding from the primary product flow, harden deployment/runtime error boundaries, validate the complete real-user workflow from holiday import through 28-SVG export and recovery, and finish the product documentation/release gate.

**Architecture:** No new product subsystem is introduced. Phase 7 integrates the production modules from Phases 1–6 into one stable application shell, verifies Vite/GitHub Pages base-path correctness and browser-only persistence/resource behavior, runs CI gates before Pages deployment, and uses a final end-to-end acceptance matrix on the deployed origin. Verification harnesses may remain available to developers but must not be the normal product entry point.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, existing Phase 1–6 production modules, GitHub Actions, GitHub Pages. No new runtime dependency is expected.

**Spec:** `docs/superpowers/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- Phase 7 is a delivery/hardening phase, not a feature-expansion phase.
- Do not add a backend, cloud sync, accounts, collaboration, PNG/PDF export, Page Editor, arbitrary vector tools, or new persistence formats.
- Formal output remains exactly 13 Main + 15 Mini = 28 SVGs.
- `Y+1 February` remains a formal Mini output.
- Outlined SVG remains the default formal export mode.
- GitHub Pages remains the required deployment target.
- The production site must work from a repository subpath, not only from `/`.
- Do not hardcode application asset URLs to `/assets/...` or another root-only path.
- No secrets or private API keys may be required by the frontend.
- GitHub Pages deployment must build the application in CI and deploy the generated Vite `dist` artifact.
- Deployment must not publish source files as the site artifact.
- `npm test` and `npm run build` must pass before deployment.
- Existing production modules must not import verification harnesses.
- Production code must not import `src/spike/`.
- Verification pages/harnesses must not be the default application route/view.
- IndexedDB persistence remains origin-scoped; the final product must clearly expose `.monthloom` backup/import as the portable recovery mechanism.
- A font-cache failure is non-fatal; a required font-resolution failure is fatal to Outlined rendering/export and must be explicit.
- Missing/insufficient holiday coverage remains a warning; Monthloom never guesses missing holiday data.
- Corrupt Project/Template/`.monthloom` data must not partially mutate the current workspace.
- Final deployed checks must use the real GitHub Pages URL, not only `vite preview`.
- Preserve the corrected Mini scope everywhere: 15 Mini, 28 total files.

---

# 1. Target File / Configuration Areas

The exact existing app structure should be preserved. Phase 7 should primarily touch these areas:

```text
.github/
  workflows/
    deploy-pages.yml

src/
  app/
    App.tsx
    AppShell.tsx
    AppErrorBoundary.tsx
    app.css

  shared/
    runtime/
      assetUrl.ts
      assetUrl.test.ts
      errorMessage.ts
      errorMessage.test.ts

  workspace/
  editor/
  preview/
  persistence/
  export/
    # existing production modules only; modify only for final integration fixes

docs/
  user/
    getting-started.md
    backup-and-recovery.md
    holiday-json.md

  release/
    2026-08-27-monthloom-final-validation.md

README.md
vite.config.ts
package.json
```

If the repository already has equivalent files/components, modify them instead of creating duplicate shells.

---

# Task 1: Audit the Current Production Entry Point and Verification Scaffolding

**Files:**
- Create: `docs/release/2026-08-27-phase7-entrypoint-audit.md`
- Inspect current `src/main.*`, `src/App.*`, verification entry points, and app composition.

**Interfaces:**
- Produces an inventory separating:
  - production product flow
  - verification/developer-only flow
  - dead/temporary scaffolding

- [ ] **Step 1: Identify the actual browser entry point**

Record:

```text
main.tsx/main.ts
→ root React component
→ current production/verification view
```

- [ ] **Step 2: Inventory verification harnesses**

Search:

```bash
find src -maxdepth 4 -type f | grep -E "verification|spike|Phase[0-9]Verification" || true
```

Record whether each is:

```text
still useful for developer regression
or
safe to remove
```

- [ ] **Step 3: Search production imports of verification/spike code**

Run:

```bash
grep -RIn \
  -e "verification/" \
  -e "src/spike" \
  -e "/spike/" \
  src \
  --exclude-dir=verification \
  --exclude-dir=spike || true
```

Expected final state:

```text
production application/modules do not depend on verification or Spike code
```

- [ ] **Step 4: Identify the complete intended production screen flow**

The audit must confirm the application exposes, directly or through simple panels:

```text
Target Year
Holiday JSON Import
Main/Mini Template Editor
Page Preview Settings / Background
13-page Full-year Preview
Project/Template Persistence
.monthloom Backup/Import
28-SVG Batch Export
```

- [ ] **Step 5: Record missing integration only**

Do not redesign working features.

The audit note lists only actual wiring/usability gaps preventing the above flow.

- [ ] **Step 6: Commit audit**

```bash
git add docs/release/2026-08-27-phase7-entrypoint-audit.md
git commit -m "docs: audit final production entry point"
```

---

# Task 2: Assemble One Production Application Shell

**Files:**
- Create/modify:
  - `src/app/App.tsx`
  - `src/app/AppShell.tsx`
  - `src/app/app.css`
  - root entry file

**Interfaces:**
- Product flow should be visible in one coherent application without a router requirement.

Suggested top-level order:

```text
Header / Project identity

Workspace
- Target Year
- China Holiday JSON
- Japan Holiday JSON
- Diagnostics

Template Editor
- Main / Mini

Page Preview Settings
- Background / Page Layout

Full-year Preview
- 13 pages

Persistence
- Project
- Template
- .monthloom

Export
- Outlined / Editable
- Export 28 SVGs
```

- [ ] **Step 1: Use existing production components**

Do not duplicate Editor, Preview, Persistence, or Export UI.

- [ ] **Step 2: Remove verification harness from default entry**

Default load must show the real product.

Verification harness may remain behind developer-only source code or a non-default development switch if already useful.

Do not add production router complexity solely to preserve harnesses.

- [ ] **Step 3: Keep workspace identity coherent**

The header should show enough state to know:

```text
current project name or Unsaved
target year
```

Do not create new account/workspace concepts.

- [ ] **Step 4: Add simple section hierarchy**

This is not a visual redesign phase.

Use readable spacing/headings and preserve existing editor interaction dimensions.

- [ ] **Step 5: Add product-shell smoke test**

Render the production app with repositories/resource dependencies substituted as existing test helpers allow.

Assert primary controls/sections are reachable.

- [ ] **Step 6: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app src/main.tsx src
git commit -m "feat: assemble final monthloom application"
```

Stage only actually modified files.

---

# Task 3: Harden Vite Base-path and Static Asset Resolution

**Files:**
- Modify: `vite.config.ts`
- Create if useful:
  - `src/shared/runtime/assetUrl.ts`
  - `src/shared/runtime/assetUrl.test.ts`
- Modify any root-hardcoded application asset references.

**Interfaces:**
- Production build must work when served from:

```text
https://<user>.github.io/<repo>/
```

rather than only:

```text
https://<user>.github.io/
```

- [ ] **Step 1: Inspect git remote / deployment target**

Determine repository name from:

```bash
git remote -v
```

Do not guess if the repository metadata is available locally.

- [ ] **Step 2: Set Vite `base` correctly**

For repository Pages:

```text
/<repo>/
```

For a user/org root Pages repo or configured custom domain:

```text
/
```

Follow the actual repository deployment target.

- [ ] **Step 3: Search root-hardcoded asset URLs**

Run:

```bash
grep -RIn \
  -e 'src="/' \
  -e "src='/" \
  -e 'href="/' \
  -e "href='/" \
  -e 'fetch("/' \
  -e "fetch('/" \
  -e 'url(/' \
  src public index.html || true
```

Review every result.

- [ ] **Step 4: Fix JS runtime public-resource paths**

Where JS/TS must reference a public asset, derive it from:

```ts
import.meta.env.BASE_URL
```

or import the asset through Vite when appropriate.

Do not concatenate application URLs into persisted asset IDs.

- [ ] **Step 5: Preserve uploaded asset semantics**

IndexedDB asset IDs remain logical IDs.

Do not rewrite them to GitHub Pages URLs.

- [ ] **Step 6: Add asset/base-path unit tests where pure helper code exists**

Example:

```text
base = /monthloom/
relative = phase3-marker.png
→ /monthloom/phase3-marker.png
```

- [ ] **Step 7: Build and inspect `dist`**

Run:

```bash
npm run build
```

Search built output for suspicious root-only references if practical:

```bash
grep -RIn '"/assets/' dist || true
```

Review results in context rather than assuming every match is invalid.

- [ ] **Step 8: Commit**

```bash
git add vite.config.ts src index.html
git commit -m "fix: support github pages base path"
```

---

# Task 4: Add Final Application-level Error Boundaries and Status Surfaces

**Files:**
- Create/modify:
  - `src/app/AppErrorBoundary.tsx`
  - `src/shared/runtime/errorMessage.ts`
  - tests
- Reuse existing feature-specific diagnostics.

**Interfaces:**
- Production must distinguish:
  - recoverable warning
  - blocking operation error
  - unexpected application render error

- [ ] **Step 1: Keep known domain warnings in existing surfaces**

Examples:

```text
holiday coverage gaps
missing holiday dataset
page layout overflow
font cache write failure
```

Do not convert warnings into fatal app errors.

- [ ] **Step 2: Ensure blocking action errors remain local**

Examples:

```text
invalid holiday JSON
failed project load
invalid .monthloom
font resolution failure
asset resolution failure
ZIP export failure
```

User must receive an explicit message and retain current valid workspace state.

- [ ] **Step 3: Add React application error boundary**

For an unexpected render exception:

```text
show concise failure UI
offer Reload
do not claim data was deleted
```

Do not attempt automatic IndexedDB mutation/recovery.

- [ ] **Step 4: Normalize unknown thrown values**

Implement a helper that safely converts:

```text
Error
string
unknown object
```

into displayable text.

- [ ] **Step 5: Add tests**

Cover:

```text
invalid bundle/import leaves existing workspace unchanged
unexpected render error displays fallback
known warning does not replace app shell
```

- [ ] **Step 6: Run tests/build**

```bash
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app src/shared/runtime
git commit -m "feat: harden application error handling"
```

---

# Task 5: Add CI Quality Gate Before GitHub Pages Deployment

**Files:**
- Create/modify: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Workflow triggers:

```text
push to main/default production branch
workflow_dispatch
```

- Build job must execute:

```text
checkout
setup Node
npm ci
npm test
npm run build
configure Pages
upload ./dist
```

- Deploy job uses uploaded Pages artifact.

- [ ] **Step 1: Inspect current default branch and existing workflows**

Do not create a second conflicting Pages workflow.

- [ ] **Step 2: Use current Node LTS**

Use:

```yaml
node-version: lts/*
cache: npm
```

unless the repository already pins a supported Node version for a concrete reason.

- [ ] **Step 3: Require tests before build artifact upload**

Order:

```text
npm ci
npm test
npm run build
```

If tests fail:

```text
do not upload/deploy
```

- [ ] **Step 4: Configure Pages permissions**

Workflow/deploy job requires:

```yaml
contents: read
pages: write
id-token: write
```

- [ ] **Step 5: Upload only `./dist`**

Do not upload the repository root.

- [ ] **Step 6: Use official Pages artifact/deployment actions**

Use the currently supported major versions consistent with current GitHub/Vite documentation.

- [ ] **Step 7: Add deployment concurrency**

Use one Pages concurrency group to avoid overlapping stale deployments.

- [ ] **Step 8: Validate workflow syntax locally as far as practical**

At minimum inspect YAML and ensure build commands match `package.json`.

- [ ] **Step 9: Commit**

```bash
git add .github/workflows
git commit -m "ci: deploy monthloom to github pages"
```

---

# Task 6: Verify Production Build Locally from the Built Artifact

**Files:**
- No production code unless an issue is discovered.
- Update final validation doc.

**Interfaces:**
- Uses:

```bash
npm run build
npm run preview
```

`vite preview` is only a local production-build check, not final deployment evidence.

- [ ] **Step 1: Start from clean install if practical**

Run:

```bash
npm ci
npm test
npm run build
```

- [ ] **Step 2: Serve the built application**

Use repository's existing preview script, normally:

```bash
npm run preview
```

- [ ] **Step 3: Smoke-test production bundle**

Check:

```text
App loads
no blank screen
fonts resolve
IndexedDB opens
Editor opens
13-page Preview renders
Persistence panel loads
Export panel loads
```

- [ ] **Step 4: Inspect browser console**

Expected:

```text
no uncaught exception
no repeated 404 application assets
no base-path asset failure
```

- [ ] **Step 5: Fix only actual production-build regressions**

Do not add features.

- [ ] **Step 6: Run test/build again after fixes**

---

# Task 7: Deploy and Verify the Real GitHub Pages Origin

**Files:**
- Deployment workflow/config only if defects are found.
- Update validation doc.

**Interfaces:**
- The real deployed URL is the final static-origin acceptance environment.

- [ ] **Step 1: Push/merge Phase 7 deployment changes to the Pages branch/default branch**

Use normal repository process.

- [ ] **Step 2: Confirm Pages source is GitHub Actions**

Repository Settings → Pages:

```text
Source = GitHub Actions
```

- [ ] **Step 3: Confirm workflow succeeds**

Required gates:

```text
npm ci
npm test
npm run build
artifact upload
deploy
```

- [ ] **Step 4: Open the deployed Pages URL directly**

Do not rely on local preview.

- [ ] **Step 5: Hard refresh**

Confirm application still loads correctly from repository subpath.

- [ ] **Step 6: Inspect network for static 404s**

Pay particular attention to:

```text
JS/CSS chunks
public images
Google Fonts CSS/font binaries
```

- [ ] **Step 7: Inspect console**

No unexpected runtime/base-path exception.

- [ ] **Step 8: Record deployed URL and commit SHA in final validation doc**

---

# Task 8: Execute a Clean-origin First-use Workflow

**Files:**
- Update: `docs/release/2026-08-27-monthloom-final-validation.md`

**Interfaces:**
- Test from a clean browser profile/incognito-like storage context where practical.

- [ ] **Step 1: Open deployed Monthloom with no existing IndexedDB state**

Expected:

```text
application starts with usable defaults
no dependency on verification fixtures
```

- [ ] **Step 2: Set target year**

Use:

```text
2027
```

- [ ] **Step 3: Import real/representative China Holiday JSON**

Verify:

```text
entry count
coverage
calendar effects
```

- [ ] **Step 4: Import real/representative Japan Holiday JSON**

Verify same.

- [ ] **Step 5: Make representative Template edits**

At minimum:

```text
Main Date position
Main typography
Mini color
one marker
Page layout
Background
```

- [ ] **Step 6: Inspect 13-page Preview**

Verify:

```text
13 pages
last Main 2028-1
last Next Mini 2028-2
```

- [ ] **Step 7: Save Project and reusable Template**

Confirm both appear in local lists.

- [ ] **Step 8: Export Outlined ZIP**

Confirm:

```text
28 files
13 Main
15 Mini
mini/2028-2.svg exists
```

- [ ] **Step 9: Backup Project to `.monthloom`**

Save the bundle externally.

- [ ] **Step 10: Record PASS/FAIL for complete first-use workflow**

---

# Task 9: Execute Reload, Recovery, and Portability Workflow on Deployed Origin

**Files:**
- Validation doc only unless defects found.

- [ ] **Step 1: Full browser reload**

Load saved Project.

Verify:

```text
target year
holidays
templates
background
image marker
page layout
```

- [ ] **Step 2: Verify Undo history after load is clean**

Undo must not walk backward into the prior browser session.

- [ ] **Step 3: Clear Monthloom IndexedDB/site data**

Do this only after `.monthloom` backup exists.

- [ ] **Step 4: Reload deployed app**

Saved local Project should be gone, proving test isolation.

- [ ] **Step 5: Import the `.monthloom` bundle**

Verify Project/resources are restored.

- [ ] **Step 6: Import the same bundle a second time**

Verify duplicate import remains isolated and assets do not collide.

- [ ] **Step 7: Export 28 SVGs from the recovered Project**

Output should remain semantically equivalent to the pre-clear project.

- [ ] **Step 8: Record recovery PASS/FAIL**

This is a final product gate, not optional.

---

# Task 10: Final SVG/Figma Regression from the Deployed Product

**Files:**
- Validation doc only unless a renderer defect is found.

**Interfaces:**
- Use final ZIP produced by deployed GitHub Pages site.

- [ ] **Step 1: Inspect exact ZIP structure**

For target 2027:

```text
main = 13
mini = 15
total = 28
```

Boundary files:

```text
main/2027-1.svg
main/2028-1.svg
mini/2026-12.svg
mini/2028-1.svg
mini/2028-2.svg
```

- [ ] **Step 2: Open representative Outlined SVGs offline**

Check at least:

```text
main/2027-1.svg
main/2027-12.svg
main/2028-1.svg
mini/2026-12.svg
mini/2028-2.svg
```

- [ ] **Step 3: Verify self-contained resources**

No missing image marker when offline.

No Background in formal SVG.

- [ ] **Step 4: Import representative final ZIP files into Figma**

At minimum:

```text
one Main
one Mini
boundary next-year Mini if useful
```

- [ ] **Step 5: Check**

```text
exact dimensions
Grid/strokes
text position
CJK outlines
image marker
```

This is a spot regression, not a repeat of every Phase 3 case.

- [ ] **Step 6: Record Figma PASS/FAIL**

---

# Task 11: Final Network, Cache, and Performance Check

**Files:**
- Validation doc only unless defects found.

- [ ] **Step 1: Verify font cache on deployed origin**

Clean font cache once.

Perform an Outlined preview/export that requires fonts.

Expected first run:

```text
Google Fonts request(s)
```

Repeat unchanged.

Expected second run:

```text
no duplicate concrete font binary fetches if persistent cache is functioning
```

- [ ] **Step 2: Verify position/page-layout edits do not refetch fonts**

Change:

```text
Date offset
Border color
Page Padding
```

No new font binary fetch solely from these edits.

- [ ] **Step 3: Verify font edit does resolve changed face**

Change family/weight/style.

Expected:

```text
new concrete font request as required
```

- [ ] **Step 4: Scroll all 13 pages**

Acceptance:

```text
responsive enough for normal use
no obvious runaway rerender loop
no repeated network storm
```

- [ ] **Step 5: Perform one 28-file Outlined export**

Browser must remain usable.

Do not introduce Worker/virtualization unless a reproducible blocking problem is measured.

- [ ] **Step 6: Record observations**

No arbitrary FPS threshold required.

---

# Task 12: Write User-facing Documentation

**Files:**
- Create:
  - `docs/user/getting-started.md`
  - `docs/user/backup-and-recovery.md`
  - `docs/user/holiday-json.md`
- Modify: `README.md`

**Interfaces:**
- Documentation describes the actual production behavior only.

- [ ] **Step 1: Getting Started**

Document concise workflow:

```text
1. Open Monthloom
2. Set year
3. Import China/Japan holiday JSON
4. Edit Main/Mini
5. Optional background
6. Review 13 pages
7. Save Project/Template
8. Backup .monthloom
9. Export 28 SVGs
```

- [ ] **Step 2: Document exact output scope**

Explicitly:

```text
13 Main
15 Mini
28 total
```

Include `Y+1 February` Mini.

- [ ] **Step 3: Backup and Recovery**

Explain:

```text
IndexedDB is browser-local
clearing site data removes local projects/assets
.monthloom is the portable backup
Google font cache does not need to be backed up
```

- [ ] **Step 4: Holiday JSON**

Explain:

```text
expected China source format
expected Japan source format
coverage warnings
Monthloom does not guess holidays
```

Do not copy large third-party datasets.

- [ ] **Step 5: README**

Include:

```text
what Monthloom is
how to run locally
test/build commands
GitHub Pages deployment
where design/implementation docs live
```

- [ ] **Step 6: Search documentation for stale Mini counts**

```bash
grep -RIn \
  -e "14 Mini" \
  -e "27 SVG" \
  -e "Preview-only" \
  docs README.md || true
```

Correct active stale language.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/user
git commit -m "docs: add monthloom user guide"
```

---

# Task 13: Final Automated and Architecture Sweep

**Files:**
- Modify only actual issues discovered.

- [ ] **Step 1: Run full automated suite**

```bash
npm test
npm run build
```

Both must pass from a clean dependency installation environment.

- [ ] **Step 2: Verify corrected output scope**

Production tests must lock:

```text
Main = 13
Mini = 15
Total = 28
Y+1 February included
```

- [ ] **Step 3: Search obsolete requirement language**

```bash
grep -RIn \
  -e "14 Mini" \
  -e "14 mini" \
  -e "27 SVG" \
  -e "27 files" \
  -e "Export 27" \
  -e "Preview-only" \
  -e "getPreviewExtraMiniMonths" \
  src docs README.md || true
```

Any active occurrence is a release blocker.

Historical plan documents may retain superseded material only if clearly marked as historical/superseded.

- [ ] **Step 4: Verify no downward dependency leaks**

```bash
grep -R "dexie\|ProjectRepository\|TemplateRepository" \
  src/domain src/rendering || true

grep -R "editor/" \
  src/domain src/rendering/layout src/rendering/svg src/resources || true
```

- [ ] **Step 5: Verify no production Spike/verification dependency**

```bash
grep -RIn \
  -e "src/spike" \
  -e "/spike/" \
  -e "verification/" \
  src/app src/domain src/rendering src/resources src/editor \
  src/preview src/workspace src/persistence src/export || true
```

Review every match.

- [ ] **Step 6: Search accidental frontend secrets**

Search source/config for obvious secret patterns:

```bash
grep -RIn \
  -e "PRIVATE_KEY" \
  -e "SECRET_KEY" \
  -e "API_SECRET" \
  -e "GITHUB_TOKEN" \
  src .env* vite.config.* || true
```

`GITHUB_TOKEN` belongs only to GitHub Actions context if present there; no browser secret.

- [ ] **Step 7: Verify `dist` is not committed unless repository policy explicitly requires it**

GitHub Pages workflow should deploy the built artifact.

- [ ] **Step 8: Commit any final fixes**

Use focused commits by defect category rather than one unrelated cleanup dump.

---

# Task 14: Complete Final Release Validation Document

**Files:**
- Create/update: `docs/release/2026-08-27-monthloom-final-validation.md`

**Required structure:**

```markdown
# Monthloom Final Product Validation

## Build

- `npm ci`: PASS/FAIL
- `npm test`: PASS/FAIL
- `npm run build`: PASS/FAIL

## GitHub Pages

- Workflow: PASS/FAIL
- Deployed URL:
- Commit SHA:
- Base path: PASS/FAIL
- Static asset 404s: NONE / DETAILS
- Browser console errors: NONE / DETAILS

## First-use Workflow

- Target year: PASS/FAIL
- China Holiday import: PASS/FAIL
- Japan Holiday import: PASS/FAIL
- Template Editor: PASS/FAIL
- Background/Page layout: PASS/FAIL
- 13-page Preview: PASS/FAIL
- Project save: PASS/FAIL
- Template save: PASS/FAIL

## Persistence / Recovery

- Full reload recovery: PASS/FAIL
- Background recovery: PASS/FAIL
- Image Marker recovery: PASS/FAIL
- `.monthloom` backup: PASS/FAIL
- Clean-storage restore: PASS/FAIL
- Duplicate bundle import: PASS/FAIL

## Formal Export

- ZIP filename: PASS/FAIL
- Main = 13: PASS/FAIL
- Mini = 15: PASS/FAIL
- Total = 28: PASS/FAIL
- `mini/Y+1-2.svg`: PASS/FAIL
- Outlined offline: PASS/FAIL
- Editable sample: PASS/FAIL
- Background excluded: PASS/FAIL
- Image Marker embedded: PASS/FAIL

## Figma Spot Check

- Main size: PASS/FAIL
- Mini size: PASS/FAIL
- Grid: PASS/FAIL
- Text/CJK: PASS/FAIL
- Image Marker: PASS/FAIL

## Runtime

- Font cache: PASS/FAIL
- Position-only edit avoids font refetch: PASS/FAIL
- 13-page scrolling: PASS/FAIL
- 28-file export responsiveness: PASS/FAIL

## Documentation

- Getting Started: PASS/FAIL
- Backup/Recovery: PASS/FAIL
- Holiday JSON: PASS/FAIL
- No active 14/27/Preview-only language: PASS/FAIL

## Known Limitations

Record only actual remaining non-blocking limitations.

## Decision

- [ ] RELEASE ACCEPTED
- [ ] RELEASE BLOCKED
```

- [ ] **Step 1: Fill only observed evidence**

Do not mark a manual item PASS from unit tests alone.

- [ ] **Step 2: Classify defects**

```text
Release blocker
Non-blocking known limitation
Future enhancement
```

- [ ] **Step 3: Fix release blockers and rerun affected checks**

- [ ] **Step 4: Do not expand scope for future enhancements**

Examples that remain valid future work:

```text
PNG/PDF production output
cloud sync
Page Editor
advanced font browsing
performance Worker if later proven necessary
```

- [ ] **Step 5: Commit final validation evidence**

```bash
git add docs/release/2026-08-27-monthloom-final-validation.md
git commit -m "docs: record monthloom final release validation"
```

---

# Phase 7 / Final Release Acceptance Gate

## Deployment

- [ ] Production app is the default entry point.
- [ ] Verification harness is not the default product UI.
- [ ] Vite `base` matches actual GitHub Pages deployment path.
- [ ] GitHub Pages source uses GitHub Actions.
- [ ] CI runs tests before deployment.
- [ ] CI builds Vite production output.
- [ ] Pages deploys `dist`, not repository source.
- [ ] Real deployed URL loads after hard refresh.
- [ ] No broken JS/CSS/public assets from base-path mistakes.
- [ ] No frontend secrets are required.

## Product Workflow

- [ ] Clean user can set target year.
- [ ] China Holiday JSON can be imported.
- [ ] Japan Holiday JSON can be imported.
- [ ] Holiday diagnostics are understandable.
- [ ] Main Template Editor works.
- [ ] Mini Template Editor works.
- [ ] Background/Page Preview settings work.
- [ ] 13-page Preview works.
- [ ] Project persistence works.
- [ ] Template persistence works.
- [ ] `.monthloom` backup/import works.
- [ ] Batch export works.

## Correct Formal Output

- [ ] Main = 13.
- [ ] Mini = 15.
- [ ] Total = 28.
- [ ] `Y+1 February` Mini is present.
- [ ] No active code/test/UI/docs still implements 14/27/Preview-only February.
- [ ] Outlined remains default.
- [ ] Editable remains optional.

## Recovery

- [ ] Full refresh preserves saved local Project.
- [ ] Binary marker/background assets survive reload.
- [ ] Clearing site data removes local DB as expected.
- [ ] `.monthloom` restores the Project after clean storage.
- [ ] Duplicate imports do not collide.
- [ ] Invalid bundle/import does not partially mutate workspace.

## Rendering / Figma

- [ ] Final deployed Outlined ZIP opens offline.
- [ ] Main representative imports correctly into Figma.
- [ ] Mini representative imports correctly into Figma.
- [ ] Grid dimensions/strokes remain correct.
- [ ] English/number/CJK outlined text remains positioned correctly.
- [ ] Image Marker remains embedded.
- [ ] Background is not in formal SVG.

## Runtime

- [ ] No uncaught production error on normal flow.
- [ ] Required font failure is explicit.
- [ ] Font cache works as optimization.
- [ ] Non-font edits do not cause unnecessary font requests.
- [ ] 13-page scroll is usable.
- [ ] 28-file export is usable without measured need for Worker/virtualization.

## Architecture

- [ ] Domain remains independent from persistence/editor.
- [ ] Rendering remains independent from persistence/editor.
- [ ] Export reuses production rendering.
- [ ] Page Preview reuses production rendering.
- [ ] Production does not import Spike.
- [ ] Production does not depend on verification harnesses.
- [ ] No backend/cloud functionality was introduced.

## Documentation

- [ ] README matches current product.
- [ ] Getting Started matches deployed workflow.
- [ ] Backup/recovery limitations are clear.
- [ ] Holiday JSON behavior is documented.
- [ ] Correct 13/15/28 output scope is documented.

## Final Decision

If every release-blocking gate above passes:

```text
Phase 7 — GitHub Pages Delivery + Final Product Verification
→ ACCEPT

Monthloom v1
→ RELEASE ACCEPTED
```

If deployment, recovery, corrected 28-file export, or final Figma self-contained SVG behavior fails:

```text
RELEASE BLOCKED
```

Fix the specific defect and rerun the affected final validation path. Do not add unrelated features during release hardening.
