/**
 * Central String & Date Utility Helpers
 */

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Returns standard ASCII ordinal suffix for a given day number (1..31).
 * Examples: 1 -> "st", 2 -> "nd", 3 -> "rd", 4 -> "th", 21 -> "st", 22 -> "nd", 23 -> "rd", 31 -> "st"
 */
export function getOrdinalSuffix(day: number): string {
  if (isNaN(day) || day < 1 || day > 31) return 'th'
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

/**
 * Legacy compatibility alias for getOrdinalSuffix.
 */
export function getOrdinalSuperscriptSuffix(day: number): string {
  return getOrdinalSuffix(day)
}

/**
 * Formats a day number with its ordinal suffix.
 * Example: 26 -> "26th", 1 -> "1st", 2 -> "2nd", 3 -> "3rd"
 */
export function formatDayOrdinal(day: number): string {
  return `${day}${getOrdinalSuffix(day)}`
}

/**
 * Legacy compatibility alias for formatDayOrdinal.
 */
export function formatDayOrdinalUnicode(day: number): string {
  return formatDayOrdinal(day)
}

/**
 * Standardized System-Wide Plain Text Ordinal Date Formatter
 * Output format: [D][st/nd/rd/th] [Mon] [YYYY]
 * Examples: "28th Aug 2026", "1st Sep 2026", "2nd Oct 2026", "3rd Nov 2026"
 */
export function formatDateOrdinal(val: unknown): string {
  if (val === null || val === undefined || val === '') return ''
  try {
    const str = String(val).trim()
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return ''

    // If YYYY-MM-DD string without time, parse parts directly to prevent UTC timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number)
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${d}${getOrdinalSuffix(d)} ${MONTH_NAMES_SHORT[m - 1]} ${y}`
      }
    }

    const dateObj = new Date(str)
    if (isNaN(dateObj.getTime())) return ''

    const day = dateObj.getDate()
    const month = MONTH_NAMES_SHORT[dateObj.getMonth()]
    const year = dateObj.getFullYear()

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`
  } catch {
    return ''
  }
}

/**
 * Legacy compatibility alias for formatDateOrdinal.
 */
export function formatDateOrdinalUnicode(val: unknown): string {
  return formatDateOrdinal(val)
}

/**
 * Formats a rental period with plain text ordinal dates and inclusive day count.
 * Example: "28th Aug 2026 to 27th Sep 2026 (30 Days)"
 */
export function formatRentalPeriodOrdinal(
  startDateStr: unknown,
  endDateStr: unknown,
  days?: number | null
): string {
  const startFmt = formatDateOrdinal(startDateStr)
  const endFmt = formatDateOrdinal(endDateStr)

  if (!startFmt && !endFmt) return ''
  if (startFmt && !endFmt) return startFmt
  if (!startFmt && endFmt) return endFmt

  const totalDays = days && days > 0 ? days : calculateRentalDays(String(startDateStr), String(endDateStr))
  return `${startFmt} to ${endFmt} (${totalDays} Days)`
}

/**
 * Legacy compatibility alias for formatRentalPeriodOrdinal.
 */
export function formatRentalPeriodOrdinalUnicode(
  startDateStr: unknown,
  endDateStr: unknown,
  days?: number | null
): string {
  return formatRentalPeriodOrdinal(startDateStr, endDateStr, days)
}

/**
 * Normalizes literal '\\n' strings into actual line break characters ('\n').
 * Ensures textareas and PDFs render proper line breaks without literal backslash-n artifacts.
 */
export function normalizeNewlines(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/\\n/g, '\n')
}

/**
 * Calculates rental days between start and end date strings (YYYY-MM-DD).
 * Rule: Same start and end date = 1 rental day.
 * Inclusive calendar-day calculation: July 15 to July 16 = 2 days.
 */
export function calculateRentalDays(startDateStr: string | null | undefined, endDateStr: string | null | undefined): number {
  if (!startDateStr || !endDateStr) return 1
  try {
    const sClean = String(startDateStr).split('T')[0]
    const eClean = String(endDateStr).split('T')[0]
    const sParts = sClean.split('-').map(Number)
    const eParts = eClean.split('-').map(Number)
    if (sParts.length < 3 || eParts.length < 3 || sParts.some(isNaN) || eParts.some(isNaN)) return 1

    const startUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2])
    const endUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2])

    if (endUtc < startUtc) return 1

    const diffMs = endUtc - startUtc
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    return diffDays + 1
  } catch {
    return 1
  }
}

/**
 * Normalizes Sri Lankan phone numbers into international country code format (94XXXXXXXXX).
 */
export function normalizeSriLankanPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  let clean = String(phone).replace(/[^0-9]/g, '')
  if (!clean) return ''

  if (clean.startsWith('94') && clean.length >= 11) {
    return clean
  }

  if (clean.startsWith('0')) {
    return '94' + clean.slice(1)
  }

  if (clean.length === 9 && clean.startsWith('7')) {
    return '94' + clean
  }

  return clean
}

/**
 * Builds the standard pre-filled WhatsApp quotation message text.
 */
export function buildWhatsAppQuotationMessage(quotation: any, companyName: string = 'Thennakoon Tours'): string {
  const customerName = quotation?.customer?.full_name || 'Valued Customer'
  const quotationNumber = quotation?.quotation_number || 'N/A'
  const grandTotal = Number(quotation?.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
  const rentalStart = formatDateOrdinal(quotation?.rental_start_date) || 'N/A'
  const rentalEnd = formatDateOrdinal(quotation?.rental_end_date) || 'N/A'

  return `Hello ${customerName},\n\nPlease find your Quotation (${quotationNumber}) details:\n\nAmount: LKR ${grandTotal}\n\nRental Dates:\n${rentalStart} to ${rentalEnd}\n\nThank you,\n${companyName}`
}

export function buildWhatsAppQuotationUrl(quotation: any, companyName: string = 'Thennakoon Tours'): string {
  const messageText = buildWhatsAppQuotationMessage(quotation, companyName)
  const cust = quotation?.customer || {}
  
  const rawPhone =
    cust.whatsapp ||
    quotation?.whatsapp_snapshot ||
    cust.mobile_phone ||
    cust.mobile ||
    cust.phone ||
    quotation?.customer_phone ||
    ''

  const phone = normalizeSriLankanPhone(rawPhone)
  const encodedMsg = encodeURIComponent(messageText)

  const url = phone
    ? `https://wa.me/${phone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`

  return url
}
