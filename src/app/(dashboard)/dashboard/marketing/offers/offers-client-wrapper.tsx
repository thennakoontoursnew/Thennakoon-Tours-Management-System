'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Tag } from 'lucide-react'
import { NewOfferModal } from '@/components/marketing/new-offer-modal'
import { createOfferAction } from '../marketing-actions'

interface OffersClientWrapperProps {
  offers: any[]
}

export function OffersClientWrapper({ offers }: OffersClientWrapperProps) {
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
          <span>New Offer & Promo Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length > 0 ? (
          offers.map((o) => (
            <div key={o.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">{o.offer_number}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  o.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {o.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{o.name}</h3>
                <div className="text-xs font-mono font-bold text-amber-500 mt-1">
                  PROMO: {o.promo_code || 'NO-CODE'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Discount</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `LKR ${o.discount_value} OFF`}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 italic">No marketing offers or promo codes registered.</div>
        )}
      </div>

      <NewOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (offerData) => {
          await createOfferAction(offerData)
          router.refresh()
        }}
      />
    </>
  )
}
