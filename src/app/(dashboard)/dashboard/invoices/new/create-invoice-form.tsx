'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Calendar,
  Car,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { createInvoice } from '../invoice-actions'

interface Customer {
  id: string
  full_name: string
  company_name?: string
  mobile?: string
  email?: string
  address_line_1?: string
}

interface Booking {
  id: string
  booking_number: string
  customer_id: string
  subtotal: number
  discount_amount: number
  refundable_deposit: number
  advance_paid: number
  booking_vehicles?: any[]
}

interface CreateInvoiceFormProps {
  customers: Customer[]
  bookings: Booking[]
  defaultInvoiceNumber: string
}

export function CreateInvoiceForm({ customers, bookings, defaultInvoiceNumber }: CreateInvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber)
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [bookingId, setBookingId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0])
  const [paymentTerms, setPaymentTerms] = useState('Due Upon Receipt')

  // Line Items
  const [items, setItems] = useState<
    { description: string; quantity: number; unit_price: number; line_total: number }[]
  >([
    { description: 'Vehicle Rental Service', quantity: 1, unit_price: 15000, line_total: 15000 },
  ])

  // Financial Totals
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [refundableDeposit, setRefundableDeposit] = useState(0)
  const [notes, setNotes] = useState('')

  // Handle Booking Selection Auto-fill
  const handleBookingSelect = (bId: string) => {
    setBookingId(bId)
    if (!bId) return

    const b = bookings.find((bk) => bk.id === bId)
    if (b) {
      setCustomerId(b.customer_id)
      setDiscountAmount(Number(b.discount_amount || 0))
      setRefundableDeposit(Number(b.refundable_deposit || 0))

      if (b.booking_vehicles && b.booking_vehicles.length > 0) {
        const vehicleItems = b.booking_vehicles.map((bv: any) => ({
          description: `Vehicle Rental: ${bv.vehicle?.vehicle_name || 'Vehicle'} (${bv.vehicle?.registration_number || 'N/A'})`,
          quantity: 1,
          unit_price: Number(bv.vehicle_rate || 0) + Number(bv.driver_charge || 0),
          line_total: Number(bv.vehicle_rate || 0) + Number(bv.driver_charge || 0),
        }))
        setItems(vehicleItems)
      }
    }
  }

  // Item modifications
  const handleAddItem = () => {
    setItems([...items, { description: 'Additional Service / Charge', quantity: 1, unit_price: 0, line_total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    const current = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unit_price') {
      current.line_total = Number(current.quantity || 0) * Number(current.unit_price || 0)
    }

    newItems[index] = current
    setItems(newItems)
  }

  // Compute Live Totals
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
  const taxAmount = (subtotal * Number(taxRate || 0)) / 100
  const grandTotal = Math.max(0, subtotal - Number(discountAmount || 0) + taxAmount + Number(refundableDeposit || 0))

  const handleSubmit = async (isIssue: boolean = false) => {
    setErrorMsg(null)
    if (!customerId) {
      setErrorMsg('Please select a customer.')
      return
    }

    setLoading(true)
    try {
      const res = await createInvoice({
        invoice_number: invoiceNumber.trim() || undefined,
        customer_id: customerId,
        booking_id: bookingId || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency: 'LKR',
        discount_amount: Number(discountAmount),
        tax_rate: Number(taxRate),
        refundable_deposit: Number(refundableDeposit),
        total_deductions: 0,
        notes: notes || undefined,
        status: isIssue ? 'issued' : 'draft',
        items: items.map((it, idx) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          display_order: idx,
        })),
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create invoice.')
        setLoading(false)
        return
      }

      router.push(`/dashboard/invoices/${res.invoiceId}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating invoice.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/invoices"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create New Invoice</h1>
          <p className="text-xs text-slate-500 mt-0.5">Generate a billing invoice from customer booking or custom line items.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: INVOICE DETAILS & CUSTOMER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Metadata */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Invoice Metadata
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                placeholder="TT-IN-10001"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Due Upon Receipt, Net 7, Net 30"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Customer & Booking Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Customer & Booking Association
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Originating Booking (Optional)</label>
              <select
                value={bookingId}
                onChange={(e) => handleBookingSelect(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              >
                <option value="">-- Direct Customer Invoice (No Booking) --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    Booking #{b.booking_number} (Subtotal: LKR {Number(b.subtotal).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billed Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.mobile ? `(${c.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: STRUCTURED LINE ITEMS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider">3. Invoice Line Items</h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <div className="sm:col-span-6">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Description #{idx + 1}</label>
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  placeholder="e.g. Toyota KDH Flat Rate (3 Days)"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Qty / Days</label>
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit Rate (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={it.unit_price}
                  onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Total (LKR)</label>
                  <span className="font-mono font-black text-slate-900 dark:text-white block pt-1">
                    {Number(it.line_total).toLocaleString()}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: FINANCIAL SUMMARY & DISCOUNTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            4. Adjustments & Notes
          </h2>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Amount (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Security Deposit (LKR)</label>
              <input
                type="number"
                step="0.01"
                value={refundableDeposit}
                onChange={(e) => setRefundableDeposit(Number(e.target.value))}
                placeholder="Displayed separately from revenue"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Notes / Special Instructions</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment instructions, bank reference details..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Calculation Summary Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            5. Financial Calculation Breakdown
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">LKR {subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span>Discount:</span>
                <span className="font-mono font-bold">- LKR {discountAmount.toLocaleString()}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Tax ({taxRate}%):</span>
                <span className="font-mono font-bold">LKR {taxAmount.toLocaleString()}</span>
              </div>
            )}

            {refundableDeposit > 0 && (
              <div className="flex justify-between items-center text-amber-500">
                <span>Refundable Deposit (Separate):</span>
                <span className="font-mono font-bold">LKR {refundableDeposit.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white text-sm">GRAND TOTAL:</span>
              <span className="font-mono font-black text-amber-500 text-xl">LKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-center"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="flex-1 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>{loading ? 'Issuing...' : 'Save & Issue Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
