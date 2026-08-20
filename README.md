# BarcodeAuto

Convert spreadsheet stock lists into print-ready thermal barcode label PDFs. Upload a `.csv` or `.xlsx`, map columns to barcode fields, set label dimensions for your printer, and download a PDF — all in the browser. Nothing is uploaded to a server.

**Live:** [barcode-auto.vercel.app](https://barcode-auto.vercel.app/)

## What it does

1. **Upload** — drop a spreadsheet (CSV, XLSX, XLS). Encoding is auto-detected, including UTF-8 and legacy codepages.
2. **Map columns** — pick which columns hold the barcode value, product name, price, and size.
3. **Validate** — every barcode is checked against its symbology's rules (digit count, check digits, character sets). Malformed codes are flagged before they reach the printer, not after.
4. **Set dimensions** — choose label width, height, and gap to match your thermal roll.
5. **Generate** — download a print-ready PDF laid out for your label printer.

Supports EAN-13, Code 128, UPC-A, and Code 39. Linear symbologies only.

## Why it exists

Built for a fashion retail business that was running a 30-minute Bartender / LibreOffice / manual-edit workflow every time new stock arrived. BarcodeAuto replaced it with a sub-minute automated path and catches barcode errors before printing rather than after.

## Architecture

React + Vite single-page app. Everything runs client-side — no server calls, no data uploads. The privacy promise is a hard rule, not a convenience.

Key libraries: SheetJS (spreadsheet parsing), JsBarcode (barcode rendering), jsPDF (PDF output).

The source is organised as:

* `src/components/` — UI: wizard steps, validation gate, barcode generator
* `src/utils/` — PDF generation, barcode rendering, validation logic, layout engine

## Run locally

```
npm install
npm run dev
```

Dev server starts at http://localhost:5173

## Deploy

Deployed to Vercel. Push to `main` triggers a production build.
