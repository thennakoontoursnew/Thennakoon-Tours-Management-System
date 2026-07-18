'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { quotationSchema, sanitizePayload } from '@/lib/validations/sales-documents'
import { z } from 'zod'

type QuotationInput = z.infer<typeof quotationSchema>

export async function createQuotation(values: QuotationInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = quotationSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { items, ...headerData } = parsed.data

    // Server-side recalculation of line totals and grand total
    let subtotal = 0
    const processedItems = items.map((item) => {
      const baseLineTotal = Number(item.number_of_days) * Number(item.unit_rate) * Number(item.quantity)
      const lineTotal = baseLineTotal + Number(item.driver_charge) + Number(item.additional_charge)
      subtotal += lineTotal
      return {
        ...item,
        line_total: lineTotal,
        display_order: item.display_order || 0,
      }
    })

    let discountAmount = 0
    if (headerData.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(headerData.discount_value)) / 100
    } else if (headerData.discount_type === 'fixed') {
      discountAmount = Number(headerData.discount_value)
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount + Number(headerData.additional_charges))
    const taxAmount = (taxableAmount * Number(headerData.tax_rate)) / 100
    const grandTotal = taxableAmount + taxAmount + Number(headerData.refundable_deposit)

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      prepared_by: user.id,
      created_by: user.id,
      updated_by: user.id,
    }

    const { data: quotation, error: insertError } = await supabase
      .from('quotations')
      .insert(payload)
      .select()
      .single()

    if (insertError || !quotation) {
      return { success: false, error: insertError?.message || 'Failed to create quotation.' }
    }

    // Insert quotation line items
    const itemRows = processedItems.map((it) => ({
      quotation_id: quotation.id,
      ...sanitizePayload(it),
    }))

    const { error: itemsError } = await supabase.from('quotation_items').insert(itemRows)
    if (itemsError) {
      await supabase.from('quotations').delete().eq('id', quotation.id)
      return { success: false, error: `Failed to insert quotation items: ${itemsError.message}` }
    }

    // Audit Logging
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_QUOTATION',
      p_entity_type: 'quotation',
      p_entity_id: quotation.id,
      p_description: `Created quotation ${quotation.quotation_number}`,
    })

    await supabase.from('document_activity_logs').insert({
      document_type: 'quotation',
      document_id: quotation.id,
      action: 'create',
      new_status: quotation.status,
      change_summary: `Created quotation ${quotation.quotation_number}`,
      user_id: user.id,
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

    let subtotal = 0
    const processedItems = items.map((item) => {
      const baseLineTotal = Number(item.number_of_days) * Number(item.unit_rate) * Number(item.quantity)
      const lineTotal = baseLineTotal + Number(item.driver_charge) + Number(item.additional_charge)
      subtotal += lineTotal
      return {
        ...item,
        line_total: lineTotal,
      }
    })

    let discountAmount = 0
    if (headerData.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(headerData.discount_value)) / 100
    } else if (headerData.discount_type === 'fixed') {
      discountAmount = Number(headerData.discount_value)
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount + Number(headerData.additional_charges))
    const taxAmount = (taxableAmount * Number(headerData.tax_rate)) / 100
    const grandTotal = taxableAmount + taxAmount + Number(headerData.refundable_deposit)

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      updated_by: user.id,
    }

    const { error: updateError } = await supabase
      .from('quotations')
      .update(payload)
      .eq('id', id)

    if (updateError) return { success: false, error: updateError.message }

    // Re-insert line items
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

