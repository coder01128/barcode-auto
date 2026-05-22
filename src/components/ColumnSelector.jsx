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
      <h2 className="text-xl font-bold dark:text-slate-100">Which item details should appear on your label?</h2>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-slate-100">Item details</h3>
        {loadedDefaults && (
          <p className="text-xs text-accent mb-3 font-medium">Your last settings have been loaded. Click any column to change.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {visibleHeaders.map((h) => (
            <button
              key={h}
              onClick={() => toggleColumn(h)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selected[h] ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-slate-100">Which column has the barcode number?</h3>
        <select
          value={barcodeCol}
          onChange={(e) => setBarcodeCol(e.target.value)}
          className="w-full p-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
        >
          {visibleHeaders.filter((h) => selected[h]).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
        <h3 className="font-semibold mb-3 dark:text-slate-100">Barcode format</h3>
        <select
          value={barcodeType}
          onChange={(e) => setBarcodeType(e.target.value)}
          className="w-full p-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
        >
          {BARCODE_TYPES.map((bt) => (
            <option key={bt.id} value={bt.id}>{bt.name}</option>
          ))}
        </select>
      </div>

      {qtyCol && (
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-l-4 border-l-accent p-4">
          <h3 className="font-bold text-base mb-2 dark:text-slate-100">Print multiple copies?</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
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
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
          <h3 className="font-semibold mb-3 dark:text-slate-100">Text style (optional)</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Make a column bold or large (e.g. price)</p>
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
          onClick={() => onConfirm({ selectedCols: headers.filter((h) => selected[h]), barcodeCol, barcodeType, columnStyles, qtyCol: useQty ? qtyCol : null, useQty })}
          disabled={selectedCount < 2}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedCount < 2 ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-[#d96c1e]'
          }`}
        >
          Next: Set label size ({selectedCount} columns)
        </button>
      </div>
    </div>
  )
}
