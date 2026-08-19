import { useState, useCallback, useEffect, useMemo } from 'react'
import FileUpload from './components/FileUpload'
import ColumnSelector from './components/ColumnSelector'
import DimensionInput from './components/DimensionInput'
import LayoutPicker from './components/LayoutPicker'
import LabelPreview from './components/LabelPreview'
import SplashModal from './components/SplashModal'
import LandingGate from './components/LandingGate'
import BarcodeGenerator from './components/BarcodeGenerator'
import ValidationGate from './components/ValidationGate'
import * as XLSX from 'xlsx'
import { generateLabelPdf } from './utils/pdfGenerator'
import { validateBarcodeData } from './utils/barcodeValidator'
import { decodeFileBuffer } from './utils/decodeFileBuffer'

async function loadSampleCSV(filename) {
  const res = await fetch(`${import.meta.env.BASE_URL}samples/${filename}`)
  const buffer = await res.arrayBuffer()
  const decoded = decodeFileBuffer(buffer)
  const workbook = decoded.mode === 'binary'
    ? XLSX.read(decoded.data, { type: 'array', raw: false })
    : XLSX.read(decoded.data, { type: 'string', raw: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  return { headers: Object.keys(json[0]), rows: json }
}

const STEPS = ['upload', 'columns', 'dimensions', 'layout', 'generate']

const STEP_DESCS = {
  upload: 'Drop your file',
  columns: 'Pick your fields',
  dimensions: 'Label size',
  layout: 'Choose style',
  generate: 'Download PDF',
}

const SPLASH_KEY = 'barcodeAuto_splashDismissed'

export default function App() {
  const [step, setStep] = useState(0)
  const [parsedData, setParsedData] = useState(null)
  const [config, setConfig] = useState({})
  const [generating, setGenerating] = useState(false)

  // Validation gate — sits between column mapping and the rest of the wizard
  const [pendingValidation, setPendingValidation] = useState(null)
  const [excludedRows, setExcludedRows] = useState([])
  const [barcodeFixes, setBarcodeFixes] = useState({})
  const [verified, setVerified] = useState(false)

  const [showSplash, setShowSplash] = useState(() => localStorage.getItem(SPLASH_KEY) !== 'true')
  const [appMode, setAppMode] = useState('gate') // 'gate' | 'generator' | 'wizard'
  const [fromGenerator, setFromGenerator] = useState(false)
  const [generatorInitialData, setGeneratorInitialData] = useState(null)
  const [loadingSample, setLoadingSample] = useState(null)

  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleSplashDismiss = useCallback(() => setShowSplash(false), [])

  const handleChooseGenerator = useCallback(() => setAppMode('generator'), [])

  const resetValidation = useCallback(() => {
    setPendingValidation(null)
    setExcludedRows([])
    setBarcodeFixes({})
    setVerified(false)
  }, [])

  const handleChooseWizard = useCallback(() => {
    setFromGenerator(false)
    setStep(0)
    setParsedData(null)
    setConfig({})
    resetValidation()
    setAppMode('wizard')
  }, [resetValidation])

  const handleSampleNeedBarcodes = useCallback(async () => {
    setLoadingSample('need')
    try {
      const data = await loadSampleCSV('sample-need-barcodes.csv')
      setGeneratorInitialData(data)
      setAppMode('generator')
    } catch (err) {
      alert('Could not load sample data: ' + err.message)
    }
    setLoadingSample(null)
  }, [])

  const handleSampleHaveBarcodes = useCallback(async () => {
    setLoadingSample('have')
    try {
      const data = await loadSampleCSV('sample-have-barcodes.csv')
      setFromGenerator(false)
      resetValidation()
      setParsedData(data)
      setStep(1)
      setAppMode('wizard')
    } catch (err) {
      alert('Could not load sample data: ' + err.message)
    }
    setLoadingSample(null)
  }, [resetValidation])

  const handleGeneratorHandoff = useCallback((enrichedData) => {
    setParsedData(enrichedData)
    setStep(1)
    setFromGenerator(true)
    resetValidation()
    setAppMode('wizard')
  }, [resetValidation])

  const handleParsed = useCallback((data) => {
    setParsedData(data)
    setStep(1)
  }, [])

  const handleColumns = useCallback((cols) => {
    setConfig((prev) => ({ ...prev, ...cols }))
    setExcludedRows([])
    setBarcodeFixes({})
    setVerified(false)

    const values = (parsedData?.rows ?? []).map((r) => String(r[cols.barcodeCol] ?? ''))
    const result = validateBarcodeData(values, cols.barcodeType)

    // Clean data never sees the gate
    if (result.blocked.length === 0 && result.warned.length === 0) {
      setStep(2)
    } else {
      setPendingValidation({ result, symbology: cols.barcodeType })
    }
  }, [parsedData])

  const handleGateProceed = useCallback(({ excluded, fixes }) => {
    setExcludedRows(excluded)
    setBarcodeFixes(fixes)
    setPendingValidation(null)
    setStep(2)
  }, [])

  const handleGateCancel = useCallback(() => setPendingValidation(null), [])

  const handleDimensions = useCallback((dims) => {
    setConfig((prev) => ({ ...prev, dimensions: dims }))
    setStep(3)
  }, [])

  const handleLayout = useCallback((layout) => {
    setConfig((prev) => ({ ...prev, layout }))
    setStep(4)
  }, [])

  // Rows actually sent to the PDF: gate exclusions removed, accepted fixes applied
  const effectiveRows = useMemo(() => {
    if (!parsedData) return []
    const skip = new Set(excludedRows)
    const out = []
    parsedData.rows.forEach((row, i) => {
      if (skip.has(i)) return
      const fix = barcodeFixes[i]
      out.push(fix !== undefined && config.barcodeCol ? { ...row, [config.barcodeCol]: fix } : row)
    })
    return out
  }, [parsedData, excludedRows, barcodeFixes, config.barcodeCol])

  const handleGenerate = useCallback(() => {
    setGenerating(true)
    try {
      const result = generateLabelPdf({
        rows: effectiveRows,
        barcodeCol: config.barcodeCol,
        barcodeType: config.barcodeType,
        layout: config.layout,
        dimensions: config.dimensions,
        qtyCol: config.qtyCol,
        useQty: config.useQty,
      })
      const { doc, fits } = result
      if (!fits) {
        const proceed = window.confirm(
          'Warning: Some content may overflow the label edges. Try selecting fewer columns or increasing label size. Generate anyway?'
        )
        if (!proceed) { setGenerating(false); return }
      }
      doc.save(`barcode-labels-${Date.now()}.pdf`)
    } catch (err) {
      alert('Error generating PDF: ' + err.message)
    }
    setGenerating(false)
  }, [effectiveRows, config])

  const handleBack = useCallback(() => {
    if (step === 0 || (fromGenerator && step === 1)) {
      setAppMode('gate')
      setFromGenerator(false)
      setStep(0)
      setParsedData(null)
      setConfig({})
      resetValidation()
    } else {
      setVerified(false)
      setStep((s) => Math.max(0, s - 1))
    }
  }, [step, fromGenerator, resetValidation])

  const handleReset = useCallback(() => {
    setStep(0)
    setParsedData(null)
    setConfig({})
    resetValidation()
    setAppMode('gate')
    setFromGenerator(false)
    setGeneratorInitialData(null)
  }, [resetValidation])

  const rowCount = effectiveRows.length
  const excludedCount = excludedRows.length
  const hasQty = config.qtyCol && config.useQty
  const totalLabels = hasQty
    ? effectiveRows.reduce((sum, r) => sum + (parseInt(r[config.qtyCol], 10) || 1), 0)
    : rowCount

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] transition-colors">
      {showSplash && <SplashModal onDismiss={handleSplashDismiss} />}

      {pendingValidation && (
        <ValidationGate
          result={pendingValidation.result}
          symbology={pendingValidation.symbology}
          onProceed={handleGateProceed}
          onCancel={handleGateCancel}
        />
      )}

      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-lg font-extrabold tracking-tight hover:opacity-80 transition-opacity"
          >
            BarcodeAuto
          </button>
          <div className="flex items-center gap-3 text-xs">
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

      {/* Step indicator — wizard mode only */}
      {appMode === 'wizard' && (
        <div className="max-w-[900px] mx-auto px-2 sm:px-4 py-6">
          {fromGenerator && (
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-xs font-semibold text-[#B8960C] dark:text-[#FFD700]">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Barcodes generated
              </span>
            </div>
          )}
          <div className="flex items-start justify-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && <span className="text-neutral-300 dark:text-neutral-600 mt-6 text-sm sm:text-base">—</span>}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold shrink-0 transition-all duration-200 active:scale-[0.97] ${
                    i <= step ? 'bg-accent text-white shadow-md' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm sm:text-base font-bold leading-tight text-center transition-colors ${
                    i <= step ? 'text-primary dark:text-[#E8E8E8]' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  <span className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 leading-tight text-center">{STEP_DESCS[s]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-[800px] mx-auto px-4 pb-16">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors">
          {appMode === 'gate' && (
            <LandingGate
              onNeedBarcodes={handleChooseGenerator}
              onHaveBarcodes={handleChooseWizard}
              onSampleNeedBarcodes={handleSampleNeedBarcodes}
              onSampleHaveBarcodes={handleSampleHaveBarcodes}
              loadingSample={loadingSample}
            />
          )}

          {appMode === 'generator' && (
            <BarcodeGenerator
              onHandoff={handleGeneratorHandoff}
              onBack={() => { setGeneratorInitialData(null); setAppMode('gate') }}
              initialData={generatorInitialData}
            />
          )}

          {appMode === 'wizard' && (
            <>
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
                  <h2 className="text-xl font-bold dark:text-[#E8E8E8]">
                    {verified ? 'Generate your labels' : 'Check one label before printing the roll'}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Generating {hasQty ? `${totalLabels} labels from ${rowCount} rows` : `${rowCount} labels`}
                    {excludedCount > 0 && ` (${excludedCount} row${excludedCount === 1 ? '' : 's'} excluded)`}.
                    {' '}PDF includes 1 blank calibration page for thermal printer alignment.
                  </p>

                  {!verified && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      Scan this one with your reader first. If it comes up short at this size, you will
                      find out now instead of at label {Math.min(400, totalLabels || 1)}.
                    </p>
                  )}

                  <LabelPreview
                    layout={config.layout}
                    dimensions={config.dimensions}
                    rows={effectiveRows}
                    barcodeCol={config.barcodeCol}
                    barcodeType={config.barcodeType}
                    minWidth={verified ? undefined : 320}
                    title={verified ? 'Label preview' : 'Verify this label'}
                  />

                  {!verified && (
                    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <div className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Encoded value
                      </div>
                      <code className="font-mono text-sm break-all text-neutral-800 dark:text-neutral-100">
                        {String(effectiveRows[0]?.[config.barcodeCol] ?? '')}
                      </code>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]"
                    >
                      Back
                    </button>
                    {verified ? (
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className={`px-8 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e] hover:shadow-md transition-all duration-200 active:scale-[0.97] flex items-center gap-2 ${
                          generating ? 'opacity-70 cursor-wait' : ''
                        }`}
                      >
                        {generating ? 'Generating...' : `Download PDF (${totalLabels || rowCount} labels)`}
                      </button>
                    ) : (
                      <button
                        onClick={() => setVerified(true)}
                        disabled={rowCount === 0}
                        className={`px-8 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          rowCount === 0
                            ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                            : 'bg-accent text-white hover:bg-[#d96c1e] hover:shadow-md active:scale-[0.97]'
                        }`}
                      >
                        Looks good, generate all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

    </div>
  )
}
