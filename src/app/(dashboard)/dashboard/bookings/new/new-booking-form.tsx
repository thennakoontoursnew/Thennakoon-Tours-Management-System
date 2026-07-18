'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBooking, checkAvailabilityAction } from '../booking-actions'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  customers: any[]
  vehicles: any[]
}

export default function NewBookingForm({ customers, vehicles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availStatus, setAvailStatus] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    rental_start_at: `${new Date().toISOString().split('T')[0]}T09:00`,
    rental_end_at: `${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T18:00`,
    pickup_location: '',
    dropoff_location: '',
    destination: '',
    passenger_count: 1,
    special_requests: '',
    discount_amount: 0,
    tax_amount: 0,
    refundable_deposit: 0,
    advance_required: 0,
    status: 'confirmed',
  })

  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  const handleCheckAvailability = async () => {
    if (!selectedVehicleId) return
    setAvailStatus('Checking availability...')
    const res = await checkAvailabilityAction(selectedVehicleId, `${formData.rental_start_at}:00Z`, `${formData.rental_end_at}:00Z`)
    if (res.isAvailable) {
      setAvailStatus('✓ Vehicle is AVAILABLE for selected rental period.')
    } else {
      setAvailStatus(`✕ CONFLICT: ${res.conflictReason}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id || !selectedVehicleId) {
      setError('Please select both a customer and a vehicle.')
      return
    }

    setLoading(true)
    setError(null)

    const vehicleMaster = vehicles.find((v) => v.id === selectedVehicleId)

    const payload = {
      ...formData,
      rental_start_at: `${formData.rental_start_at}:00Z`,
      rental_end_at: `${formData.rental_end_at}:00Z`,
      passenger_count: Number(formData.passenger_count),
      discount_amount: Number(formData.discount_amount),
      tax_amount: Number(formData.tax_amount),
      refundable_deposit: Number(vehicleMaster?.refundable_deposit || 0),
      advance_required: Number(formData.advance_required),
      vehicles: [
        {
          vehicle_id: selectedVehicleId,
          rental_start_at: `${formData.rental_start_at}:00Z`,
          rental_end_at: `${formData.rental_end_at}:00Z`,
          vehicle_rate: Number(vehicleMaster?.daily_rate || 0),
          driver_charge: 0,
          deposit_amount: Number(vehicleMaster?.refundable_deposit || 0),
        },
      ],
    }

    const res = await createBooking(payload as any)
    if (!res.success) {
      setError(res.error || 'Failed to create booking.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/bookings/${res.bookingId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create New Booking</h1>
          <p className="text-xs text-slate-500">Reserve a fleet vehicle with real-time overlap validation.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
        {/* Customer & Schedule */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Customer & Rental Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.rental_start_at}
                onChange={(e) => setFormData({ ...formData, rental_start_at: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental End Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.rental_end_at}
                onChange={(e) => setFormData({ ...formData, rental_end_at: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Selection & Availability */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Vehicle Selection & Availability Validation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Fleet Vehicle *</label>
              <select
                required
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_name} ({v.registration_number}) - Daily LKR {Number(v.daily_rate).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCheckAvailability}
              className="px-4 py-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Check Availability
            </button>
          </div>

          {availStatus && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {availStatus}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href="/dashboard/bookings"
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
            <span>{loading ? 'Creating...' : 'Create Booking'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
