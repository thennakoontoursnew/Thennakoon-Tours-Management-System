'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Wrench, CheckCircle } from 'lucide-react'
import { NewTaskModal } from '@/components/maintenance/new-task-modal'
import { createMaintenanceTaskAction, completeMaintenanceTaskAction } from './maintenance-actions'

interface MaintenanceClientWrapperProps {
  vehicles: any[]
  tasks: any[]
}

export function MaintenanceClientWrapper({ vehicles, tasks }: MaintenanceClientWrapperProps) {
  const router = useRouter()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  const handleCompleteTask = async (taskId: string) => {
    const costStr = prompt('Enter total repair / service cost (LKR):', '0')
    if (costStr === null) return
    const totalCost = Number(costStr)

    const createExpense = confirm('Would you like to record this maintenance cost as an operating expense in Finance?')

    try {
      await completeMaintenanceTaskAction(taskId, {
        labour_cost: totalCost,
        create_expense: createExpense,
      })
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {tasks && tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Task No</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Title & Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Garage / Provider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{t.task_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {t.vehicle?.vehicle_name} ({t.vehicle?.registration_number})
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{t.task_type.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${t.priority === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{t.scheduled_date}</td>
                    <td className="py-3 px-4">{t.provider_name || 'In-House Service'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        t.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteTask(t.id)}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle size={13} />
                          <span>Complete Task</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No maintenance tasks scheduled.</div>
        )}
      </div>

      <NewTaskModal
        isOpen={isTaskModalOpen}
        vehicles={vehicles}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (taskData) => {
          await createMaintenanceTaskAction(taskData)
          router.refresh()
        }}
      />
    </>
  )
}
