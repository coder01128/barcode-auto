function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0
  }
  return h
}

function skuToTenDigits(sku) {
  const str = String(sku).trim()
  if (/^\d+$/.test(str) && str.length <= 10) return str.padStart(10, '0')
  const h1 = djb2(str)
  const h2 = djb2(str.split('').reverse().join(''))
  return ((h1 % 100000) * 100000 + (h2 % 100000)).toString().padStart(10, '0')
}

function eanCheck(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return String((10 - (sum % 10)) % 10)
}

export function generateBarcodeValue(sku, format, usedCodes) {
  const str = String(sku).trim()

  if (format === 'code128') return str
  if (format === 'qrcode') return str
  if (format === 'code39') {
    const cleaned = str.toUpperCase().replace(/[^A-Z0-9\-\.\$\/%\+\s]/g, '')
    return cleaned || str.slice(0, 10).toUpperCase()
  }

  if (format === 'ean13') {
    const ten = skuToTenDigits(str)
    let base12 = '20' + ten
    let counter = 0
    while (usedCodes.has(base12)) {
      counter++
      base12 = '20' + String((parseInt(ten, 10) + counter) % 1e10).padStart(10, '0')
    }
    usedCodes.add(base12)
    return base12 + eanCheck(base12)
  }

  if (format === 'upca') {
    const ten = skuToTenDigits(str)
    let base11 = '2' + ten
    let counter = 0
    while (usedCodes.has(base11)) {
      counter++
      base11 = '2' + String((parseInt(ten, 10) + counter) % 1e10).padStart(10, '0')
    }
    usedCodes.add(base11)
    return base11 + eanCheck(base11)
  }

  return str
}

export function generateAllBarcodes(rows, skuCol, format) {
  const usedCodes = new Set()
  return rows.map(row => ({
    ...row,
    GENERATED_BARCODE: generateBarcodeValue(row[skuCol] ?? '', format, usedCodes),
  }))
}
