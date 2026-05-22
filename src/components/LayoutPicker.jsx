import { useState, useEffect } from 'react'
import { generateLayouts } from '../utils/layoutEngine'

const LAYOUT_SAVE_KEY = 'barcodeAuto_layout'

export default function LayoutPicker({ fields, barcodeCol, columnStyles, dimensions, onConfirm, onBack }) {
  const [selected, setSelected] = useState(null)
  const layouts = generateLayouts(fields, barcodeCol, columnStyles, dimensions)

  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_SAVE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const match = layouts.find((l) => l.id === parsed.selectedLayoutId)
        if (match) setSelected(match)
      } catch {}
    }
  }, [])

  function saveDefaults() {
    if (selected) {
      localStorage.setItem(LAYOUT_SAVE_KEY, JSON.stringify({
        selectedLayoutId: selected.id,
      }))
    }
  }

  // Use actual label aspect ratio when dimensions available, else default 90x65
  const vw = dimensions?.width || 90
  const vh = dimensions?.height || 65

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold dark:text-[#E8E8E8]">Choose a layout</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">Select how your labels should look</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layouts.map((layout) => (
          <div
            key={layout.id}
            onClick={() => setSelected(layout)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all active:scale-[0.98] ${
              selected?.id === layout.id ? 'border-accent bg-orange-50 dark:bg-orange-900/20 shadow-md' : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 shadow-sm'
            }`}
          >
            <h3 className="font-semibold mb-1 dark:text-[#E8E8E8]">{layout.name}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{layout.description}</p>

            {/* Mini SVG preview with correct aspect ratio */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full border rounded bg-white dark:bg-neutral-800"
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
                      fill={el.fontWeight === 'bold' ? '#2D2D2D' : '#666'}
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

      <div className="flex justify-end">
        <button onClick={saveDefaults} className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#E0E0E0] bg-white dark:bg-[#1C1C1C] dark:border-[#333333] text-neutral-500 dark:text-[#999999] flex items-center gap-1.5 hover:bg-[#F5F5F5] hover:border-accent dark:hover:bg-[#2A2A2A] transition-all duration-200 active:scale-[0.97]">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Save for next time
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]">
          Back
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !selected ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-[#d96c1e] hover:shadow-md'
          }`}
        >
          Next: Generate PDF
        </button>
      </div>
    </div>
  )
}
