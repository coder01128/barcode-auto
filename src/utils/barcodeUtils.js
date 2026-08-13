export const BARCODE_TYPES = [
  { id: 'ean13', name: 'EAN-13', default: true },
  { id: 'code128', name: 'Code 128' },
  { id: 'upca', name: 'UPC-A' },
  { id: 'code39', name: 'Code 39' },
]

export function suggestBarcodeFormat(digitCount) {
  if (digitCount === 13) return 'ean13'
  if (digitCount === 12) return 'upca'
  return 'code128'
}
