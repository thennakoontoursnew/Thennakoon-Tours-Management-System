'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { quotationSchema } from '@/lib/validations/sales-documents'
import { normalizeNewlines, calculateRentalDays } from '@/lib/utils/formatters'
import { z } from 'zod'

type QuotationInput = z.infer<typeof quotationSchema>

function sanitizePayload(obj: Record<string, any>) {
  const clean: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === '') {
      clean[key] = null
    } else if (typeof value === 'string') {
      clean[key] = normalizeNewlines(value.trim()) || null
    } else {
      clean[key] = value
    }
  }
  return clean
}

export async function createQuotation(values: QuotationInput) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = quotationSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { items, ...headerData } = parsed.data

    const canonicalDays = calculateRentalDays(headerData.rental_start_date, headerData.rental_end_date)
    let subtotal = 0
    const processedItems = items.map((item) => {
      const numDays = canonicalDays
      const baseLineTotal = Number(numDays) * Number(item.unit_rate) * Number(item.quantity || 1)
      const lineTotal = baseLineTotal + Number(item.driver_charge || 0) + Number(item.additional_charge || 0)
      subtotal += lineTotal
      return {
        ...item,
        number_of_days: numDays,
        line_total: lineTotal,
      }
    })

    let discountAmount = 0
    if (headerData.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(headerData.discount_value || 0)) / 100
    } else if (headerData.discount_type === 'fixed') {
      discountAmount = Number(headerData.discount_value || 0)
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount + Number(headerData.additional_charges || 0))
    const taxAmount = (taxableAmount * Number(headerData.tax_rate || 0)) / 100
    const grandTotal = taxableAmount + taxAmount + Number(headerData.refundable_deposit || 0)

    const year = new Date().getFullYear()
    const { data: maxQt } = await supabase
      .from('quotations')
      .select('quotation_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextSeq = 1
    if (maxQt?.quotation_number) {
      const parts = maxQt.quotation_number.split('-')
      const lastSeq = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
    }
    const quotationNumber = `QT-${year}-${String(nextSeq).padStart(6, '0')}`

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      quotation_number: quotationNumber,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      prepared_by: user.id,
      created_by: user.id,
      updated_by: user.id,
      special_notes: normalizeNewlines(headerData.special_notes),
      important_message: normalizeNewlines(headerData.important_message),
      bank_account_name_snapshot: headerData.bank_account_name_snapshot,
      bank_name_snapshot: headerData.bank_name_snapshot,
      bank_branch_snapshot: headerData.bank_branch_snapshot,
      bank_account_number_snapshot: headerData.bank_account_number_snapshot,
      bank_swift_code_snapshot: headerData.bank_swift_code_snapshot,
      payment_instructions_snapshot: normalizeNewlines(headerData.payment_instructions_snapshot),
      prepared_by_name_snapshot: headerData.prepared_by_name_snapshot,
      prepared_by_designation_snapshot: headerData.prepared_by_designation_snapshot,
      company_name_snapshot: headerData.company_name_snapshot,
      terms_and_conditions_snapshot: normalizeNewlines(headerData.terms_and_conditions_snapshot),
    }

    const { data: quotation, error: insertError } = await supabase
      .from('quotations')
      .insert(payload)
      .select()
      .single()

    if (insertError || !quotation) {
      return { success: false, error: insertError?.message || 'Failed to create quotation record.' }
    }

    const itemRows = processedItems.map((it) => ({
      quotation_id: quotation.id,
      ...sanitizePayload(it),
    }))

    const { error: itemsError } = await supabase.from('quotation_items').insert(itemRows)
    if (itemsError) {
      await supabase.from('quotations').delete().eq('id', quotation.id)
      return { success: false, error: `Failed to insert quotation line items: ${itemsError.message}` }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_QUOTATION',
      p_entity_type: 'quotation',
      p_entity_id: quotation.id,
      p_description: `Created quotation ${quotation.quotation_number}`,
    })

    revalidatePath('/dashboard/quotations')
    revalidatePath('/dashboard')
    return { success: true, quotationId: quotation.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create quotation.' }
  }
}

