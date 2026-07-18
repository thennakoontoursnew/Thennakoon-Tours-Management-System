'use client'

import { useState } from 'react'
import { addCustomerNote } from '../customer-actions'
import { MessageSquare, Plus, Clock } from 'lucide-react'

interface Note {
  id: string
  note: string
  created_at: string
  profiles?: { full_name: string } | null
}

interface Props {
  customerId: string
  initialNotes: Note[]
}

export function CustomerNotesSection({ customerId, initialNotes }: Props) {
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return

    setLoading(true)
    setError(null)

    const res = await addCustomerNote(customerId, noteText)
    if (!res.success) {
      setError(res.error || 'Failed to add note.')
      setLoading(false)
      return
    }

    setNoteText('')
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Notes & Timeline
          </h3>
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          rows={3}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add an internal note or communication record..."
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        ></textarea>
        <button
          type="submit"
          disabled={loading || !noteText.trim()}
          className="w-full py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus size={14} />
          <span>{loading ? 'Adding Note...' : 'Add Note to Timeline'}</span>
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-3 pt-2">
        {initialNotes && initialNotes.length > 0 ? (
          initialNotes.map((n) => (
            <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <p className="text-slate-800 dark:text-slate-200 leading-normal">{n.note}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <span className="font-semibold">{n.profiles?.full_name || 'Staff Member'}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-xs text-slate-400 py-4">No notes recorded yet.</p>
        )}
      </div>
    </div>
  )
}
