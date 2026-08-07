'use client'

import { useState, useMemo } from 'react'
import { Car, X, Calculator, AlertTriangle } from 'lucide-react'

interface RecordReturnModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (returnData: any) => Promise<void>
  initialPickupOdometer?: number
  allowedKmTotal?: number
  configuredExtraKmRate?: number
}

export function RecordReturnModal({
  isOpen,
  onClose,
  onSubmit,
  initialPickupOdometer = 50000,
  allowedKmTotal = 500,
  configuredExtraKmRate = 100,
}: RecordReturnModalProps) {
  const [loading, setLoading] = useState(false)
  const [pickupOdo, setPickupOdo] = useState(initialPickupOdometer)
  const [returnOdo, setReturnOdo] = useState(initialPickupOdometer + 650)
  const [allowedKm, setAllowedKm] = useState(allowedKmTotal)
  const [extraKmRate, setExtraKmRate] = useState(configuredExtraKmRate)
  const [pickupFuel, setPickupFuel] = useState(100)
  const [returnFuel, setReturnFuel] = useState(100)
  const [exterior, setExterior] = useState<'pass' | 'attention_required' | 'damage_found'>('pass')
  const [interior, setInterior] = useState<'pass' | 'attention_required' | 'damage_found'>('pass')
  const [tyres, setTyres] = useState<'pass' | 'attention_required' | 'damage_found'>('pass')
  const [lights, setLights] = useState<'pass' | 'attention_required' | 'damage_found'>('pass')
  const [glass, setGlass] = useState<'pass' | 'attention_required' | 'damage_found'>('pass')
  const [damageFound, setDamageFound] = useState(false)
  const [damageDesc, setDamageDesc] = useState('')
  const [notes, setNotes] = useState('')

  // Calculations
  const actualKm = useMemo(() => Math.max(returnOdo - pickupOdo, 0), [returnOdo, pickupOdo])
  const extraKm = useMemo(() => Math.max(actualKm - allowedKm, 0), [actualKm, allowedKm])
  const extraKmCharge = useMemo(() => extraKm * extraKmRate, [extraKm, extraKmRate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (returnOdo < pickupOdo) {
      alert(`Return odometer (${returnOdo.toLocaleString()} KM) cannot be less than pickup odometer (${pickupOdo.toLocaleString()} KM).`)
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        pickup_odometer: pickupOdo,
        return_odometer: returnOdo,
        actual_km_driven: actualKm,
        allowed_km: allowedKm,
        extra_km: extraKm,
        extra_km_rate: extraKmRate,
        extra_km_charge: extraKmCharge,
        pickup_fuel_percent: pickupFuel,
        return_fuel_percent: returnFuel,
        exterior_condition: exterior,
        interior_condition: interior,
        tyres_condition: tyres,
        lights_condition: lights,
        glass_condition: glass,
        damage_found: damageFound,
        damage_description: damageDesc,
        overall_status: damageFound ? 'damage_found' : 'pass',
        notes,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Car size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Record Vehicle Return & Inspection</h2>
              <p className="text-[11px] text-slate-400">Mileage calculation & return verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Mileage & Extra KM Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Calculator size={16} className="text-amber-500" />
              <span>Odometer & Extra Mileage Calculation</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Pickup Odometer (KM)
                </label>
                <input
                  type="number"
                  value={pickupOdo}
                  onChange={(e) => setPickupOdo(Number(e.target.value))}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Return Odometer (KM)
                </label>
                <input
                  type="number"
                  value={returnOdo}
                  onChange={(e) => setReturnOdo(Number(e.target.value))}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Actual KM</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{actualKm.toLocaleString()} KM</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Allowed KM</span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-sm">{allowedKm.toLocaleString()} KM</span>
              </div>

              <div>
                <span className="text-[10px] text-rose-500 font-bold uppercase block">Extra KM</span>
                <span className="font-mono font-black text-rose-500 text-sm">{extraKm.toLocaleString()} KM</span>
              </div>
            </div>

            {extraKm > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-xs">Extra KM Charge Calculated</span>
                  <span className="text-[11px]">{extraKm.toLocaleString()} KM × LKR {extraKmRate}/KM</span>
                </div>
                <span className="font-mono font-black text-base">LKR {extraKmCharge.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Condition Inspection Checks */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">Return Condition Inspection</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Exterior Body</label>
                <select
                  value={exterior}
                  onChange={(e: any) => setExterior(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="pass">Pass (Clean)</option>
                  <option value="attention_required">Attention Required</option>
                  <option value="damage_found">Damage Found</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Interior Cleanliness</label>
                <select
                  value={interior}
                  onChange={(e: any) => setInterior(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="pass">Pass (Clean)</option>
                  <option value="attention_required">Attention Required</option>
                  <option value="damage_found">Damage Found</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tyres & Spare</label>
                <select
                  value={tyres}
                  onChange={(e: any) => setTyres(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="pass">Pass (Good)</option>
                  <option value="attention_required">Attention Required</option>
                  <option value="damage_found">Damage Found</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Glass & Mirrors</label>
                <select
                  value={glass}
                  onChange={(e: any) => setGlass(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="pass">Pass (Intact)</option>
                  <option value="attention_required">Attention Required</option>
                  <option value="damage_found">Damage Found</option>
                </select>
              </div>
            </div>
          </div>

          {/* Damage Check & Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={damageFound}
                onChange={(e) => setDamageFound(e.target.checked)}
                className="accent-rose-500"
              />
              <span className="font-bold text-rose-600 dark:text-rose-400">Damage Identified During Return</span>
            </label>

            {damageFound && (
              <textarea
                rows={2}
                value={damageDesc}
                onChange={(e) => setDamageDesc(e.target.value)}
                placeholder="Describe damage location, severity, and photo references..."
                className="w-full p-2.5 bg-rose-500/5 border border-rose-500/30 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              General Return Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Staff return notes..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
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
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Recording Return...' : 'Record Vehicle Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
