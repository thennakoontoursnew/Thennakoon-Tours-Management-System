'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Play, Clock, ArrowRight } from 'lucide-react'
import { NewContentModal } from '@/components/marketing/new-content-modal'
import { createContentItemAction, changeContentStatusAction } from '../marketing-actions'

interface PlannerClientWrapperProps {
  contentItems: any[]
}

export function PlannerClientWrapper({ contentItems }: PlannerClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = [
    { id: 'idea', label: 'Ideas' },
    { id: 'planned', label: 'Planned' },
    { id: 'in_production', label: 'In Production' },
    { id: 'ready_for_review', label: 'Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
  ]

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await changeContentStatusAction(id, newStatus)
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
          <span>New Content Item</span>
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-4 scrollbar-none">
        {columns.map((col) => {
          const items = contentItems.filter((i) => i.status === col.id)

          return (
            <div key={col.id} className="bg-slate-100/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 min-w-[200px]">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-500">{items.length}</span>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">{item.content_number}</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{item.title}</h4>
                    <div className="text-[10px] text-slate-400">{item.content_type} • {item.content_pillar}</div>
                    
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.planned_publish_at ? new Date(item.planned_publish_at).toLocaleDateString() : 'No date'}
                      </span>
                      {item.status !== 'published' && (
                        <button
                          onClick={() => {
                            const nextMap: any = {
                              idea: 'planned',
                              planned: 'in_production',
                              in_production: 'ready_for_review',
                              ready_for_review: 'approved',
                              approved: 'scheduled',
                              scheduled: 'published',
                            }
                            handleStatusChange(item.id, nextMap[item.status] || 'published')
                          }}
                          className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 cursor-pointer"
                          title="Advance Status"
                        >
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-slate-400 italic">No items</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NewContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (contentData) => {
          await createContentItemAction(contentData)
          router.refresh()
        }}
      />
    </>
  )
}
