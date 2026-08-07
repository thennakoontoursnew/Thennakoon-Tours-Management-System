'use client'

import { useState } from 'react'
import { ClipboardCheck, X } from 'lucide-react'

interface NewInspectionModalProps {
  isOpen: boolean
  vehicles: any[]
  onClose: () => void
  onSubmit: (inspectionData: any) => Promise<void>
}

export function NewInspectionModal({ isOpen, vehicles, onClose, onSubmit }: NewInspectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '')
  const [inspectionType, setInspectionType] = useState('general')
  const [odometerReading, setOdometerReading] = useState('')
  const [fuelLevelPercent, setFuelLevelPercent] = useState('100')
  const [overallCondition, setOverallCondition] = useState('pass')
  const [generalNotes, setGeneralNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId) return

    setLoading(true)
    try {
      await onSubmit({
        vehicle_id: vehicleId,
        inspection_type: inspectionType,
        odometer_reading: odometerReading ? Number(odometerReading) : undefined,
        fuel_level_percent: Number(fuelLevelPercent),
        overall_condition: overallCondition,
        general_notes: generalNotes || undefined,
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
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
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">New Vehicle Inspection</h2>
              <p className="text-[11px] text-slate-400">Record vehicle health check, odometer & condition audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Select Vehicle <span className="text-rose-500">*</span></label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_name} ({v.registration_number}) - {v.vehicle_code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Inspection Type <span className="text-rose-500">*</span></label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="general">General Inspection</option>
                <option value="pre_handover">Pre-Handover Check</option>
                <option value="return">Return Inspection</option>
                <option value="maintenance">Maintenance Inspection</option>
                <option value="damage">Damage Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Odometer (KM)</label>
              <input
                type="number"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                placeholder="e.g. 68500"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Fuel Level %</label>
              <select
                value={fuelLevelPercent}
                onChange={(e) => setFuelLevelPercent(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="100">100% Full Tank</option>
                <option value="75">75% (3/4 Tank)</option>
                <option value="50">50% (Half Tank)</option>
                <option value="25">25% (1/4 Tank)</option>
                <option value="10">10% Low Fuel</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Overall Result <span className="text-rose-500">*</span></label>
              <select
                value={overallCondition}
                onChange={(e) => setOverallCondition(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
              >
                <option value="pass">PASS — Vehicle Ready</option>
                <option value="attention_required">Attention Required (Minor)</option>
                <option value="damage_found">Damage Found</option>
                <option value="maintenance_required">Maintenance Required</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Inspector Notes / Observations</label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Record any exterior scratches, tyre wear, or interior cleanliness comments..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
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
              {loading ? 'Saving...' : 'Complete Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
