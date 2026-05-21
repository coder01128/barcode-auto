export const BARCODE_TYPES = [
  { id: 'ean13', name: 'EAN-13', default: true },
  { id: 'code128', name: 'Code 128' },
  { id: 'upca', name: 'UPC-A' },
  { id: 'code39', name: 'Code 39' },
  { id: 'qrcode', name: 'QR Code' },
]

export function suggestBarcodeFormat(digitCount) {
  if (digitCount === 13) return 'ean13'
  if (digitCount === 12) return 'upca'
  return 'code128'
}

export function validateBarcode(value, format) {
  if (!value || String(value).trim() === '') return { valid: false, reason: 'Empty' }
  const str = String(value).replace(/\s/g, '')
  if (format === 'ean13') {
    if (!/^\d{13}$/.test(str)) return { valid: false, reason: 'Must be 13 digits' }
    return { valid: isValidEANChecksum(str), reason: 'Invalid checksum' }
  }
  if (format === 'upca') {
    if (!/^\d{12}$/.test(str)) return { valid: false, reason: 'Must be 12 digits' }
    return { valid: isValidEANChecksum(str), reason: 'Invalid checksum' }
  }
  if (format === 'code128') {
    return { valid: str.length > 0 && str.length <= 80, reason: 'Must be 1-80 chars' }
  }
  if (format === 'code39') {
    return { valid: /^[A-Z0-9\-\.\$\/%\+\s]+$/.test(str), reason: 'Invalid characters for Code 39' }
  }
  return { valid: true }
}

function isValidEANChecksum(code) {
  let sum = 0
  for (let i = 0; i < code.length - 1; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  return check === parseInt(code[code.length - 1])
}
