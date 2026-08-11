import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface FinanceKPIs {
  totalInvoiced: number
  totalCollected: number
  outstandingBalance: number
  overdueBalance: number
  totalExpenses: number
  netCashFlow: number
  depositsHeld: number
  collectionRate: number
  todaysCollections: number
  thisMonthsCollections: number
  partiallyPaidCount: number
  paidCount: number
  draftCount: number
  issuedCount: number
  overdueCount: number
  cancelledCount: number
}

export interface PaymentMethodBreakdown {
  method: string
  methodLabel: string
  amount: number
  count: number
  percentage: number
}

export interface CustomerStatementItem {
  id: string
  date: string
  type: 'invoice' | 'payment' | 'credit' | 'refund'
  reference: string
  description: string
  debit: number
  credit: number
  runningBalance: number
}

export interface AgingBucketItem {
  id: string
  invoiceNumber: string
  customerName: string
  customerId: string
  dueDate: string
  daysOverdue: number
  invoiceAmount: number
  balanceDue: number
  bucket: 'not_due' | '0_30' | '31_60' | '61_90' | '90_plus'
}

export function getPeriodDateRange(period: string = 'this_month'): { startStr?: string; endStr?: string } {
  const todayStr = getColomboTodayString()
  const year = parseInt(todayStr.slice(0, 4), 10)
  const month = parseInt(todayStr.slice(5, 7), 10)

  if (period === 'today') {
    return { startStr: todayStr, endStr: todayStr }
  }
  if (period === '7d') {
    const d = new Date(todayStr)
    d.setDate(d.getDate() - 7)
    return { startStr: d.toISOString().slice(0, 10), endStr: todayStr }
  }
  if (period === '30d') {
    const d = new Date(todayStr)
    d.setDate(d.getDate() - 30)
    return { startStr: d.toISOString().slice(0, 10), endStr: todayStr }
  }
  if (period === 'this_month') {
    const startStr = `${todayStr.slice(0, 7)}-01`
    return { startStr, endStr: todayStr }
  }
  if (period === 'last_month') {
    const lastMonth = month === 1 ? 12 : month - 1
    const lastMonthYear = month === 1 ? year - 1 : year
    const lastMonthStr = String(lastMonth).padStart(2, '0')
    const startStr = `${lastMonthYear}-${lastMonthStr}-01`
    const lastDay = new Date(lastMonthYear, lastMonth, 0).getDate()
    const endStr = `${lastMonthYear}-${lastMonthStr}-${String(lastDay).padStart(2, '0')}`
    return { startStr, endStr }
  }
  if (period === 'ytd') {
    return { startStr: `${year}-01-01`, endStr: todayStr }
  }

  return {}
}

