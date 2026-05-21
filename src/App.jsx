import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import ColumnSelector from './components/ColumnSelector'
import DimensionInput from './components/DimensionInput'
import LayoutPicker from './components/LayoutPicker'
import LabelPreview from './components/LabelPreview'
import { generateLabelPdf } from './utils/pdfGenerator'
import { canGenerate, incrementUsage, remainingLabels } from './utils/usageLimiter'

const STEPS = ['upload', 'columns', 'dimensions', 'layout', 'generate']

export default function App() {
  const [step, setStep] = useState(0)
  const [parsedData, setParsedData] = useState(null)
  const [config, setConfig] = useState({})
  const [generating, setGenerating] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const handleParsed = useCallback((data) => {
    setParsedData(data)
    setStep(1)
  }, [])

  const handleColumns = useCallback((cols) => {
    setConfig((prev) => ({ ...prev, ...cols }))
    setStep(2)
  }, [])

  const handleDimensions = useCallback((dims) => {
    setConfig((prev) => ({ ...prev, dimensions: dims }))
    setStep(3)
  }, [])

  const handleLayout = useCallback((layout) => {
    setConfig((prev) => ({ ...prev, layout }))
    setStep(4)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!canGenerate()) {
      setShowPaywall(true)
      return
    }
    setGenerating(true)
    try {
      const result = generateLabelPdf({
        rows: parsedData.rows,
        barcodeCol: config.barcodeCol,
        barcodeType: config.barcodeType,
        layout: config.layout,
        dimensions: config.dimensions,
        qtyCol: config.qtyCol,
        useQty: config.useQty,
      })

      const { doc, labelCount, rowCount, fits } = result

      if (!fits) {
        const proceed = window.confirm(
          'Warning: Some content may overflow the label edges. Try selecting fewer columns or increasing label size. Generate anyway?'
        )
        if (!proceed) {
          setGenerating(false)
          return
        }
      }

      const usageCount = Math.min(labelCount, 999)
      for (let i = 0; i < usageCount; i++) {
        if (!canGenerate()) break
        incrementUsage()
      }

      doc.save(`barcode-labels-${Date.now()}.pdf`)
    } catch (err) {
      alert('Error generating PDF: ' + err.message)
    }
    setGenerating(false)
  }, [parsedData, config])

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const handleReset = useCallback(() => {
    setStep(0)
    setParsedData(null)
    setConfig({})
    setShowPaywall(false)
  }, [])

  const rowCount = parsedData?.rows.length || 0
  const hasQty = config.qtyCol && config.useQty
  const totalLabels = hasQty
    ? parsedData?.rows.reduce((sum, r) => sum + (parseInt(r[config.qtyCol], 10) || 1), 0) || 0
    : rowCount

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">BarcodeAuto</h1>
            <p className="text-xs text-blue-200">Spreadsheet to Labels. Instantly.</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-blue-200">{remainingLabels()} labels left</span>
            <a href="#pricing" className="text-accent font-semibold hover:underline">Upgrade</a>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-[800px] mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className={`hidden sm:inline ${i <= step ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < STEPS.length - 1 && <span className="text-gray-300">—</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[800px] mx-auto px-4 pb-16">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {step === 0 && <FileUpload onParsed={handleParsed} />}
          {step === 1 && parsedData && (
            <ColumnSelector
              headers={parsedData.headers}
              rows={parsedData.rows}
              onConfirm={handleColumns}
              onBack={handleBack}
            />
          )}
          {step === 2 && (
            <DimensionInput onConfirm={handleDimensions} onBack={handleBack} />
          )}
          {step === 3 && (
            <LayoutPicker
              fields={config.selectedCols}
              barcodeCol={config.barcodeCol}
              columnStyles={config.columnStyles}
              dimensions={config.dimensions}
              onConfirm={handleLayout}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Generate your labels</h2>
              <p className="text-sm text-gray-600">
                Generating {hasQty ? `${totalLabels} labels from ${rowCount} rows` : `${rowCount} labels`}.
                {' '}{remainingLabels()} remaining in free tier.
                {' '}PDF includes 1 blank calibration page for thermal printer alignment.
              </p>
              <LabelPreview layout={config.layout} dimensions={config.dimensions} rows={parsedData?.rows} barcodeCol={config.barcodeCol} barcodeType={config.barcodeType} />

              {showPaywall ? (
                <div className="bg-orange-50 border-2 border-accent rounded-lg p-6 text-center space-y-3">
                  <h3 className="font-bold text-lg">Free limit reached</h3>
                  <p className="text-sm text-gray-600">1000 labels per session on free tier.</p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e]">
                      Single batch — $1.99
                    </button>
                    <button className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                      Pro Monthly — $9.99/mo
                    </button>
                  </div>
                  <button onClick={handleReset} className="text-sm text-gray-500 hover:underline">
                    Start over
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleBack} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`px-8 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e] transition-colors flex items-center gap-2 ${
                      generating ? 'opacity-70 cursor-wait' : ''
                    }`}
                  >
                    {generating ? (
                      <>Generating...</>
                    ) : (
                      <>Download PDF ({Math.min(totalLabels || rowCount, 1000, remainingLabels() || 1000)} labels)</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pb-8">
        <p>All processing happens in your browser. No data uploaded to servers.</p>
      </footer>
    </div>
  )
}
