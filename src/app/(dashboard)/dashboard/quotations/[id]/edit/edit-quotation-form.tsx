'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateQuotation } from '../../quotation-actions'
import { normalizeNewlines, calculateRentalDays, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, DEFAULT_EXCHANGE_RATES } from '@/lib/utils/formatters'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, FileText, Building2, User, Calculator, ShieldAlert, Eye } from 'lucide-react'

interface Props {
  quotation: any
  customers: any[]
  vehicles: any[]
}

export default function EditQuotationForm({ quotation, customers, vehicles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: quotation.customer_id || '',
    quotation_date: quotation.quotation_date || new Date().toISOString().split('T')[0],
    rental_start_date: quotation.rental_start_date || new Date().toISOString().split('T')[0],
    rental_end_date: quotation.rental_end_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickup_location: quotation.pickup_location || '',
    dropoff_location: quotation.dropoff_location || '',
    destination: quotation.destination || '',
    passenger_count: quotation.passenger_count || 1,
    purpose: quotation.purpose || '',
    currency: quotation.currency || 'LKR',
    exchange_rate: Number(quotation.exchange_rate || 1.0),
    discount_type: quotation.discount_type || 'none',
    discount_value: quotation.discount_value || 0,
    tax_rate: quotation.tax_rate || 0,
    refundable_deposit: quotation.refundable_deposit || 0,
    additional_charges: quotation.additional_charges || 0,
    notes: quotation.notes || '',
    // 12 Saved Snapshot Fields (Pre-normalized)
    special_notes: normalizeNewlines(quotation.special_notes),
    important_message: normalizeNewlines(quotation.important_message),
    bank_account_name_snapshot: quotation.bank_account_name_snapshot || '',
    bank_name_snapshot: quotation.bank_name_snapshot || '',
    bank_branch_snapshot: quotation.bank_branch_snapshot || '',
    bank_account_number_snapshot: quotation.bank_account_number_snapshot || '',
    bank_swift_code_snapshot: quotation.bank_swift_code_snapshot || '',
    payment_instructions_snapshot: normalizeNewlines(quotation.payment_instructions_snapshot),
    prepared_by_name_snapshot: quotation.prepared_by_name_snapshot || '',
    prepared_by_designation_snapshot: quotation.prepared_by_designation_snapshot || '',
    company_name_snapshot: quotation.company_name_snapshot || '',
    terms_and_conditions_snapshot: normalizeNewlines(quotation.terms_and_conditions_snapshot || quotation.terms_and_conditions),
  })

  const rentalDays = useMemo(() => {
    return calculateRentalDays(formData.rental_start_date, formData.rental_end_date)
  }, [formData.rental_start_date, formData.rental_end_date])

  const [items, setItems] = useState<any[]>(
    (quotation.items || []).map((it: any) => ({
      vehicle_id: it.vehicle_id || '',
      description: it.description || 'Vehicle Rental Service',
      quantity: it.quantity || 1,
      number_of_days: rentalDays,
      unit_rate: it.unit_rate || 0,
      driver_charge: it.driver_charge || 0,
      additional_charge: it.additional_charge || 0,
      deposit_amount: it.deposit_amount || 0,
      allowed_km: it.allowed_km || 100,
      extra_km_charge: it.extra_km_charge || 50,
    }))
  )

  const handleDateChange = (field: string, val: string) => {
    const nextFormData = { ...formData, [field]: val }
    setFormData(nextFormData)
    const newDays = calculateRentalDays(
      field === 'rental_start_date' ? val : formData.rental_start_date,
      field === 'rental_end_date' ? val : formData.rental_end_date
    )
    setItems((prev) => prev.map((it) => ({ ...it, number_of_days: newDays })))
  }

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
        number_of_days: rentalDays,
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

  // Live Summary Calculations
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const line = Number(it.number_of_days || 1) * Number(it.unit_rate || 0) * Number(it.quantity || 1)
      return acc + line + Number(it.driver_charge || 0) + Number(it.additional_charge || 0)
    }, 0)
  }, [items])

  const calculatedDiscount = useMemo(() => {
    if (formData.discount_type === 'percentage') {
      return (calculatedSubtotal * Number(formData.discount_value || 0)) / 100
    }
    if (formData.discount_type === 'fixed') {
      return Number(formData.discount_value || 0)
    }
    return 0
  }, [calculatedSubtotal, formData.discount_type, formData.discount_value])

  const calculatedTaxable = Math.max(0, calculatedSubtotal - calculatedDiscount + Number(formData.additional_charges || 0))
  const calculatedTax = (calculatedTaxable * Number(formData.tax_rate || 0)) / 100
  const calculatedGrandTotal = calculatedTaxable + calculatedTax + Number(formData.refundable_deposit || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      customer_id: formData.customer_id,
      quotation_date: formData.quotation_date,
      rental_start_date: formData.rental_start_date,
      rental_end_date: formData.rental_end_date,
      pickup_location: formData.pickup_location,
      dropoff_location: formData.dropoff_location,
      destination: formData.destination,
      passenger_count: Number(formData.passenger_count),
      purpose: formData.purpose,
      currency: formData.currency,
      exchange_rate: Number(formData.exchange_rate || 1.0),
      discount_type: formData.discount_type as any,
      discount_value: Number(formData.discount_value),
      tax_rate: Number(formData.tax_rate),
      refundable_deposit: Number(formData.refundable_deposit),
      additional_charges: Number(formData.additional_charges),
      notes: formData.notes,
      // 12 Saved Snapshot Fields
      special_notes: normalizeNewlines(formData.special_notes),
      important_message: normalizeNewlines(formData.important_message),
      bank_account_name_snapshot: formData.bank_account_name_snapshot,
      bank_name_snapshot: formData.bank_name_snapshot,
      bank_branch_snapshot: formData.bank_branch_snapshot,
      bank_account_number_snapshot: formData.bank_account_number_snapshot,
      bank_swift_code_snapshot: formData.bank_swift_code_snapshot,
      payment_instructions_snapshot: normalizeNewlines(formData.payment_instructions_snapshot),
      prepared_by_name_snapshot: formData.prepared_by_name_snapshot,
      prepared_by_designation_snapshot: formData.prepared_by_designation_snapshot,
      company_name_snapshot: formData.company_name_snapshot,
      terms_and_conditions_snapshot: normalizeNewlines(formData.terms_and_conditions_snapshot),
      terms_and_conditions: normalizeNewlines(formData.terms_and_conditions_snapshot),
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

    const res = await updateQuotation(quotation.id, payload as any)
    if (!res.success) {
      setError(res.error || 'Failed to update quotation.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/quotations/${quotation.id}`)
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/quotations/${quotation.id}`}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Quotation ({quotation.quotation_number})</h1>
          <p className="text-xs text-slate-500">Edit quotation details and saved instance snapshots.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
        {/* Section 1: Customer */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Customer Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
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
          </div>
        </div>

        {/* Section 2: Dates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Rental Schedule ({rentalDays} Day(s))
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Start Date *</label>
              <input
                type="date"
                required
                value={formData.rental_start_date}
                onChange={(e) => handleDateChange('rental_start_date', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental End Date *</label>
              <input
                type="date"
                required
                value={formData.rental_end_date}
                onChange={(e) => handleDateChange('rental_end_date', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Vehicle Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">3. Vehicle Items & Rates</h3>
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
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Fleet Vehicle</label>
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
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Rental Days <span className="text-[10px] font-normal text-slate-400">(Schedule Sync)</span>
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={rentalDays}
                    title="Rental days automatically equal schedule duration"
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Daily Unit Rate ({formData.currency})</label>
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

        {/* Section 4: Pricing Summary & Multi-Currency */}
        <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Calculator size={15} />
            <span>4. Pricing Summary & Financial Calculations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const cur = e.target.value
                  const defaultRates = DEFAULT_EXCHANGE_RATES
                  const newRate = cur === 'LKR' ? 1.0 : (Number(defaultRates[cur]) || 1.0)
                  setFormData({ ...formData, currency: cur, exchange_rate: newRate })
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c] || c})</option>
                ))}
              </select>
            </div>

            {formData.currency !== 'LKR' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Exchange Rate (1 {formData.currency} in LKR)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={formData.exchange_rate}
                  onChange={(e) => setFormData({ ...formData, exchange_rate: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({formData.currency})</option>
              </select>
            </div>

            {formData.discount_type !== 'none' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Value ({formData.discount_type === 'percentage' ? '%' : formData.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Deposit ({formData.currency})</label>
              <input
                type="number"
                min="0"
                value={formData.refundable_deposit}
                onChange={(e) => setFormData({ ...formData, refundable_deposit: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-500">Subtotal</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{formData.currency} {calculatedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-slate-500">Discount</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">- {formData.currency} {calculatedDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-slate-500">Refundable Deposit</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">+ {formData.currency} {Number(formData.refundable_deposit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Grand Total</div>
                <div className="font-black text-amber-500 text-base">{formData.currency} {calculatedGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            {formData.currency !== 'LKR' && (
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-medium">
                <span>LKR Estimate: <strong className="font-mono font-bold">≈ LKR {(calculatedGrandTotal * (Number(formData.exchange_rate) || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Rate: 1 {formData.currency} = LKR {Number(formData.exchange_rate || 1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Special Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            5. Special Notes & Important Message
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Special Notes</label>
              <textarea
                rows={5}
                value={formData.special_notes}
                onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Important Message</label>
              <textarea
                rows={5}
                value={formData.important_message}
                onChange={(e) => setFormData({ ...formData, important_message: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Bank Details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 size={14} className="text-amber-500" />
            <span>Saved Bank Details Snapshot</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Account Name</label>
              <input
                type="text"
                value={formData.bank_account_name_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_account_name_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_name_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.bank_branch_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_branch_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bank_account_number_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_account_number_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Swift Code</label>
              <input
                type="text"
                value={formData.bank_swift_code_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_swift_code_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Instructions</label>
              <input
                type="text"
                value={formData.payment_instructions_snapshot}
                onChange={(e) => setFormData({ ...formData, payment_instructions_snapshot: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Prepared By */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prepared By Name</label>
            <input
              type="text"
              value={formData.prepared_by_name_snapshot}
              onChange={(e) => setFormData({ ...formData, prepared_by_name_snapshot: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prepared By Designation</label>
            <input
              type="text"
              value={formData.prepared_by_designation_snapshot}
              onChange={(e) => setFormData({ ...formData, prepared_by_designation_snapshot: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              value={formData.company_name_snapshot}
              onChange={(e) => setFormData({ ...formData, company_name_snapshot: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href={`/dashboard/quotations/${quotation.id}`}
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
            <span>{loading ? 'Updating...' : 'Update Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
