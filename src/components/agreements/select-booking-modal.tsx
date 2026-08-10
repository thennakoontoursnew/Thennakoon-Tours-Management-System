'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Calendar, User, Car, X, CheckCircle, FileText, ChevronRight } from 'lucide-react'

interface SelectBookingModalProps {
  bookings: any[]
  existingUserAgreements: any[]
  isOpen: boolean
  onClose: () => void
}

export function SelectBookingModal({
  bookings,
  existingUserAgreements,
  isOpen,
  onClose,
}: SelectBookingModalProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  // Map existing active agreements by booking_id
  const agreementMap: Record<string, any> = {}
  existingUserAgreements.forEach((agr) => {
    if (agr.booking_id && ['active', 'generated', 'signed', 'draft'].includes(agr.status)) {
      agreementMap[agr.booking_id] = agr
    }
  })

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.booking_number?.toLowerCase().includes(q) ||
      b.customer?.full_name?.toLowerCase().includes(q) ||
      b.customer?.mobile?.includes(q)
    )
  })

  const handleSelectBooking = (bookingId: string) => {
    onClose()
    router.push(`/dashboard/agreements/new?booking_id=${bookingId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Select Booking for User Agreement</h3>
              <p className="text-slate-400 text-xs">Choose a booking reservation to generate a new User Agreement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking number, customer name, mobile..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
          />
        </div>

        {/* Bookings List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {filteredBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No active bookings found.</div>
          ) : (
            filteredBookings.map((b) => {
              const existingAgr = agreementMap[b.id]

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-500">{b.booking_number}</span>
                      <span className="text-slate-900 dark:text-white font-bold">{b.customer?.full_name || 'Customer'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Rental: {new Date(b.rental_start_at).toLocaleDateString()} to {new Date(b.rental_end_at).toLocaleDateString()}
                    </div>
                  </div>

                  {existingAgr ? (
                    <div className="text-right shrink-0 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                        Active Agreement: {existingAgr.agreement_number}
                      </span>
                      <Link
                        href={`/dashboard/agreements/${existingAgr.id}/preview`}
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 inline-flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle size={12} />
                        <span>View User Agreement</span>
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectBooking(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Select Booking</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
