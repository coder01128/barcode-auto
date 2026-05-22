import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

export default function FileUpload({ onParsed }) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (!json || json.length === 0) {
          alert('No data found in file')
          return
        }
        const headers = Object.keys(json[0])
        setParsedData({ headers, rows: json })
        setPreview(json.slice(0, 5))
      } catch (err) {
        alert('Could not parse file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleInputChange(e) {
    const file = e.target.files[0]
    handleFile(file)
  }

  function handleConfirm() {
    if (parsedData) {
      onParsed(parsedData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero headline */}
      <div className="text-center space-y-3">
        <h1 className="text-[2.5rem] font-bold text-primary dark:text-slate-100 leading-tight">
          Spreadsheet to Labels. Instantly.
        </h1>
        <p className="text-base text-gray-600 dark:text-slate-300 max-w-lg mx-auto">
          Upload your stock spreadsheet, pick your columns, download print-ready labels in under 60 seconds.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`border-[3px] border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-accent bg-orange-50 dark:bg-orange-900/20' : 'border-gray-400 dark:border-slate-500 hover:border-gray-500 dark:hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-xl font-bold text-gray-800 dark:text-slate-100">Drop your spreadsheet here</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">or click to browse. Supports .xlsx, .xls, .csv</p>
      </div>

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-800 dark:text-green-300">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="font-medium">All processing happens in your browser. No data uploaded to servers.</span>
      </div>

      {/* Preview section */}
      {preview && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
          <h3 className="font-semibold mb-2 dark:text-slate-100">Preview ({preview.length} rows)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-700">
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-slate-200 border-b dark:border-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="even:bg-gray-50 dark:even:bg-slate-700/50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 border-b dark:border-slate-700 text-gray-600 dark:text-slate-300 truncate max-w-[150px]">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirm}
            className="mx-auto mt-4 block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-[#243b5e] transition-colors"
          >
            This looks good — let's build the label
          </button>
        </div>
      )}
    </div>
  )
}
