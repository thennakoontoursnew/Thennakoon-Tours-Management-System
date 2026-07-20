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
export function calculateRentalDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1
  try {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)

    // Reset time components to midnight UTC
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

    if (endUtc < startUtc) return 1

    const diffMs = endUtc - startUtc
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return diffDays + 1
  } catch {
    return 1
  }
}
