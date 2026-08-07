'use client'

import { useState } from 'react'
import { Share2, X } from 'lucide-react'

interface ManualMetricModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
  onSubmit: (metricData: any) => Promise<void>
}

export function ManualMetricModal({ isOpen, onClose, accounts, onSubmit }: ManualMetricModalProps) {
  const [loading, setLoading] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [metricDate, setMetricDate] = useState(new Date().toISOString().slice(0, 10))
  const [followers, setFollowers] = useState(12500)
  const [reach, setReach] = useState(45000)
  const [views, setViews] = useState(18000)
  const [engagements, setEngagements] = useState(3200)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      await onSubmit({
        social_account_id: accountId || accounts[0]?.id,
        metric_date: metricDate,
        followers: Number(followers),
        reach: Number(reach),
        views: Number(views),
        engagements: Number(engagements),
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
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Record Manual Social Metrics</h2>
              <p className="text-[11px] text-slate-400">Log follower count, monthly reach, views, and engagements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Select Channel Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.platform.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Snapshot Date</label>
            <input
              type="date"
              value={metricDate}
              onChange={(e) => setMetricDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Followers Count</label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Monthly Reach</label>
              <input
                type="number"
                value={reach}
                onChange={(e) => setReach(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Video Views</label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Total Engagements</label>
              <input
                type="number"
                value={engagements}
                onChange={(e) => setEngagements(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
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
              {loading ? 'Saving...' : 'Record Metrics'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
