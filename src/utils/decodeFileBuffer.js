// SheetJS falls back to cp1252 when handed the raw bytes of a CSV that has no
// UTF-8 BOM. A non-breaking space (0xC2 0xA0) then arrives as "Â ", and smart
// quotes as "â€œ" -- which matters here because the validation gate exists
// specifically to catch NBSP and smart punctuation. Mojibake hides them.
//
// Fix: decode text formats ourselves and hand SheetJS a proper string.
// Binary workbook formats are left alone -- they carry their own encoding.

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04] // .xlsx (and any zip)
const OLE2_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] // legacy .xls
const UTF8_BOM = [0xef, 0xbb, 0xbf]

function startsWith(bytes, signature) {
  if (bytes.length < signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false
  }
  return true
}

/**
 * Decide how a dropped file should be handed to SheetJS.
 *
 * Detection is by magic bytes rather than file extension: drag-and-drop
 * ignores the input's `accept` list, so the extension may be absent or wrong.
 *
 * @param {ArrayBuffer} buffer
 * @returns {{ mode: 'binary', data: Uint8Array }
 *          |{ mode: 'text', data: string, encoding: 'utf-8'|'windows-1252' }}
 */
export function decodeFileBuffer(buffer) {
  const bytes = new Uint8Array(buffer)

  // Binary workbook formats: hand the bytes over untouched.
  if (startsWith(bytes, ZIP_MAGIC) || startsWith(bytes, OLE2_MAGIC)) {
    return { mode: 'binary', data: bytes }
  }

  // Everything else is treated as text: CSV, TSV, or anything plain dragged in.
  const body = startsWith(bytes, UTF8_BOM) ? bytes.subarray(3) : bytes

  try {
    // fatal:true makes this a test, not just a decode -- invalid UTF-8 throws
    // instead of silently producing replacement characters.
    return {
      mode: 'text',
      data: new TextDecoder('utf-8', { fatal: true }).decode(body),
      encoding: 'utf-8',
    }
  } catch {
    // Genuinely legacy file. Decode it as cp1252 rather than forcing UTF-8.
    return {
      mode: 'text',
      data: new TextDecoder('windows-1252').decode(body),
      encoding: 'windows-1252',
    }
  }
}
