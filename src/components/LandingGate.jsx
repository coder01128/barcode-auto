export default function LandingGate({ onNeedBarcodes, onHaveBarcodes }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-[2.5rem] font-bold text-primary dark:text-[#E8E8E8] leading-tight">
          Spreadsheet to Labels. Instantly.
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
          Upload your stock spreadsheet, pick your columns, download print-ready labels in under 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <button
          onClick={onNeedBarcodes}
          className="text-left p-6 rounded-xl border-2 border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#FFD700" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-lg font-bold text-primary dark:text-[#E8E8E8]">I need barcodes</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Generate unique barcodes from your product list (SKU, product code, etc.), then create labels.
          </p>
        </button>

        <button
          onClick={onHaveBarcodes}
          className="text-left p-6 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 hover:border-accent dark:hover:border-accent hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-primary dark:text-[#E8E8E8]">I already have barcodes</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Your spreadsheet already has barcode numbers. Jump straight to building labels.
          </p>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-800 dark:text-green-300">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="font-medium">All processing happens in your browser. No data uploaded to servers.</span>
      </div>
    </div>
  )
}
