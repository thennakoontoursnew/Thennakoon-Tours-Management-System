/**
 * Central String & Date Utility Helpers
 */

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
