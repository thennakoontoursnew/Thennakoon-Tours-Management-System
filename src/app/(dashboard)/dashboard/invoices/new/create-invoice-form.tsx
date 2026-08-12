'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  Car,
  User,
} from 'lucide-react'
import { createInvoice } from '../invoice-actions'
import { generateCommercialInvoicePDF } from '@/lib/documents/invoice-pdf-commercial'
import { COMPANY_CONFIG } from '@/lib/company-config'

interface Customer {
  id: string
  full_name: string
  company_name?: string
  mobile?: string
  email?: string
  address_line_1?: string
  identifier_no?: string
}

interface Booking {
  id: string
  booking_number: string
  customer_id: string
  subtotal: number
  discount_amount: number
  refundable_deposit: number
  advance_paid: number
  booking_vehicles?: Record<string, unknown>[]
}

interface Vehicle {
  id: string
  vehicle_name: string
  registration_number: string
  category?: string
  make?: string
  model?: string
}

interface Quotation {
  id: string
  quotation_number: string
  customer_id: string
  items?: Record<string, unknown>[]
}

interface CurrentUser {
  id: string
  full_name: string
  role: string
}

interface CreateInvoiceFormProps {
  customers: Customer[]
  bookings: Booking[]
  vehicles: Vehicle[]
  quotations: Quotation[]
  defaultInvoiceNumber: string
  currentUser: CurrentUser
}

