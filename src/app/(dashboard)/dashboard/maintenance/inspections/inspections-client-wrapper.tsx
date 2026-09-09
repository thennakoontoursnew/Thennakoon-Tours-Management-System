'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ClipboardCheck } from 'lucide-react'
import { NewInspectionModal } from '@/components/maintenance/new-inspection-modal'
import { createVehicleInspectionAction, recordVehicleOnboardingInspectionAction } from '../maintenance-actions'

interface InspectionsClientWrapperProps {
  vehicles: any[]
  categories?: any[]
  inspections: any[]
}

export function InspectionsClientWrapper({ vehicles, categories = [], inspections }: InspectionsClientWrapperProps) {
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
          <span>New Inspection</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {inspections && inspections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Inspection No</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Fuel %</th>
                  <th className="py-3 px-4">Overall Result</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {inspections.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{i.inspection_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {i.vehicle?.vehicle_name} ({i.vehicle?.registration_number})
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold">{i.inspection_type?.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono">{new Date(i.inspection_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono">{i.odometer_reading ? `${i.odometer_reading} KM` : 'N/A'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{i.fuel_level_percent ? `${i.fuel_level_percent}%` : 'N/A'}</td>
                    <td className="py-3 px-4 font-bold uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${
                        i.overall_condition === 'pass' ? 'bg-emerald-500/10 text-emerald-500' :
                        i.overall_condition === 'attention_required' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {i.overall_condition?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No vehicle inspections recorded.</div>
        )}
      </div>

      <NewInspectionModal
        isOpen={isModalOpen}
        vehicles={vehicles}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (inspectionData) => {
          if (inspectionData.mode === 'onboarding') {
            await recordVehicleOnboardingInspectionAction(inspectionData)
          } else {
            await createVehicleInspectionAction(inspectionData)
          }
          router.refresh()
        }}
      />
    </>
  )
}
