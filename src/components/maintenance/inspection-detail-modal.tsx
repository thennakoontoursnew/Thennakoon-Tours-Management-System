'use client'

import { ClipboardCheck, X, Gauge, Fuel, Calendar, FileText, CheckCircle, AlertTriangle, XCircle, User } from 'lucide-react'

interface InspectionDetailModalProps {
  isOpen: boolean
  inspection: {
    id: string
    inspection_number: string
    inspection_type?: string
    inspection_date: string
    odometer_reading?: number | null
    fuel_level_percent?: number | null
    overall_condition?: string
    status?: string
    general_notes?: string | null
    vehicle?: {
      vehicle_name?: string
      registration_number?: string
      vehicle_code?: string
      status?: string
    } | null
  } | null
  onClose: () => void
}

export function InspectionDetailModal({ isOpen, inspection, onClose }: InspectionDetailModalProps) {
  if (!isOpen || !inspection) return null

  const cond = inspection.overall_condition || 'pass'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Inspection Audit Log</h2>
                <span className="font-mono font-bold text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                  {inspection.inspection_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Complete technical audit entry & health observations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Vehicle Info Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {inspection.vehicle?.vehicle_name || 'Vehicle Record'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Plate: <strong className="text-slate-800 dark:text-slate-200">{inspection.vehicle?.registration_number || 'N/A'}</strong> &bull; Code: {inspection.vehicle?.vehicle_code || 'N/A'}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {inspection.vehicle?.status?.replace(/_/g, ' ') || 'Registered'}
            </span>
          </div>

          {/* Audit Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} />
                <span>Audit Date</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                {new Date(inspection.inspection_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} />
                <span>Inspection Type</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-xs capitalize">
                {inspection.inspection_type?.replace(/_/g, ' ') || 'General Audit'}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Gauge size={12} />
                <span>Odometer Reading</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                {inspection.odometer_reading ? `${Number(inspection.odometer_reading).toLocaleString()} KM` : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Fuel size={12} />
                <span>Fuel Level</span>
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                {inspection.fuel_level_percent ? `${inspection.fuel_level_percent}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Overall Condition Result */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Condition Assessment</div>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${
                  cond === 'pass'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : cond === 'attention_required'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                {cond === 'pass' ? (
                  <CheckCircle size={14} />
                ) : cond === 'attention_required' ? (
                  <AlertTriangle size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                <span>{cond.replace(/_/g, ' ')}</span>
              </span>
            </div>
          </div>

          {/* Inspector Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Inspector Observations & Notes</label>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 min-h-[60px] italic">
              {inspection.general_notes || 'No extra observations noted during this inspection.'}
            </div>
          </div>

          <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-800 font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
            >
              Close Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
