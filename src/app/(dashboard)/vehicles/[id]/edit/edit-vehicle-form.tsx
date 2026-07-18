'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateVehicle, archiveVehicle } from '../../vehicle-actions'
import { ArrowLeft, Save, AlertCircle, Archive } from 'lucide-react'

interface Props {
  vehicle: any
  categories: { id: string; name: string }[]
}

export default function EditVehicleForm({ vehicle, categories }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    current_mileage: vehicle.current_mileage || 0,
    daily_rate: vehicle.daily_rate || 0,
    weekly_rate: vehicle.weekly_rate || 0,
    monthly_rate: vehicle.monthly_rate || 0,
    refundable_deposit: vehicle.refundable_deposit || 0,
    allowed_km_per_day: vehicle.allowed_km_per_day || 100,
    extra_km_charge: vehicle.extra_km_charge || 100,
    insurance_expiry: vehicle.insurance_expiry || '',
    revenue_license_expiry: vehicle.revenue_license_expiry || '',
    emission_test_expiry: vehicle.emission_test_expiry || '',
    gps_installed: vehicle.gps_installed || false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await updateVehicle(vehicle.id, formData as any)
    if (!res.success) {
      setError(res.error || 'Failed to update vehicle.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/vehicles/${vehicle.id}`)
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this vehicle?')) return
    const res = await archiveVehicle(vehicle.id)
    if (res.success) router.push('/dashboard/vehicles')
    else alert(res.error)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <p className="text-xs text-slate-500">Update vehicle details, status, or rates.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleArchive}
          className="px-3 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
        >
          <Archive size={15} />
          <span>Archive Vehicle</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
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
                <option value="reserved">Reserved</option>
                <option value="on_trip">On Trip</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Specs & Rates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Rate (LKR) *</label>
              <input
                type="number"
                name="daily_rate"
                required
                value={formData.daily_rate}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Deposit (LKR)</label>
              <input
                type="number"
                name="refundable_deposit"
                value={formData.refundable_deposit}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Mileage (KM)</label>
              <input
                type="number"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

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
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Saving...' : 'Update Vehicle'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
