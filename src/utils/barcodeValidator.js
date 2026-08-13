// Pre-flight validation for barcode values pulled from a user spreadsheet.
//
// Two severities:
//   BLOCKED - the value cannot produce a scannable barcode. Generation is
//             refused until the row is excluded.
//   WARNED  - the value will encode, but something about it is likely to
//             bite the user at the POS. Never fixed silently: the caller
//             must confirm each row. A trailing space may genuinely be part
//             of the value stored in the POS database, so trimming it
//             without asking would break the lookup it was meant to fix.
//
// Every pattern below uses \u escapes on purpose - the characters this module
// hunts for are invisible, and literal ones in the source cannot be reviewed.

const ZERO_WIDTH_CHARS = ['\u200B', '\u200C', '\u200D', '\uFEFF']

// Alternation rather than a character class: U+200D is a joiner, and linters
// rightly flag it inside a class as ambiguous with emoji sequences.
const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF/
const ZERO_WIDTH_RE_G = /\u200B|\u200C|\u200D|\uFEFF/g
const NBSP_RE = /\u00A0/
const NBSP_RE_G = /\u00A0/g
const SMART_RE = /[\u2018\u2019\u201C\u201D\u2013\u2014]/
const SMART_RE_G = /[\u2018\u2019\u201C\u201D\u2013\u2014]/g
// ASCII 0-31 except 9 (tab) and 10 (line feed), which surface as whitespace instead.
// Matching control characters is the whole point of this rule, hence the disable.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B-\u001F]/
// eslint-disable-next-line no-control-regex
const CONTROL_RE_G = /[\u0000-\u0008\u000B-\u001F]/g
const SCIENTIFIC_RE = /^\d+\.?\d*[eE]\+?\d+$/
const CODE39_RE = /^[0-9A-Z \-.$/+%]*$/

const SMART_MAP = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
}

/**
 * Strip every issue that has a mechanical fix. Used both as the proposed
 * row-level fix and as the basis for structural checks, so a stray
 * non-breaking space surfaces as a fixable warning rather than an
 * unexplained "invalid character" block.
 */
export function normalizeValue(raw) {
  return String(raw ?? '')
    .replace(ZERO_WIDTH_RE_G, '')
    .replace(NBSP_RE_G, ' ')
    .replace(SMART_RE_G, (c) => SMART_MAP[c])
    .replace(CONTROL_RE_G, '')
    .trim()
}

/**
 * The single fix offered for a row, covering every fixable warning on it at
 * once. Returns the raw value unchanged when nothing is mechanically fixable
 * (scientific notation and long numerics are flagged for review, not rewritten).
 */
export function proposedFixForRow(raw, symbology) {
  const normalized = normalizeValue(raw)
  return symbology === 'code39' ? normalized.toUpperCase() : normalized
}

/** Render invisible characters so the user can see what is actually in the cell. */
export function toDisplayValue(raw) {
  const str = String(raw ?? '')
  const lead = (str.match(/^ +/) || [''])[0].length
  const trail = (str.match(/ +$/) || [''])[0].length

  let out = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const code = str.charCodeAt(i)
    const isEdgeSpace = ch === ' ' && (i < lead || i >= str.length - trail)

    if (isEdgeSpace) out += '·'
    else if (code === 0x00a0) out += '⎵'
    else if (ZERO_WIDTH_CHARS.includes(ch)) out += '[ZWS]'
    else if (ch === '\t') out += '[TAB]'
    else if (ch === '\n' || ch === '\r') out += '⏎'
    else if (code < 32) out += `[0x${code.toString(16).toUpperCase().padStart(2, '0')}]`
    else out += ch
  }
  return out
}

/** Mod-10 check digit used by both EAN-13 and UPC-A. */
function checkDigit(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3)
  }
  return String((10 - (sum % 10)) % 10)
}

function hasValidCheckDigit(code) {
  return checkDigit(code.slice(0, -1)) === code.slice(-1)
}

function entry(rowIndex, rawValue, rule, message, proposedFix) {
  return {
    rowIndex,
    rawValue,
    displayValue: toDisplayValue(rawValue),
    rule,
    message,
    proposedFix,
  }
}

function plural(n) {
  return n === 1 ? '' : 's'
}

function quoteList(chars) {
  return [...new Set(chars)].map((c) => `"${c}"`).join(', ')
}

