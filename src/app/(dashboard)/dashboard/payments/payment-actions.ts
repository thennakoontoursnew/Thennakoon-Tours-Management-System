'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { paymentSchema, sanitizePayload } from '@/lib/validations/sales-documents'
import { z } from 'zod'

type PaymentInput = z.infer<typeof paymentSchema>

export async function recordPayment(values: PaymentInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = paymentSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const payload = sanitizePayload(parsed.data)

    // Validate Invoice balance if payment is for an invoice
    let currentInvoice: any = null
    if (payload.invoice_id) {
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('id, grand_total, amount_paid, balance_due, status, booking_id')
        .eq('id', payload.invoice_id)
        .single()

      if (invErr || !inv) return { success: false, error: 'Target invoice not found.' }
      if (inv.status === 'cancelled') return { success: false, error: 'Cannot record payment for a cancelled invoice.' }
      
      // Reject overpayment
      if (Number(payload.amount) > Number(inv.balance_due) + 0.01) {
        return {
          success: false,
          error: `Payment amount (LKR ${payload.amount}) exceeds remaining balance due (LKR ${inv.balance_due}).`,
        }
      }
      currentInvoice = inv
    }

    // Insert Payment Record
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .insert({
        ...payload,
        recorded_by: user.id,
      })
      .select()
      .single()

    if (pError || !payment) return { success: false, error: pError?.message || 'Failed to record payment.' }

    // Update Invoice Balance & Status
    if (currentInvoice) {
      const newPaid = Number(currentInvoice.amount_paid) + Number(payload.amount)
      const newBalance = Math.max(0, Number(currentInvoice.grand_total) - newPaid)
      const newStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid'

      await supabase
        .from('invoices')
        .update({
          amount_paid: newPaid,
          balance_due: newBalance,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', currentInvoice.id)

      // Also update booking advance paid if linked to a booking
      if (currentInvoice.booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('advance_paid, grand_total')
          .eq('id', currentInvoice.booking_id)
          .single()

        if (booking) {
          const bPaid = Number(booking.advance_paid) + Number(payload.amount)
          await supabase
            .from('bookings')
            .update({
              advance_paid: bPaid,
              balance_due: Math.max(0, Number(booking.grand_total) - bPaid),
            })
            .eq('id', currentInvoice.booking_id)
        }
      }
    }

    // Auto-generate Payment Receipt
    const { data: receipt } = await supabase
      .from('receipts')
      .insert({
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        booking_id: payment.booking_id,
        customer_id: payment.customer_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        prepared_by: user.id,
      })
      .select()
      .single()

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'RECORD_PAYMENT',
      p_entity_type: 'payment',
      p_entity_id: payment.id,
      p_description: `Recorded payment of LKR ${payment.amount} via ${payment.payment_method}`,
    })

    if (payload.invoice_id) revalidatePath(`/dashboard/invoices/${payload.invoice_id}`)
    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard/receipts')
    revalidatePath('/dashboard')

    return { success: true, paymentId: payment.id, receiptId: receipt?.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record payment.' }
  }
}
