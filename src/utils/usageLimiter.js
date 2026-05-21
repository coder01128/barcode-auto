const STORAGE_KEY = 'barcodeauto_usage'
const FREE_LIMIT = 1000

export function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, sessionId: null }
    const data = JSON.parse(raw)
    return data
  } catch {
    return { count: 0, sessionId: null }
  }
}

export function incrementUsage() {
  const usage = getUsage()
  usage.count += 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage))
  return usage.count
}

export function canGenerate() {
  const usage = getUsage()
  return usage.count < FREE_LIMIT
}

export function remainingLabels() {
  const usage = getUsage()
  return Math.max(0, FREE_LIMIT - usage.count)
}
