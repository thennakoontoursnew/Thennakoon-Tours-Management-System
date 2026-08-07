'use client'

import { WalletCards, ArrowUpRight, TrendingUp, DollarSign, CreditCard } from 'lucide-react'

interface FinancialOverviewCardProps {
  summary: {
    totalInvoiced: number
    totalCollected: number
    outstanding: number
  }
}

export function FinancialOverviewCard({ summary }: FinancialOverviewCardProps) {
  const invoiced = summary?.totalInvoiced || 0
  const collected = summary?.totalCollected || 0
  const outstanding = summary?.outstanding || 0
  const expenses = 0 // Recorded expenses (0 until phase 4 expense module)
  const netCashFlow = collected - expenses

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Financial Overview</h2>
            <p className="text-[11px] text-slate-400">Cash flow & billing metrics</p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
          <WalletCards size={18} />
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced</span>
          <p className="text-base font-black text-slate-900 dark:text-white font-mono">
            LKR {invoiced.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-500">Collected Income</span>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
            LKR {collected.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400">Outstanding Balance</span>
          <p className="text-base font-black text-rose-500 dark:text-rose-400 font-mono">
            LKR {outstanding.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Recorded Expenses</span>
          <p className="text-base font-black text-slate-700 dark:text-slate-300 font-mono">
            LKR {expenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Net Cash Flow Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Net Cash Flow</span>
          <p className="text-lg font-black font-mono">
            LKR {netCashFlow.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">Collected Payments − Recorded Expenses</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold">
          <TrendingUp size={20} />
        </div>
      </div>
    </div>
  )
}
