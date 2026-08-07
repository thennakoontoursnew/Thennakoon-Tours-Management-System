'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Share2, AlertCircle } from 'lucide-react'
import { ManualMetricModal } from '@/components/marketing/manual-metric-modal'
import { recordManualSocialSnapshotAction } from '../marketing-actions'

interface SocialClientWrapperProps {
  accounts: any[]
  snapshots: any[]
}

export function SocialClientWrapper({ accounts, snapshots }: SocialClientWrapperProps) {
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
          <span>Record Social Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">{acc.account_name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500">
                Source: {acc.data_source}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">{acc.account_handle || '@thennakoontours'}</div>
          </div>
        ))}
      </div>

      <ManualMetricModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        onSubmit={async (metricData) => {
          await recordManualSocialSnapshotAction(metricData)
          router.refresh()
        }}
      />
    </>
  )
}
