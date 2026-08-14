'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invoiceSchema, sanitizePayload } from '@/lib/validations/sales-documents'
import { z } from 'zod'
import { calculateCommercialInvoiceFinancials } from '@/lib/utils/relation-utils'

type InvoiceInput = z.infer<typeof invoiceSchema> & {
  invoice_number?: string | null
  override_reason?: string | null
}

export async function createInvoice(values: InvoiceInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Role check for manual editing authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'viewer'
    const isAuthorizedToEdit = ['owner', 'admin', 'manager', 'finance_staff', 'booking_staff'].includes(userRole)

    const parsed = invoiceSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { items, ...headerData } = parsed.data

    // Handle Invoice Numbering logic
    let customInvoiceNo: string | null = null
    const rawCustomNo = (values.invoice_number || '').trim().toUpperCase()

    if (rawCustomNo) {
      if (!isAuthorizedToEdit) {
        return { success: false, error: 'Permission denied. Only Owner, Admin, Finance, or Manager can specify custom invoice numbers.' }
      }

      if (!rawCustomNo.startsWith('TT-IN-')) {
        return { success: false, error: 'Invoice number must start with TT-IN-.' }
      }

      if (!/^TT-IN-[A-Z0-9-]+$/.test(rawCustomNo)) {
        return { success: false, error: 'Invalid invoice number format. Allowed characters: A–Z, 0–9, hyphens.' }
      }

      // Check unique constraint across all existing invoices
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', rawCustomNo)
        .maybeSingle()

      if (existingInv) {
        return { success: false, error: `Invoice number ${rawCustomNo} already exists.` }
      }

      customInvoiceNo = rawCustomNo
    }

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

    const financials = calculateCommercialInvoiceFinancials({
      subtotal,
      discount_amount: Number(headerData.discount_amount),
      total_deductions: Number(headerData.total_deductions),
      additional_charges: Number(headerData.additional_charges),
      tax_rate: Number(headerData.tax_rate),
      refundable_deposit: Number(headerData.refundable_deposit),
      amount_paid: 0,
    })

    const sanitizedHeader = sanitizePayload(headerData)
    const payload: Record<string, unknown> = {
      ...sanitizedHeader,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      total_deductions: financials.deductions,
      additional_charges: financials.additionalCharges,
      tax_rate: financials.taxRate,
      tax_amount: financials.taxAmount,
      grand_total: financials.netAmount,
      refundable_deposit: financials.refundableDeposit,
      amount_paid: 0,
      balance_due: financials.netAmount,
      prepared_by: user.id,
      prepared_by_name_snapshot: profile?.full_name || 'Staff Member',
      prepared_by_designation_snapshot: profile?.role ? profile.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff',
      created_by: user.id,
      updated_by: user.id,
    }

    if (customInvoiceNo) {
      payload.invoice_number = customInvoiceNo
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

    // Synchronize number_counters if manual high invoice number was specified
    if (customInvoiceNo) {
      await supabase.rpc('sync_invoice_counter', { p_invoice_number: customInvoiceNo })

      // Audit Log for manual override
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'INVOICE_NUMBER_OVERRIDE',
        p_entity_type: 'invoice',
        p_entity_id: invoice.id,
        p_description: `Manual invoice number override: ${customInvoiceNo}`,
      })
    } else {
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'CREATE_INVOICE',
        p_entity_type: 'invoice',
        p_entity_id: invoice.id,
        p_description: `Created invoice ${invoice.invoice_number}`,
      })
    }

    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard')
    return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoice_number }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create invoice.'
    return { success: false, error: msg }
  }
}

