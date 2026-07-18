'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invoiceSchema, sanitizePayload } from '@/lib/validations/sales-documents'
import { z } from 'zod'

type InvoiceInput = z.infer<typeof invoiceSchema>

export async function createInvoice(values: InvoiceInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = invoiceSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { items, ...headerData } = parsed.data

    let subtotal = 0
    const processedItems = items.map((it, idx) => {
      const lineTotal = Number(it.quantity) * Number(it.unit_price)
      subtotal += lineTotal
      return {
        ...it,
        line_total: lineTotal,
        display_order: idx,
      }
    })

    const taxAmount = (subtotal * Number(headerData.tax_rate)) / 100
    const grandTotal = Math.max(
      0,
      subtotal - Number(headerData.discount_amount) + taxAmount + Number(headerData.refundable_deposit) - Number(headerData.total_deductions)
    )

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      subtotal,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      amount_paid: 0,
      balance_due: grandTotal,
      prepared_by: user.id,
      created_by: user.id,
      updated_by: user.id,
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert(payload)
      .select()
      .single()

    if (invError || !invoice) return { success: false, error: invError?.message || 'Failed to create invoice.' }

    const itemRows = processedItems.map((it) => ({
      invoice_id: invoice.id,
      ...sanitizePayload(it),
    }))

    await supabase.from('invoice_items').insert(itemRows)

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_INVOICE',
      p_entity_type: 'invoice',
      p_entity_id: invoice.id,
      p_description: `Created invoice ${invoice.invoice_number}`,
    })

    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard')
    return { success: true, invoiceId: invoice.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create invoice.' }
  }
}

export async function createInvoiceFromBooking(bookingId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: b, error: bError } = await supabase
      .from('bookings')
      .select('*, booking_vehicles(*, vehicle:vehicles(vehicle_name, registration_number))')
      .eq('id', bookingId)
      .single()

    if (bError || !b) return { success: false, error: 'Booking not found.' }

    // Create invoice line items from booking vehicles
    const items = (b.booking_vehicles || []).map((bv: any) => ({
      description: `Vehicle Rental: ${bv.vehicle?.vehicle_name || 'Vehicle'} (${bv.vehicle?.registration_number || 'N/A'})`,
      quantity: 1,
      unit_price: Number(bv.vehicle_rate) + Number(bv.driver_charge),
      vehicle_id: bv.vehicle_id,
    }))

    if (items.length === 0) {
      items.push({
        description: `Booking ${b.booking_number} Rental Service`,
        quantity: 1,
        unit_price: Number(b.subtotal),
        vehicle_id: null,
      })
    }

    return await createInvoice({
      booking_id: b.id,
      quotation_id: b.quotation_id,
      customer_id: b.customer_id,
      invoice_date: new Date().toISOString().split('T')[0],
      currency: 'LKR',
      discount_amount: b.discount_amount,
      tax_rate: 0,
      refundable_deposit: b.refundable_deposit,
      total_deductions: b.advance_paid,
      status: 'draft',
      items,
    })
  } catch (err: any) {
    return { success: false, error: err.message || 'Invoice creation failed.' }
  }
}

export async function issueInvoice(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'issued',
        issued_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/invoices/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
