'use client'

import { useState } from 'react'
import { Calculator, X } from 'lucide-react'

interface VehicleOdometerModalProps {
  isOpen: boolean
  vehicleId: string
  currentOdometer: number
  isOwner: boolean
  onClose: () => void
  onSubmit: (newOdometer: number, sourceType: string, notes: string, isOwnerOverride: boolean) => Promise<void>
}

export function VehicleOdometerModal({
  isOpen,
  vehicleId,
  currentOdometer,
  isOwner,
  onClose,
  onSubmit,
}: VehicleOdometerModalProps) {
  const [loading, setLoading] = useState(false)
  const [newOdo, setNewOdo] = useState(currentOdometer + 100)
  const [sourceType, setSourceType] = useState('manual')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const isLower = newOdo < currentOdometer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLower && !isOwner) {
      alert(`New odometer reading (${newOdo.toLocaleString()} KM) cannot be less than current odometer (${currentOdometer.toLocaleString()} KM). Owner override required.`)
      return
    }

    setLoading(true)
    try {
      await onSubmit(newOdo, sourceType, notes, isLower && isOwner)
      onClose()
    } catch (err) {
      console.error(err)
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
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Log Odometer Reading</h2>
              <p className="text-[11px] text-slate-400">Record updated vehicle mileage entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-500 font-bold">Current Odometer:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {currentOdometer.toLocaleString()} KM
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              New Odometer Reading (KM) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={newOdo}
              onChange={(e) => setNewOdo(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          {isLower && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] space-y-1">
              <span className="font-bold block">⚠️ Mileage Reset Warning</span>
              <span>
                Entered value is lower than current mileage. {isOwner ? 'Owner override will record this adjustment.' : 'Only Owner can decrease odometer values.'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Source</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
            >
              <option value="manual">Manual Staff Audit</option>
              <option value="handover">Trip Handover Check</option>
              <option value="return">Trip Return Check</option>
              <option value="maintenance">Maintenance Service</option>
              <option value="inspection">Fleet Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for odometer update..."
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
              disabled={loading || (isLower && !isOwner)}
              className="px-5 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all cursor-pointer"
            >
              {loading ? 'Logging...' : 'Save Odometer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
