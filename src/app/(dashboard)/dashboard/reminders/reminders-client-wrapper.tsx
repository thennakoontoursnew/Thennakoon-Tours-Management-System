'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle, XCircle, Bell } from 'lucide-react'
import { NewReminderModal } from '@/components/reminders/new-reminder-modal'
import { createManualReminderAction, markReminderCompleteAction, dismissReminderAction } from './reminder-actions'

interface RemindersClientWrapperProps {
  reminders: any[]
}

export function RemindersClientWrapper({ reminders }: RemindersClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleComplete = async (id: string) => {
    try {
      await markReminderCompleteAction(id)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismissReminderAction(id)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>New Staff Reminder</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {reminders && reminders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{r.reminder_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{r.message}</div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold">{r.reminder_type.replace('_', ' ')}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${
                        r.priority === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                        r.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{r.due_at ? new Date(r.due_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4 capitalize font-semibold">{r.source}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        r.status === 'overdue' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {r.status !== 'completed' && (
                        <button
                          onClick={() => handleComplete(r.id)}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          title="Mark Complete"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {r.status !== 'dismissed' && (
                        <button
                          onClick={() => handleDismiss(r.id)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 cursor-pointer"
                          title="Dismiss"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No reminders found. All system tasks up to date!</div>
        )}
      </div>

      <NewReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (reminderData) => {
          await createManualReminderAction(reminderData)
          router.refresh()
        }}
      />
    </>
  )
}
