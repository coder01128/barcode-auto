import { useState } from 'react'

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Label dimensions</h2>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3 text-sm text-gray-600">Common sizes</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-4">Enter dimensions (mm)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Width (mm)</label>
            <p className="text-[10px] text-gray-400 mb-1 leading-tight">measured across the roll</p>
            <input
              type="number"
              min={10}
              max={200}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Height (mm)</label>
            <p className="text-[10px] text-gray-400 mb-1 leading-tight">measured along feed direction</p>
            <input
              type="number"
              min={10}
              max={300}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gap</label>
            <input
              type="number"
              min={0}
              max={20}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Simplified preview — labels shown vertically like the printer output */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3 text-sm text-gray-600">Preview</h3>

        <div className="flex flex-col items-center gap-0">
          {/* First label */}
          <div
            className="border-2 border-primary rounded bg-blue-50 flex items-center justify-center"
            style={{
              width: `${Math.min(width * 2.5, 250)}px`,
              height: `${Math.min(height * 2.5, 200)}px`
            }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-primary">{width} × {height}mm</div>
              <div className="text-[10px] text-gray-500">your label</div>
            </div>
          </div>

          {/* Gap indicator */}
          {gap > 0 && (
            <div
              className="bg-gray-100 w-full flex items-center justify-center border-x-2 border-dashed border-gray-300"
              style={{
                width: `${Math.min(width * 2.5, 250)}px`,
                height: `${Math.max(gap * 2.5, 12)}px`
              }}
            >
              <span className="text-[9px] text-gray-400">{gap}mm gap</span>
            </div>
          )}

          <svg
            width={Math.min(width * 3, 200)}
            height={Math.min(height * 3, 200)}
            className="border-2 border-dashed border-gray-400 rounded"
          >
            <rect width="100%" height="100%" fill="#f0f0f0" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#666">
              next label
            </text>
          </svg>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Total pitch: {height + gap}mm (label + gap)
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={() => onConfirm({ width, height, gap })}
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-[#d96c1e] transition-colors"
        >
          Next: Choose layout
        </button>
      </div>
    </div>
  )
}
