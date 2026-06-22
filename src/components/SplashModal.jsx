import { useState } from 'react'

const SPLASH_KEY = 'barcodeAuto_splashDismissed'

export default function SplashModal({ onDismiss }) {
  const [dontShow, setDontShow] = useState(false)

  function handleOK() {
    if (dontShow) localStorage.setItem(SPLASH_KEY, 'true')
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-[#2D2D2D] border border-[#FFD700]/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 mb-4">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FFD700" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Welcome to BarcodeAuto</h2>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Turn any spreadsheet into print-ready barcode labels in under 60 seconds.
            <br />No signup. No server uploads. Everything runs in your browser.
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 text-sm text-neutral-400 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="rounded accent-[#FFD700]"
          />
          Don't show again
        </label>

        <button
          onClick={handleOK}
          className="w-full py-3 bg-[#FFD700] text-[#2D2D2D] font-bold rounded-xl hover:bg-[#FFDF00] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-200 active:scale-[0.98]"
        >
          OK, let's go →
        </button>
      </div>
    </div>
  )
}
