import { useState, useMemo } from 'react'
import { toDisplayValue } from '../utils/barcodeValidator'

/**
 * Shown on the "I need barcodes" path when the chosen source column repeats a
 * value. The generator derives each barcode from this column, so repeats mean
 * two different products end up carrying the same code.
 *
 * A group counts as resolved once at most one row in it survives - excluding
 * one row out of three still leaves two products sharing a barcode.
 */
export default function DuplicateSourceGate({ groups, column, onProceed, onCancel }) {
  const [excluded, setExcluded] = useState(() => new Set())
  const [keepAll, setKeepAll] = useState(false)

  const affectedRows = useMemo(
    () => groups.reduce((n, g) => n + g.rows.length, 0),
    [groups],
  )

  function toggleExclude(row) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(row)) next.delete(row)
      else next.add(row)
      return next
    })
  }

  const unresolved = groups.filter(
    (g) => g.rows.filter((r) => !excluded.has(r)).length > 1,
  ).length

  const canProceed = keepAll || unresolved === 0

  function handleProceed() {
    onProceed({ excluded: keepAll ? [] : [...excluded], keepAll })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-neutral-200 dark:border-neutral-700">

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-xl font-bold text-primary dark:text-[#E8E8E8]">
            {affectedRows} rows share a value in "{column}"
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            These rows have identical values in your source column. Generating barcodes
            from them will produce duplicate barcodes for different products.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {groups.map((group) => {
            const remaining = group.rows.filter((r) => !excluded.has(r)).length
            const resolved = keepAll || remaining <= 1

            return (
              <section
                key={group.value}
                className={`rounded-lg border p-3 transition-colors ${
                  resolved
                    ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40'
                    : 'border-[var(--color-danger-text)] bg-red-50 dark:bg-red-950/30'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                  <code className="font-mono text-[13px] font-semibold break-all text-neutral-800 dark:text-neutral-100">
                    {toDisplayValue(group.value)}
                  </code>
                  <span
                    className={`text-[13px] font-semibold ${
                      resolved
                        ? 'text-neutral-600 dark:text-neutral-300'
                        : 'text-[var(--color-danger-text)]'
                    }`}
                  >
                    {resolved
                      ? keepAll
                        ? `${group.rows.length} rows kept`
                        : 'Resolved'
                      : `${remaining} rows still share this value`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.rows.map((row) => {
                    const isExcluded = excluded.has(row)
                    return (
                      <div
                        key={row}
                        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-1.5 ${
                          isExcluded
                            ? 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 opacity-70'
                            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                        }`}
                      >
                        <span className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
                          Row {row + 2}
                          {isExcluded && <span className="ml-2 font-normal">excluded</span>}
                        </span>
                        <button
                          onClick={() => toggleExclude(row)}
                          disabled={keepAll}
                          className={`shrink-0 px-3 py-1 text-[13px] font-semibold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                            keepAll
                              ? 'border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                              : isExcluded
                                ? 'border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                : 'border-[var(--color-danger-text)] text-[var(--color-danger-text)] hover:bg-red-100 dark:hover:bg-red-900/40'
                          }`}
                        >
                          {isExcluded ? 'Undo' : 'Exclude row'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* Deliberate escape hatch - some people really do want repeated codes */}
          <label className="flex items-start gap-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
            <input
              type="checkbox"
              checked={keepAll}
              onChange={(e) => setKeepAll(e.target.checked)}
              className="mt-0.5 accent-[#E87A2D]"
            />
            <span className="text-[13px] text-neutral-700 dark:text-neutral-200">
              <span className="font-semibold">Keep all — I want duplicate barcodes.</span>{' '}
              Choose this if the repeated rows really are the same product and you want
              them to scan identically.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 shrink-0 flex items-center gap-3 flex-wrap">
          <div className="text-[13px] text-neutral-600 dark:text-neutral-300">
            {keepAll
              ? 'Keeping every row, duplicates included'
              : excluded.size > 0
                ? `${excluded.size} row${excluded.size === 1 ? '' : 's'} excluded`
                : 'No rows excluded'}
            {!canProceed && (
              <span className="block text-[var(--color-accent-text)] font-medium">
                {unresolved} group{unresolved === 1 ? '' : 's'} still unresolved
              </span>
            )}
          </div>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-neutral-200 transition-all duration-200 active:scale-[0.97]"
            >
              Back
            </button>
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
