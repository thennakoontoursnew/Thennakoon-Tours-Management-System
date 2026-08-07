'use client'

import { useState } from 'react'
import { Target, X } from 'lucide-react'

interface NewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (campaignData: any) => Promise<void>
}

export function NewCampaignModal({ isOpen, onClose, onSubmit }: NewCampaignModalProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('Lead Generation')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const [budget, setBudget] = useState(50000)
  const [actualSpend, setActualSpend] = useState(0)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        name,
        objective,
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget),
        actual_spend: Number(actualSpend),
        status: 'active',
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Target size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Create Marketing Campaign</h2>
              <p className="text-[11px] text-slate-400">Set campaign targets, dates, and advertising budget</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Campaign Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Luxury Tour Promotion 2026"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Campaign Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
            >
              <option value="Lead Generation">Lead Generation</option>
              <option value="Brand Awareness">Brand Awareness</option>
              <option value="Bookings Boost">Bookings Boost</option>
              <option value="Vehicle Promotion">Vehicle Promotion</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Planned Budget (LKR)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Actual Spend (LKR)</label>
              <input
                type="number"
                value={actualSpend}
                onChange={(e) => setActualSpend(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
