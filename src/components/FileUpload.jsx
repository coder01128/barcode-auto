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
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-accent bg-orange-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-base font-medium">Drop your spreadsheet here</p>
        <p className="text-sm text-gray-500 mt-1">or click to browse. Supports .xlsx, .xls, .csv</p>
      </div>

      {preview && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Preview ({preview.length} rows)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="even:bg-gray-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 border-b text-gray-600 truncate max-w-[150px]">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirm}
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-[#243b5e] transition-colors"
          >
            This looks good — choose columns
          </button>
        </div>
      )}
    </div>
  )
}
