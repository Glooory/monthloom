# Monthloom

**Monthloom** is a client-side web application for generating, previewing, and batch-exporting production-grade vector calendar SVGs.

Built for precision calendar design, Monthloom features customizable Main and Mini calendar layouts, Google Fonts glyph outlining, China & Japan holiday integration, multi-page stream preview, and robust local persistence with `.monthloom` portable backups.

---

## Features

- **Full-Year Output Scope**: Generates exactly **28 standalone SVGs** (13 Main months + 15 Mini months, including $Y+1$ February).
- **Template Editor**: Interactive canvas for both Main and Mini calendar templates with anchor alignments, typography, colors, borders, and image markers.
- **Holiday System**: Native support for China (Timor/NianJia format with workday shift overrides) and Japan (Holidays JP format) with real-time coverage diagnostics.
- **Font Engine & Glyph Outlining**: Google Fonts integration with Fontkit outline extraction, ensuring SVGs render with 100% vector fidelity even offline and in Figma.
- **13-Page Full-Year Preview**: Real-time streaming preview of the entire 13-page calendar with configurable background image, margins, and padding.
- **Browser-Native Persistence**: Local project and template storage in IndexedDB, plus portable `.monthloom` zip backup/restore with zero backend required.
- **Batch Export**: Instant client-side generation of `Monthloom-<Year>.zip` with clean directory structure (`main/` and `mini/`).

---

## Getting Started

### Local Development

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Run full test suite
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Documentation

- [Getting Started Guide](docs/user/getting-started.md)
- [Backup and Recovery](docs/user/backup-and-recovery.md)
- [Holiday JSON Formats](docs/user/holiday-json.md)
- [Technical Design Spec](docs/specs/2026-08-27-monthloom-technical-design.md)
- [Release Validation](docs/release/2026-08-27-monthloom-final-validation.md)

---

## GitHub Pages Deployment

Monthloom is automatically tested and deployed to GitHub Pages on every push to `main` via GitHub Actions.

Production URL: `https://glooory.github.io/monthloom/`

---

## License

MIT
