'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createQuotation } from '../quotation-actions'
import { normalizeNewlines, calculateRentalDays } from '@/lib/utils/formatters'
import QuickCustomerModal from './quick-customer-modal'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Building2,
  User,
  UserPlus,
  Printer,
  Eye,
  CheckCircle,
  Calendar,
  Car,
  Calculator,
  ShieldAlert,
} from 'lucide-react'

interface Props {
  customers: any[]
  vehicles: any[]
  template?: any
  userProfile?: any
}

export default function NewQuotationForm({ customers: initialCustomers, vehicles, template, userProfile }: Props) {
  const router = useRouter()
  const [customersList, setCustomersList] = useState<any[]>(initialCustomers || [])
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionType, setActionType] = useState<'draft' | 'preview'>('draft')
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
    // 12 Explicit Snapshot Fields (pre-normalized)
    special_notes: normalizeNewlines(template?.special_notes) || '• 700km allowed.\n• This quotation is valid for 24 hours only.',
    important_message: normalizeNewlines(template?.important_message) || 'Please find the account details below. Kindly ensure payment is completed on or before due date.',
    bank_account_name_snapshot: template?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd',
    bank_name_snapshot: template?.bank_name || 'Nations Trust Bank',
    bank_branch_snapshot: template?.bank_branch || 'Nugegoda',
    bank_account_number_snapshot: template?.bank_account_number || '100530013140',
    bank_swift_code_snapshot: template?.bank_swift_code || 'NTBCLKLX',
    payment_instructions_snapshot: normalizeNewlines(template?.payment_instructions) || 'Kindly ensure payment is completed on or before due date.',
    prepared_by_name_snapshot: userProfile?.full_name || 'Authorized Officer',
    prepared_by_designation_snapshot: template?.prepared_by_designation || 'Admin & Marketing Assistant',
    company_name_snapshot: template?.company_name || 'Thennakoon Tours (Pvt) Ltd',
    terms_and_conditions_snapshot: normalizeNewlines(template?.default_terms_and_conditions) || 'Standard Thennakoon Tours quotation terms apply.',
  })

  // Selected customer details preview
  const selectedCustomer = useMemo(() => {
    return customersList.find((c) => c.id === formData.customer_id)
  }, [customersList, formData.customer_id])

  // Rental Days calculation
  const rentalDays = useMemo(() => {
    return calculateRentalDays(formData.rental_start_date, formData.rental_end_date)
  }, [formData.rental_start_date, formData.rental_end_date])

  const [items, setItems] = useState<any[]>([
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

  // Update item days when rentalDays change
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
        const extraKmText = selected.extra_km_charge ? ` (Rs.${selected.extra_km_charge}/- per extra kilometer)` : ''
        copy[idx].description = `${selected.vehicle_name} [${selected.registration_number}]${extraKmText}`
        copy[idx].unit_rate = Number(selected.daily_rate)
        copy[idx].deposit_amount = Number(selected.refundable_deposit || 0)
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

  const handleCustomerCreated = (newCust: any) => {
    setCustomersList((prev) => [newCust, ...prev])
    setFormData((prev) => ({ ...prev, customer_id: newCust.id }))
  }

  const handleSubmit = async (e: React.FormEvent, type: 'draft' | 'preview') => {
    e.preventDefault()
    if (!formData.customer_id) {
      setError('Please select or add a customer.')
      return
    }
    setLoading(true)
    setActionType(type)
    setError(null)

    const payload = {
      customer_id: formData.customer_id,
      quotation_date: formData.quotation_date,
      rental_start_date: formData.rental_start_date,
      rental_end_date: formData.rental_end_date,
      pickup_location: formData.pickup_location,
      dropoff_location: formData.dropoff_location,
      destination: formData.destination,
      passenger_count: Number(formData.passenger_count || 1),
      purpose: formData.purpose,
      discount_type: formData.discount_type as any,
      discount_value: Number(formData.discount_value || 0),
      tax_rate: Number(formData.tax_rate || 0),
      refundable_deposit: Number(formData.refundable_deposit || 0),
      additional_charges: Number(formData.additional_charges || 0),
      notes: formData.notes,
      // 12 Normalized Snapshot Fields
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
        quantity: Number(it.quantity || 1),
        number_of_days: Number(it.number_of_days || 1),
        unit_rate: Number(it.unit_rate || 0),
        driver_charge: Number(it.driver_charge || 0),
        additional_charge: Number(it.additional_charge || 0),
        deposit_amount: Number(it.deposit_amount || 0),
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

    if (type === 'preview') {
      router.push(`/dashboard/quotations/${res.quotationId}/preview`)
    } else {
      router.push(`/dashboard/quotations/${res.quotationId}`)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotations"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create New Quotation</h1>
            <p className="text-xs text-slate-500">Single-page ERP quotation creation form with live rate calculations and snapshot isolation.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-6">
        {/* SECTION 1: Customer Information */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <User size={16} />
              <span>1. Customer Information</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <UserPlus size={14} />
              <span>+ Quick Add Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-semibold"
              >
                <option value="">-- Search / Choose Customer --</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.customer_code}] {c.full_name} ({c.mobile}) {c.company_name ? `- ${c.company_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{selectedCustomer.full_name}</div>
                <div className="text-slate-600 dark:text-slate-400">Mobile: {selectedCustomer.mobile}</div>
                <div className="text-slate-600 dark:text-slate-400">NIC/Passport: {selectedCustomer.nic || 'N/A'}</div>
                {selectedCustomer.company_name && <div className="text-slate-600">Company: {selectedCustomer.company_name}</div>}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Rental Information */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Calendar size={16} />
              <span>2. Rental Information & Schedule</span>
            </h3>
            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              Calculated Duration: <span className="text-amber-500 font-black">{rentalDays} Rental Day(s)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quotation Date *</label>
              <input
                type="date"
                required
                value={formData.quotation_date}
                onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Start Date *</label>
              <input
                type="date"
                required
                value={formData.rental_start_date}
                onChange={(e) => handleDateChange('rental_start_date', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental End Date *</label>
              <input
                type="date"
                required
                value={formData.rental_end_date}
                onChange={(e) => handleDateChange('rental_end_date', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Destination / Route</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. Kandy & Nuwara Eliya"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Vehicle and Pricing */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Car size={16} />
              <span>3. Vehicle Items & Custom Rate Overrides</span>
            </h3>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Fleet Master Vehicle</label>
                  <select
                    value={item.vehicle_id}
                    onChange={(e) => handleVehicleSelect(idx, e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
                  >
                    <option value="">-- Choose Fleet Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.vehicle_code}] {v.vehicle_name} ({v.registration_number}) - LKR {Number(v.daily_rate).toLocaleString()}/day
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
                    className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
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
                    className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {items.length > 1 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Remove Item</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SECTION 4: Pricing Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <Calculator size={16} />
            <span>4. Pricing Summary & Financial Calculations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (LKR)</option>
              </select>
            </div>

            {formData.discount_type !== 'none' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Value ({formData.discount_type === 'percentage' ? '%' : 'LKR'})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Deposit (LKR)</label>
              <input
                type="number"
                min="0"
                value={formData.refundable_deposit}
                onChange={(e) => setFormData({ ...formData, refundable_deposit: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500">Subtotal</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">LKR {calculatedSubtotal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">Discount</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">- LKR {calculatedDiscount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">Refundable Deposit</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">+ LKR {Number(formData.refundable_deposit || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Grand Total</div>
              <div className="font-black text-amber-500 text-base">LKR {calculatedGrandTotal.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Special Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <FileText size={16} />
            <span>5. Special Notes (Visible & Editable Textarea)</span>
          </h3>
          <textarea
            rows={6}
            value={formData.special_notes}
            onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-sans"
          />
        </div>

        {/* SECTION 6: Important Message */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <ShieldAlert size={16} />
            <span>6. Important Message Box Text</span>
          </h3>
          <textarea
            rows={4}
            value={formData.important_message}
            onChange={(e) => setFormData({ ...formData, important_message: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-sans"
          />
        </div>

        {/* SECTION 7: Bank Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <Building2 size={16} />
            <span>7. Bank Details & Payment Instructions Grid</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Account Name</label>
              <input
                type="text"
                value={formData.bank_account_name_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_account_name_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_name_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Branch Name</label>
              <input
                type="text"
                value={formData.bank_branch_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_branch_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bank_account_number_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_account_number_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Swift Code</label>
              <input
                type="text"
                value={formData.bank_swift_code_snapshot}
                onChange={(e) => setFormData({ ...formData, bank_swift_code_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Instructions</label>
              <input
                type="text"
                value={formData.payment_instructions_snapshot}
                onChange={(e) => setFormData({ ...formData, payment_instructions_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 8: Prepared By */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <User size={16} />
            <span>8. Prepared By & Signature Block Defaults</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prepared By Name</label>
              <input
                type="text"
                value={formData.prepared_by_name_snapshot}
                onChange={(e) => setFormData({ ...formData, prepared_by_name_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prepared By Designation</label>
              <input
                type="text"
                value={formData.prepared_by_designation_snapshot}
                onChange={(e) => setFormData({ ...formData, prepared_by_designation_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company_name_snapshot}
                onChange={(e) => setFormData({ ...formData, company_name_snapshot: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 9: Terms and Conditions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <FileText size={16} />
            <span>9. Quotation Terms and Conditions</span>
          </h3>
          <textarea
            rows={3}
            value={formData.terms_and_conditions_snapshot}
            onChange={(e) => setFormData({ ...formData, terms_and_conditions_snapshot: e.target.value })}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>
      </form>

      {/* SECTION 10: STICKY ACTION TOOLBAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-6 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/dashboard/quotations"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{loading && actionType === 'draft' ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'preview')}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Eye size={15} />
              <span>{loading && actionType === 'preview' ? 'Generating Preview...' : 'Save & Preview'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <QuickCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  )
}
