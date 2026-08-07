'use client'

import { useState } from 'react'
import { CheckCircle2, X, AlertTriangle } from 'lucide-react'

interface VehicleReadyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (handoverData: any) => Promise<void>
}

export function VehicleReadyModal({ isOpen, onClose, onSubmit }: VehicleReadyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cleanliness_checked: true,
    documents_checked: true,
    insurance_valid: true,
    revenue_license_valid: true,
    emission_test_valid: true,
    tyres_checked: true,
    lights_checked: true,
    fuel_level_percent: 100,
    odometer_reading: 50000,
    existing_damage_notes: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Vehicle Ready Checklist</h2>
              <p className="text-[11px] text-slate-400">Pre-handover verification for booking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cleanliness_checked}
                onChange={(e) => setFormData({ ...formData, cleanliness_checked: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Vehicle Cleaned</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.documents_checked}
                onChange={(e) => setFormData({ ...formData, documents_checked: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Vehicle Documents</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.insurance_valid}
                onChange={(e) => setFormData({ ...formData, insurance_valid: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Insurance Valid</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.revenue_license_valid}
                onChange={(e) => setFormData({ ...formData, revenue_license_valid: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Revenue License</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tyres_checked}
                onChange={(e) => setFormData({ ...formData, tyres_checked: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Tyres Inspected</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.lights_checked}
                onChange={(e) => setFormData({ ...formData, lights_checked: e.target.checked })}
                className="accent-amber-400"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Lights & Indicators</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Fuel Level (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.fuel_level_percent}
                onChange={(e) => setFormData({ ...formData, fuel_level_percent: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Current Odometer (KM)
              </label>
              <input
                type="number"
                min="0"
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Existing Damage / Inspection Notes
            </label>
            <textarea
              rows={2}
              value={formData.existing_damage_notes}
              onChange={(e) => setFormData({ ...formData, existing_damage_notes: e.target.value })}
              placeholder="Record any minor scratches, dents, or pre-existing condition notes..."
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
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Confirming...' : 'Confirm Vehicle Ready'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
