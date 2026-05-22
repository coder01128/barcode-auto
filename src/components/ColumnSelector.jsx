import { useState, useEffect } from 'react'
import { BARCODE_TYPES } from '../utils/barcodeUtils'

const QTY_NAMES = ['qty', 'quantity']

export default function ColumnSelector({ headers, rows, onConfirm, onBack }) {
  const [selected, setSelected] = useState({})
  const [barcodeCol, setBarcodeCol] = useState('')
  const [barcodeType, setBarcodeType] = useState('ean13')
  const [columnStyles, setColumnStyles] = useState({})
  const [useQty, setUseQty] = useState(true)
  const [loadedDefaults, setLoadedDefaults] = useState(false)

  const COL_SAVE_KEY = 'barcodeAuto_columns'

  const qtyCol = headers.find((h) => QTY_NAMES.includes(h.toLowerCase()))

  const isImageCol = (h) => /image/i.test(h)

  useEffect(() => {
    if (headers.length > 0) {
      const init = {}
      headers.forEach((h) => { init[h] = false })

      const saved = localStorage.getItem(COL_SAVE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.selectedColumns) {
            parsed.selectedColumns.forEach((h) => {
              if (headers.includes(h)) init[h] = true
            })
          }
          if (parsed.barcodeCol && headers.includes(parsed.barcodeCol)) {
            setBarcodeCol(parsed.barcodeCol)
          } else {
            setBarcodeCol(headers.find((h) => !isImageCol(h)) || headers[0])
          }
          if (parsed.barcodeType) setBarcodeType(parsed.barcodeType)
          if (typeof parsed.useQty === 'boolean') setUseQty(parsed.useQty)
          setLoadedDefaults(true)
        } catch { setBarcodeCol(headers.find((h) => !isImageCol(h)) || headers[0]) }
      } else {
        setBarcodeCol(headers.find((h) => !isImageCol(h)) || headers[0])
      }

      setSelected(init)
    }
  }, [headers, rows])

  function saveDefaults() {
    const cols = headers.filter((h) => selected[h])
    localStorage.setItem(COL_SAVE_KEY, JSON.stringify({
      selectedColumns: cols,
      barcodeCol,
      barcodeType,
      useQty,
    }))
  }

  function toggleColumn(h) {
    setSelected((prev) => ({ ...prev, [h]: !prev[h] }))
  }

  function toggleStyle(col, style) {
    setColumnStyles((prev) => {
      const current = prev[col] || {}
      return { ...prev, [col]: { ...current, [style]: !current[style] } }
    })
  }

  const visibleHeaders = headers.filter((h) => !isImageCol(h))

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold dark:text-[#E8E8E8]">Which item details should appear on your label?</h2>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-[#E8E8E8]">Item details</h3>
        {loadedDefaults && (
          <p className="text-xs text-accent mb-3 font-medium">Your last settings have been loaded. Click any column to change.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {visibleHeaders.map((h) => (
            <button
              key={h}
              onClick={() => toggleColumn(h)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-[0.97] ${
                selected[h] ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-[#E8E8E8]">Which column has the barcode number?</h3>
        <select
          value={barcodeCol}
          onChange={(e) => setBarcodeCol(e.target.value)}
          className="w-full p-2 border rounded-lg text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
        >
          {visibleHeaders.filter((h) => selected[h]).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-[#E8E8E8]">Barcode format</h3>
        <select
          value={barcodeType}
          onChange={(e) => setBarcodeType(e.target.value)}
          className="w-full p-2 border rounded-lg text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
        >
          {BARCODE_TYPES.map((bt) => (
            <option key={bt.id} value={bt.id}>{bt.name}</option>
          ))}
        </select>
      </div>

      {qtyCol && (
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-l-4 border-l-accent p-4">
          <h3 className="font-bold text-base mb-2 dark:text-[#E8E8E8]">Print multiple copies?</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
            Your spreadsheet has a "{qtyCol}" column. If an item says {qtyCol} 3,
            we'll print 3 labels for it instead of 1.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useQty}
              onChange={(e) => setUseQty(e.target.checked)}
              className="rounded"
            />
            Yes, print the right number of labels for each item
          </label>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
          <h3 className="font-semibold mb-3 dark:text-[#E8E8E8]">Text style (optional)</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Make a column bold or large (e.g. price)</p>
          <div className="space-y-2">
            {visibleHeaders.filter((h) => selected[h] && h !== barcodeCol).map((h) => (
              <div key={h} className="flex items-center justify-between text-sm">
                <span>{h}</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={columnStyles[h]?.isBold || false} onChange={() => toggleStyle(h, 'isBold')} />
                    Bold
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={columnStyles[h]?.isLarge || false} onChange={() => toggleStyle(h, 'isLarge')} />
                    Large
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          onClick={() => onConfirm({ selectedCols: headers.filter((h) => selected[h]), barcodeCol, barcodeType, columnStyles, qtyCol: useQty ? qtyCol : null, useQty })}
          disabled={selectedCount < 2}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedCount < 2 ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-[#d96c1e] hover:shadow-md active:scale-[0.97]'
          }`}
        >
          Next: Set label size ({selectedCount} columns)
        </button>
      </div>
    </div>
  )
}
