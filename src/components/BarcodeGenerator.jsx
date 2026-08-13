import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { BARCODE_TYPES } from '../utils/barcodeUtils'
import { generateAllBarcodes } from '../utils/barcodeGenerator'

const GEN_STEPS = ['Upload', 'Configure', 'Preview']

export default function BarcodeGenerator({ onHandoff, onBack }) {
  const [genStep, setGenStep] = useState(0)
  const [parsedData, setParsedData] = useState(null)
  const [skuCol, setSkuCol] = useState('')
  const [format, setFormat] = useState('ean13')
  const [enrichedRows, setEnrichedRows] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [code39Warning, setCode39Warning] = useState(false)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', raw: false })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        // raw:false forces formatted text so leading zeros, scientific-notation
        // strings and long numerics survive as literal strings
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
        if (!json?.length) { alert('No data found in file'); return }
        const headers = Object.keys(json[0])
        setParsedData({ headers, rows: json })
        setSkuCol(headers[0])
        setGenStep(1)
      } catch (err) {
        alert('Could not parse file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleGenerate() {
    if (!parsedData || !skuCol) return
    if (format === 'code39') {
      const hasInvalid = parsedData.rows.some(
        row => /[^A-Z0-9\-\.\$\/%\+\s]/i.test(String(row[skuCol] ?? ''))
      )
      setCode39Warning(hasInvalid)
    } else {
      setCode39Warning(false)
    }
    const rows = generateAllBarcodes(parsedData.rows, skuCol, format)
    setEnrichedRows(rows)
    setGenStep(2)
  }

  function handleDownload() {
    if (!enrichedRows) return
    const ws = XLSX.utils.json_to_sheet(enrichedRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcodes-generated-${Date.now()}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleHandoff() {
    if (!enrichedRows || !parsedData) return
    onHandoff({
      headers: [...parsedData.headers, 'GENERATED_BARCODE'],
      rows: enrichedRows,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1"
          aria-label="Back"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-xl font-bold dark:text-[#E8E8E8]">Generate Barcodes</h2>
      </div>

      {/* Sub-step indicator */}
      <div className="flex items-center justify-center gap-2">
        {GEN_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className="text-neutral-300 dark:text-neutral-600 text-sm">—</span>}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                i < genStep
                  ? 'bg-[#FFD700] text-[#2D2D2D]'
                  : i === genStep
                  ? 'bg-[#FFD700] text-[#2D2D2D] ring-2 ring-[#FFD700]/30 ring-offset-2 ring-offset-white dark:ring-offset-neutral-800'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
              }`}>
                {i < genStep ? (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= genStep ? 'text-primary dark:text-[#E8E8E8]' : 'text-neutral-400 dark:text-neutral-500'}`}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {genStep === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Upload your product spreadsheet. We'll generate a unique barcode for each row.
          </p>
          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`border-[3px] border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 active:scale-[0.99] ${
              dragOver
                ? 'border-[#FFD700] bg-[#FFD700]/5'
                : 'border-neutral-400 dark:border-neutral-500 hover:border-[#FFD700] dark:hover:border-[#FFD700]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
            <svg className="mx-auto h-14 w-14 text-neutral-400 dark:text-neutral-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-lg font-bold text-neutral-800 dark:text-[#E8E8E8]">Drop your spreadsheet here</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">or click to browse · .xlsx, .xls, .csv</p>
          </div>
        </div>
      )}

      {/* Step 1: Configure */}
      {genStep === 1 && parsedData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold mb-1 dark:text-[#E8E8E8]">Which column contains your product identifier?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">SKU, product code, item number, etc.</p>
            <select
              value={skuCol}
              onChange={(e) => setSkuCol(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
            >
              {parsedData.headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Preview table */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold mb-2 dark:text-[#E8E8E8]">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-700">
                    {parsedData.headers.map((h) => (
                      <th key={h} className={`px-3 py-2 text-left font-medium border-b dark:border-neutral-600 ${
                        h === skuCol ? 'text-[#B8960C] dark:text-[#FFD700]' : 'text-neutral-700 dark:text-neutral-200'
                      }`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="even:bg-neutral-50 dark:even:bg-neutral-700/50">
                      {parsedData.headers.map((h, j) => (
                        <td key={j} className={`px-3 py-2 border-b dark:border-neutral-700 truncate max-w-[150px] ${
                          h === skuCol ? 'font-semibold text-neutral-800 dark:text-[#E8E8E8]' : 'text-neutral-600 dark:text-neutral-300'
                        }`}>{String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold mb-3 dark:text-[#E8E8E8]">What barcode format do you need?</h3>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
            >
              {BARCODE_TYPES.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
            {format === 'ean13' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Uses prefix "20" (in-store/internal range). No GS1 membership required.</p>
            )}
            {format === 'upca' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Uses prefix "2" (in-store range). 12-digit standard.</p>
            )}
            {format === 'code39' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Alphanumeric uppercase only. Invalid characters will be removed automatically.</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGenStep(0)}
              className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              className="px-8 py-2 bg-[#FFD700] text-[#2D2D2D] rounded-lg font-bold hover:bg-[#FFDF00] hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all duration-200 active:scale-[0.97]"
            >
              Generate barcodes →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview + Download */}
      {genStep === 2 && enrichedRows && (
        <div className="space-y-4">
          {code39Warning && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-3 text-sm text-orange-800 dark:text-orange-300">
              Some SKU values had characters invalid for Code 39. Those characters were stripped from the barcode value.
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]"></div>
            <p className="text-sm font-semibold dark:text-[#E8E8E8]">{enrichedRows.length} barcodes generated — all unique</p>
          </div>

          {/* Be explicit about what these codes are for, before anyone prints a thousand of them. */}
          {(format === 'ean13' || format === 'upca') && (
            <div className="bg-[#FFD700]/10 border border-[#FFD700]/50 rounded-lg p-4 text-sm text-neutral-700 dark:text-neutral-200">
              <p className="font-semibold mb-1 dark:text-[#E8E8E8]">These are in-store barcodes — here's what that means.</p>
              <p className="leading-relaxed">
                They'll scan perfectly on your own tills, shelves and stock system. That's exactly
                what the {format === 'ean13' ? '"20"' : '"2"'} prefix is set aside for, and it's why you don't need a GS1
                membership to use them. What they won't do is identify your product in someone
                else's shop — those codes have to be bought from GS1. If you're labelling your
                own stock, you're sorted.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold mb-2 dark:text-[#E8E8E8]">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-700">
                    {Object.keys(enrichedRows[0]).map((h) => (
                      <th key={h} className={`px-3 py-2 text-left font-medium border-b dark:border-neutral-600 ${
                        h === 'GENERATED_BARCODE' ? 'bg-[#FFD700]/10 text-[#B8960C] dark:text-[#FFD700]' : 'text-neutral-700 dark:text-neutral-200'
                      }`}>
                        {h}
                        {h === 'GENERATED_BARCODE' && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-widest bg-[#FFD700] text-[#2D2D2D] px-1 py-0.5 rounded font-bold">new</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrichedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="even:bg-neutral-50 dark:even:bg-neutral-700/50">
                      {Object.keys(row).map((h, j) => (
                        <td key={j} className={`px-3 py-2 border-b dark:border-neutral-700 truncate max-w-[180px] ${
                          h === 'GENERATED_BARCODE'
                            ? 'font-mono font-bold text-[#B8960C] dark:text-[#FFD700] bg-[#FFD700]/5'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}>{String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setGenStep(1)}
              className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]"
            >
              Back
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-2 border-2 border-[#FFD700] text-[#B8960C] dark:text-[#FFD700] rounded-lg font-bold hover:bg-[#FFD700] hover:text-[#2D2D2D] transition-all duration-200 active:scale-[0.97]"
            >
              Download spreadsheet with barcodes
            </button>
            <button
              onClick={handleHandoff}
              className="px-8 py-2 bg-[#FFD700] text-[#2D2D2D] rounded-lg font-bold hover:bg-[#FFDF00] hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all duration-200 active:scale-[0.97] flex items-center gap-2"
            >
              Now let's turn these into labels →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