export async function getFinanceSummaryKPIs(supabase: SupabaseClient, period: string = 'this_month'): Promise<FinanceKPIs> {
  const todayStr = getColomboTodayString()
  const range = getPeriodDateRange(period)
  const thisMonthStartStr = `${todayStr.slice(0, 7)}-01`

  // 1. Fetch Invoices
  let invQuery = supabase
    .from('invoices')
    .select('id, grand_total, amount_paid, balance_due, due_date, status, created_at')
    .neq('status', 'cancelled')
    .eq('is_archived', false)

  if (range.startStr && range.endStr) {
    invQuery = invQuery.gte('created_at', `${range.startStr}T00:00:00.000Z`).lte('created_at', `${range.endStr}T23:59:59.999Z`)
  }

  // 2. Fetch Payments (Completed payments)
  let payQuery = supabase
    .from('payments')
    .select('amount, payment_date, status')
    .eq('status', 'completed')

  if (range.startStr && range.endStr) {
    payQuery = payQuery.gte('payment_date', `${range.startStr}T00:00:00.000Z`).lte('payment_date', `${range.endStr}T23:59:59.999Z`)
  }

  // 3. Fetch All Time Completed Payments for Today & This Month KPIs
  const todayPayQuery = supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('status', 'completed')

  // 4. Fetch Expenses
  let expQuery = supabase
    .from('expenses')
    .select('amount, expense_date, status')
    .neq('status', 'cancelled')

  if (range.startStr && range.endStr) {
    expQuery = expQuery.gte('expense_date', range.startStr).lte('expense_date', range.endStr)
  }

  // 5. Fetch Refundable Deposits
  const depQuery = supabase
    .from('refundable_deposits')
    .select('amount')
    .eq('status', 'received')

  const [invoicesRes, paymentsRes, allPaymentsRes, expensesRes, depositsRes] = await Promise.all([
    invQuery,
    payQuery,
    todayPayQuery,
    expQuery,
    depQuery,
  ])

  const invoices = invoicesRes.data || []
  const payments = paymentsRes.data || []
  const allPayments = allPaymentsRes.data || []
  const expenses = expensesRes.data || []
  const deposits = depositsRes.data || []

  let totalInvoiced = 0
  let outstandingBalance = 0
  let overdueBalance = 0
  let partiallyPaidCount = 0
  let paidCount = 0
  let draftCount = 0
  let issuedCount = 0
  let overdueCount = 0
  let cancelledCount = 0

  invoices.forEach((inv: Record<string, unknown>) => {
    const grand = Number(inv.grand_total || 0)
    const bal = Number(inv.balance_due || 0)
    totalInvoiced += grand

    if (inv.status === 'draft') draftCount++
    else if (inv.status === 'issued') issuedCount++
    else if (inv.status === 'partially_paid') partiallyPaidCount++
    else if (inv.status === 'paid') paidCount++
    else if (inv.status === 'cancelled') cancelledCount++

    if (bal > 0) {
      outstandingBalance += bal
      const isOverdue = inv.status === 'overdue' || Boolean(inv.due_date && String(inv.due_date) < todayStr)
      if (isOverdue) {
        overdueBalance += bal
        overdueCount++
      }
    }
  })

  const totalCollected = payments.reduce((acc: number, p: Record<string, unknown>) => acc + Number(p.amount || 0), 0)
  const totalExpenses = expenses.reduce((acc: number, e: Record<string, unknown>) => acc + Number(e.amount || 0), 0)
  const depositsHeld = deposits.reduce((acc: number, d: Record<string, unknown>) => acc + Number(d.amount || 0), 0)
  const netCashFlow = totalCollected - totalExpenses

  const collectionRate = totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 10000) / 100) : 0

  let todaysCollections = 0
  let thisMonthsCollections = 0

  allPayments.forEach((p: Record<string, unknown>) => {
    const amt = Number(p.amount || 0)
    const pDate = String(p.payment_date || '').slice(0, 10)
    if (pDate === todayStr) todaysCollections += amt
    if (pDate >= thisMonthStartStr) thisMonthsCollections += amt
  })

  return {
    totalInvoiced,
    totalCollected,
    outstandingBalance,
    overdueBalance,
    totalExpenses,
    netCashFlow,
    depositsHeld,
    collectionRate,
    todaysCollections,
    thisMonthsCollections,
    partiallyPaidCount,
    paidCount,
    draftCount,
    issuedCount,
    overdueCount,
    cancelledCount,
  }
}

