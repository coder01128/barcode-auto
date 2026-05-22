import { useState, useEffect } from 'react'

const DIM_SAVE_KEY = 'barcodeAuto_dimensions'

const PRESETS = [
  { label: '40×30mm', w: 40, h: 30, gap: 3 },
  { label: '50×25mm', w: 50, h: 25, gap: 3 },
  { label: '50×30mm', w: 50, h: 30, gap: 3 },
  { label: '60×40mm', w: 60, h: 40, gap: 5 },
  { label: '100×150mm (4×6in)', w: 100, h: 150, gap: 5 },
  { label: 'Shipping 100×70mm', w: 100, h: 70, gap: 5 },
]

export default function DimensionInput({ onConfirm, onBack }) {
  const [width, setWidth] = useState(40)
  const [height, setHeight] = useState(30)
  const [gap, setGap] = useState(3)

  function handlePreset(p) {
    setWidth(p.w)
    setHeight(p.h)
    setGap(p.gap)
  }

  useEffect(() => {
    const saved = localStorage.getItem(DIM_SAVE_KEY)
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.labelWidth) setWidth(p.labelWidth)
        if (p.labelHeight) setHeight(p.labelHeight)
        if (typeof p.labelGap === 'number') setGap(p.labelGap)
      } catch {}
    }
  }, [])

  function saveDefaults() {
    localStorage.setItem(DIM_SAVE_KEY, JSON.stringify({
      labelWidth: width,
      labelHeight: height,
      labelGap: gap,
    }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Label dimensions</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3 text-sm text-gray-600 dark:text-gray-400">Common sizes</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const sel = p.w === width && p.h === height && p.g === gap
            return (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className={`px-3 py-1.5 text-sm border rounded-lg transition-all duration-200 ${
                  sel
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-4 dark:text-[#E8E8E8]">Enter dimensions (mm)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Width (mm)</label>
            <p className="text-[13px] text-[#444] dark:text-gray-400 mb-1 leading-tight">measured across the roll</p>
            <input
              type="number"
              min={10}
              max={200}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Height (mm)</label>
            <p className="text-[13px] text-[#444] dark:text-gray-400 mb-1 leading-tight">measured along feed direction</p>
            <input
              type="number"
              min={10}
              max={300}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Gap</label>
            <input
              type="number"
              min={0}
              max={20}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={saveDefaults} className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#E0E0E0] bg-white dark:bg-[#1C1C1C] dark:border-[#333333] text-gray-500 dark:text-[#999999] flex items-center gap-1.5 hover:bg-[#F5F5F5] hover:border-accent dark:hover:bg-[#2A2A2A] transition-all duration-200">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Save for next time
        </button>
      </div>

      {/* Simplified preview — labels shown vertically like the printer output */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3 text-sm text-gray-600 dark:text-gray-400">Preview</h3>

        <div className="flex flex-col items-center gap-0">
          {/* First label */}
          <div
            className="border-2 border-primary rounded bg-primary/5 dark:bg-primary/20 flex items-center justify-center"
            style={{
              width: `${Math.max(Math.min(width * 5, 350), 150)}px`,
              height: `${Math.max(Math.min(height * 5, 250), 80)}px`
            }}
          >
            <div className="text-center">
              <div className="text-base font-bold text-primary dark:text-[#E8E8E8]">{width} × {height}mm</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">your label</div>
            </div>
          </div>

          {/* Gap indicator */}
          {gap > 0 && (
            <div
              className="bg-gray-100 dark:bg-gray-700 w-full flex items-center justify-center border-x-2 border-dashed border-gray-300 dark:border-gray-600"
              style={{
                width: `${Math.max(Math.min(width * 5, 350), 150)}px`,
                height: `${Math.max(gap * 5, 20)}px`
              }}
            >
              <span className="text-sm text-gray-400 dark:text-gray-500">{gap}mm gap</span>
            </div>
          )}

          <svg
            width={Math.max(Math.min(width * 5, 250), 150)}
            height={Math.max(Math.min(height * 5, 250), 50)}
            className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded"
          >
            <rect width="100%" height="100%" className="fill-gray-100 dark:fill-gray-600" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="13" className="fill-gray-500 dark:fill-gray-300">
              next label
            </text>
          </svg>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center font-medium">
          Total pitch: {height + gap}mm (label + gap)
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200">
          Back
        </button>
        <button
          onClick={() => onConfirm({ width, height, gap })}
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-[#d96c1e] hover:shadow-md transition-colors dark:text-white"
        >
          Next: Choose layout
        </button>
      </div>
    </div>
  )
}