export async function updateInvoiceAction(invoiceId: string, values: InvoiceInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'viewer'
    const isAuthorizedToEdit = ['owner', 'admin', 'manager', 'finance_staff', 'booking_staff'].includes(userRole)
    if (!isAuthorizedToEdit) {
      return { success: false, error: 'Permission denied. You do not have permission to edit invoices.' }
    }

    const { data: existingInv, error: existError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (existError || !existingInv) {
      return { success: false, error: 'Invoice not found.' }
    }

    if (['cancelled', 'void'].includes(existingInv.status)) {
      return { success: false, error: `Cannot edit an invoice in '${existingInv.status}' status.` }
    }

    const parsed = invoiceSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { items, ...headerData } = parsed.data

    // Handle Manual Invoice Number Edit / Lock
    let targetInvoiceNo = existingInv.invoice_number
    const rawCustomNo = (values.invoice_number || '').trim().toUpperCase()

    if (rawCustomNo && rawCustomNo !== existingInv.invoice_number) {
      if (!rawCustomNo.startsWith('TT-IN-')) {
        return { success: false, error: 'Invoice number must start with TT-IN-.' }
      }
      if (!/^TT-IN-[A-Z0-9-]+$/.test(rawCustomNo)) {
        return { success: false, error: 'Invalid invoice number format. Allowed characters: A–Z, 0–9, hyphens.' }
      }

      const { data: dupCheck } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', rawCustomNo)
        .neq('id', invoiceId)
        .maybeSingle()

      if (dupCheck) {
        return { success: false, error: `Invoice number ${rawCustomNo} already exists.` }
      }

      targetInvoiceNo = rawCustomNo

      await supabase.rpc('sync_invoice_counter', { p_invoice_number: targetInvoiceNo })
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'INVOICE_NUMBER_OVERRIDE',
        p_entity_type: 'invoice',
        p_entity_id: invoiceId,
        p_description: `Invoice number changed from ${existingInv.invoice_number} to ${targetInvoiceNo}`,
      })
    }

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

    const financials = calculateCommercialInvoiceFinancials({
      subtotal,
      discount_amount: Number(headerData.discount_amount),
      total_deductions: Number(headerData.total_deductions),
      additional_charges: Number(headerData.additional_charges),
      tax_rate: Number(headerData.tax_rate),
      refundable_deposit: Number(headerData.refundable_deposit),
      amount_paid: Number(existingInv.amount_paid || 0),
    })

    // Paid / partially paid sanity check
    if (financials.netAmount < Number(existingInv.amount_paid || 0)) {
      return {
        success: false,
        error: `Net amount (LKR ${financials.netAmount.toLocaleString()}) cannot be less than already paid amount (LKR ${Number(existingInv.amount_paid).toLocaleString()}).`,
      }
    }

    const sanitizedHeader = sanitizePayload(headerData)
    const payload: Record<string, unknown> = {
      ...sanitizedHeader,
      invoice_number: targetInvoiceNo,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      total_deductions: financials.deductions,
      additional_charges: financials.additionalCharges,
      tax_rate: financials.taxRate,
      tax_amount: financials.taxAmount,
      grand_total: financials.netAmount,
      refundable_deposit: financials.refundableDeposit,
      amount_paid: Number(existingInv.amount_paid || 0),
      balance_due: financials.balanceDue,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    const { error: updateErr } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', invoiceId)

    if (updateErr) return { success: false, error: updateErr.message }

    // Atomic update of line items
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

    const itemRows = processedItems.map((it) => ({
      invoice_id: invoiceId,
      ...sanitizePayload(it),
    }))

    await supabase.from('invoice_items').insert(itemRows)

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_INVOICE',
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_description: `Updated invoice ${targetInvoiceNo}`,
    })

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    revalidatePath(`/dashboard/invoices/${invoiceId}/edit`)

    return { success: true, invoiceId, invoiceNumber: targetInvoiceNo }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update invoice.'
    return { success: false, error: msg }
  }
}

