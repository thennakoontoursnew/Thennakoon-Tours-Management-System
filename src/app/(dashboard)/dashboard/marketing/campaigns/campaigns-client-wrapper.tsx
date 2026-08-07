'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Target, DollarSign } from 'lucide-react'
import { NewCampaignModal } from '@/components/marketing/new-campaign-modal'
import { createCampaignAction } from '../marketing-actions'

interface CampaignsClientWrapperProps {
  campaigns: any[]
}

export function CampaignsClientWrapper({ campaigns }: CampaignsClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.length > 0 ? (
          campaigns.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{c.campaign_number}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {c.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Objective: {c.objective}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Planned Budget</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">LKR {Number(c.budget).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Actual Spend</span>
                  <span className="font-mono font-bold text-rose-500">LKR {Number(c.actual_spend).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2">
                <span>Duration: {c.start_date} to {c.end_date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 italic">No marketing campaigns registered.</div>
        )}
      </div>

      <NewCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (campaignData) => {
          await createCampaignAction(campaignData)
          router.refresh()
        }}
      />
    </>
  )
}
