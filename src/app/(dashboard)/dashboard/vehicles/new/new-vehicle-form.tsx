'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createVehicleWithOptionalOwner, OwnershipMode } from '../vehicle-actions'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import {
  VehicleOwnershipSection,
  InlineOwnerState,
  INITIAL_INLINE_OWNER,
} from '@/components/fleet/vehicle-ownership-section'
import { VehiclePricingMarginSection } from '@/components/fleet/vehicle-pricing-margin-section'

interface Props {
  categories: { id: string; name: string }[]
  owners: any[]
}

export default function NewVehicleForm({ categories, owners }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('company')
  const [existingOwnerId, setExistingOwnerId] = useState<string>('')
  const [newOwner, setNewOwner] = useState<InlineOwnerState>(INITIAL_INLINE_OWNER)

  const [formData, setFormData] = useState({
    vehicle_name: '',
    brand: '',
    model: '',
    manufacture_year: new Date().getFullYear(),
    category_id: categories[0]?.id || '',
    registration_number: '',
    chassis_number: '',
    engine_number: '',
    transmission: 'automatic',
    fuel_type: 'petrol',
    seat_count: 5,
    colour: '',
    current_mileage: 0,
    // Selling & Owner Rates (Self-Drive & With-Driver)
    daily_rate: 10000,
    weekly_rate: 65000,
    monthly_rate: 250000,
    refundable_deposit: 25000,
    allowed_km_per_day: 100,
    extra_km_charge: 100,
    owner_daily_rate_self: 0,
    owner_monthly_rate_self: 0,
    owner_daily_rate_with_driver: 0,
    owner_monthly_rate_with_driver: 0,
    selling_daily_rate_with_driver: 0,
    selling_monthly_rate_with_driver: 0,
    driver_bata_per_day: 0,
    monthly_km_quota: 3000,
    owner_excess_km_rate: 0,
    service_interval_km: 5000,
    // Compliance & Telematics
    insurance_expiry: '',
    revenue_license_expiry: '',
    emission_test_expiry: '',
    gps_installed: false,
    tracker_id: '',
    status: 'available',
    description: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleNumberChange = (name: string, val: number) => {
    setFormData((prev) => ({ ...prev, [name]: val }))
    if (name === 'monthly_km_quota' || name === 'owner_excess_km_rate') {
      setNewOwner((prev) => ({ ...prev, [name]: val }))
    }
  }

  const handleExistingOwnerChange = (ownerId: string, ownerObj?: any) => {
    setExistingOwnerId(ownerId)
    if (ownerObj) {
      setFormData((prev) => ({
        ...prev,
        monthly_km_quota: ownerObj.monthly_km_quota ?? prev.monthly_km_quota,
        owner_excess_km_rate: ownerObj.owner_excess_km_rate ?? prev.owner_excess_km_rate,
        owner_daily_rate_self:
          prev.owner_daily_rate_self === 0 && ownerObj.flat_rate_per_day
            ? Number(ownerObj.flat_rate_per_day)
            : prev.owner_daily_rate_self,
      }))
    }
  }

  const handleNewOwnerChange = (updates: Partial<InlineOwnerState>) => {
    setNewOwner((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (ownershipMode === 'existing' && !existingOwnerId) {
      setError('Please select an existing Vehicle Owner or choose Company Owned.')
      return
    }
    if (ownershipMode === 'new' && !newOwner.full_name.trim()) {
      setError('Owner Full Name is required when registering a new owner inline.')
      return
    }

    setLoading(true)

    const res = await createVehicleWithOptionalOwner({
      vehicle: {
        ...(formData as any),
        ownership_type: ownershipMode === 'company' ? 'company' : 'owner_leased',
        vehicle_owner_id: ownershipMode === 'existing' ? existingOwnerId : null,
      },
      ownershipMode,
      existingOwnerId: ownershipMode === 'existing' ? existingOwnerId : null,
      newOwner:
        ownershipMode === 'new'
          ? {
              full_name: newOwner.full_name,
              owner_type: newOwner.owner_type,
              company_name: newOwner.company_name || null,
              national_id: newOwner.national_id || null,
              mobile: newOwner.mobile || null,
              whatsapp: newOwner.whatsapp || null,
              email: newOwner.email || null,
              address: newOwner.address || null,
              payment_terms: newOwner.payment_terms,
              revenue_share_pct: Number(newOwner.revenue_share_pct || 0),
              monthly_km_quota: Number(formData.monthly_km_quota || 3000),
              owner_excess_km_rate: Number(formData.owner_excess_km_rate || 0),
              bank_account_name: newOwner.bank_account_name || null,
              bank_name: newOwner.bank_name || null,
              bank_account_number: newOwner.bank_account_number || null,
              bank_branch: newOwner.bank_branch || null,
              signature_url: newOwner.signature_url || null,
              notes: newOwner.notes || null,
            }
          : null,
    })

    if (!res.success) {
      setError(res.error || 'Failed to create vehicle.')
      setLoading(false)
      return
    }

    if (res.vehicleId) {
      router.push(`/dashboard/vehicles/${res.vehicleId}`)
    } else {
      router.push('/dashboard/vehicles')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vehicles"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Register New Vehicle</h1>
            <p className="text-xs text-slate-500">
              Add a fleet vehicle, optionally register & link its owner, and configure Self-Drive & Chauffeur rates.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-8 shadow-xs">
        {/* Section 1: Basic Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Basic Vehicle Information & Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle Name *</label>
              <input
                type="text"
                name="vehicle_name"
                required
                value={formData.vehicle_name}
                onChange={handleChange}
                placeholder="e.g. Toyota Prius Alpha"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand *</label>
              <input
                type="text"
                name="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Toyota"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                name="model"
                required
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. Prius Alpha"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Number *</label>
              <input
                type="text"
                name="registration_number"
                required
                value={formData.registration_number}
                onChange={handleChange}
                placeholder="e.g. CAD-1234"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Manufacture Year</label>
              <input
                type="number"
                name="manufacture_year"
                value={formData.manufacture_year}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="semi_automatic">Semi Automatic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fuel Type</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
                <option value="plug_in_hybrid">Plug-in Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Seats</label>
              <input
                type="number"
                name="seat_count"
                min="1"
                value={formData.seat_count}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Colour</label>
              <input
                type="text"
                name="colour"
                value={formData.colour}
                onChange={handleChange}
                placeholder="e.g. Pearl White"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chassis No</label>
              <input
                type="text"
                name="chassis_number"
                value={formData.chassis_number}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Odometer (KM)</label>
              <input
                type="number"
                name="current_mileage"
                min="0"
                value={formData.current_mileage}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section A: Vehicle Ownership & Inline Owner Registration */}
        <VehicleOwnershipSection
          ownershipMode={ownershipMode}
          onOwnershipModeChange={setOwnershipMode}
          owners={owners}
          existingOwnerId={existingOwnerId}
          onExistingOwnerChange={handleExistingOwnerChange}
          newOwner={newOwner}
          onNewOwnerChange={handleNewOwnerChange}
          monthlyKmQuota={formData.monthly_km_quota}
          ownerExcessKmRate={formData.owner_excess_km_rate}
          onSettlementTermChange={handleNumberChange}
        />

        {/* Section B: Dual Pricing & Live Profit Margin Matrix */}
        <VehiclePricingMarginSection
          isOwnerLeased={ownershipMode !== 'company'}
          formData={formData}
          onNumberChange={handleNumberChange}
        />

        {/* Section 3: Legal Expiry Dates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Legal & Compliance Expiry Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Insurance Expiry</label>
              <input
                type="date"
                name="insurance_expiry"
                value={formData.insurance_expiry}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Revenue License Expiry</label>
              <input
                type="date"
                name="revenue_license_expiry"
                value={formData.revenue_license_expiry}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Emission Test Expiry</label>
              <input
                type="date"
                name="emission_test_expiry"
                value={formData.emission_test_expiry}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: GPS Telematics & Tracking */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            4. GPS Telematics & Telemetry Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                GPS Tracker ID / Device IMEI
              </label>
              <input
                type="text"
                name="tracker_id"
                value={formData.tracker_id}
                onChange={handleChange}
                placeholder="e.g. TRK-PRIUS-01 or 864500000000000"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Unique identifier connecting device to OwnTracks mobile app or SinoTrack/Traccar 4G GPS tracker.
              </p>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="gps_installed"
                  checked={formData.gps_installed}
                  onChange={handleChange}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>Hardware GPS Tracking Device Installed</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href="/dashboard/vehicles"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            <span>{loading ? 'Registering...' : ownershipMode === 'new' ? 'Register Owner & Save Vehicle' : 'Save Vehicle'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
