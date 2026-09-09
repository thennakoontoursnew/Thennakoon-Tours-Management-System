'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordInvoicePaymentAction(
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero.')
  }

  // 1. Fetch Invoice
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, full_name, mobile, whatsapp)')
    .eq('id', invoiceId)
    .single()

  if (fetchErr || !invoice) {
    throw new Error('Invoice record not found.')
  }

  const currentBalance = Number(invoice.balance_due || 0)
  if (amount > currentBalance) {
    throw new Error(`Payment amount (LKR ${amount.toLocaleString()}) exceeds outstanding invoice balance (LKR ${currentBalance.toLocaleString()}).`)
  }

  // 2. Insert Payment Record
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      booking_id: invoice.booking_id || null,
      customer_id: invoice.customer_id,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
      status: 'completed',
      recorded_by: user?.id || null,
    })
    .select()
    .single()

  if (payErr || !payment) {
    throw new Error(`Failed to record payment: ${payErr?.message}`)
  }

  // 3. Atomically Update Invoice Balance & Status
  const newAmountPaid = Number(invoice.amount_paid || 0) + amount
  const newBalanceDue = Math.max(0, Number(invoice.grand_total || 0) - newAmountPaid)
  const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid'

  await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status: newStatus,
      paid_at: newBalanceDue === 0 ? new Date().toISOString() : invoice.paid_at,
    })
    .eq('id', invoiceId)

  // 4. Generate Receipt Record (Idempotent uniqueness via uq_receipt_payment)
  const receiptNumber = `RCT-${new Date().getFullYear()}-${String(payment.id.slice(0, 6)).toUpperCase()}`
  await supabase
    .from('receipts')
    .insert({
      payment_id: payment.id,
      receipt_number: receiptNumber,
    })
    .single()

  // 5. Audit Log
  await supabase.from('document_activity_logs').insert({
    document_type: 'invoice',
    document_id: invoiceId,
    action: 'PAYMENT_RECORDED',
    change_summary: `Recorded payment of LKR ${amount.toLocaleString()} via ${paymentMethod}. New Balance: LKR ${newBalanceDue.toLocaleString()}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/receipts')
  return { success: true, payment_id: payment.id }
}

export async function updateDraftInvoiceNumberAction(invoiceId: string, newInvoiceNumber: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const trimmedNum = newInvoiceNumber.trim().toUpperCase()

  // Fetch invoice to verify draft status
  const { data: inv } = await supabase.from('invoices').select('status, invoice_number').eq('id', invoiceId).single()
  if (!inv) throw new Error('Invoice not found.')

  if (inv.status !== 'draft') {
    throw new Error('Only DRAFT invoices allow manual invoice number editing.')
  }

  // Check collision
  const { data: existing } = await supabase.from('invoices').select('id').eq('invoice_number', trimmedNum).neq('id', invoiceId).maybeSingle()
  if (existing) {
    throw new Error(`Invoice number [${trimmedNum}] is already in use by another invoice. Duplicate invoice numbers are not allowed.`)
  }

  // Update
  await supabase.from('invoices').update({ invoice_number: trimmedNum }).eq('id', invoiceId)

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'invoice',
    document_id: invoiceId,
    action: 'INVOICE_NUMBER_EDITED',
    change_summary: `Updated draft invoice number from ${inv.invoice_number} to ${trimmedNum}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function createExpenseAction(expenseData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const expenseNum = `EXP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      expense_number: expenseNum,
      expense_date: expenseData.expense_date || new Date().toISOString().slice(0, 10),
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      payment_method: expenseData.payment_method || 'cash',
      supplier_name: expenseData.supplier_name || null,
      reference_number: expenseData.reference_number || null,
      vehicle_id: expenseData.vehicle_id || null,
      driver_id: expenseData.driver_id || null,
      booking_id: expenseData.booking_id || null,
      receipt_url: expenseData.receipt_url || null,
      voucher_number: expenseData.voucher_number || expenseNum,
      bill_name: expenseData.bill_name || null,
      customer_name: expenseData.customer_name || null,
      account_number: expenseData.account_number || null,
      bank_name: expenseData.bank_name || null,
      branch_name: expenseData.branch_name || null,
      add_payments_breakdown: expenseData.add_payments_breakdown || null,
      deduction_breakdown: expenseData.deduction_breakdown || null,
      net_balance: expenseData.net_balance !== undefined && expenseData.net_balance !== null ? Number(expenseData.net_balance) : Number(expenseData.amount),
      remark: expenseData.remark || null,
      special_notice: expenseData.special_notice || null,
      prepared_by: expenseData.prepared_by || null,
      approved_by: expenseData.approved_by || null,
      status: 'approved',
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to record expense: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'expense',
    document_id: expense.id,
    action: 'EXPENSE_CREATED',
    change_summary: `Recorded expense ${expenseNum} (LKR ${expenseData.amount.toLocaleString()}) - ${expenseData.category}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard/reports/earnings')
  return { success: true, data: expense }
}

export async function getCompanySettingsAction() {
  const supabase = await createClient()
  const { data } = await supabase.from('company_settings').select('*').limit(1).single()
  return data || null
}