export function CreateInvoiceForm({
  customers,
  bookings,
  vehicles,
  quotations,
  defaultInvoiceNumber,
  currentUser,
}: CreateInvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // SECTION 1: INVOICE METADATA
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber)
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0])
  const [paymentTerms, setPaymentTerms] = useState('7 Days')
  const [invoiceStatus] = useState('draft')
  const [quotationId, setQuotationId] = useState('')

  // SECTION 2: CUSTOMER DETAILS
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [bookingId, setBookingId] = useState('')
  const [customerName, setCustomerName] = useState(customers[0]?.full_name || '')
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.mobile || '')
  const [customerEmail, setCustomerEmail] = useState(customers[0]?.email || '')
  const [customerCompany, setCustomerCompany] = useState(customers[0]?.company_name || '')
  const [customerRef, setCustomerRef] = useState(customers[0]?.identifier_no || '')
  const [customerAddress, setCustomerAddress] = useState(customers[0]?.address_line_1 || '')

  // SECTION 3: RENTAL & VEHICLE INFO
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [rentalStartDate, setRentalStartDate] = useState('')
  const [rentalEndDate, setRentalEndDate] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')

  // SECTION 4: LINE ITEMS
  const [items, setItems] = useState<
    { description: string; quantity: number; unit_price: number; line_total: number }[]
  >([
    { description: 'Vehicle Rental Service', quantity: 1, unit_price: 15000, line_total: 15000 },
  ])

  // SECTION 5: FINANCIAL SUMMARY
  const [discountAmount, setDiscountAmount] = useState(0)
  const [additionalCharges, setAdditionalCharges] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [advancePayment, setAdvancePayment] = useState(0)
  const [refundableDeposit, setRefundableDeposit] = useState(0)

  // SECTION 6: NOTES
  const [specialNotes, setSpecialNotes] = useState(COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const [importantTerms, setImportantTerms] = useState(COMPANY_CONFIG.defaultInvoiceImportantTerms)
  const [internalNotes, setInternalNotes] = useState('')

  // Calculate Rental Days
  const rentalDays = useMemo(() => {
    if (!rentalStartDate || !rentalEndDate) return 0
    const start = new Date(rentalStartDate).getTime()
    const end = new Date(rentalEndDate).getTime()
    if (isNaN(start) || isNaN(end) || end < start) return 0
    const diff = Math.ceil((end - start) / (1000 * 3600 * 24))
    return Math.max(1, diff)
  }, [rentalStartDate, rentalEndDate])

  // Handle Customer Selection Auto-fill
  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId)
    const c = customers.find((cust) => cust.id === cId)
    if (c) {
      setCustomerName(c.full_name || '')
      setCustomerPhone(c.mobile || '')
      setCustomerEmail(c.email || '')
      setCustomerCompany(c.company_name || '')
      setCustomerRef(c.identifier_no || '')
      setCustomerAddress(c.address_line_1 || '')
    }
  }

  // Handle Vehicle Selection Auto-fill
  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId)
    const v = vehicles.find((vh) => vh.id === vId)
    if (v) {
      setVehicleName(v.vehicle_name || '')
      setRegistrationNumber(v.registration_number || '')
    }
  }

  // Handle Quotation Select Auto-fill
  const handleQuotationSelect = (qId: string) => {
    setQuotationId(qId)
    if (!qId) return
    const q = quotations.find((quote) => quote.id === qId)
    if (q) {
      if (q.customer_id) handleCustomerSelect(q.customer_id)
      if (q.items && q.items.length > 0) {
        const qItems = q.items.map((it: Record<string, unknown>) => ({
          description: String(it.description || 'Quotation Line Item'),
          quantity: Number(it.quantity || 1),
          unit_price: Number(it.unit_rate || 0),
          line_total: Number(it.quantity || 1) * Number(it.unit_rate || 0),
        }))
        setItems(qItems)
      }
    }
  }

  // Handle Booking Selection Auto-fill
  const handleBookingSelect = (bId: string) => {
    setBookingId(bId)
    if (!bId) return

    const b = bookings.find((bk) => bk.id === bId)
    if (b) {
      handleCustomerSelect(b.customer_id)
      setDiscountAmount(Number(b.discount_amount || 0))
      setRefundableDeposit(Number(b.refundable_deposit || 0))
      setAdvancePayment(Number(b.advance_paid || 0))

      if (b.booking_vehicles && b.booking_vehicles.length > 0) {
        const vehicleItems = b.booking_vehicles.map((bv: Record<string, unknown>) => {
          const vObj = bv.vehicle && typeof bv.vehicle === 'object' ? (bv.vehicle as Record<string, unknown>) : null
          const vName = vObj && typeof vObj.vehicle_name === 'string' ? vObj.vehicle_name : 'Vehicle'
          const vReg = vObj && typeof vObj.registration_number === 'string' ? vObj.registration_number : 'N/A'
          return {
            description: `Vehicle Rental: ${vName} (${vReg})`,
            quantity: 1,
            unit_price: Number(bv.vehicle_rate || 0) + Number(bv.driver_charge || 0),
            line_total: Number(bv.vehicle_rate || 0) + Number(bv.driver_charge || 0),
          }
        })
        setItems(vehicleItems)
      }
    }
  }

  // Item Modifications
  const handleAddItem = () => {
    setItems([...items, { description: 'Additional Service / Repair Charge', quantity: 1, unit_price: 0, line_total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: unknown) => {
    const newItems = [...items]
    const current = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unit_price') {
      current.line_total = Number(current.quantity || 0) * Number(current.unit_price || 0)
    }

    newItems[index] = current
    setItems(newItems)
  }

  // Compute Live Canonical Totals
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
  const taxAmount = (subtotal * Number(taxRate || 0)) / 100
  const netAmount = Math.max(0, subtotal - Number(discountAmount || 0) + Number(additionalCharges || 0) + taxAmount + Number(refundableDeposit || 0))
  const balanceDue = Math.max(0, netAmount - Number(advancePayment || 0))

  // Prepare Snapshot Data Payload for PDF Generator
  const getInvoiceDataSnapshot = () => {
    const selCust = customers.find((c) => c.id === customerId)
    const selQuote = quotations.find((q) => q.id === quotationId)

    return {
      invoice_number: invoiceNumber.trim() || defaultInvoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      status: invoiceStatus,
      quotation_number: selQuote?.quotation_number || null,
      customer: {
        full_name: customerName.trim() || selCust?.full_name || 'Customer Name',
        company_name: customerCompany.trim() || selCust?.company_name || null,
        mobile: customerPhone.trim() || selCust?.mobile || 'N/A',
        email: customerEmail.trim() || selCust?.email || 'N/A',
        address: customerAddress.trim() || selCust?.address_line_1 || 'Sri Lanka',
        identifier_no: customerRef.trim() || selCust?.identifier_no || 'N/A',
      },
      vehicle_name: vehicleName,
      vehicle_registration: registrationNumber,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      rental_days: rentalDays,
      pickup_location: pickupLocation,
      destination: destination,
      dropoff_location: dropoffLocation,
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        line_total: Number(it.line_total || 0),
      })),
      subtotal,
      discount_amount: Number(discountAmount || 0),
      additional_charges: Number(additionalCharges || 0),
      tax_rate: Number(taxRate || 0),
      tax_amount: taxAmount,
      refundable_deposit: Number(refundableDeposit || 0),
      grand_total: netAmount,
      amount_paid: Number(advancePayment || 0),
      balance_due: balanceDue,
      special_notes: specialNotes,
      terms_and_conditions: importantTerms,
      prepared_by_name_snapshot: currentUser.full_name,
      prepared_by_designation_snapshot: currentUser.role ? currentUser.role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff',
    }
  }

  // PDF Preview Action
  const handlePreviewPDF = async () => {
    try {
      const snap = getInvoiceDataSnapshot()
      const doc = await generateCommercialInvoicePDF(snap)
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to preview PDF:', err)
      alert('Could not generate PDF preview.')
    }
  }

  // PDF Download Action
  const handleDownloadPDF = async () => {
    try {
      const snap = getInvoiceDataSnapshot()
      const doc = await generateCommercialInvoicePDF(snap)
      doc.save(`Invoice_${snap.invoice_number}.pdf`)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Could not download PDF.')
    }
  }

  // Form Submission (Save Draft or Save & Issue)
  const handleSubmit = async (isIssue: boolean = false) => {
    if (loading) return
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
        quotation_id: quotationId || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        currency: 'LKR',
        discount_amount: Number(discountAmount),
        tax_rate: Number(taxRate),
        refundable_deposit: Number(refundableDeposit),
        total_deductions: Number(advancePayment),
        notes: internalNotes ? `Internal: ${internalNotes}\n\n${specialNotes}` : specialNotes,
        special_notes: specialNotes,
        important_message: importantTerms,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while creating invoice.'
      setErrorMsg(msg)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* TOP HEADER & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Create New Commercial Invoice</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Build and issue commercial billing invoices for rentals, tours, repairs, and services.</p>
          </div>
        </div>

        {/* WORKFLOW BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewPDF}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye size={14} className="text-slate-500" />
            <span>Preview PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download size={14} className="text-slate-500" />
            <span>Download</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>{loading ? 'Issuing...' : 'Save & Issue'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 01 — INVOICE METADATA & ASSOCIATIONS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <FileText size={15} />
          <span>Section 01 — Invoice Metadata</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Number *</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              placeholder="TT-IN-10001"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="2 Days">2 Days</option>
              <option value="7 Days">7 Days</option>
              <option value="14 Days">14 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quotation Reference (Optional)</label>
            <select
              value={quotationId}
              onChange={(e) => handleQuotationSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            >
              <option value="">-- No Quotation Linked --</option>
              {quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  Quotation #{q.quotation_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Booking Link (Optional)</label>
            <select
              value={bookingId}
              onChange={(e) => handleBookingSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            >
              <option value="">-- Direct Invoice (No Booking) --</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Booking #{b.booking_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Status</label>
            <input
              type="text"
              value={invoiceStatus.toUpperCase()}
              disabled
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 02 — CUSTOMER DETAILS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <User size={15} />
          <span>Section 02 — Customer Details</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Existing CRM Customer *</label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.company_name ? `(${c.company_name})` : ''} {c.mobile ? `— ${c.mobile}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="e.g. ABC Holdings (Pvt) Ltd"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Ref / NIC / Passport</label>
              <input
                type="text"
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                placeholder="e.g. 198512345678"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Street address, city, country..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 03 — RENTAL & VEHICLE INFO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Car size={15} />
          <span>Section 03 — Rental & Vehicle Information (Optional)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Fleet Vehicle</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
            >
              <option value="">-- Custom / No Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_name} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle Name / Model</label>
            <input
              type="text"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="e.g. Toyota KDH Super GL"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              placeholder="e.g. WP ND-4589"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Rental Days</label>
            <input
              type="number"
              min="0"
              value={rentalDays}
              readOnly
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Start Date</label>
            <input
              type="date"
              value={rentalStartDate}
              onChange={(e) => setRentalStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rental End Date</label>
            <input
              type="date"
              value={rentalEndDate}
              onChange={(e) => setRentalEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Location</label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. BIA Colombo Airport"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Destination / Route</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kandy — Sigiriya Tour"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Drop-off Location</label>
            <input
              type="text"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              placeholder="e.g. Hotel / Airport"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* SECTION 04 — INVOICE LINE ITEMS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={15} />
            <span>Section 04 — Invoice Line Items</span>
          </h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add New Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <div className="sm:col-span-6">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Item Description #{idx + 1}</label>
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  placeholder="e.g. Vehicle Rental, Auto Care Repair, Driver Service..."
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Qty / Days</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={it.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit Price (LKR)</label>
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Line Total (LKR)</label>
                  <span className="font-mono font-black text-slate-900 dark:text-white block pt-1">
                    {Number(it.line_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

      {/* SECTION 05 — FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adjustments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Section 05 — Financial Deductions & Charges
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Charges (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Advance Received (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
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
                placeholder="Separate security deposit"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Calculation Summary Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Financial Breakdown Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                LKR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span>Discount:</span>
                <span className="font-mono font-bold">- LKR {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {additionalCharges > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Additional Charges:</span>
                <span className="font-mono font-bold">LKR {additionalCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Tax ({taxRate}%):</span>
                <span className="font-mono font-bold">LKR {taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {refundableDeposit > 0 && (
              <div className="flex justify-between items-center text-amber-500">
                <span>Refundable Deposit (Separate):</span>
                <span className="font-mono font-bold">LKR {refundableDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Net Amount:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                LKR {netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-500">
              <span>Amount Paid / Advance:</span>
              <span className="font-mono font-bold">LKR {advancePayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* BALANCE DUE Highlight Bar (Black background with Yellow text matching PDF & Brand) */}
            <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center shadow-xs border border-amber-400/30">
              <span className="font-black text-amber-400 uppercase text-xs">BALANCE DUE:</span>
              <span className="font-mono font-black text-amber-400 text-xl">
                LKR {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 06 — SPECIAL & IMPORTANT NOTES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Section 06 — Special & Important Notes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Special Notes (Appears on Customer PDF)</label>
            <textarea
              rows={4}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Important Terms & Conditions (Appears on Customer PDF)</label>
            <textarea
              rows={4}
              value={importantTerms}
              onChange={(e) => setImportantTerms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Internal Notes (Private — Excluded from Customer PDF)</label>
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Internal staff notes, accounting references..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* SECTION 07 — PREPARED BY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Section 07 — Prepared By Information
        </h2>
        <div className="flex items-center gap-3 pt-1 text-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{currentUser.full_name || 'Authenticated Staff Member'}</p>
            <p className="text-[11px] text-slate-500 font-semibold">
              {currentUser.role ? currentUser.role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff'} — {COMPANY_CONFIG.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
