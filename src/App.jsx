import { useState, useCallback, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import ColumnSelector from './components/ColumnSelector'
import DimensionInput from './components/DimensionInput'
import LayoutPicker from './components/LayoutPicker'
import LabelPreview from './components/LabelPreview'
import { generateLabelPdf } from './utils/pdfGenerator'
import { canGenerate, incrementUsage, remainingLabels } from './utils/usageLimiter'

const STEPS = ['upload', 'columns', 'dimensions', 'layout', 'generate']

const STEP_DESCS = {
  upload: 'Drop your file',
  columns: 'Pick your fields',
  dimensions: 'Label size',
  layout: 'Choose style',
  generate: 'Download PDF',
}

export default function App() {
  const [step, setStep] = useState(0)
  const [parsedData, setParsedData] = useState(null)
  const [config, setConfig] = useState({})
  const [generating, setGenerating] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-tight">BarcodeAuto</h1>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-blue-200">{remainingLabels()} labels left</span>
            <a href="#pricing" className="text-accent font-semibold hover:underline">Upgrade</a>
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Toggle dark mode"
            >
              {dark ? (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-[800px] mx-auto px-4 py-4">
        <div className="flex items-start justify-center gap-0 sm:gap-1 text-sm">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-0 sm:gap-1">
              {i > 0 && <span className="text-gray-300 dark:text-gray-600 mt-3">—</span>}
              <div className="flex flex-col items-center gap-0.5 min-w-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-colors ${
                  i <= step ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold leading-tight text-center transition-colors ${
                  i <= step ? 'text-primary dark:text-slate-100' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 leading-tight text-center">{STEP_DESCS[s]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[800px] mx-auto px-4 pb-16">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
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
              <h2 className="text-xl font-bold dark:text-slate-100">Generate your labels</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Generating {hasQty ? `${totalLabels} labels from ${rowCount} rows` : `${rowCount} labels`}.
                {' '}{remainingLabels()} remaining in free tier.
                {' '}PDF includes 1 blank calibration page for thermal printer alignment.
              </p>
              <LabelPreview layout={config.layout} dimensions={config.dimensions} rows={parsedData?.rows} barcodeCol={config.barcodeCol} barcodeType={config.barcodeType} />

              {showPaywall ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-accent rounded-lg p-6 text-center space-y-3 shadow-sm">
                  <h3 className="font-bold text-lg dark:text-slate-100">Free limit reached</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">1000 labels per session on free tier.</p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e] hover:shadow-md transition-colors">
                      Single batch — $1.99
                    </button>
                    <button className="px-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-200 hover:shadow-sm transition-colors">
                      Pro Monthly — $9.99/mo
                    </button>
                  </div>
                  <button onClick={handleReset} className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
                    Start over
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleBack} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                    Back
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`px-8 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e] hover:shadow-md transition-colors flex items-center gap-2 ${
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
    </div>
  )
}
