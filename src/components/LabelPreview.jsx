import { useMemo } from 'react'
import JsBarcode from 'jsbarcode'
import { scaleLayoutToLabel, autoScaleContent } from '../utils/layoutEngine'

const PT_TO_MM = 0.3528

export default function LabelPreview({ layout, dimensions, rows, barcodeCol, barcodeType }) {
  if (!layout || !dimensions) return null

  const sampleRow = rows?.[0] ?? {}
  const fallbackVal = sampleRow[barcodeCol] ?? '1234567890128'

  // Scale layout to actual label dimensions
  const scaled = scaleLayoutToLabel(layout, dimensions)
  const { elements } = autoScaleContent(scaled, dimensions)

  const formatMap = { ean13: 'EAN13', upca: 'UPC-A', code128: 'CODE128', code39: 'CODE39', qrcode: 'CODE128' }
  const barcodeFormat = formatMap[barcodeType] || 'CODE128'

  const scale = Math.min(500 / dimensions.width, 400 / dimensions.height, 6)
  const svgW = dimensions.width * scale
  const svgH = dimensions.height * scale

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4 min-w-[400px]">
      <h3 className="font-semibold mb-2 dark:text-slate-100">Label preview</h3>
      <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} width={svgW} height={svgH} className="border mx-auto bg-white">
        <rect width={dimensions.width} height={dimensions.height} fill="white" />
        {elements.map((el, i) => {
          if (el.type === 'text') {
            const val = sampleRow[el.column] ?? el.column
            const fontSizeMm = el.fontSize * PT_TO_MM
            return (
              <text
                key={i}
                x={el.x}
                y={el.y + fontSizeMm}
                fontSize={fontSizeMm}
                fontWeight={el.fontWeight}
                fill="#1B2A4A"
              >
                {val}
              </text>
            )
          }
          if (el.type === 'barcode') {
            return (
              <BarcodeElement
                key={i}
                el={el}
                value={fallbackVal}
                format={barcodeFormat}
              />
            )
          }
          return null
        })}
      </svg>
    </div>
  )
}

function getJsBarcodeDataUrl(value, format, el) {
  const dpi = 10
  const w = Math.round(el.width * dpi)
  const h = Math.round(el.height * dpi)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  try {
    JsBarcode(canvas, value, {
      format,
      width: 3,
      height: Math.round(Math.max(20, el.height * 0.7) * dpi),
      displayValue: true,
      fontSize: 5 * dpi,
      textMargin: 1 * dpi,
      margin: 1 * dpi,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return canvas.toDataURL('image/png', 1.0)
  } catch {
    return null
  }
}

function BarcodeElement({ el, value, format }) {
  const dataUrl = useMemo(
    () => getJsBarcodeDataUrl(value, format, el),
    [value, format, el.width, el.height],
  )
  if (!dataUrl) return null
  return <image href={dataUrl} x={el.x} y={el.y} width={el.width} height={el.height} />
}
