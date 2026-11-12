# Font loading and preview recovery

Font resources remain character subsets. Collect actual project text over the
formal 13 Main + 15 Mini months, including custom labels and holiday names.
Main and Mini editor views resolve their own requirements independently.

## Font choices

All inspector font family, weight and style choices go through
`FontSelectionContext` and `FontSelectionRequest` before committing the document.
Preparation downloads and parses the requested face and validates its required
characters. Failure leaves the current font and undo history unchanged. Users
can retry, cancel or choose another face. Only the latest pending choice may
commit. Document/selection/year/project changes and holiday-library updates
invalidate pending work. Local font acquisition also rejects stale completions.

## Shared resources

`resolveFonts` owns bounded in-memory parsed-face caching, in-flight sharing,
canonical subset keys and persistent byte caching. Larger cached subsets can
satisfy smaller requests. Failed promises are evicted; corrupt persistent entries
are deleted and fetched again. Remote downloads have a 15-second deadline.

`resolvePreviewFontEngine` explicitly reports substitutions. It tries the
requested face, then a valid previous face for that element, then the bundled
Noto Sans SC Regular preview font. Both measurement and outlines use that same
actual face. Substitution does not modify the document. Missing characters in the
substitute are errors, never silent missing-glyph rendering.

The bundled font is an approximately 8 MB, lazy-loaded same-origin asset, with
its OFL notice shipped in `public/licenses`. It avoids depending on Google Fonts
for recovery. It does not provide offline application installation: the app and
its bundled asset must still be accessible or cached by the browser.

## Atomic previews and export

`usePreviewResource` accepts only the latest complete asynchronous result and
retains the last successful result on failure. Layout, font outlines and assets
must finish before replacing the preview. Errors remain retryable.

Editor snapshots keep scene and SVG together, with bounded separate Main/Mini
month entries. Drag frames keep their overlay mounted; replacing a font pauses
canvas interaction until the matching SVG is ready. Gallery snapshots also keep
page definitions, geometry and background together. App project keys reset all
preview and font-selection history when switching projects.

Formal export uses only strict `resolveFontEngine`; preview substitutes cannot
silently enter the exported 28 SVG files. Failed faces are reported and the
existing export button can retry.

## Verification

Resource tests exercise real bundled font metrics and outlines, Chinese/Japanese
and ASCII coverage, unsupported characters, strict export failure, cached subsets,
in-flight deduplication, corrupt cache recovery and retry. Selection and shared
asynchronous-resource tests cover supersession, cancellation, unchanged history
on failure and retention of complete results. Browser validation remains manual.
