/**
 * Production-Hardened Relation & Data Unwrapping Utilities
 * Safely unwrap Supabase PostgREST foreign key joins (object, array, null, undefined)
 */

export function toSafeNumber(value: unknown): number {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num : 0
}

export function toSafeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback
  const str = String(value).trim()
  return str || fallback
}

export function toSafeDateString(value: unknown, fallback: string = 'N/A'): string {
  if (!value) return fallback
  const str = String(value).slice(0, 10)
  if (str.length === 10 && str.includes('-')) return str
  return fallback
}

export function unwrapSingleRelation<T extends object>(relation: unknown): T | null {
  if (!relation) return null
  if (Array.isArray(relation)) {
    const first = relation[0]
    if (first && typeof first === 'object') return first as T
    return null
  }
  if (typeof relation === 'object') return relation as T
  return null
}

export function unwrapArrayRelation<T extends object>(relation: unknown): T[] {
  if (!relation) return []
  if (Array.isArray(relation)) {
    return relation.filter((item): item is T => Boolean(item && typeof item === 'object'))
  }
  if (typeof relation === 'object') return [relation as T]
  return []
}

export function getCustomerName(customer: unknown, fallback: string = 'Customer'): string {
  const obj = unwrapSingleRelation<{ full_name?: string | null }>(customer)
  if (obj && typeof obj.full_name === 'string' && obj.full_name.trim()) {
    return obj.full_name.trim()
  }
  return fallback
}

export function getCustomerMobile(customer: unknown): string {
  const obj = unwrapSingleRelation<{ mobile?: string | null; whatsapp?: string | null }>(customer)
  if (obj) {
    if (typeof obj.mobile === 'string' && obj.mobile.trim()) return obj.mobile.trim()
    if (typeof obj.whatsapp === 'string' && obj.whatsapp.trim()) return obj.whatsapp.trim()
  }
  return ''
}

export function getInvoiceNumber(invoice: unknown, fallback: string | null = null): string | null {
  const obj = unwrapSingleRelation<{ invoice_number?: string | null }>(invoice)
  if (obj && typeof obj.invoice_number === 'string' && obj.invoice_number.trim()) {
    return obj.invoice_number.trim()
  }
  return fallback
}

export function getReceiptNumber(receipt: unknown, fallback: string | null = null): string | null {
  const list = unwrapArrayRelation<{ receipt_number?: string | null }>(receipt)
  if (list.length > 0 && typeof list[0].receipt_number === 'string' && list[0].receipt_number.trim()) {
    return list[0].receipt_number.trim()
  }
  const obj = unwrapSingleRelation<{ receipt_number?: string | null }>(receipt)
  if (obj && typeof obj.receipt_number === 'string' && obj.receipt_number.trim()) {
    return obj.receipt_number.trim()
  }
  return fallback
}

export function getReceiptId(receipt: unknown): string | null {
  const list = unwrapArrayRelation<{ id?: string | null }>(receipt)
  if (list.length > 0 && typeof list[0].id === 'string' && list[0].id.trim()) {
    return list[0].id.trim()
  }
  const obj = unwrapSingleRelation<{ id?: string | null }>(receipt)
  if (obj && typeof obj.id === 'string' && obj.id.trim()) {
    return obj.id.trim()
  }
  return null
}
