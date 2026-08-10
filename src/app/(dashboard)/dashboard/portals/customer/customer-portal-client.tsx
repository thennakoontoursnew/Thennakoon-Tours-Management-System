'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  Car,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import {
  createSelfBookingRequestAction,
  approveSelfBookingRequestAction,
} from '../portal-actions'

interface CustomerPortalClientProps {
  portalData: any
  selfBookings: any[]
  categories: any[]
  vehicles: any[]
}

export function CustomerPortalClient({
  portalData,
  selfBookings,
  categories,
  vehicles,
}: CustomerPortalClientProps) {
  const router = useRouter()
  const [showSelfBookingModal, setShowSelfBookingModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Form State
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [pickupLoc, setPickupLoc] = useState('')
  const [dropoffLoc, setDropoffLoc] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [passengerCount, setPassengerCount] = useState('1')
  const [categoryId, setCategoryId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  const handleSelfBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await createSelfBookingRequestAction({
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_email: customerEmail,
        pickup_location: pickupLoc,
        dropoff_location: dropoffLoc,
        rental_start_date: startDate,
        rental_end_date: endDate,
        passenger_count: Number(passengerCount),
        vehicle_category_id: categoryId || null,
        vehicle_id: vehicleId || null,
      })

      if (res.success) {
        setShowSelfBookingModal(false)
        router.refresh()
      } else {
        alert(res.error || 'Failed to submit booking request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveRequest = async (id: string) => {
    setApprovingId(id)
    try {
      const res = await approveSelfBookingRequestAction(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Approval failed')
      }
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Modal for Customer Self Booking */}
      {showSelfBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">New Customer Self-Booking Reservation</h3>
              <button onClick={() => setShowSelfBookingModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSelfBookingSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ruwan Perera"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="077XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    value={pickupLoc}
                    onChange={(e) => setPickupLoc(e.target.value)}
                    placeholder="e.g. Colombo International Airport"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dropoff Location *</label>
                  <input
                    type="text"
                    required
                    value={dropoffLoc}
                    onChange={(e) => setDropoffLoc(e.target.value)}
                    placeholder="e.g. Kandy Hotel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vehicle Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Passenger Count</label>
                  <input
                    type="number"
                    min="1"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSelfBookingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Self-Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-amber-500" /> Customer Self-Service Portal Ecosystem
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Customer bookings tracking, self-service reservation requests, signed agreements & invoice balances.
          </p>
        </div>

        <button
          onClick={() => setShowSelfBookingModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={15} /> Customer Self-Booking
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Bookings</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">
            {portalData.activeBookings?.length || 0}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Self-Booking Requests</span>
          <span className="font-mono font-black text-amber-500 text-xl">{selfBookings.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Outstanding Balance</span>
          <span className="font-mono font-black text-rose-500 text-base">
            LKR {(portalData.totalOutstanding || 0).toLocaleString()}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Portal Access</span>
          <span className="font-mono font-bold text-emerald-600 text-xs block uppercase">ACTIVE</span>
        </div>
      </div>

      {/* Self-Booking Requests Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Customer Self-Booking Requests</h2>
          <span className="text-xs text-slate-400">{selfBookings.length} requests</span>
        </div>

        {selfBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No self-booking requests submitted yet. Click "Customer Self-Booking" above to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {selfBookings.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{req.request_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${req.status === 'converted' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-amber-500/10 text-amber-600 border border-amber-200'}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">{req.customer_name} ({req.customer_mobile})</div>
                  <div className="text-[10px] text-slate-400">{req.pickup_location} → {req.dropoff_location} ({req.rental_start_date} to {req.rental_end_date})</div>
                </div>

                {req.status === 'pending' && (
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    disabled={approvingId === req.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto"
                  >
                    {approvingId === req.id ? 'Approving...' : 'Approve & Convert to Booking'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Customer Bookings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3">Active Customer Bookings</h2>

        {(portalData.activeBookings || []).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">No active customer bookings.</div>
        ) : (
          <div className="space-y-2">
            {portalData.activeBookings.map((b: any) => (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all group"
              >
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">{b.booking_number}</div>
                  <div className="text-[10px] text-slate-400">{b.pickup_location} → {b.dropoff_location}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{b.customer?.full_name || 'Customer'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">LKR {Number(b.grand_total || 0).toLocaleString()}</div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-200 uppercase">
                      {b.status}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
