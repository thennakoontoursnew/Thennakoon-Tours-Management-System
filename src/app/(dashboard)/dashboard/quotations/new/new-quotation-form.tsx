'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createQuotation } from '../quotation-actions'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'

interface Props {
  customers: any[]
  vehicles: any[]
}

export default function NewQuotationForm({ customers, vehicles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    rental_start_date: new Date().toISOString().split('T')[0],
    rental_end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickup_location: '',
    dropoff_location: '',
    destination: '',
    passenger_count: 1,
    purpose: '',
    discount_type: 'none',
    discount_value: 0,
    tax_rate: 0,
    refundable_deposit: 0,
    additional_charges: 0,
    notes: '',
    special_notes: '1. Quotation valid for 7 days. 2. Advance deposit required upon booking.',
    terms_and_conditions: 'Standard Thennakoon Tours rental terms apply.',
  })

  const [items, setItems] = useState([
    {
      vehicle_id: '',
      description: 'Vehicle Rental Service',
      quantity: 1,
      number_of_days: 1,
      unit_rate: 0,
      driver_charge: 0,
      additional_charge: 0,
      deposit_amount: 0,
      allowed_km: 100,
      extra_km_charge: 50,
    },
  ])

  const handleVehicleSelect = (idx: number, vehicleId: string) => {
    const selected = vehicles.find((v) => v.id === vehicleId)
    setItems((prev) => {
      const copy = [...prev]
      copy[idx].vehicle_id = vehicleId
      if (selected) {
        copy[idx].description = `${selected.vehicle_name} (${selected.registration_number})`
        copy[idx].unit_rate = Number(selected.daily_rate)
        copy[idx].deposit_amount = Number(selected.refundable_deposit)
        copy[idx].allowed_km = Number(selected.allowed_km_per_day || 100)
        copy[idx].extra_km_charge = Number(selected.extra_km_charge || 50)
      }
      return copy
    })
  }

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        vehicle_id: '',
        description: 'Vehicle Rental Service',
        quantity: 1,
        number_of_days: 1,
        unit_rate: 0,
        driver_charge: 0,
        additional_charge: 0,
        deposit_amount: 0,
        allowed_km: 100,
        extra_km_charge: 50,
      },
    ])
  }

  const removeItemRow = (idx: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id) {
      setError('Please select a customer.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      ...formData,
      passenger_count: Number(formData.passenger_count),
      discount_value: Number(formData.discount_value),
      tax_rate: Number(formData.tax_rate),
      refundable_deposit: Number(formData.refundable_deposit),
      additional_charges: Number(formData.additional_charges),
      items: items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        number_of_days: Number(it.number_of_days),
        unit_rate: Number(it.unit_rate),
        driver_charge: Number(it.driver_charge),
        additional_charge: Number(it.additional_charge),
        deposit_amount: Number(it.deposit_amount),
        allowed_km: Number(it.allowed_km || 0),
        extra_km_charge: Number(it.extra_km_charge || 0),
      })),
    }

    const res = await createQuotation(payload as any)
    if (!res.success) {
      setError(res.error || 'Failed to create quotation.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/quotations/${res.quotationId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/quotations"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create New Quotation</h1>
          <p className="text-xs text-slate-500">Calculate rates, select vehicles, and generate official price quotes.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
        {/* Customer & Dates Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Customer & Rental Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.mobile}) {c.company_name ? `- ${c.company_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Start Date *</label>
              <input
                type="date"
                required
                value={formData.rental_start_date}
                onChange={(e) => setFormData({ ...formData, rental_start_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental End Date *</label>
              <input
                type="date"
                required
                value={formData.rental_end_date}
                onChange={(e) => setFormData({ ...formData, rental_end_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">2. Vehicle Items & Rates</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-1 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Vehicle Master</label>
                  <select
                    value={item.vehicle_id}
                    onChange={(e) => handleVehicleSelect(idx, e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="">-- Choose Fleet Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_name} ({v.registration_number}) - LKR {Number(v.daily_rate).toLocaleString()}/day
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Rental Days</label>
                  <input
                    type="number"
                    min="1"
                    value={item.number_of_days}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setItems((prev) => {
                        const copy = [...prev]
                        copy[idx].number_of_days = val
                        return copy
                      })
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Daily Unit Rate (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={item.unit_rate}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setItems((prev) => {
                        const copy = [...prev]
                        copy[idx].unit_rate = val
                        return copy
                      })
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {items.length > 1 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove Item</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href="/dashboard/quotations"
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
            <span>{loading ? 'Creating...' : 'Generate Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
