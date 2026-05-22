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
      <h2 className="text-xl font-bold dark:text-slate-100">Choose a layout</h2>
      <p className="text-sm text-gray-600 dark:text-slate-300">Select how your labels should look</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layouts.map((layout) => (
          <div
            key={layout.id}
            onClick={() => setSelected(layout)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selected?.id === layout.id ? 'border-accent bg-orange-50 dark:bg-orange-900/20 shadow-md' : 'border-gray-200 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
            }`}
          >
            <h3 className="font-semibold mb-1 dark:text-slate-100">{layout.name}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{layout.description}</p>

            {/* Mini SVG preview with correct aspect ratio */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full border rounded bg-white dark:bg-slate-800"
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

      <div className="flex justify-end">
        <button onClick={saveDefaults} className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 hover:text-accent transition-colors">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M17.25 6.75L17.25 3H6.75L6.75 6.75M17.25 6.75H6.75M17.25 6.75C18.0784 6.75 18.75 7.42157 18.75 8.25L18.75 20.25C18.75 21.0784 18.0784 21.75 17.25 21.75L6.75 21.75C5.92157 21.75 5.25 21.0784 5.25 20.25L5.25 8.25C5.25 7.42157 5.92157 6.75 6.75 6.75" />
          </svg>
          Save as default
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
          Back
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !selected ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-[#d96c1e]'
          }`}
        >
          Next: Generate PDF
        </button>
      </div>
    </div>
  )
}
