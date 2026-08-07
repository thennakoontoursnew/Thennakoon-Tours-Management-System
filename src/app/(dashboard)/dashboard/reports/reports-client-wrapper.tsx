'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  DollarSign,
  Users,
  Car,
  UserSquare2,
  Wrench,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { ReportDefinition } from '@/lib/reports/report-registry'

interface ReportsClientWrapperProps {
  reports: ReportDefinition[]
}

export function ReportsClientWrapper({ reports }: ReportsClientWrapperProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All Reports' },
    { id: 'operations', label: 'Operations' },
    { id: 'finance', label: 'Finance' },
    { id: 'crm', label: 'CRM & Sales' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'communication', label: 'Communication' },
    { id: 'executive', label: 'Executive' },
  ]

  const filteredReports = reports.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Category Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search report name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/reports/${r.id}`}
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 transition-all shadow-xs flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {r.category}
                </span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-500 transition-colors">
                {r.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[10px] font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-850">
              {r.supportsCsv && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">CSV</span>}
              {r.supportsPdf && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">PDF</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
