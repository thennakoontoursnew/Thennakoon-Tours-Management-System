// Utility: Date string YYYY-MM-DD in Asia/Colombo timezone (+05:30)
export function getColomboTodayString(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '08'
  const day = parts.find((p) => p.type === 'day')?.value || '07'
  return `${year}-${month}-${day}`
}

// Utility: ISO Start & End timestamps for Asia/Colombo timezone (+05:30)
export function getColomboDayBounds(dateStr?: string) {
  const targetDateStr = dateStr || getColomboTodayString()
  const startIso = `${targetDateStr}T00:00:00.000+05:30`
  const endIso = `${targetDateStr}T23:59:59.999+05:30`
  return { startIso, endIso, targetDateStr }
}