export async function createInvoiceFromBooking(bookingId: string, customInvoiceNumber?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Check if an active invoice already exists for this booking
    const { data: existingInv } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('booking_id', bookingId)
      .neq('status', 'cancelled')
      .maybeSingle()

    if (existingInv) {
      return {
        success: true,
        existing: true,
        invoiceId: existingInv.id,
        invoiceNumber: existingInv.invoice_number,
      }
    }

    const { data: b, error: bError } = await supabase
      .from('bookings')
      .select('*, booking_vehicles(*, vehicle:vehicles(vehicle_name, registration_number))')
      .eq('id', bookingId)
      .single()

    if (bError || !b) return { success: false, error: 'Booking not found.' }

    // Create invoice line items from booking vehicles
    const items = (b.booking_vehicles || []).map((bv: Record<string, unknown>) => {
      const vObj = bv.vehicle && typeof bv.vehicle === 'object' ? (bv.vehicle as Record<string, unknown>) : null
      const vName = vObj && typeof vObj.vehicle_name === 'string' ? vObj.vehicle_name : 'Vehicle'
      const vReg = vObj && typeof vObj.registration_number === 'string' ? vObj.registration_number : 'N/A'
      return {
        description: `Vehicle Rental: ${vName} (${vReg})`,
        quantity: 1,
        unit_price: Number(bv.vehicle_rate || 0) + Number(bv.driver_charge || 0),
        vehicle_id: (bv.vehicle_id as string) || null,
      }
    })

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
      invoice_number: customInvoiceNumber || undefined,
      invoice_date: new Date().toISOString().split('T')[0],
      currency: 'LKR',
      discount_amount: b.discount_amount,
      additional_charges: 0,
      tax_rate: 0,
      refundable_deposit: b.refundable_deposit,
      total_deductions: b.advance_paid,
      status: 'draft',
      items,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invoice creation failed.'
    return { success: false, error: msg }
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Action failed.'
    return { success: false, error: msg }
  }
}

export async function duplicateInvoiceAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: orig, error: origErr } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', id)
      .single()

    if (origErr || !orig) return { success: false, error: 'Original invoice not found.' }

    const res = await createInvoice({
      customer_id: orig.customer_id,
      booking_id: orig.booking_id,
      quotation_id: orig.quotation_id,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      currency: orig.currency || 'LKR',
      discount_amount: orig.discount_amount || 0,
      additional_charges: orig.additional_charges || 0,
      tax_rate: orig.tax_rate || 0,
      refundable_deposit: orig.refundable_deposit || 0,
      total_deductions: orig.total_deductions || 0,
      notes: `Duplicated from ${orig.invoice_number}. ${orig.notes || ''}`,
      status: 'draft',
      items: (orig.items || []).map((it: Record<string, unknown>, idx: number) => ({
        description: String(it.description || ''),
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        display_order: Number(it.display_order ?? idx),
      })),
    })

    if (res.success && res.invoiceId) {
      await supabase.from('document_activity_logs').insert({
        document_type: 'invoice',
        document_id: res.invoiceId,
        action: 'INVOICE_DUPLICATED',
        change_summary: `Created duplicate draft invoice from ${orig.invoice_number}`,
        user_id: user.id,
      })
    }

    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Duplication failed.'
    return { success: false, error: msg }
  }
}

export async function cancelOrVoidInvoiceAction(id: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: inv } = await supabase.from('invoices').select('status, invoice_number').eq('id', id).single()
    if (!inv) return { success: false, error: 'Invoice not found.' }

    const targetStatus = inv.status === 'issued' ? 'void' : 'cancelled'

    const { error } = await supabase
      .from('invoices')
      .update({
        status: targetStatus,
        notes: `[${targetStatus.toUpperCase()}: ${reason}]`,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.from('document_activity_logs').insert({
      document_type: 'invoice',
      document_id: id,
      action: targetStatus === 'void' ? 'INVOICE_VOIDED' : 'INVOICE_CANCELLED',
      change_summary: `Updated status of ${inv.invoice_number} to ${targetStatus}: ${reason}`,
      user_id: user?.id || null,
    })

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/invoices/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Operation failed.'
    return { success: false, error: msg }
  }
}
