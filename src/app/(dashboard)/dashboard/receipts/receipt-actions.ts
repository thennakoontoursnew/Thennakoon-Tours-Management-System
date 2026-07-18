'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateReceipt(paymentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (pErr || !payment) return { success: false, error: 'Payment record not found.' }

    const { data: existing } = await supabase
      .from('receipts')
      .select('id')
      .eq('payment_id', paymentId)
      .single()

    if (existing) {
      return { success: true, receiptId: existing.id }
    }

    const { data: receipt, error: rErr } = await supabase
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

    if (rErr || !receipt) return { success: false, error: rErr?.message || 'Failed to generate receipt.' }

    revalidatePath('/dashboard/receipts')
    return { success: true, receiptId: receipt.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