export async function updateQuotation(id: string, values: QuotationInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: existing } = await supabase
      .from('quotations')
      .select('status')
      .eq('id', id)
      .single()

    if (existing?.status === 'accepted') {
      return { success: false, error: 'Accepted quotations are locked from editing.' }
    }

    const parsed = quotationSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { items, ...headerData } = parsed.data

    const canonicalDays = calculateRentalDays(headerData.rental_start_date, headerData.rental_end_date)
    let subtotal = 0
    const processedItems = items.map((item) => {
      const numDays = canonicalDays
      const baseLineTotal = Number(numDays) * Number(item.unit_rate) * Number(item.quantity || 1)
      const lineTotal = baseLineTotal + Number(item.driver_charge || 0) + Number(item.additional_charge || 0)
      subtotal += lineTotal
      return {
        ...item,
        number_of_days: numDays,
        line_total: lineTotal,
      }
    })

    let discountAmount = 0
    if (headerData.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(headerData.discount_value || 0)) / 100
    } else if (headerData.discount_type === 'fixed') {
      discountAmount = Number(headerData.discount_value || 0)
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount + Number(headerData.additional_charges || 0))
    const taxAmount = (taxableAmount * Number(headerData.tax_rate || 0)) / 100
    const grandTotal = taxableAmount + taxAmount + Number(headerData.refundable_deposit || 0)

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      updated_by: user.id,
      special_notes: normalizeNewlines(headerData.special_notes),
      important_message: normalizeNewlines(headerData.important_message),
      bank_account_name_snapshot: headerData.bank_account_name_snapshot,
      bank_name_snapshot: headerData.bank_name_snapshot,
      bank_branch_snapshot: headerData.bank_branch_snapshot,
      bank_account_number_snapshot: headerData.bank_account_number_snapshot,
      bank_swift_code_snapshot: headerData.bank_swift_code_snapshot,
      payment_instructions_snapshot: normalizeNewlines(headerData.payment_instructions_snapshot),
      prepared_by_name_snapshot: headerData.prepared_by_name_snapshot,
      prepared_by_designation_snapshot: headerData.prepared_by_designation_snapshot,
      company_name_snapshot: headerData.company_name_snapshot,
      terms_and_conditions_snapshot: normalizeNewlines(headerData.terms_and_conditions_snapshot),
    }

    const { error: updateError } = await supabase
      .from('quotations')
      .update(payload)
      .eq('id', id)

    if (updateError) return { success: false, error: updateError.message }

    await supabase.from('quotation_items').delete().eq('quotation_id', id)
    const itemRows = processedItems.map((it) => ({
      quotation_id: id,
      ...sanitizePayload(it),
    }))
    await supabase.from('quotation_items').insert(itemRows)

    revalidatePath('/dashboard/quotations')
    revalidatePath(`/dashboard/quotations/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update quotation.' }
  }
}

export async function changeQuotationStatus(id: string, newStatus: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('quotations')
      .update({ status: newStatus, updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/quotations/${id}`)
    revalidatePath('/dashboard/quotations')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function duplicateQuotation(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: orig, error: fetchErr } = await supabase
      .from('quotations')
      .select('*, items:quotation_items(*)')
      .eq('id', id)
      .single()

    if (fetchErr || !orig) return { success: false, error: 'Original quotation not found.' }

    const year = new Date().getFullYear()
    const { data: maxQt } = await supabase
      .from('quotations')
      .select('quotation_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextSeq = 1
    if (maxQt?.quotation_number) {
      const parts = maxQt.quotation_number.split('-')
      const lastSeq = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
    }
    const newQuotationNumber = `QT-${year}-${String(nextSeq).padStart(6, '0')}`

    const { id: _, created_at: __, updated_at: ___, quotation_number: ____, items: origItems, ...headerCopy } = orig

    const payload = {
      ...headerCopy,
      quotation_number: newQuotationNumber,
      status: 'draft',
      created_by: user.id,
      updated_by: user.id,
      prepared_by: user.id,
    }

    const { data: newQt, error: insErr } = await supabase
      .from('quotations')
      .insert(payload)
      .select()
      .single()

    if (insErr || !newQt) return { success: false, error: insErr?.message || 'Failed to duplicate quotation.' }

    if (origItems && origItems.length > 0) {
      const itemRows = origItems.map((it: any) => {
        const { id: itemUuid, quotation_id: origId, created_at: cat, updated_at: uat, ...itemData } = it
        return {
          quotation_id: newQt.id,
          ...itemData,
        }
      })
      await supabase.from('quotation_items').insert(itemRows)
    }

    revalidatePath('/dashboard/quotations')
    return { success: true, quotationId: newQt.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to duplicate quotation.' }
  }
}

export async function convertQuotationToBooking(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: res, error: rpcErr } = await supabase.rpc('convert_quotation_to_booking_rpc', {
      p_quotation_id: id,
      p_user_id: user.id,
    })

    if (rpcErr || !res || !res.success) {
      return {
        success: false,
        error: rpcErr?.message || res?.error || 'Booking conversion failed. No partial booking was created.',
      }
    }

    revalidatePath('/dashboard/quotations')
    revalidatePath(`/dashboard/quotations/${id}`)
    revalidatePath('/dashboard/bookings')
    return {
      success: true,
      bookingId: res.booking_id,
      bookingNumber: res.booking_number,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Booking conversion failed. No partial booking was created.' }
  }
}
