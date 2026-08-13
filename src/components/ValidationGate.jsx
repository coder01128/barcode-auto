import { useState, useMemo } from 'react'
import { proposedFixForRow } from '../utils/barcodeValidator'

function groupByRow(entries) {
  const map = new Map()
  entries.forEach((e) => {
    if (!map.has(e.rowIndex)) map.set(e.rowIndex, [])
    map.get(e.rowIndex).push(e)
  })
  return map
}

function RawValue({ children }) {
  return (
    <code className="font-mono text-[13px] break-all text-neutral-800 dark:text-neutral-100">
      {children === '' ? <span className="italic text-neutral-500 dark:text-neutral-400">(empty)</span> : children}
    </code>
  )
}

export default function ValidationGate({ result, symbology, onProceed, onCancel }) {
  const [excluded, setExcluded] = useState(() => new Set())
  // rowIndex -> 'fix' | 'keep'
  const [decisions, setDecisions] = useState(() => ({}))

  const blockedByRow = useMemo(() => groupByRow(result.blocked), [result.blocked])
  const warnedByRow = useMemo(() => groupByRow(result.warned), [result.warned])

  const blockedRows = useMemo(() => [...blockedByRow.keys()].sort((a, b) => a - b), [blockedByRow])
  const warnedRows = useMemo(() => [...warnedByRow.keys()].sort((a, b) => a - b), [warnedByRow])

  const fixes = useMemo(() => {
    const map = {}
    warnedRows.forEach((row) => {
      const raw = warnedByRow.get(row)[0].rawValue
      const fix = proposedFixForRow(raw, symbology)
      if (fix !== String(raw)) map[row] = fix
    })
    return map
  }, [warnedRows, warnedByRow, symbology])

  const issueCount = blockedRows.length + warnedRows.length

  function toggleExclude(row) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(row)) next.delete(row)
      else next.add(row)
      return next
    })
  }

  function decide(row, choice) {
    setDecisions((prev) => ({ ...prev, [row]: choice }))
  }

  function fixAllWarnings() {
    setDecisions((prev) => {
      const next = { ...prev }
      warnedRows.forEach((row) => {
        next[row] = fixes[row] !== undefined ? 'fix' : 'keep'
      })
      return next
    })
  }

  const allBlockedHandled = blockedRows.every((row) => excluded.has(row))
  const allWarnedHandled = warnedRows.every((row) => excluded.has(row) || decisions[row])
  const canProceed = allBlockedHandled && allWarnedHandled

  const fixableCount = warnedRows.filter((row) => fixes[row] !== undefined && !excluded.has(row)).length

  function handleProceed() {
    const appliedFixes = {}
    warnedRows.forEach((row) => {
      if (!excluded.has(row) && decisions[row] === 'fix' && fixes[row] !== undefined) {
        appliedFixes[row] = fixes[row]
      }
    })
    onProceed({ excluded: [...excluded], fixes: appliedFixes })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-neutral-200 dark:border-neutral-700">

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-xl font-bold text-primary dark:text-[#E8E8E8]">
            We found {issueCount} issue{issueCount === 1 ? '' : 's'} in your data
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Fixing these now is cheaper than reprinting a roll of labels.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">

          {blockedRows.length > 0 && (
            <section>
              <h3 className="font-bold text-[15px] text-[var(--color-danger-text)]">
                Blocked — {blockedRows.length} row{blockedRows.length === 1 ? '' : 's'}
              </h3>
              <p className="text-[13px] text-neutral-600 dark:text-neutral-300 mt-1 mb-3">
                These rows cannot generate valid barcodes and must be excluded before you continue.
              </p>

              <div className="space-y-2">
                {blockedRows.map((row) => {
                  const isExcluded = excluded.has(row)
                  return (
                    <div
                      key={row}
                      className={`rounded-lg border p-3 transition-colors ${
                        isExcluded
                          ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40'
                          : 'border-[var(--color-danger-text)] bg-red-50 dark:bg-red-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                            Row {row + 2}
                          </div>
                          <RawValue>{blockedByRow.get(row)[0].displayValue}</RawValue>
                          <ul className="mt-1.5 space-y-0.5">
                            {blockedByRow.get(row).map((e) => (
                              <li key={e.rule} className="text-[13px] text-[var(--color-danger-text)] font-medium">
                                {e.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={() => toggleExclude(row)}
                          className={`shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                            isExcluded
                              ? 'border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                              : 'border-[var(--color-danger-text)] text-[var(--color-danger-text)] hover:bg-red-100 dark:hover:bg-red-900/40'
                          }`}
                        >
                          {isExcluded ? 'Excluded — undo' : 'Exclude row'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {warnedRows.length > 0 && (
            <section>
              <h3 className="font-bold text-[15px] text-[var(--color-accent-text)]">
                Warnings — {warnedRows.length} row{warnedRows.length === 1 ? '' : 's'}
              </h3>
              <p className="text-[13px] text-neutral-600 dark:text-neutral-300 mt-1 mb-3">
                These will print, but may not scan the way you expect. Choose per row — nothing is changed unless you say so.
              </p>

              <div className="space-y-2">
                {warnedRows.map((row) => {
                  const entries = warnedByRow.get(row)
                  const fix = fixes[row]
                  const isExcluded = excluded.has(row)
                  const choice = decisions[row]

                  return (
                    <div
                      key={row}
                      className={`rounded-lg border p-3 transition-colors ${
                        isExcluded
                          ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 opacity-70'
                          : choice
                            ? 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                            : 'border-accent bg-orange-50 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                        Row {row + 2}
                        {isExcluded && <span className="ml-2 font-normal">(excluded above)</span>}
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <RawValue>{entries[0].displayValue}</RawValue>
                        {fix !== undefined && (
                          <>
                            <span className="text-neutral-600 dark:text-neutral-300 text-[13px]">→</span>
                            <code className="font-mono text-[13px] break-all text-green-700 dark:text-green-400">
                              {fix === '' ? '(empty)' : fix}
                            </code>
                          </>
                        )}
                      </div>

                      <ul className="mt-1.5 space-y-0.5">
                        {entries.map((e) => (
                          <li key={e.rule} className="text-[13px] text-neutral-700 dark:text-neutral-300">
                            {e.message}
                          </li>
                        ))}
                      </ul>

                      {!isExcluded && (
                        <div className="flex gap-2 mt-2.5">
                          <button
                            onClick={() => decide(row, 'fix')}
                            disabled={fix === undefined}
                            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                              fix === undefined
                                ? 'border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                                : choice === 'fix'
                                  ? 'bg-accent text-white border-accent'
                                  : 'border-accent text-[var(--color-accent-text)] hover:bg-accent/10 dark:hover:bg-accent/20'
                            }`}
                          >
                            {choice === 'fix' ? '✓ Applying fix' : 'Accept fix'}
                          </button>
                          <button
                            onClick={() => decide(row, 'keep')}
                            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                              choice === 'keep'
                                ? 'bg-primary text-white border-primary dark:bg-neutral-600 dark:border-neutral-500'
                                : 'border-neutral-400 dark:border-neutral-500 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {choice === 'keep' ? '✓ Keeping original' : 'Keep original'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 shrink-0 flex items-center gap-3 flex-wrap">
          <div className="text-[13px] text-neutral-600 dark:text-neutral-300">
            {excluded.size > 0
              ? `${excluded.size} row${excluded.size === 1 ? '' : 's'} excluded`
              : 'No rows excluded'}
            {!canProceed && (
              <span className="block text-[var(--color-accent-text)] font-medium">
                {!allBlockedHandled
                  ? 'Exclude every blocked row to continue'
                  : 'Choose an action for every warning to continue'}
              </span>
            )}
          </div>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]"
            >
              Back to columns
            </button>
            {fixableCount > 0 && (
              <button
                onClick={fixAllWarnings}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-accent bg-white dark:bg-[#1C1C1C] text-[var(--color-accent-text)] hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-200 active:scale-[0.97]"
              >
                Fix all warnings ({fixableCount})
              </button>
            )}
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`px-6 py-2 text-sm rounded-lg font-semibold transition-all duration-200 ${
                canProceed
                  ? 'bg-accent text-white hover:bg-[#d96c1e] hover:shadow-md active:scale-[0.97]'
                  : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
              }`}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