export async function getPaymentMethodBreakdown(
  supabase: SupabaseClient,
  period: string = 'this_month'
): Promise<PaymentMethodBreakdown[]> {
  const range = getPeriodDateRange(period)
  let payQuery = supabase
    .from('payments')
    .select('amount, payment_method, status')
    .eq('status', 'completed')

  if (range.startStr && range.endStr) {
    payQuery = payQuery.gte('payment_date', `${range.startStr}T00:00:00.000Z`).lte('payment_date', `${range.endStr}T23:59:59.999Z`)
  }

  const { data: payments } = await payQuery
  const pList = payments || []

  const methodMap: Record<string, { amount: number; count: number }> = {
    cash: { amount: 0, count: 0 },
    bank_transfer: { amount: 0, count: 0 },
    card: { amount: 0, count: 0 },
    online: { amount: 0, count: 0 },
    cheque: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  }

  let grandTotal = 0

  pList.forEach((p: Record<string, unknown>) => {
    const m = String(p.payment_method || 'other').toLowerCase()
    const amt = Number(p.amount || 0)
    grandTotal += amt

    if (!methodMap[m]) {
      methodMap[m] = { amount: 0, count: 0 }
    }
    methodMap[m].amount += amt
    methodMap[m].count += 1
  })

  const labels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Credit / Debit Card',
    online: 'Online Transfer',
    cheque: 'Cheque',
    other: 'Other',
  }

  return Object.keys(methodMap).map((m) => {
    const amt = methodMap[m].amount
    const pct = grandTotal > 0 ? Math.round((amt / grandTotal) * 10000) / 100 : 0
    return {
      method: m,
      methodLabel: labels[m] || m.toUpperCase(),
      amount: amt,
      count: methodMap[m].count,
      percentage: pct,
    }
  })
}

export async function getCustomerStatementLedger(
  supabase: SupabaseClient,
  customerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  customer: Record<string, unknown> | null
  totalInvoiced: number
  totalCollected: number
  outstandingBalance: number
  overdueBalance: number
  items: CustomerStatementItem[]
}> {
  const todayStr = getColomboTodayString()

  // Fetch Customer Profile
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  // Fetch Invoices
  let invQuery = supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, grand_total, amount_paid, balance_due, due_date, status, notes')
    .eq('customer_id', customerId)
    .neq('status', 'cancelled')
    .order('invoice_date', { ascending: true })

  if (dateFrom) invQuery = invQuery.gte('invoice_date', dateFrom)
  if (dateTo) invQuery = invQuery.lte('invoice_date', dateTo)

  // Fetch Payments
  let payQuery = supabase
    .from('payments')
    .select('id, payment_date, amount, payment_method, reference_number, notes, invoice:invoices(invoice_number)')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .order('payment_date', { ascending: true })

  if (dateFrom) payQuery = payQuery.gte('payment_date', `${dateFrom}T00:00:00.000Z`)
  if (dateTo) payQuery = payQuery.lte('payment_date', `${dateTo}T23:59:59.999Z`)

  const [invRes, payRes] = await Promise.all([invQuery, payQuery])
  const invoices = invRes.data || []
  const payments = payRes.data || []

  let totalInvoiced = 0
  let totalCollected = 0
  let outstandingBalance = 0
  let overdueBalance = 0

  invoices.forEach((inv: Record<string, unknown>) => {
    totalInvoiced += Number(inv.grand_total || 0)
    const bal = Number(inv.balance_due || 0)
    if (bal > 0) {
      outstandingBalance += bal
      if (inv.status === 'overdue' || (inv.due_date && String(inv.due_date) < todayStr)) {
        overdueBalance += bal
      }
    }
  })

  payments.forEach((p: Record<string, unknown>) => {
    totalCollected += Number(p.amount || 0)
  })

  // Combine invoices and payments into a chronological ledger
  const rawEvents: { date: string; timeSort: string; item: CustomerStatementItem }[] = []

  invoices.forEach((inv: Record<string, unknown>) => {
    const invDateStr = String(inv.invoice_date || todayStr)
    const invStatusStr = String(inv.status || '').toUpperCase()
    rawEvents.push({
      date: invDateStr,
      timeSort: `${invDateStr}T00:00:00`,
      item: {
        id: String(inv.id || ''),
        date: invDateStr,
        type: 'invoice',
        reference: String(inv.invoice_number || ''),
        description: `Invoice issued (${invStatusStr})`,
        debit: Number(inv.grand_total || 0),
        credit: 0,
        runningBalance: 0,
      },
    })
  })

  payments.forEach((p: Record<string, unknown>) => {
    const pDate = String(p.payment_date || '').slice(0, 10)
    const invData = p.invoice as Record<string, unknown> | null
    const invNum = invData?.invoice_number ? ` for ${invData.invoice_number}` : ''
    const ref = p.reference_number ? ` (Ref: ${p.reference_number})` : ''
    const pMethodStr = String(p.payment_method || '').toUpperCase()
    rawEvents.push({
      date: pDate,
      timeSort: String(p.payment_date || `${pDate}T12:00:00`),
      item: {
        id: String(p.id || ''),
        date: pDate,
        type: 'payment',
        reference: String(p.reference_number || 'PAYMENT'),
        description: `Payment received via ${pMethodStr}${invNum}${ref}`,
        debit: 0,
        credit: Number(p.amount || 0),
        runningBalance: 0,
      },
    })
  })

  // Sort chronological
  rawEvents.sort((a, b) => (a.timeSort > b.timeSort ? 1 : -1))

  let running = 0
  const items: CustomerStatementItem[] = rawEvents.map((ev) => {
    running += ev.item.debit - ev.item.credit
    return {
      ...ev.item,
      runningBalance: running,
    }
  })

  return {
    customer: customer as Record<string, unknown> | null,
    totalInvoiced,
    totalCollected,
    outstandingBalance,
    overdueBalance,
    items,
  }
}

