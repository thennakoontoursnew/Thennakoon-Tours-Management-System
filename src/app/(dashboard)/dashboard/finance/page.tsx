import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Landmark,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ReceiptText,
  CreditCard,
  WalletCards,
  FileSpreadsheet,
  FileBarChart,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'
import { RecordPaymentButton } from '@/components/finance/record-payment-button'
import { NewExpenseButton } from '@/components/finance/new-expense-button'

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function FinanceDashboardPage({ searchParams }: PageProps) {
  const { period = 'this_month' } = await searchParams
  const supabase = await createClient()

  // Fetch Authoritative Finance KPIs
  const kpis = await getFinanceSummaryKPIs(supabase, period)

  // Fetch Recent Invoices
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, grand_total, balance_due, status, invoice_date, customer:customers(full_name)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch Recent Payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, payment_method, payment_date, reference_number, customer:customers(full_name), invoice:invoices(invoice_number)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch Recent Expenses
  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select('id, expense_number, category, description, amount, expense_date')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch Recent Receipts
  const { data: recentReceipts } = await supabase
    .from('receipts')
    .select('id, receipt_number, amount, payment_method, created_at, customer:customers(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const toSafeNumber = (value: unknown): number => {
    const num = Number(value ?? 0)
    return Number.isFinite(num) ? num : 0
  }

  const getCustomerName = (customer: unknown): string => {
    if (!customer) return 'Customer'
    if (Array.isArray(customer)) {
      const first = customer[0]
      if (first && typeof first === 'object' && 'full_name' in first && typeof first.full_name === 'string' && first.full_name.trim()) {
        return first.full_name
      }
      return 'Customer'
    }
    if (typeof customer === 'object' && 'full_name' in customer && typeof customer.full_name === 'string' && customer.full_name.trim()) {
      return customer.full_name
    }
    return 'Customer'
  }

  const getInvoiceNumber = (invoice: unknown): string | null => {
    if (!invoice) return null
    if (Array.isArray(invoice)) {
      const first = invoice[0]
      if (first && typeof first === 'object' && 'invoice_number' in first && typeof first.invoice_number === 'string' && first.invoice_number.trim()) {
        return first.invoice_number
      }
      return null
    }
    if (typeof invoice === 'object' && 'invoice_number' in invoice && typeof invoice.invoice_number === 'string' && invoice.invoice_number.trim()) {
      return invoice.invoice_number
    }
    return null
  }

  const getStatusBadge = (st: unknown) => {
    const statusStr = typeof st === 'string' ? st.toLowerCase() : ''
    switch (statusStr) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Paid</span>
      case 'partially_paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Partial</span>
      case 'issued':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Issued</span>
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Overdue</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{(statusStr || 'UNKNOWN').toUpperCase()}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER & PERIOD FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Finance Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative cash flow, billing ledger, expenses, and collections overview.</p>
            </div>
          </div>
        </div>

        {/* Period Selector Form */}
        <form method="GET" className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <select
            name="period"
            defaultValue={period}
            onChange={(e) => e.target.form?.submit()}
            className="py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="ytd">Year to Date (YTD)</option>
            <option value="all">All Time</option>
          </select>
        </form>
      </div>

      {/* QUICK ACTIONS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/invoices/new"
            className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>+ New Invoice</span>
          </Link>

          <RecordPaymentButton />

          <NewExpenseButton />

          <Link
            href="/dashboard/invoices?status=overdue"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
          >
            <AlertCircle size={14} />
            <span>View Outstanding ({kpis.overdueCount})</span>
          </Link>

          <Link
            href="/dashboard/finance/reports"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <FileBarChart size={14} />
            <span>Reports & Statements</span>
          </Link>
        </div>
      </div>

      {/* PRIMARY FINANCE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Today&apos;s Collections</span>
          <span className="font-mono font-black text-emerald-500 text-xl block mt-1">LKR {toSafeNumber(kpis.todaysCollections).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Real-time daily cash inflow</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">This Month Collections</span>
          <span className="font-mono font-black text-emerald-500 text-xl block mt-1">LKR {toSafeNumber(kpis.thisMonthsCollections).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Monthly total received</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">LKR {toSafeNumber(kpis.totalInvoiced).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Valid non-cancelled invoices</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Outstanding Balance</span>
          <span className="font-mono font-black text-amber-500 text-xl block mt-1">LKR {toSafeNumber(kpis.outstandingBalance).toLocaleString()}</span>
          <span className="text-[10px] text-amber-500/80 block mt-1">{toSafeNumber(kpis.partiallyPaidCount)} partial / {toSafeNumber(kpis.issuedCount)} issued</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Overdue Amount</span>
          <span className="font-mono font-black text-rose-500 text-xl block mt-1">LKR {toSafeNumber(kpis.overdueBalance).toLocaleString()}</span>
          <span className="text-[10px] text-rose-500/80 block mt-1">{toSafeNumber(kpis.overdueCount)} overdue invoices</span>
        </div>
      </div>

      {/* SECONDARY METRICS: CASH FLOW & EXPENSES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Collected</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <span className="font-mono font-black text-emerald-500 text-2xl block mt-1">LKR {toSafeNumber(kpis.totalCollected).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Completed payment records</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Operating Expenses</span>
            <ReceiptText size={16} className="text-rose-500" />
          </div>
          <span className="font-mono font-black text-rose-500 text-2xl block mt-1">LKR {toSafeNumber(kpis.totalExpenses).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Fuel, maintenance, repairs, etc.</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Net Cash Flow</span>
            <TrendingUp size={16} className={toSafeNumber(kpis.netCashFlow) >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
          </div>
          <span className={`font-mono font-black text-2xl block mt-1 ${toSafeNumber(kpis.netCashFlow) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            LKR {toSafeNumber(kpis.netCashFlow).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Completed Collections - Expenses</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Collection Rate</span>
            <span className="font-mono text-xs font-bold text-amber-500">{toSafeNumber(kpis.collectionRate)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, toSafeNumber(kpis.collectionRate))}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 block mt-2">Collected vs Invoiced</span>
        </div>
      </div>

      {/* RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT INVOICES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Invoices</h2>
            </div>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentInvoices && recentInvoices.length > 0 ? (
            <div className="space-y-2.5">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono font-bold text-amber-500 hover:underline">
                        {inv.invoice_number || 'INV'}
                      </Link>
                      {getStatusBadge(inv.status)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{getCustomerName(inv.customer)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">LKR {toSafeNumber(inv.grand_total).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Bal: LKR {toSafeNumber(inv.balance_due).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent invoices recorded.</p>
          )}
        </div>

        {/* RECENT PAYMENTS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Payments</h2>
            </div>
            <Link href="/dashboard/payments" className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentPayments && recentPayments.length > 0 ? (
            <div className="space-y-2.5">
              {recentPayments.map((p) => {
                const invNum = getInvoiceNumber(p.invoice)
                const methodStr = p.payment_method ? String(p.payment_method).toUpperCase() : 'PAYMENT'
                const pDateStr = p.payment_date ? String(p.payment_date).slice(0, 10) : ''
                return (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{getCustomerName(p.customer)}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Via {methodStr} {invNum ? `(${invNum})` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-500">LKR {toSafeNumber(p.amount).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pDateStr}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent payments recorded.</p>
          )}
        </div>

        {/* RECENT EXPENSES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ReceiptText size={16} className="text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Expenses</h2>
            </div>
            <Link href="/dashboard/expenses" className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentExpenses && recentExpenses.length > 0 ? (
            <div className="space-y-2.5">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{exp.description || 'Expense'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{exp.expense_number || 'EXP'} • {exp.category ? String(exp.category).toUpperCase() : 'GENERAL'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-500">LKR {toSafeNumber(exp.amount).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{exp.expense_date || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent expenses recorded.</p>
          )}
        </div>

        {/* RECENT RECEIPTS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <WalletCards size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Receipts</h2>
            </div>
            <Link href="/dashboard/receipts" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentReceipts && recentReceipts.length > 0 ? (
            <div className="space-y-2.5">
              {recentReceipts.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-amber-500">{r.receipt_number || 'RCPT'}</div>
                    <div className="text-[11px] text-slate-500">{getCustomerName(r.customer)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-500">LKR {toSafeNumber(r.amount).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.payment_method ? String(r.payment_method).toUpperCase() : 'RECEIPT'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent receipts generated.</p>
          )}
        </div>
      </div>
    </div>
  )
}
