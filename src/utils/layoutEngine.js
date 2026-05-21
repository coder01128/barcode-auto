const SAFE = 3
const PT_TO_MM = 0.3528

function getStyle(col, styles) {
  const s = styles?.[col] || {}
  return { isBold: s.isBold || false, isLarge: s.isLarge || false }
}

export function scaleLayoutToLabel(layout) {
  return layout
}

export function autoScaleContent(layout) {
  return { elements: layout.elements, fits: true }
}

const LAYOUT_TEMPLATES = [
  {
    id: 'stacked',
    name: 'Stacked',
    description: 'Barcode bottom, text stacked above',
    key: 'stacked',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Minimal: barcode + 2 key fields',
    key: 'compact',
  },
  {
    id: 'price-tag',
    name: 'Price Tag',
    description: 'Barcode top, price prominent, details below',
    key: 'price-tag',
  },
]

function fitFont(fontSizePt, numFields, availHeight, minLineSpacing) {
  let font = fontSizePt
  let lineH = Math.max(font * PT_TO_MM * 1.3, minLineSpacing)

  for (let i = 0; i < 20; i++) {
    const needed = (numFields - 1) * lineH + font * PT_TO_MM
    if (needed <= availHeight || font <= 5) break
    font = Math.max(font - 0.5, 5)
    lineH = Math.max(font * PT_TO_MM * 1.3, minLineSpacing)
  }

  return {
    fontSizePt: Math.round(font * 10) / 10,
    lineH: Math.round(lineH * 10) / 10,
  }
}

function generateStacked(fields, barcodeCol, columnStyles, dims) {
  const elements = []
  const textFields = fields.filter(f => f !== barcodeCol)
  const numFields = textFields.length
  const availW = dims.width - SAFE * 2
  const availH = dims.height - SAFE * 2

  const barcodeH = Math.max(6, Math.min(availH * 0.45, 18))
  const barcodeY = dims.height - SAFE - barcodeH
  const textAvailH = barcodeY - SAFE - 1
  const maxFont = Math.min(7 * (dims.height / 30), 12)
  const { fontSizePt, lineH } = fitFont(maxFont, numFields, textAvailH, 3.5)

  textFields.forEach((f, i) => {
    const { isBold } = getStyle(f, columnStyles)
    elements.push({
      type: 'text',
      column: f,
      x: SAFE,
      y: SAFE + i * lineH,
      fontSize: fontSizePt,
      fontWeight: isBold ? 'bold' : 'normal',
      width: availW,
      align: 'left',
    })
  })

  elements.push({
    type: 'barcode',
    column: barcodeCol,
    x: SAFE,
    y: barcodeY,
    width: availW,
    height: barcodeH,
  })

  return { elements, id: 'stacked' }
}

function generateCompact(fields, barcodeCol, columnStyles, dims) {
  const elements = []
  const textFields = fields.filter(f => f !== barcodeCol).slice(0, 2)
  const numFields = textFields.length
  const availW = dims.width - SAFE * 2
  const availH = dims.height - SAFE * 2

  const barcodeH = Math.max(6, Math.min(availH * 0.45, 18))
  const barcodeY = dims.height - SAFE - barcodeH
  const textAvailH = barcodeY - SAFE - 1
  const maxFont = Math.min(7 * (dims.height / 30), 12)
  const { fontSizePt, lineH } = fitFont(maxFont, numFields, textAvailH, 3.5)

  textFields.forEach((f, i) => {
    const { isBold } = getStyle(f, columnStyles)
    elements.push({
      type: 'text',
      column: f,
      x: SAFE,
      y: SAFE + i * lineH,
      fontSize: fontSizePt,
      fontWeight: isBold ? 'bold' : 'normal',
      width: availW,
      align: 'left',
    })
  })

  elements.push({
    type: 'barcode',
    column: barcodeCol,
    x: SAFE,
    y: barcodeY,
    width: availW,
    height: barcodeH,
  })

  return { elements, id: 'compact' }
}

function generatePriceTag(fields, barcodeCol, columnStyles, dims) {
  const elements = []
  const textFields = fields.filter(f => f !== barcodeCol)
  const numFields = textFields.length
  const availW = dims.width - SAFE * 2
  const availH = dims.height - SAFE * 2

  const barcodeH = Math.max(6, Math.min(availH * 0.45, 18))
  const barcodeY = SAFE + 1
  const barcodeBottom = barcodeY + barcodeH

  const textStartY = barcodeBottom + 1
  const textEndY = dims.height - SAFE
  const textAvailH = textEndY - textStartY

  const maxFont = Math.min(7 * (dims.height / 30), 12)
  const { fontSizePt, lineH } = fitFont(maxFont, numFields, textAvailH, 3.5)

  elements.push({
    type: 'barcode',
    column: barcodeCol,
    x: SAFE,
    y: barcodeY,
    width: availW,
    height: barcodeH,
  })

  textFields.forEach((f, i) => {
    const { isBold } = getStyle(f, columnStyles)
    elements.push({
      type: 'text',
      column: f,
      x: SAFE,
      y: textStartY + i * lineH,
      fontSize: fontSizePt,
      fontWeight: isBold ? 'bold' : 'normal',
      width: availW,
      align: 'center',
    })
  })

  return { elements, id: 'price-tag' }
}

const GENERATORS = {
  stacked: generateStacked,
  compact: generateCompact,
  'price-tag': generatePriceTag,
}

export function generateLayouts(fields, barcodeCol, columnStyles = {}, dimensions = { width: 40, height: 30 }) {
  return LAYOUT_TEMPLATES.map((t) => {
    const fn = GENERATORS[t.key]
    const { elements } = fn(fields, barcodeCol, columnStyles, dimensions)
    return { id: t.id, name: t.name, description: t.description, elements }
  })
}
