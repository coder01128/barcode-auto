# CLAUDE.md — BarcodeAuto

## Project Overview

BarcodeAuto is a client-side web app that converts spreadsheets into print-ready thermal barcode label PDFs. React/Vite stack, deployed on GitHub Pages (`coder01128/barcode-auto`). Part of the darKLoud digitAI (DLD) product portfolio.

Local path: `C:\ccode\git-repos\barcode-auto`

## Aesthetic

- Dark theme: background `#2D2D2D`, surface cards slightly lighter
- Gold accent: `#FFD700` — used for active states, highlights, buttons, progress indicators
- Font: Inter
- Privacy badge: green border, shield icon, "All processing happens in your browser"
- All buttons must be visually obvious — gold border or gold background, with hover states. No unstyled text-only CTAs.

## Architecture

- React + Vite
- Single-page app with a step wizard (Upload → Columns → Dimensions → Layout → Generate)
- Spreadsheet parsing: SheetJS (xlsx)
- Barcode rendering: JsBarcode (EAN-13, Code 128, UPC-A, Code 39). Linear only — there is no QR support and no QR library
- PDF generation: jsPDF
- 100% client-side — zero server calls, zero data uploads. This is a hard rule. Never add fetch/API calls to external services.

## Hard Rules

1. **No server calls.** All processing is browser-only. Never introduce backend dependencies, API calls, or external data transmission. The privacy promise ("No data uploaded to servers") is a core trust feature.
2. **No git push to main.** Always work on feature branches. Branch naming: `feature/<name>` or `fix/<name>`.
3. **No package installs without asking.** Don't add new npm dependencies unless the task explicitly requires it and there's no way to achieve it with existing deps.
4. **No Vercel CLI.** This app deploys via GitHub Pages, not Vercel.
5. **Don't touch base64 strings.** If any base64-encoded assets exist in the codebase, leave them untouched.
6. **Preserve the existing wizard flow.** Steps 1–5 must continue to work exactly as before. New features are additive — prepend or append, don't restructure the core wizard unless explicitly told to.
7. **Gold buttons, always.** Every primary action button must have a gold (#FFD700) border or background with a hover state. No invisible/unstyled CTAs anywhere in the app.

## Free Tier

The app has a free tier of 1,000 labels. A counter in the top-right shows remaining labels. This is tracked in localStorage. Don't modify this logic unless explicitly asked.

## Barcode Formats Supported

- EAN-13 (default)
- Code 128
- UPC-A
- Code 39

QR Code was listed here and in the UI but was never implemented — it silently
rendered a Code 128 linear barcode. Removed. Adding it would need a new
dependency and 2D rendering in both the PDF and preview paths.

## File Structure (key paths)

```
barcode-auto/
├── src/              # React components and app logic
├── public/           # Static assets
├── index.html        # Entry point
├── package.json      # Dependencies
├── vite.config.js    # Vite configuration
├── BarcodeAuto_PRD_v1.docx  # Original product requirements
└── CLAUDE.md         # This file
```

## Testing Checklist (run after any change)

- [ ] Splash popup appears on first visit, respects "don't show again"
- [ ] "I already have barcodes" path → existing 5-step flow works unchanged
- [ ] Barcode generator path → upload → column pick → format pick → preview → download
- [ ] Downloaded spreadsheet has correct GENERATED_BARCODE column
- [ ] EAN-13 check digits are mathematically valid
- [ ] No duplicate barcodes in output
- [ ] All buttons across all steps are visually highlighted (gold border/bg + hover)
- [ ] Free tier label counter still works
- [ ] "All processing in browser" remains true — no network requests added
- [ ] Dark/gold aesthetic is consistent, no style regressions
