import { getColomboTodayString, getColomboDayBounds } from '@/lib/utils/colombo-date-utils'

export interface FinanceKPIs {
  totalInvoiced: number
  totalCollected: number
  outstandingBalance: number
  overdueBalance: number
  totalExpenses: number
  netCashFlow: number
  depositsHeld: number
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

export async function getFinanceSummaryKPIs(supabase: any, period: string = 'this_month'): Promise<FinanceKPIs> {
  const todayStr = getColomboTodayString()
  const range = getPeriodDateRange(period)

  // 1. Fetch Invoices
  let invQuery = supabase
    .from('invoices')
    .select('id, grand_total, amount_paid, balance_due, due_date, status, created_at')
    .neq('status', 'cancelled')

  if (range.startStr && range.endStr) {
    invQuery = invQuery.gte('created_at', `${range.startStr}T00:00:00.000Z`).lte('created_at', `${range.endStr}T23:59:59.999Z`)
  }

  // 2. Fetch Payments (Authoritative Revenue Source)
  let payQuery = supabase
    .from('payments')
    .select('amount, payment_date, status')
    .eq('status', 'completed')

  if (range.startStr && range.endStr) {
    payQuery = payQuery.gte('payment_date', range.startStr).lte('payment_date', range.endStr)
  }

  // 3. Fetch Expenses
  let expQuery = supabase
    .from('expenses')
    .select('amount, expense_date, status')
    .neq('status', 'cancelled')

  if (range.startStr && range.endStr) {
    expQuery = expQuery.gte('expense_date', range.startStr).lte('expense_date', range.endStr)
  }

  // 4. Fetch Refundable Deposits
  const depQuery = supabase
    .from('refundable_deposits')
    .select('amount')
    .eq('status', 'received')

  const [invoicesRes, paymentsRes, expensesRes, depositsRes] = await Promise.all([
    invQuery,
    payQuery,
    expQuery,
    depQuery,
  ])

  const invoices = invoicesRes.data || []
  const payments = paymentsRes.data || []
  const expenses = expensesRes.data || []
  const deposits = depositsRes.data || []

  let totalInvoiced = 0
  let outstandingBalance = 0
  let overdueBalance = 0

  invoices.forEach((inv: any) => {
    totalInvoiced += Number(inv.grand_total || 0)
    const bal = Number(inv.balance_due || 0)
    if (bal > 0) {
      outstandingBalance += bal
      if (inv.status === 'overdue' || (inv.due_date && inv.due_date < todayStr)) {
        overdueBalance += bal
      }
    }
  })

  const totalCollected = payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  const totalExpenses = expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0)
  const depositsHeld = deposits.reduce((acc: number, d: any) => acc + Number(d.amount || 0), 0)
  const netCashFlow = totalCollected - totalExpenses

  return {
    totalInvoiced,
    totalCollected,
    outstandingBalance,
    overdueBalance,
    totalExpenses,
    netCashFlow,
    depositsHeld,
  }
}
