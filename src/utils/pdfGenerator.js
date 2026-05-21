import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { scaleLayoutToLabel, autoScaleContent } from './layoutEngine'

export function generateLabelPdf({ rows, barcodeCol, barcodeType, layout, dimensions, qtyCol, useQty }) {
  const { width, height } = dimensions

  // Scale layout to actual label dimensions
  const scaledLayout = scaleLayoutToLabel(layout, dimensions)
  const { elements, fits } = autoScaleContent(scaledLayout, dimensions)

  const doc = new jsPDF({
    orientation: width >= height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [width, height],
  })

  // Expand rows by QTY if enabled
  let expandedRows = rows
  if (qtyCol && useQty) {
    expandedRows = []
    rows.forEach((row) => {
      const qty = parseInt(row[qtyCol], 10) || 1
      for (let i = 0; i < qty; i++) {
        expandedRows.push(row)
      }
    })
  }

  // Blank calibration page (page 1)
  doc.addPage([width, height])

  // Label pages
  expandedRows.forEach((row) => {
    doc.addPage([width, height])

    elements.forEach((el) => {
      if (el.type === 'text') {
        const text = String(row[el.column] ?? '')
        doc.setFontSize(el.fontSize)
        doc.setFont('helvetica', el.fontWeight === 'bold' ? 'bold' : 'normal')
        const lines = doc.splitTextToSize(text, el.width)
        doc.text(lines, el.x, el.y + el.fontSize * 0.35)
      } else if (el.type === 'barcode') {
        const barcodeValue = String(row[barcodeCol] ?? '')
        if (barcodeValue) {
          try {
            const canvas = document.createElement('canvas')
            const scaleFactor = 8
            canvas.width = Math.round(el.width * scaleFactor * 3)
            canvas.height = Math.round(el.height * scaleFactor * 3)

            JsBarcode(canvas, barcodeValue, {
              format: getJsBarcodeFormat(barcodeType),
              width: 3,
              height: Math.round((el.height * 0.75) * scaleFactor),
              displayValue: true,
              fontSize: 5 * scaleFactor,
              textMargin: 1 * scaleFactor,
              margin: 1 * scaleFactor,
              background: '#ffffff',
              lineColor: '#000000',
            })
            const dataUrl = canvas.toDataURL('image/png', 1.0)
            doc.addImage(dataUrl, 'PNG', el.x, el.y, el.width, el.height)
          } catch (e) {
            doc.setFontSize(10)
            doc.text(barcodeValue, el.x, el.y + 15)
          }
        }
      }
    })
  })

  // Remove empty page created by constructor (page 1), calibration stays as page 1
  if (doc.getNumberOfPages() > 1) {
    doc.deletePage(1)
  }

  return { doc, labelCount: expandedRows.length, rowCount: rows.length, fits }
}

function getJsBarcodeFormat(format) {
  const map = {
    ean13: 'EAN13',
    upca: 'UPC-A',
    code128: 'CODE128',
    code39: 'CODE39',
    qrcode: 'CODE128',
  }
  return map[format] || 'CODE128'
}
