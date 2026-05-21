import { canGenerate, remainingLabels } from '../utils/usageLimiter'

export default function UsageLimiter({ labelCount, onUpgrade }) {
  if (canGenerate()) return null

  return (
    <div className="bg-white rounded-lg border-2 border-accent p-6 text-center space-y-3">
      <h3 className="text-lg font-bold">Free limit reached</h3>
      <p className="text-sm text-gray-600">
        You&apos;ve used all {1000} labels in this session. Upgrade for unlimited labels.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onUpgrade}
          className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-[#d96c1e] transition-colors"
        >
          Single batch — $1.99
        </button>
        <button className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Pro Monthly — $9.99/mo
        </button>
      </div>
    </div>
  )
}
