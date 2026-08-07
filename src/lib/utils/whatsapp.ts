export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')

  // If phone starts with '0' (e.g. 0771234567), replace leading 0 with Sri Lanka country code 94
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.slice(1)
  }

  // If phone is 9 digits (e.g. 771234567), prepend 94
  if (cleaned.length === 9 && !cleaned.startsWith('94')) {
    cleaned = '94' + cleaned
  }

  return cleaned
}
