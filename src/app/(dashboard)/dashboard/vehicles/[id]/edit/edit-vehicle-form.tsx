'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateVehicleWithOptionalOwner, archiveVehicle, OwnershipMode } from '../../vehicle-actions'
import { ArrowLeft, Save, AlertCircle, Archive } from 'lucide-react'
import {
  VehicleOwnershipSection,
  InlineOwnerState,
  INITIAL_INLINE_OWNER,
} from '@/components/fleet/vehicle-ownership-section'
import { VehiclePricingMarginSection } from '@/components/fleet/vehicle-pricing-margin-section'

interface Props {
  vehicle: any
  categories: { id: string; name: string }[]
  owners: any[]
}

export default function EditVehicleForm({ vehicle, categories, owners }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialMode: OwnershipMode = vehicle.vehicle_owner_id ? 'existing' : 'company'
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>(initialMode)
  const [existingOwnerId, setExistingOwnerId] = useState<string>(vehicle.vehicle_owner_id || '')
  const [newOwner, setNewOwner] = useState<InlineOwnerState>(INITIAL_INLINE_OWNER)

  const [formData, setFormData] = useState({
    vehicle_name: vehicle.vehicle_name || '',
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    manufacture_year: vehicle.manufacture_year || new Date().getFullYear(),
    category_id: vehicle.category_id || '',
    registration_number: vehicle.registration_number || '',
    chassis_number: vehicle.chassis_number || '',
    engine_number: vehicle.engine_number || '',
    transmission: vehicle.transmission || 'automatic',
    fuel_type: vehicle.fuel_type || 'petrol',
    seat_count: vehicle.seat_count || 5,
    colour: vehicle.colour || '',
    current_mileage: Number(vehicle.current_mileage || 0),
    daily_rate: Number(vehicle.daily_rate || 0),
    weekly_rate: Number(vehicle.weekly_rate || 0),
    monthly_rate: Number(vehicle.monthly_rate || 0),
    refundable_deposit: Number(vehicle.refundable_deposit || 0),
    allowed_km_per_day: Number(vehicle.allowed_km_per_day ?? 100),
    extra_km_charge: Number(vehicle.extra_km_charge ?? 100),
    owner_daily_rate_self: Number(vehicle.owner_daily_rate_self ?? vehicle.owner_flat_rate_per_day ?? 0),
    owner_monthly_rate_self: Number(vehicle.owner_monthly_rate_self ?? 0),
    owner_daily_rate_with_driver: Number(vehicle.owner_daily_rate_with_driver ?? 0),
    owner_monthly_rate_with_driver: Number(vehicle.owner_monthly_rate_with_driver ?? 0),
    selling_daily_rate_with_driver: Number(vehicle.selling_daily_rate_with_driver ?? 0),
    selling_monthly_rate_with_driver: Number(vehicle.selling_monthly_rate_with_driver ?? 0),
    driver_bata_per_day: Number(vehicle.driver_bata_per_day ?? 0),
    monthly_km_quota: Number(vehicle.monthly_km_quota ?? 3000),
    owner_excess_km_rate: Number(vehicle.owner_excess_km_rate ?? 0),
    service_interval_km: Number(vehicle.service_interval_km ?? 5000),
    insurance_expiry: vehicle.insurance_expiry || '',
    revenue_license_expiry: vehicle.revenue_license_expiry || '',
    emission_test_expiry: vehicle.emission_test_expiry || '',
    gps_installed: vehicle.gps_installed || false,
    tracker_id: vehicle.tracker_id || '',
    status: vehicle.status || 'available',
    description: vehicle.description || '',
    notes: vehicle.notes || '',
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
      setError('Please select an existing Vehicle Owner or switch to Company Owned.')
      return
    }
    if (ownershipMode === 'new' && !newOwner.full_name.trim()) {
      setError('Owner Full Name is required when registering a new owner inline.')
      return
    }

    setLoading(true)

    const res = await updateVehicleWithOptionalOwner(vehicle.id, {
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
              notes: newOwner.notes || null,
            }
          : null,
    })

    if (!res.success) {
      setError(res.error || 'Failed to update vehicle.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/vehicles/${vehicle.id}`)
    router.refresh()
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this vehicle?')) return
    const res = await archiveVehicle(vehicle.id)
    if (res.success) router.push('/dashboard/vehicles')
    else alert(res.error)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Vehicle ({vehicle.vehicle_code})</h1>
            <p className="text-xs text-slate-500">Update vehicle details, ownership link, or Self-Drive & With-Driver rates.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleArchive}
          className="px-3 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Archive size={15} />
          <span>Archive Vehicle</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-8 shadow-xs">
        {/* Section 1: Identity & Operational Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Identity & Operational Status
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
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Operational Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="available">Available</option>
                <option value="available_on_call">Available On-Call</option>
                <option value="reserved">Reserved</option>
                <option value="on_trip">On Trip</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Mileage (KM)</label>
              <input
                type="number"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <input
                type="number"
                name="manufacture_year"
                value={formData.manufacture_year}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chassis No</label>
              <input
                type="text"
                name="chassis_number"
                value={formData.chassis_number}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Engine No</label>
              <input
                type="text"
                name="engine_number"
                value={formData.engine_number}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section A: Ownership & Inline Owner Registration */}
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
            3. Legal Compliance Expiry Dates
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

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href={`/dashboard/vehicles/${vehicle.id}`}
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
            <span>{loading ? 'Saving...' : 'Update Vehicle'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