export async function duplicateQuotation(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: orig, error: fetchError } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !orig) return { success: false, error: 'Quotation not found.' }

    // Create duplicate header
    const { data: dup, error: dupError } = await supabase
      .from('quotations')
      .insert({
        customer_id: orig.customer_id,
        quotation_date: new Date().toISOString().split('T')[0],
        rental_start_date: orig.rental_start_date,
        rental_end_date: orig.rental_end_date,
        pickup_location: orig.pickup_location,
        dropoff_location: orig.dropoff_location,
        destination: orig.destination,
        passenger_count: orig.passenger_count,
        purpose: orig.purpose,
        currency: orig.currency,
        subtotal: orig.subtotal,
        discount_type: orig.discount_type,
        discount_value: orig.discount_value,
        discount_amount: orig.discount_amount,
        tax_rate: orig.tax_rate,
        tax_amount: orig.tax_amount,
        refundable_deposit: orig.refundable_deposit,
        additional_charges: orig.additional_charges,
        grand_total: orig.grand_total,
        notes: orig.notes,
        special_notes: orig.special_notes,
        terms_and_conditions: orig.terms_and_conditions,
        status: 'draft',
        parent_quotation_id: orig.id,
        prepared_by: user.id,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (dupError || !dup) return { success: false, error: dupError?.message || 'Failed to duplicate.' }

    if (orig.quotation_items && orig.quotation_items.length > 0) {
      const items = orig.quotation_items.map((it: any) => ({
        quotation_id: dup.id,
        vehicle_id: it.vehicle_id,
        description: it.description,
        vehicle_name_snapshot: it.vehicle_name_snapshot,
        vehicle_registration_snapshot: it.vehicle_registration_snapshot,
        vehicle_year_snapshot: it.vehicle_year_snapshot,
        quantity: it.quantity,
        number_of_days: it.number_of_days,
        unit_rate: it.unit_rate,
        line_total: it.line_total,
        allowed_km: it.allowed_km,
        extra_km_charge: it.extra_km_charge,
        deposit_amount: it.deposit_amount,
        driver_charge: it.driver_charge,
        additional_charge: it.additional_charge,
        display_order: it.display_order,
      }))
      await supabase.from('quotation_items').insert(items)
    }

    revalidatePath('/dashboard/quotations')
    return { success: true, newQuotationId: dup.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to duplicate quotation.' }
  }
}

export async function changeQuotationStatus(id: string, newStatus: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const updatePayload: any = { status: newStatus, updated_by: user.id }
    if (newStatus === 'accepted') updatePayload.accepted_at = new Date().toISOString()
    if (newStatus === 'rejected') updatePayload.rejected_at = new Date().toISOString()
    if (newStatus === 'sent') updatePayload.sent_at = new Date().toISOString()
    if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString()

    const { error } = await supabase
      .from('quotations')
      .update(updatePayload)
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/quotations')
    revalidatePath(`/dashboard/quotations/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function convertQuotationToBooking(quotationId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: q, error: qError } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('id', quotationId)
      .single()

    if (qError || !q) return { success: false, error: 'Quotation not found.' }
    if (q.status !== 'accepted') {
      return { success: false, error: 'Only accepted quotations can be converted to bookings.' }
    }

    // Check if booking already created
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id, booking_number')
      .eq('quotation_id', quotationId)
      .single()

    if (existingBooking) {
      return { success: false, error: `This quotation was already converted to Booking ${existingBooking.booking_number}` }
    }

    const startAt = `${q.rental_start_date}T09:00:00Z`
    const endAt = `${q.rental_end_date}T18:00:00Z`

    // Create booking
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert({
        quotation_id: q.id,
        customer_id: q.customer_id,
        booking_date: new Date().toISOString().split('T')[0],
        rental_start_at: startAt,
        rental_end_at: endAt,
        pickup_location: q.pickup_location,
        dropoff_location: q.dropoff_location,
        destination: q.destination,
        passenger_count: q.passenger_count,
        subtotal: q.subtotal,
        discount_amount: q.discount_amount,
        tax_amount: q.tax_amount,
        refundable_deposit: q.refundable_deposit,
        grand_total: q.grand_total,
        advance_required: q.grand_total * 0.25,
        advance_paid: 0,
        balance_due: q.grand_total,
        status: 'confirmed',
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (bError || !booking) return { success: false, error: bError?.message || 'Failed to convert to booking.' }

    // Assign vehicles from quotation items
    if (q.quotation_items && q.quotation_items.length > 0) {
      const bVehicles = q.quotation_items
        .filter((it: any) => it.vehicle_id)
        .map((it: any) => ({
          booking_id: booking.id,
          vehicle_id: it.vehicle_id,
          rental_start_at: startAt,
          rental_end_at: endAt,
          vehicle_rate: it.unit_rate,
          driver_charge: it.driver_charge,
          deposit_amount: it.deposit_amount,
          allowed_km: it.allowed_km,
          extra_km_charge: it.extra_km_charge,
          status: 'reserved',
        }))

      if (bVehicles.length > 0) {
        await supabase.from('booking_vehicles').insert(bVehicles)
      }
    }

    await supabase.from('document_activity_logs').insert({
      document_type: 'quotation',
      document_id: q.id,
      action: 'convert',
      new_status: 'converted',
      change_summary: `Converted quotation ${q.quotation_number} to booking ${booking.booking_number}`,
      user_id: user.id,
    })

    revalidatePath('/dashboard/quotations')
    revalidatePath('/dashboard/bookings')
    return { success: true, bookingId: booking.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Conversion failed.' }
  }
}