export async function getAccountsReceivableAging(supabase: SupabaseClient): Promise<{
  summary: {
    notDue: number
    bucket0_30: number
    bucket31_60: number
    bucket61_90: number
    bucket90Plus: number
    totalOutstanding: number
  }
  items: AgingBucketItem[]
}> {
  const todayStr = getColomboTodayString()
  const todayDate = new Date(todayStr)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, grand_total, balance_due, status, customer:customers(id, full_name)')
    .neq('status', 'cancelled')
    .gt('balance_due', 0)
    .eq('is_archived', false)
    .order('due_date', { ascending: true })

  const invList = invoices || []

  let notDue = 0
  let bucket0_30 = 0
  let bucket31_60 = 0
  let bucket61_90 = 0
  let bucket90Plus = 0
  let totalOutstanding = 0

  const items: AgingBucketItem[] = invList.map((inv: Record<string, unknown>) => {
    const bal = Number(inv.balance_due || 0)
    totalOutstanding += bal
    const dueDateStr = String(inv.due_date || todayStr)
    const dueDate = new Date(dueDateStr)

    const diffTime = todayDate.getTime() - dueDate.getTime()
    const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 3600 * 24)))

    let bucket: 'not_due' | '0_30' | '31_60' | '61_90' | '90_plus' = 'not_due'

    if (dueDateStr >= todayStr) {
      bucket = 'not_due'
      notDue += bal
    } else if (daysOverdue <= 30) {
      bucket = '0_30'
      bucket0_30 += bal
    } else if (daysOverdue <= 60) {
      bucket = '31_60'
      bucket31_60 += bal
    } else if (daysOverdue <= 90) {
      bucket = '61_90'
      bucket61_90 += bal
    } else {
      bucket = '90_plus'
      bucket90Plus += bal
    }

    const custObj = inv.customer as Record<string, unknown> | null

    return {
      id: String(inv.id || ''),
      invoiceNumber: String(inv.invoice_number || ''),
      customerName: String(custObj?.full_name || 'N/A'),
      customerId: String(custObj?.id || ''),
      dueDate: dueDateStr,
      daysOverdue: dueDateStr >= todayStr ? 0 : daysOverdue,
      invoiceAmount: Number(inv.grand_total || 0),
      balanceDue: bal,
      bucket,
    }
  })

  return {
    summary: {
      notDue,
      bucket0_30,
      bucket31_60,
      bucket61_90,
      bucket90Plus,
      totalOutstanding,
    },
    items,
  }
}
