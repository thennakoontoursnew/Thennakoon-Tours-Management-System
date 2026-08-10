'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  CalendarCheck,
  ScrollText,
  Users,
  Car,
  UserRound,
  FileSpreadsheet,
  Building2,
  Fuel,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const quickCategories = [
    { label: 'User Agreement', href: '/dashboard/agreements', icon: ScrollText, queryParam: 'q' },
    { label: 'Owner Agreement', href: '/dashboard/agreements', icon: ShieldCheck, queryParam: 'q' },
    { label: 'Bookings', href: '/dashboard/bookings', icon: CalendarCheck, queryParam: 'q' },
    { label: 'Quotations', href: '/dashboard/quotations', icon: FileText, queryParam: 'q' },
    { label: 'Invoices', href: '/dashboard/invoices', icon: FileSpreadsheet, queryParam: 'q' },
    { label: 'Customers', href: '/dashboard/customers', icon: Users, queryParam: 'q' },
    { label: 'Vehicles', href: '/dashboard/vehicles', icon: Car, queryParam: 'q' },
    { label: 'Vehicle Owners', href: '/dashboard/fleet/owners', icon: Building2, queryParam: 'q' },
    { label: 'Fuel Logs', href: '/dashboard/fleet/fuel', icon: Fuel, queryParam: 'q' },
    { label: 'Drivers', href: '/dashboard/drivers', icon: UserRound, queryParam: 'q' },
  ]

  const handleSelect = (href: string, param?: string) => {
    onClose()
    if (query.trim() && param) {
      router.push(`${href}?${param}=${encodeURIComponent(query.trim())}`)
    } else {
      router.push(href)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search size={18} className="text-amber-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search User Agreements, Owner Agreements, bookings, quotations, invoices..."
            autoFocus
            className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Quick Search Suggestions */}
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search In Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.label}
                  onClick={() => handleSelect(cat.href, cat.queryParam)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Press enter to search</span>
          <span className="font-mono text-[10px]">Thennakoon Tours ERP v2.0</span>
        </div>
      </div>
    </div>
  )
}
