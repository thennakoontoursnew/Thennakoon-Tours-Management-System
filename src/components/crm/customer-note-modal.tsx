'use client'

import { useState } from 'react'
import { FileText, X } from 'lucide-react'

interface CustomerNoteModalProps {
  isOpen: boolean
  customerId: string
  onClose: () => void
  onSubmit: (noteData: { note: string; note_type: string; is_important: boolean }) => Promise<void>
}

export function CustomerNoteModal({
  isOpen,
  customerId,
  onClose,
  onSubmit,
}: CustomerNoteModalProps) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [isImportant, setIsImportant] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        note,
        note_type: noteType,
        is_important: isImportant,
      })
      setNote('')
      onClose()
    } catch (err) {
      console.error(err)
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
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Add Internal Customer Note</h2>
              <p className="text-[11px] text-slate-400">Internal operational log — never visible to customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Note Category / Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
            >
              <option value="general">General Note</option>
              <option value="booking">Booking Preference / Special Request</option>
              <option value="payment">Payment Record / Promise</option>
              <option value="complaint">Complaint / Feedback</option>
              <option value="risk">Risk / Conduct Log</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Note Content <span className="text-rose-500">*</span></label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record details of conversation, payment commitment, or customer preference..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="is_important" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Flag as High Priority / Pin to Top
            </label>
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
              {loading ? 'Saving...' : 'Save Customer Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
