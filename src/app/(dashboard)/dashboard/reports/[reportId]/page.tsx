import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, FileText, Filter } from 'lucide-react'
import { getConsolidatedReportData } from '@/lib/reports/report-service'
import { ReportTable } from '@/components/reports/report-table'

interface PageProps {
  params: Promise<{ reportId: string }>
  searchParams: Promise<{ period?: string }>
}

export default async function ReportDetailPage({ params, searchParams }: PageProps) {
  const { reportId } = await params
  const { period = 'this_month' } = await searchParams

  const supabase = await createClient()

  const reportData = await getConsolidatedReportData(supabase, reportId, period)
  if (!reportData || !reportData.definition) {
    notFound()
  }

  const { definition, kpis, rows } = reportData

  // Format headers and row cells dynamically
  let headers: string[] = []
  let formattedRows: any[][] = []

  if (reportId === 'booking_summary' || reportId === 'executive_summary') {
    headers = ['Booking No', 'Customer', 'Start Date', 'End Date', 'Status']
    formattedRows = rows.map((r: any) => [
      r.booking_number,
      r.customer?.full_name || 'N/A',
      new Date(r.rental_start_at).toLocaleDateString(),
      new Date(r.rental_end_at).toLocaleDateString(),
      r.status.toUpperCase(),
    ])
  } else if (reportId === 'revenue_report' || reportId === 'accounts_receivable') {
    headers = ['Invoice No', 'Customer', 'Grand Total', 'Amount Paid', 'Balance Due', 'Due Date', 'Status']
    formattedRows = rows.map((r: any) => [
      r.invoice_number,
      r.customer?.full_name || 'N/A',
      `LKR ${Number(r.grand_total).toLocaleString()}`,
      `LKR ${Number(r.amount_paid).toLocaleString()}`,
      `LKR ${Number(r.balance_due).toLocaleString()}`,
      r.due_date || 'N/A',
      r.status.toUpperCase(),
    ])
  } else if (reportId === 'expense_report') {
    headers = ['Expense No', 'Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Status']
    formattedRows = rows.map((r: any) => [
      r.expense_number,
      r.expense_date,
      r.category.toUpperCase(),
      r.description,
      `LKR ${Number(r.amount).toLocaleString()}`,
      r.payment_method,
      r.status.toUpperCase(),
    ])
  } else if (reportId === 'maintenance_due') {
    headers = ['Task No', 'Vehicle', 'Title', 'Type', 'Priority', 'Scheduled Date', 'Status']
    formattedRows = rows.map((r: any) => [
      r.task_number,
      r.vehicle?.vehicle_name || 'Vehicle',
      r.title,
      r.task_type.toUpperCase(),
      r.priority.toUpperCase(),
      r.scheduled_date || 'N/A',
      r.status.toUpperCase(),
    ])
  } else {
    headers = ['Ref ID', 'Title / Description', 'Category', 'Date', 'Status']
    formattedRows = rows.map((r: any) => [
      r.id ? String(r.id).slice(0, 8) : 'N/A',
      r.title || r.customer_name || 'Item',
      definition.category.toUpperCase(),
      r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
      r.status ? String(r.status).toUpperCase() : 'ACTIVE',
    ])
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reports"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {definition.category}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{definition.name}</h1>
          </div>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'ytd', label: 'Year to Date' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/reports/${reportId}?period=${p.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.id ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Collected Revenue</span>
          <span className="font-mono font-black text-emerald-500 text-xl">LKR {kpis.finance.totalCollected.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">LKR {kpis.finance.totalInvoiced.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Operating Expenses</span>
          <span className="font-mono font-black text-rose-500 text-xl">LKR {kpis.finance.totalExpenses.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Net Cash Flow</span>
          <span className="font-mono font-black text-amber-500 text-xl">LKR {kpis.finance.netCashFlow.toLocaleString()}</span>
        </div>
      </div>

      {/* Report Table */}
      <ReportTable reportName={definition.name} headers={headers} rows={formattedRows} />
    </div>
  )
}
