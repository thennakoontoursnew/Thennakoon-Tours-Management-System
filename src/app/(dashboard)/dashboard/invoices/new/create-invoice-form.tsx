'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  Lock,
  Unlock,
  Info,
  ShieldAlert,
} from 'lucide-react'
import { createInvoice, updateInvoiceAction } from '../invoice-actions'
import { generateCommercialInvoicePDF } from '@/lib/documents/invoice-pdf-commercial'
import { COMPANY_CONFIG } from '@/lib/company-config'
import { calculateCommercialInvoiceFinancials, unwrapDeductionsRelation } from '@/lib/utils/relation-utils'

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
  vehicle_name?: string
  registration_number?: string
  license_plate?: string
  category?: string
  make?: string
  model?: string
  brand?: string
  daily_rate?: number
  monthly_rate?: number
  refundable_deposit?: number
  [key: string]: unknown
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
  initialInvoice?: Record<string, unknown>
  companySettings?: Record<string, unknown>
}

export function CreateInvoiceForm({
  customers,
  bookings,
  vehicles,
  quotations,
  defaultInvoiceNumber,
  currentUser,
  initialInvoice,
  companySettings,
}: CreateInvoiceFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialInvoice && initialInvoice.id)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // SECTION 1: INVOICE METADATA
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    return String(initialInvoice?.invoice_number || defaultInvoiceNumber)
  })
  const [isEditingInvoiceNumber, setIsEditingInvoiceNumber] = useState(false)

  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    if (initialInvoice?.invoice_date) return String(initialInvoice.invoice_date)
    return new Date().toISOString().split('T')[0]
  })

  const [paymentTerms, setPaymentTerms] = useState<string>(() => {
    return String(initialInvoice?.payment_terms || '7 Days')
  })

  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialInvoice?.due_date) return String(initialInvoice.due_date)
    return new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  })

  const [invoiceStatus] = useState<string>(() => {
    return String(initialInvoice?.status || 'draft')
  })

  const [quotationId, setQuotationId] = useState<string>(() => {
    return String(initialInvoice?.quotation_id || '')
  })

  const [bookingId, setBookingId] = useState<string>(() => {
    return String(initialInvoice?.booking_id || '')
  })

  // SECTION 2: CUSTOMER DETAILS
  const [customerList, setCustomerList] = useState<Customer[]>(() => customers || [])

  useEffect(() => {
    if (customers && customers.length > 0) {
      setCustomerList(customers)
    } else {
      const supabase = createClient()
      supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const active = data.filter((c: any) => !c.is_archived)
            setCustomerList(active.length > 0 ? active : data)
          }
        })
    }
  }, [customers])

  const initialCustomerObj = initialInvoice?.customer && typeof initialInvoice.customer === 'object'
    ? (initialInvoice.customer as Record<string, unknown>)
    : null
  const initialCustomerSnap = initialInvoice?.customer_snapshot && typeof initialInvoice.customer_snapshot === 'object'
    ? (initialInvoice.customer_snapshot as Record<string, unknown>)
    : null

  const [customerId, setCustomerId] = useState<string>(() => {
    return String(initialInvoice?.customer_id || (customers && customers.length > 0 ? customers[0].id : ''))
  })
  const [customerName, setCustomerName] = useState<string>(() => {
    return String(initialCustomerSnap?.full_name || initialCustomerObj?.full_name || customers[0]?.full_name || '')
  })
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return String(initialCustomerSnap?.mobile || initialCustomerObj?.mobile || customers[0]?.mobile || '')
  })
  const [customerEmail, setCustomerEmail] = useState<string>(() => {
    return String(initialCustomerSnap?.email || initialCustomerObj?.email || customers[0]?.email || '')
  })
  const [customerCompany, setCustomerCompany] = useState<string>(() => {
    return String(initialCustomerSnap?.company_name || initialCustomerObj?.company_name || customers[0]?.company_name || '')
  })
  const [customerRef, setCustomerRef] = useState<string>(() => {
    return String(initialCustomerSnap?.identifier_no || initialCustomerObj?.identifier_no || customers[0]?.identifier_no || '')
  })
  const [customerAddress, setCustomerAddress] = useState<string>(() => {
    return String(initialCustomerSnap?.address || initialCustomerObj?.address_line_1 || customers[0]?.address_line_1 || '')
  })

  // SECTION 3: RENTAL & VEHICLE INFO
  const [vehicleList, setVehicleList] = useState<Vehicle[]>(() => vehicles || [])

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      setVehicleList(vehicles)
    } else {
      const supabase = createClient()
      supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const active = data.filter((v: any) => !v.is_archived)
            setVehicleList(active.length > 0 ? active : data)
          }
        })
    }
  }, [vehicles])

  const initialRentalSnap = initialInvoice?.rental_vehicle_snapshot && typeof initialInvoice.rental_vehicle_snapshot === 'object'
    ? (initialInvoice.rental_vehicle_snapshot as Record<string, unknown>)
    : null

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    return String(initialRentalSnap?.vehicle_id || '')
  })
  const [vehicleName, setVehicleName] = useState<string>(() => {
    return String(initialRentalSnap?.vehicle_name || '')
  })
  const [registrationNumber, setRegistrationNumber] = useState<string>(() => {
    return String(initialRentalSnap?.registration_number || '')
  })
  const [rentalStartDate, setRentalStartDate] = useState<string>(() => {
    return String(initialRentalSnap?.rental_start_date || '')
  })
  const [rentalEndDate, setRentalEndDate] = useState<string>(() => {
    return String(initialRentalSnap?.rental_end_date || '')
  })
  const [manualRentalDays, setManualRentalDays] = useState<string>(() => {
    return initialRentalSnap?.rental_days ? String(initialRentalSnap.rental_days) : ''
  })
  const [pickupLocation, setPickupLocation] = useState<string>(() => {
    return String(initialRentalSnap?.pickup_location || '')
  })
  const [destination, setDestination] = useState<string>(() => {
    return String(initialRentalSnap?.destination || '')
  })
  const [dropoffLocation, setDropoffLocation] = useState<string>(() => {
    return String(initialRentalSnap?.dropoff_location || '')
  })

  // SECTION 4: LINE ITEMS
  const [items, setItems] = useState<
    { description: string; quantity: number; unit_price: number; line_total: number }[]
  >(() => {
    if (initialInvoice?.items && Array.isArray(initialInvoice.items) && initialInvoice.items.length > 0) {
      return initialInvoice.items.map((it: Record<string, unknown>) => ({
        description: String(it.description || 'Service Line Item'),
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        line_total: Number(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
      }))
    }
    return [{ description: 'Vehicle Rental Service', quantity: 1, unit_price: 15000, line_total: 15000 }]
  })

  // SECTION 5: FINANCIAL SUMMARY
  const [discountAmount, setDiscountAmount] = useState<number>(() => Number(initialInvoice?.discount_amount || 0))
  const [discountDescription, setDiscountDescription] = useState<string>(() => String(initialInvoice?.discount_description || ''))

  const [deductions, setDeductions] = useState<
    { id?: string; description: string; amount: number }[]
  >(() => {
    if (initialInvoice) {
      return unwrapDeductionsRelation(
        initialInvoice.deductions,
        Number(initialInvoice.total_deductions),
        initialInvoice.deduction_description ? String(initialInvoice.deduction_description) : null
      )
    }
    return []
  })

  const computedTotalDeductions = useMemo(() => {
    return deductions.reduce((sum, d) => sum + Math.max(0, Number(d.amount || 0)), 0)
  }, [deductions])

  const handleAddDeduction = () => {
    setDeductions([...deductions, { description: '', amount: 0 }])
  }

  const handleRemoveDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  const handleDeductionChange = (index: number, field: 'description' | 'amount', value: unknown) => {
    const newDeductions = [...deductions]
    const current = { ...newDeductions[index] }
    if (field === 'description') {
      current.description = String(value)
    } else if (field === 'amount') {
      const a = Math.max(0, Number(value || 0))
      current.amount = isNaN(a) ? 0 : a
    }
    newDeductions[index] = current
    setDeductions(newDeductions)
  }

  const [additionalCharges, setAdditionalCharges] = useState<number>(() => Number(initialInvoice?.additional_charges || 0))
  const [additionalChargeDescription, setAdditionalChargeDescription] = useState<string>(() => String(initialInvoice?.additional_charge_description || ''))

  const [taxRate, setTaxRate] = useState<number>(() => Number(initialInvoice?.tax_rate || 0))
  const [refundableDeposit, setRefundableDeposit] = useState<number>(() => Number(initialInvoice?.refundable_deposit || 0))
  const [advancePayment, setAdvancePayment] = useState<number>(() => Number(initialInvoice?.amount_paid || 0))

  // SECTION 6: NOTES
  const defaultSpecialNotes = String(companySettings?.default_special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const csTerms = String(companySettings?.default_invoice_terms || '')
  const defaultInvoiceTerms = csTerms && !csTerms.includes('Payment due upon receipt')
    ? csTerms
    : COMPANY_CONFIG.defaultInvoiceImportantTerms

  const invTerms = String(initialInvoice?.terms_and_conditions || initialInvoice?.important_message || '')
  const initialTermsVal = invTerms && !invTerms.includes('Payment due upon receipt')
    ? invTerms
    : defaultInvoiceTerms

  const [specialNotes, setSpecialNotes] = useState<string>(() => String(initialInvoice?.special_notes || defaultSpecialNotes))
  const [importantTerms, setImportantTerms] = useState<string>(() => initialTermsVal)
  const [internalNotes, setInternalNotes] = useState<string>(() => String(initialInvoice?.notes || ''))

  // Auto-calculate Rental Days with safe manual override
  const computedRentalDays = useMemo(() => {
    if (!rentalStartDate || !rentalEndDate) return 0
    const start = new Date(rentalStartDate).getTime()
    const end = new Date(rentalEndDate).getTime()
    if (isNaN(start) || isNaN(end) || end < start) return 0
    const diff = Math.ceil((end - start) / (1000 * 3600 * 24))
    return Math.max(1, diff)
  }, [rentalStartDate, rentalEndDate])

  const rentalDaysToDisplay = manualRentalDays !== '' ? Number(manualRentalDays) : computedRentalDays

  // Helper to calculate Due Date based on Payment Terms
  const calculateDueDate = (terms: string, invDate: string): string => {
    if (terms === 'Custom' || !invDate) return dueDate
    try {
      const baseDate = new Date(invDate)
      if (isNaN(baseDate.getTime())) return dueDate

      let addDays = 0
      if (terms === 'Due on Receipt') addDays = 0
      else if (terms === '2 Days') addDays = 2
      else if (terms === '7 Days') addDays = 7
      else if (terms === '14 Days') addDays = 14
      else if (terms === '30 Days') addDays = 30

      const computed = new Date(baseDate.getTime() + addDays * 24 * 3600 * 1000)
      return computed.toISOString().split('T')[0]
    } catch {
      return dueDate
    }
  }

  const handleInvoiceDateChange = (newDate: string) => {
    setInvoiceDate(newDate)
    if (paymentTerms !== 'Custom') {
      const nextDue = calculateDueDate(paymentTerms, newDate)
      setDueDate(nextDue)
    }
  }

  const handlePaymentTermsChange = (newTerms: string) => {
    setPaymentTerms(newTerms)
    if (newTerms !== 'Custom') {
      const nextDue = calculateDueDate(newTerms, invoiceDate)
      setDueDate(nextDue)
    }
  }

  // Handle Customer Selection Auto-fill (does NOT mutate master CRM)
  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId)
    if (!cId) return
    const c = (customerList || []).find((cust: any) => cust.id === cId) as any
    if (c) {
      const name = c.full_name || c.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || ''
      const phone = c.mobile || c.phone || c.phone_number || ''
      const email = c.email || ''
      const company = c.company_name || c.company || ''
      const ref = c.identifier_no || c.nic || c.passport_number || c.customer_code || c.id_number || ''
      const address = c.address_line_1 || c.billing_address || c.address || c.street_address || ''

      setCustomerName(String(name || ''))
      setCustomerPhone(String(phone || ''))
      setCustomerEmail(String(email || ''))
      setCustomerCompany(String(company || ''))
      setCustomerRef(String(ref || ''))
      setCustomerAddress(String(address || ''))
    }
  }

  // Handle Vehicle Selection Auto-fill
  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId)
    if (!vId) return

    const v = (vehicleList || []).find((vh: any) => vh.id === vId)
    if (v) {
      const reg = v.registration_number || v.license_plate || v.reg_no || v.vehicle_code || ''
      const makeModel = [v.make || v.brand, v.model].filter(Boolean).join(' ')
      const vName = v.vehicle_name || v.name || ''
      const displayName = vName ? (makeModel ? `${vName} (${makeModel})` : vName) : (makeModel || 'Vehicle')

      setVehicleName(String(displayName || ''))
      setRegistrationNumber(String(reg || ''))

      // Auto fill daily rate if single default item is present (preserving line item description)
      const rate = Number(v.daily_rate || 0)
      if (rate > 0 && items.length === 1 && (items[0].unit_price === 15000 || items[0].unit_price === 0)) {
        const days = rentalDaysToDisplay || 1
        setItems([
          {
            description: items[0].description || 'Vehicle Rental Service',
            quantity: days,
            unit_price: rate,
            line_total: days * rate,
          },
        ])
      }
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
    setItems([...items, { description: 'Additional Service / Charge', quantity: 1, unit_price: 0, line_total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: unknown) => {
    const newItems = [...items]
    const current = { ...newItems[index] }

    if (field === 'description') {
      current.description = String(value)
    } else if (field === 'quantity') {
      const q = Math.max(0, Number(value || 0))
      current.quantity = isNaN(q) ? 0 : q
      current.line_total = current.quantity * current.unit_price
    } else if (field === 'unit_price') {
      const u = Math.max(0, Number(value || 0))
      current.unit_price = isNaN(u) ? 0 : u
      current.line_total = current.quantity * current.unit_price
    }

    newItems[index] = current
    setItems(newItems)
  }

  // Compute Live Canonical Totals via calculateCommercialInvoiceFinancials
  const rawSubtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)

  const financials = calculateCommercialInvoiceFinancials({
    subtotal: rawSubtotal,
    discount_amount: discountAmount,
    deduction_items: deductions,
    additional_charges: additionalCharges,
    tax_rate: taxRate,
    refundable_deposit: refundableDeposit,
    amount_paid: advancePayment,
  })

  // Prepare Snapshot Data Payload for PDF Generator
  const getInvoiceDataSnapshot = () => {
    return {
      invoice_number: invoiceNumber.trim() || defaultInvoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      status: invoiceStatus,
      quotation_number: quotationId ? quotations.find((q) => q.id === quotationId)?.quotation_number : null,
      customer: {
        full_name: customerName.trim() || 'Valued Customer',
        company_name: customerCompany.trim() || null,
        mobile: customerPhone.trim() || 'N/A',
        email: customerEmail.trim() || 'N/A',
        address: customerAddress.trim() || 'Sri Lanka',
        identifier_no: customerRef.trim() || 'N/A',
      },
      vehicle_name: vehicleName,
      vehicle_registration: registrationNumber,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      rental_days: rentalDaysToDisplay,
      pickup_location: pickupLocation,
      destination: destination,
      dropoff_location: dropoffLocation,
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        line_total: Number(it.line_total || 0),
      })),
      deductions: deductions.map((d, idx) => ({
        description: d.description,
        amount: Number(d.amount),
        sort_order: idx,
      })),
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      discount_description: discountDescription,
      total_deductions: financials.deductions,
      deduction_description: deductions.map((d) => d.description).join(', '),
      additional_charges: financials.additionalCharges,
      additional_charge_description: additionalChargeDescription,
      tax_rate: financials.taxRate,
      tax_amount: financials.taxAmount,
      refundable_deposit: financials.refundableDeposit,
      grand_total: financials.netAmount,
      amount_paid: financials.amountPaid,
      balance_due: financials.balanceDue,
      special_notes: specialNotes,
      terms_and_conditions: importantTerms,
      prepared_by_name_snapshot: initialInvoice?.prepared_by_name_snapshot ? String(initialInvoice.prepared_by_name_snapshot) : currentUser.full_name,
      prepared_by_designation_snapshot: initialInvoice?.prepared_by_designation_snapshot ? String(initialInvoice.prepared_by_designation_snapshot) : (currentUser.role ? currentUser.role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff'),
    }
  }

  // PDF Preview Action
  const handlePreviewPDF = async () => {
    try {
      const snap = getInvoiceDataSnapshot()
      const doc = await generateCommercialInvoicePDF(snap, companySettings)
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
      const doc = await generateCommercialInvoicePDF(snap, companySettings)
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

    if (items.length === 0) {
      setErrorMsg('At least one line item is required.')
      return
    }

    for (let i = 0; i < deductions.length; i++) {
      if (Number(deductions[i].amount) > 0 && !deductions[i].description.trim()) {
        setErrorMsg(`Please provide a description for Deduction #${i + 1}.`)
        return
      }
    }

    setLoading(true)
    try {
      const customerSnap = {
        full_name: customerName,
        mobile: customerPhone,
        email: customerEmail,
        company_name: customerCompany,
        identifier_no: customerRef,
        address: customerAddress,
      }

      const rentalVehicleSnap = {
        vehicle_id: selectedVehicleId,
        vehicle_name: vehicleName,
        registration_number: registrationNumber,
        rental_start_date: rentalStartDate,
        rental_end_date: rentalEndDate,
        rental_days: rentalDaysToDisplay,
        pickup_location: pickupLocation,
        destination: destination,
        dropoff_location: dropoffLocation,
      }

      const payload = {
        invoice_number: invoiceNumber.trim() || undefined,
        customer_id: customerId,
        booking_id: bookingId || undefined,
        quotation_id: quotationId || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        currency: 'LKR',
        discount_amount: Number(discountAmount),
        discount_description: discountDescription || undefined,
        total_deductions: Number(financials.deductions),
        deduction_description: deductions.map((d) => d.description.trim()).filter(Boolean).join(', ') || undefined,
        additional_charges: Number(additionalCharges),
        additional_charge_description: additionalChargeDescription || undefined,
        tax_rate: Number(taxRate),
        refundable_deposit: Number(refundableDeposit),
        notes: internalNotes ? `Internal: ${internalNotes}\n\n${specialNotes}` : specialNotes,
        special_notes: specialNotes,
        important_message: importantTerms,
        status: (isEditing ? (invoiceStatus as 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled') : (isIssue ? 'issued' : 'draft')),
        customer_snapshot: customerSnap,
        rental_vehicle_snapshot: rentalVehicleSnap,
        prepared_by_name_snapshot: initialInvoice?.prepared_by_name_snapshot ? String(initialInvoice.prepared_by_name_snapshot) : currentUser.full_name,
        prepared_by_designation_snapshot: initialInvoice?.prepared_by_designation_snapshot ? String(initialInvoice.prepared_by_designation_snapshot) : (currentUser.role ? currentUser.role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff'),
        items: items.map((it, idx) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          display_order: idx,
        })),
        deduction_items: deductions
          .filter((d) => d.description.trim() && Number(d.amount) >= 0)
          .map((d, idx) => ({
            id: d.id,
            description: d.description.trim(),
            amount: Number(d.amount),
            sort_order: idx,
          })),
      }

      let res
      if (isEditing && initialInvoice?.id) {
        res = await updateInvoiceAction(String(initialInvoice.id), payload)
      } else {
        res = await createInvoice(payload)
      }

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to save invoice.')
        setLoading(false)
        return
      }

      router.push(`/dashboard/invoices/${res.invoiceId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving invoice.'
      setErrorMsg(msg)
      setLoading(false)
    }
  }

  const isReadOnlyStatus = isEditing && ['cancelled', 'void'].includes(invoiceStatus)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* TOP HEADER & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={isEditing && initialInvoice?.id ? `/dashboard/invoices/${initialInvoice.id}` : '/dashboard/invoices'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isEditing ? `Edit Commercial Invoice #${invoiceNumber}` : 'Create Commercial Invoice'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Update invoice metadata, line items, deductions, and terms.' : 'Build and issue commercial billing invoices for rentals, tours, repairs, and services.'}
            </p>
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

          {!isReadOnlyStatus && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
              >
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Draft')}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{loading ? 'Issuing...' : 'Save & Issue'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isReadOnlyStatus && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-2xl text-xs flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>This invoice is currently in {invoiceStatus.toUpperCase()} status and cannot be modified.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 01 — INVOICE METADATA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <FileText size={15} />
          <span>Section 01 — Invoice Metadata</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* INVOICE NUMBER WITH MANUAL EDIT TOGGLE */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Invoice Number *</label>
              <button
                type="button"
                onClick={() => setIsEditingInvoiceNumber(!isEditingInvoiceNumber)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isEditingInvoiceNumber ? (
                  <>
                    <Lock size={12} />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <Unlock size={12} />
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={invoiceNumber}
              disabled={!isEditingInvoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              placeholder="TT-IN-10001"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:outline-none disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => handlePaymentTermsChange(e.target.value)}
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Due Date</label>
            <input
              type="date"
              value={dueDate}
              disabled={paymentTerms !== 'Custom'}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800"
            />
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
          <span>Section 02 — Customer Details (Snapshot Saved)</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Existing CRM Customer *</label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            >
              <option value="">-- Select Existing CRM Customer or Enter Custom --</option>
              {customerList && customerList.length > 0 && customerList.map((c: any) => {
                const name = c.full_name || c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Customer'
                const phone = c.mobile || c.phone || c.phone_number || ''
                const company = c.company_name || c.company || ''
                const label = company ? `${name} (${company})` : phone ? `${name} — ${phone}` : name
                return (
                  <option key={c.id} value={c.id}>
                    {label}
                  </option>
                )
              })}
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
          <span>Section 03 — Rental & Vehicle Information (Snapshot Saved)</span>
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
              {vehicleList && vehicleList.length > 0 && vehicleList.map((v: any) => {
                const reg = v.registration_number || v.license_plate || v.reg_no || v.vehicle_code || 'No Plate'
                const makeModel = [v.make || v.brand, v.model].filter(Boolean).join(' ')
                const vName = v.vehicle_name || v.name || ''
                const nameStr = vName ? (makeModel ? `${vName} (${makeModel})` : vName) : (makeModel || 'Vehicle')
                return (
                  <option key={v.id} value={v.id}>
                    {reg} - {nameStr}
                  </option>
                )
              })}
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
              value={manualRentalDays !== '' ? manualRentalDays : computedRentalDays}
              onChange={(e) => setManualRentalDays(e.target.value)}
              placeholder={`Auto: ${computedRentalDays}`}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
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
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
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
                  onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
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

      {/* SECTION 05 — PAYMENT & FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adjustments & Deductions */}
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
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Reason / Description</label>
                <input
                  type="text"
                  value={discountDescription}
                  onChange={(e) => setDiscountDescription(e.target.value)}
                  placeholder="e.g. Seasonal Promotion, Early Booking"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* MULTIPLE DEDUCTIONS (OPTIONAL) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">DEDUCTIONS (OPTIONAL)</label>
                  <p className="text-[11px] text-slate-400">Damage, fuel, or late fee deductions</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDeduction}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Deduction</span>
                </button>
              </div>

              {deductions.length === 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs text-center">
                  No deductions added. Click “Add Deduction” to specify damage, fuel, or late fee deductions.
                </div>
              ) : (
                <div className="space-y-3">
                  {deductions.map((d, dIdx) => (
                    <div key={dIdx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                      <div className="sm:col-span-7">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Deduction #{dIdx + 1} Description</label>
                        <input
                          type="text"
                          value={d.description}
                          onChange={(e) => handleDeductionChange(dIdx, 'description', e.target.value)}
                          placeholder="e.g. Fuel Shortage, Vehicle Damage, Late Return Fee"
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Amount (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={d.amount}
                          onChange={(e) => handleDeductionChange(dIdx, 'amount', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveDeduction(dIdx)}
                          className="px-2.5 py-1 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Total Deductions</span>
                    <span className="font-mono text-rose-500">
                      LKR {computedTotalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Charges (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Charge Description</label>
                <input
                  type="text"
                  value={additionalChargeDescription}
                  onChange={(e) => setAdditionalChargeDescription(e.target.value)}
                  placeholder="e.g. Airport Parking Fee, Toll Charges"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Advance Received (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={advancePayment}
                  disabled={isEditing}
                  onChange={(e) => setAdvancePayment(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Security Deposit (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundableDeposit}
                onChange={(e) => setRefundableDeposit(Math.max(0, Number(e.target.value)))}
                placeholder="Separate security deposit"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Calculation Summary Breakdown (Highlighted Card) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Info size={15} />
            <span>Financial Breakdown Summary</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                LKR {financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {financials.discountAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span>Discount {discountDescription ? `(${discountDescription})` : ''}:</span>
                <span className="font-mono font-bold">- LKR {financials.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {financials.deductions > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-rose-500 font-bold">
                  <span>Deductions ({deductions.length} item{deductions.length > 1 ? 's' : ''}):</span>
                  <span className="font-mono">- LKR {financials.deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {deductions.map((d, dIdx) => (
                  <div key={dIdx} className="flex justify-between items-center text-[10px] text-rose-400/80 pl-2">
                    <span>• {d.description || 'Deduction'}</span>
                    <span className="font-mono">- LKR {Number(d.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}

            {financials.additionalCharges > 0 && (
              <div className="flex justify-between items-center text-emerald-500">
                <span>Additional Charges {additionalChargeDescription ? `(${additionalChargeDescription})` : ''}:</span>
                <span className="font-mono font-bold">+ LKR {financials.additionalCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {financials.taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Tax ({financials.taxRate}%):</span>
                <span className="font-mono font-bold">LKR {financials.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {financials.refundableDeposit > 0 && (
              <div className="flex justify-between items-center text-amber-500">
                <span>Refundable Deposit (Separate):</span>
                <span className="font-mono font-bold">LKR {financials.refundableDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Net Amount:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                LKR {financials.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-500">
              <span>Amount Paid / Advance:</span>
              <span className="font-mono font-bold">LKR {financials.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* BALANCE DUE Highlight Bar */}
            <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center shadow-xs border border-amber-400/30">
              <span className="font-black text-amber-400 uppercase text-xs">BALANCE DUE:</span>
              <span className="font-mono font-black text-amber-400 text-xl">
                LKR {financials.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Internal Notes (Private — EXCLUDED from Customer PDF)</label>
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
          Section 07 — Prepared By Information (Snapshot Saved)
        </h2>
        <div className="flex items-center gap-3 pt-1 text-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
            {initialInvoice?.prepared_by_name_snapshot ? String(initialInvoice.prepared_by_name_snapshot).charAt(0).toUpperCase() : (currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'S')}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {initialInvoice?.prepared_by_name_snapshot ? String(initialInvoice.prepared_by_name_snapshot) : (currentUser.full_name || 'Authenticated Staff Member')}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">
              {initialInvoice?.prepared_by_designation_snapshot ? String(initialInvoice.prepared_by_designation_snapshot) : (currentUser.role ? currentUser.role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Finance Staff')} — {COMPANY_CONFIG.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
