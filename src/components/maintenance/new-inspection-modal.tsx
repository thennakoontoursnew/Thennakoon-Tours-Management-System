'use client'

import { useState } from 'react'
import { ClipboardCheck, X, Car, PlusCircle, Info } from 'lucide-react'

interface NewInspectionModalProps {
  isOpen: boolean
  vehicles: any[]
  categories?: any[]
  onClose: () => void
  onSubmit: (inspectionData: any) => Promise<void>
}

export function NewInspectionModal({ isOpen, vehicles, categories = [], onClose, onSubmit }: NewInspectionModalProps) {
  const [mode, setMode] = useState<'existing' | 'onboarding'>('existing')
  const [loading, setLoading] = useState(false)

  // Existing mode state
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '')

  // Onboarding mode state
  const [regNumber, setRegNumber] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [manufactureYear, setManufactureYear] = useState(new Date().getFullYear().toString())
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [transmission, setTransmission] = useState<'automatic' | 'manual'>('automatic')
  const [fuelType, setFuelType] = useState('petrol')
  const [ownerContactName, setOwnerContactName] = useState('')
  const [ownerContactPhone, setOwnerContactPhone] = useState('')
  const [agreedPayoutRate, setAgreedPayoutRate] = useState('')

  // Shared inspection state
  const [inspectionType, setInspectionType] = useState('general')
  const [odometerReading, setOdometerReading] = useState('')
  const [fuelLevelPercent, setFuelLevelPercent] = useState('100')
  const [overallCondition, setOverallCondition] = useState('pass')
  const [generalNotes, setGeneralNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'onboarding') {
        if (!regNumber || !vehicleName) {
          alert('Please enter Registration Number and Vehicle Name for onboarding.')
          setLoading(false)
          return
        }
        await onSubmit({
          mode: 'onboarding',
          registration_number: regNumber,
          vehicle_name: vehicleName,
          brand: brand || vehicleName.split(' ')[0],
          model: model || vehicleName.split(' ').slice(1).join(' '),
          manufacture_year: Number(manufactureYear) || new Date().getFullYear(),
          category_id: categoryId || categories[0]?.id,
          transmission,
          fuel_type: fuelType,
          owner_contact_name: ownerContactName || undefined,
          owner_contact_phone: ownerContactPhone || undefined,
          agreed_payout_rate: agreedPayoutRate ? Number(agreedPayoutRate) : undefined,
          inspection_type: inspectionType || 'pre_onboarding',
          odometer_reading: odometerReading ? Number(odometerReading) : 0,
          fuel_level_percent: Number(fuelLevelPercent),
          overall_condition: overallCondition,
          general_notes: generalNotes || undefined,
        })
      } else {
        if (!vehicleId) {
          alert('Please select a vehicle.')
          setLoading(false)
          return
        }
        await onSubmit({
          mode: 'existing',
          vehicle_id: vehicleId,
          inspection_type: inspectionType,
          odometer_reading: odometerReading ? Number(odometerReading) : undefined,
          fuel_level_percent: Number(fuelLevelPercent),
          overall_condition: overallCondition,
          general_notes: generalNotes || undefined,
        })
      }
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 my-8">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Vehicle Inspection & Onboarding</h2>
              <p className="text-[11px] text-slate-400">Record health checks, odometer & pre-fleet audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={() => {
              setMode('existing')
              setInspectionType('general')
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'existing'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Existing Fleet Vehicle
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('onboarding')
              setInspectionType('pre_onboarding')
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'onboarding'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <PlusCircle size={14} className={mode === 'onboarding' ? 'text-purple-500' : 'text-slate-400'} />
            <span>New Vehicle Onboarding</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {mode === 'onboarding' ? (
            /* Mode 2: New Vehicle Onboarding Fields */
            <div className="space-y-3 p-3.5 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">
                New Vehicle Details (Pre-Fleet Intake)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Plate / Reg Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. WP CAB-1234"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle Name / Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="e.g. Toyota Prius 1.8"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    value={manufactureYear}
                    onChange={(e) => setManufactureYear(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Owner / Supplier & Proposed Payout Rate Section */}
              <div className="pt-2 border-t border-purple-200/40 dark:border-purple-800/40 space-y-2">
                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Owner / Supplier Contact & Rate Negotiation
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Owner Contact Name</label>
                    <input
                      type="text"
                      value={ownerContactName}
                      onChange={(e) => setOwnerContactName(e.target.value)}
                      placeholder="e.g. Bandara (Owner)"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Owner Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={ownerContactPhone}
                      onChange={(e) => setOwnerContactPhone(e.target.value)}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Proposed Rate (LKR/Day)</label>
                    <input
                      type="number"
                      value={agreedPayoutRate}
                      onChange={(e) => setAgreedPayoutRate(e.target.value)}
                      placeholder="e.g. 12000"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 1: Existing Vehicle Dropdown */
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Select Fleet Vehicle <span className="text-rose-500">*</span>
              </label>
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
          )}

          {/* Inspection Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Inspection Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                {mode === 'onboarding' && <option value="pre_onboarding">Pre-Fleet Onboarding Audit</option>}
                <option value="general">General Inspection</option>
                <option value="pre_handover">Pre-Handover Check</option>
                <option value="return">Return Inspection</option>
                <option value="maintenance">Maintenance Inspection</option>
                <option value="damage">Damage Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Initial / Odometer (KM)</label>
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
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Overall Result <span className="text-rose-500">*</span>
              </label>
              <select
                value={overallCondition}
                onChange={(e) => setOverallCondition(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
              >
                <option value="pass">PASS — Vehicle Ready</option>
                <option value="attention_required">Attention Required (Minor)</option>
                <option value="damage_found">Damage Found (FAIL)</option>
                <option value="maintenance_required">Maintenance Required (FAIL)</option>
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

          {/* Onboarding UI Hint Banner */}
          {mode === 'onboarding' && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-2 font-medium">
              <Info size={15} className="shrink-0 mt-0.5 text-purple-500" />
              <span>
                Vehicles will only become available in the active fleet once the inspection is marked as <strong>PASS</strong>.
              </span>
            </div>
          )}

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
              className={`px-5 py-2 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer ${
                mode === 'onboarding' ? 'bg-purple-400 hover:bg-purple-300' : 'bg-amber-400 hover:bg-amber-300'
              }`}
            >
              {loading ? 'Processing...' : mode === 'onboarding' ? 'Onboard & Record Audit' : 'Complete Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
