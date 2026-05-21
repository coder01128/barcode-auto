import { useState } from 'react'
import { generateLayouts } from '../utils/layoutEngine'

export default function LayoutPicker({ fields, barcodeCol, columnStyles, dimensions, onConfirm, onBack }) {
  const [selected, setSelected] = useState(null)
  const layouts = generateLayouts(fields, barcodeCol, columnStyles, dimensions)

  // Use actual label aspect ratio when dimensions available, else default 90x65
  const vw = dimensions?.width || 90
  const vh = dimensions?.height || 65

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Choose a layout</h2>
      <p className="text-sm text-gray-600">Select how your labels should look</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layouts.map((layout) => (
          <div
            key={layout.id}
            onClick={() => setSelected(layout)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selected?.id === layout.id ? 'border-accent bg-orange-50 shadow-md' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <h3 className="font-semibold mb-1">{layout.name}</h3>
            <p className="text-xs text-gray-500 mb-3">{layout.description}</p>

            {/* Mini SVG preview with correct aspect ratio */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full border rounded bg-white"
              style={{ maxHeight: '180px', aspectRatio: `${dimensions.width}/${dimensions.height}` }}
            >
              <rect width={dimensions.width} height={dimensions.height} fill="white" />
              {layout.elements.map((el, i) => {
                if (el.type === 'text') {
                  return (
                    <text
                      key={i}
                      x={el.x}
                      y={el.y + el.fontSize * 0.35}
                      fontSize={el.fontSize * 0.35}
                      fontWeight={el.fontWeight}
                      fill={el.fontWeight === 'bold' ? '#1B2A4A' : '#666'}
                    >
                      {el.column}
                    </text>
                  )
                }
                if (el.type === 'barcode') {
                  const barCount = Math.floor(el.width / 0.8)
                  return (
                    <g key={i}>
                      {Array.from({ length: barCount }).map((_, j) => {
                        const isBar = j % 4 !== 2
                        return isBar ? (
                          <rect
                            key={j}
                            x={el.x + (j / barCount) * el.width}
                            y={el.y}
                            width={el.width / barCount * 0.65}
                            height={el.height * 0.75}
                            fill="#000"
                          />
                        ) : null
                      })}
                    </g>
                  )
                }
                return null
              })}
            </svg>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !selected ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-accent text-white hover:bg-[#d96c1e]'
          }`}
        >
          Next: Generate PDF
        </button>
      </div>
    </div>
  )
}
