'use client'

import { useState } from 'react'
import {
  FileBarChart,
  Calendar,
  Download,
  FileSpreadsheet,
  PieChart,
  Users,
  Clock,
  TrendingUp,
  ReceiptText,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import {
  FinanceKPIs,
  PaymentMethodBreakdown,
  CustomerStatementItem,
  AgingBucketItem,
} from '@/lib/finance/finance-service'
import { generateCustomerStatementPDF } from '@/lib/documents/customer-statement-pdf'

interface ReportsClientProps {
  initialKPIs: FinanceKPIs
  paymentMethods: PaymentMethodBreakdown[]
  agingReport: {
    summary: {
      notDue: number
      bucket0_30: number
      bucket31_60: number
      bucket61_90: number
      bucket90Plus: number
      totalOutstanding: number
    }
    items: AgingBucketItem[]
  }
  customers: { id: string; full_name: string; company_name?: string; mobile?: string }[]
  initialStatement?: {
    customer: any
    totalInvoiced: number
    totalCollected: number
    outstandingBalance: number
    overdueBalance: number
    items: CustomerStatementItem[]
  }
  currentPeriod: string
  currentCustomerId?: string
}

export function FinanceReportsClient({
  initialKPIs,
  paymentMethods,
  agingReport,
  customers,
  initialStatement,
  currentPeriod,
  currentCustomerId,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'statement' | 'aging'>('overview')
  const [selectedCustomerId, setSelectedCustomerId] = useState(currentCustomerId || customers[0]?.id || '')

  const formatCurrency = (val: number) => `LKR ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Helper for CSV export
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportOverviewCSV = () => {
    const headers = ['Metric', 'Amount (LKR)']
    const rows = [
      ['Total Invoiced', initialKPIs.totalInvoiced],
      ['Total Collected', initialKPIs.totalCollected],
      ['Outstanding Balance', initialKPIs.outstandingBalance],
      ['Overdue Balance', initialKPIs.overdueBalance],
      ['Total Expenses', initialKPIs.totalExpenses],
      ['Net Cash Flow', initialKPIs.netCashFlow],
      ['Collection Rate (%)', initialKPIs.collectionRate],
    ]
    exportToCSV(`finance_overview_${currentPeriod}`, headers, rows)
  }

  const handleExportMethodsCSV = () => {
    const headers = ['Payment Method', 'Collected Amount (LKR)', 'Transaction Count', 'Percentage (%)']
    const rows = paymentMethods.map((m) => [m.methodLabel, m.amount, m.count, m.percentage])
    exportToCSV(`payment_methods_${currentPeriod}`, headers, rows)
  }

  const handleExportAgingCSV = () => {
    const headers = ['Invoice Number', 'Customer Name', 'Due Date', 'Days Overdue', 'Invoice Amount (LKR)', 'Balance Due (LKR)', 'Aging Bucket']
    const rows = agingReport.items.map((it) => [
      it.invoiceNumber,
      it.customerName,
      it.dueDate,
      it.daysOverdue,
      it.invoiceAmount,
      it.balanceDue,
      it.bucket,
    ])
    exportToCSV(`ar_aging_report`, headers, rows)
  }

  const handleExportStatementCSV = () => {
    if (!initialStatement) return
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (LKR)', 'Credit (LKR)', 'Running Balance (LKR)']
    const rows = initialStatement.items.map((it) => [
      it.date,
      it.type.toUpperCase(),
      it.reference,
      it.description,
      it.debit,
      it.credit,
      it.runningBalance,
    ])
    exportToCSV(`statement_${initialStatement.customer?.full_name || 'customer'}`, headers, rows)
  }

  const handleDownloadStatementPDF = async () => {
    if (!initialStatement || !initialStatement.customer) {
      alert('Please select a customer with statement data.')
      return
    }
    const doc = await generateCustomerStatementPDF(
      initialStatement.customer,
      initialStatement.items,
      initialStatement.totalInvoiced,
      initialStatement.totalCollected,
      initialStatement.outstandingBalance
    )
    doc.save(`Customer_Statement_${initialStatement.customer.full_name.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* TAB NAVIGATION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Financial Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('methods')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'methods'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart size={14} />
            <span>Payment Methods</span>
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'statement'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Customer Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('aging')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'aging'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>AR Aging Report</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'overview' && (
            <button
              onClick={handleExportOverviewCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          {activeTab === 'methods' && (
            <button
              onClick={handleExportMethodsCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          {activeTab === 'statement' && (
            <>
              <button
                onClick={handleDownloadStatementPDF}
                className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} />
                <span>Download Statement PDF</span>
              </button>
              <button
                onClick={handleExportStatementCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </>
          )}

          {activeTab === 'aging' && (
            <button
              onClick={handleExportAgingCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: FINANCIAL OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">{formatCurrency(initialKPIs.totalInvoiced)}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-500 block">Payments Collected</span>
              <span className="font-mono font-black text-emerald-500 text-xl block mt-1">{formatCurrency(initialKPIs.totalCollected)}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-500 block">Outstanding Balance</span>
              <span className="font-mono font-black text-amber-500 text-xl block mt-1">{formatCurrency(initialKPIs.outstandingBalance)}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Collection Rate</span>
              <span className="font-mono font-black text-amber-400 text-xl block mt-1">{initialKPIs.collectionRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Counts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Invoice Status Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Draft</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-lg">{initialKPIs.draftCount}</span>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span className="text-[10px] text-blue-500 font-bold uppercase block">Issued</span>
                  <span className="font-mono font-bold text-blue-500 text-lg">{initialKPIs.issuedCount}</span>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <span className="text-[10px] text-amber-500 font-bold uppercase block">Partially Paid</span>
                  <span className="font-mono font-bold text-amber-500 text-lg">{initialKPIs.partiallyPaidCount}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase block">Paid</span>
                  <span className="font-mono font-bold text-emerald-500 text-lg">{initialKPIs.paidCount}</span>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="text-[10px] text-rose-500 font-bold uppercase block">Overdue</span>
                  <span className="font-mono font-bold text-rose-500 text-lg">{initialKPIs.overdueCount}</span>
                </div>
                <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cancelled</span>
                  <span className="font-mono font-bold text-slate-500 text-lg">{initialKPIs.cancelledCount}</span>
                </div>
              </div>
            </div>

            {/* Operating Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Operating Cash Flow Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Completed Revenue Collected</span>
                  <span className="font-mono font-bold text-emerald-500">{formatCurrency(initialKPIs.totalCollected)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Operating Expenses Outflow</span>
                  <span className="font-mono font-bold text-rose-500">-{formatCurrency(initialKPIs.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white">Net Cash Flow</span>
                  <span className={`font-mono font-black text-sm ${initialKPIs.netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(initialKPIs.netCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT METHODS */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Payment Method Collection Distribution
            </h3>

            <div className="space-y-4">
              {paymentMethods.map((m) => (
                <div key={m.method} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{m.methodLabel}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.count} txns
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-500 mr-3">{formatCurrency(m.amount)}</span>
                      <span className="font-mono font-bold text-amber-500 text-xs">{m.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${m.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER STATEMENT */}
      {activeTab === 'statement' && (
        <div className="space-y-6">
          {/* Customer Selection Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value)
                  window.location.href = `/dashboard/finance/reports?customer_id=${e.target.value}`
                }}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {initialStatement?.customer && (
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Invoiced</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(initialStatement.totalInvoiced)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Collected</span>
                  <span className="font-mono font-bold text-emerald-500">{formatCurrency(initialStatement.totalCollected)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding</span>
                  <span className="font-mono font-bold text-amber-500">{formatCurrency(initialStatement.outstandingBalance)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statement Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            {initialStatement && initialStatement.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Debit (Billed)</th>
                      <th className="py-3 px-4 text-right">Credit (Paid)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                    {initialStatement.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                        <td className="py-3 px-4 font-mono">{it.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              it.type === 'invoice'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}
                          >
                            {it.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{it.reference}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{it.description}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {it.debit > 0 ? formatCurrency(it.debit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-500">
                          {it.credit > 0 ? formatCurrency(it.credit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-500">{formatCurrency(it.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">No financial transactions recorded for this customer.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AGING REPORT */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {/* Aging Summary Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Not Due Yet</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-lg block mt-1">{formatCurrency(agingReport.summary.notDue)}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-500 block">0–30 Days Overdue</span>
              <span className="font-mono font-bold text-amber-500 text-lg block mt-1">{formatCurrency(agingReport.summary.bucket0_30)}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 block">31–60 Days Overdue</span>
              <span className="font-mono font-bold text-amber-600 text-lg block mt-1">{formatCurrency(agingReport.summary.bucket31_60)}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-rose-500 block">61–90 Days Overdue</span>
              <span className="font-mono font-bold text-rose-500 text-lg block mt-1">{formatCurrency(agingReport.summary.bucket61_90)}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-rose-700 block">90+ Days (Severe)</span>
              <span className="font-mono font-bold text-rose-700 text-lg block mt-1">{formatCurrency(agingReport.summary.bucket90Plus)}</span>
            </div>
          </div>

          {/* Aging Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            {agingReport.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Days Overdue</th>
                      <th className="py-3 px-4">Invoice Amount</th>
                      <th className="py-3 px-4">Balance Due</th>
                      <th className="py-3 px-4">Aging Bucket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                    {agingReport.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                        <td className="py-3 px-4 font-mono font-bold text-amber-500">{it.invoiceNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{it.customerName}</td>
                        <td className="py-3 px-4 font-mono">{it.dueDate}</td>
                        <td className="py-3 px-4 font-mono font-bold">{it.daysOverdue > 0 ? `${it.daysOverdue} days` : 'Current (Not due)'}</td>
                        <td className="py-3 px-4 font-mono">{formatCurrency(it.invoiceAmount)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-500">{formatCurrency(it.balanceDue)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              it.bucket === 'not_due'
                                ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                : it.bucket === '0_30'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}
                          >
                            {it.bucket.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">No outstanding or overdue accounts receivable found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