/** Structural checks - run against the normalized value. */
function findBlockingIssue(rowIndex, raw, normalized, symbology) {
  if (normalized === '') {
    return entry(rowIndex, raw, 'EMPTY', 'Value is empty or only whitespace', null)
  }

  if (symbology === 'ean13') {
    if (!/^\d{12,13}$/.test(normalized)) {
      return entry(rowIndex, raw, 'EAN13_LENGTH',
        `EAN-13 needs exactly 12 or 13 digits - this has ${normalized.length} character${plural(normalized.length)}`, null)
    }
    if (normalized.length === 13 && !hasValidCheckDigit(normalized)) {
      const correct = checkDigit(normalized.slice(0, 12))
      return entry(rowIndex, raw, 'EAN13_CHECKSUM',
        `Check digit is wrong - should be ${correct}, not ${normalized[12]}`,
        normalized.slice(0, 12) + correct)
    }
  }

  if (symbology === 'upca') {
    if (!/^\d{11,12}$/.test(normalized)) {
      return entry(rowIndex, raw, 'UPCA_LENGTH',
        `UPC-A needs exactly 11 or 12 digits - this has ${normalized.length} character${plural(normalized.length)}`, null)
    }
    if (normalized.length === 12 && !hasValidCheckDigit(normalized)) {
      const correct = checkDigit(normalized.slice(0, 11))
      return entry(rowIndex, raw, 'UPCA_CHECKSUM',
        `Check digit is wrong - should be ${correct}, not ${normalized[11]}`,
        normalized.slice(0, 11) + correct)
    }
  }

  if (symbology === 'code39') {
    const upper = normalized.toUpperCase()
    if (!CODE39_RE.test(upper)) {
      const bad = [...upper].filter((c) => !CODE39_RE.test(c))
      return entry(rowIndex, raw, 'CODE39_INVALID',
        `Code 39 cannot encode ${quoteList(bad)} - allowed: 0-9 A-Z space - . $ / + %`, null)
    }
  }

  if (symbology === 'code128') {
    const bad = [...normalized].filter((c) => c.charCodeAt(0) > 127)
    if (bad.length > 0) {
      return entry(rowIndex, raw, 'CODE128_INVALID',
        `Code 128 cannot encode non-ASCII character${plural(bad.length)} ${quoteList(bad)}`, null)
    }
  }

  return null
}

/** Cosmetic / invisible-character checks - run against the raw value. */
function findWarnings(rowIndex, raw, normalized, symbology) {
  const warnings = []
  const str = String(raw ?? '')

  if (str !== str.trim()) {
    warnings.push(entry(rowIndex, raw, 'WHITESPACE',
      'Leading or trailing whitespace - scanners encode it, but your POS lookup may not expect it',
      normalized))
  }
  if (NBSP_RE.test(str)) {
    warnings.push(entry(rowIndex, raw, 'NBSP',
      'Contains a non-breaking space (U+00A0), usually pasted from a web page or Word',
      normalized))
  }
  if (ZERO_WIDTH_RE.test(str)) {
    warnings.push(entry(rowIndex, raw, 'ZERO_WIDTH',
      'Contains zero-width characters that are invisible in your spreadsheet',
      normalized))
  }
  if (SMART_RE.test(str)) {
    warnings.push(entry(rowIndex, raw, 'SMART_PUNCTUATION',
      'Contains smart quotes or dashes - autocorrect usually causes this',
      normalized))
  }
  if (SCIENTIFIC_RE.test(str)) {
    warnings.push(entry(rowIndex, raw, 'SCIENTIFIC_NOTATION',
      'Looks like scientific notation - confirm this is the literal barcode and not a number your spreadsheet reformatted',
      null))
  }
  if (/^\d{16,}$/.test(str)) {
    warnings.push(entry(rowIndex, raw, 'LONG_NUMERIC',
      `${str.length}-digit number - long numerics are easily rounded by spreadsheet software, so check it against the source`,
      null))
  }
  if (symbology === 'code39' && /[a-z]/.test(str)) {
    warnings.push(entry(rowIndex, raw, 'CODE39_LOWERCASE',
      'Code 39 only supports uppercase - the encoded barcode will differ from your spreadsheet',
      normalized.toUpperCase()))
  }
  if (CONTROL_RE.test(str)) {
    warnings.push(entry(rowIndex, raw, 'CONTROL_CHAR',
      'Control characters can cause scanners to inject keystrokes or submit POS forms',
      normalized))
  }

  return warnings
}

/**
 * @param {string[]} values     barcode column value per row, in row order
 * @param {string} symbology    one of: ean13 | upca | code128 | code39
 * @returns {{ blocked: object[], warned: object[], clean: number[] }}
 */
export function validateBarcodeData(values, symbology) {
  const list = Array.isArray(values) ? values : []
  const normalized = list.map((v) => normalizeValue(v))

  // Duplicates compare on the normalized value: two rows differing only by a
  // trailing space would scan identically at the till.
  const counts = new Map()
  normalized.forEach((n) => {
    if (n !== '') counts.set(n, (counts.get(n) || 0) + 1)
  })

  const blocked = []
  const warned = []
  const clean = []

  list.forEach((raw, i) => {
    const norm = normalized[i]
    const rowBlocked = []

    const structural = findBlockingIssue(i, raw, norm, symbology)
    if (structural) rowBlocked.push(structural)

    if (norm !== '' && counts.get(norm) > 1) {
      rowBlocked.push(entry(i, raw, 'DUPLICATE',
        `This barcode appears on ${counts.get(norm)} rows - duplicates make stock items indistinguishable at the till`, null))
    }

    const rowWarnings = findWarnings(i, raw, norm, symbology)

    if (rowBlocked.length > 0) blocked.push(...rowBlocked)
    if (rowWarnings.length > 0) warned.push(...rowWarnings)
    if (rowBlocked.length === 0 && rowWarnings.length === 0) clean.push(i)
  })

  return { blocked, warned, clean }
}
