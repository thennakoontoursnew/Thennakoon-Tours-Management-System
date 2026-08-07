'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UserSquare2,
  Calendar,
  FileCheck,
  Wrench,
  AlertTriangle,
  Plus,
  MessageSquare,
  ChevronRight,
  Phone,
  ShieldAlert,
} from 'lucide-react'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'

interface DriverProfileTabsProps {
  driver: any
  assignments: any[]
  currentBooking: any
  nextBooking: any
  documents: any[]
  leaves: any[]
  incidents: any[]
  notes: any[]
  stats: {
    totalAssignedTrips: number
    completedTrips: number
    cancelledTrips: number
    incidentsCount: number
  }
  userRole: string
  onOpenLeaveModal: () => void
  onOpenNoteModal: () => void
}

export function DriverProfileTabs({
  driver,
  assignments,
  currentBooking,
  nextBooking,
  documents,
  leaves,
  incidents,
  notes,
  stats,
  userRole,
  onOpenLeaveModal,
  onOpenNoteModal,
}: DriverProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'availability' | 'assignments' | 'documents' | 'leave' | 'incidents' | 'notes'
  >('overview')

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview & Identity', icon: UserSquare2 },
    { id: 'availability', label: 'Availability & Calendar', icon: Calendar },
    { id: 'assignments', label: `Assignments (${assignments.length})`, icon: Calendar },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileCheck },
    { id: 'leave', label: `Leave (${leaves.length})`, icon: Calendar },
    { id: 'incidents', label: `Incidents (${incidents.length})`, icon: AlertTriangle },
    { id: 'notes', label: `Internal Notes (${notes.length})`, icon: MessageSquare },
  ]

  const licHealth = calculateDocumentHealth(driver.license_expiry)
  const polHealth = calculateDocumentHealth(driver.police_clearance_expiry)
  const medHealth = calculateDocumentHealth(driver.medical_expiry)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                Identity & Contact Records
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{driver.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driver Code</span>
                  <span className="font-mono font-bold text-amber-500">{driver.driver_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIC Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.nic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.whatsapp || driver.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">License Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.license_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Contact</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{driver.emergency_contact_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Phone</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.emergency_contact_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date Joined</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{driver.date_joined || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Performance & Trip Metrics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                Driver Trip Performance Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Assigned Trips</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-lg">{stats.totalAssignedTrips}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-emerald-500 block">Completed Trips</span>
                  <span className="font-mono font-black text-emerald-500 text-lg">{stats.completedTrips}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">Cancelled Trips</span>
                  <span className="font-mono font-black text-rose-500 text-lg">{stats.cancelledTrips}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-amber-500 block">Incidents Logged</span>
                  <span className="font-mono font-black text-amber-500 text-lg">{stats.incidentsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Compliance Health */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Legal Document Compliance
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Driving License</span>
                  <span className={`font-bold block ${licHealth.status === 'expired' || licHealth.status === 'expiring_soon' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {licHealth.label}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Police Clearance</span>
                  <span className={`font-bold block ${polHealth.status === 'expired' || polHealth.status === 'expiring_soon' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {polHealth.label}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Certificate</span>
                  <span className={`font-bold block ${medHealth.status === 'expired' || medHealth.status === 'expiring_soon' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {medHealth.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AVAILABILITY & CALENDAR */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Booking Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">Current Active Trip</span>
            {currentBooking ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/dashboard/bookings/${currentBooking.booking.id}`}
                    className="font-mono font-black text-amber-500 hover:underline text-sm"
                  >
                    {currentBooking.booking.booking_number}
                  </Link>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                    {currentBooking.booking.status}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-bold">
                  Hirer: {currentBooking.booking.customer?.full_name || 'Customer'}
                </div>
                <div className="text-slate-500">
                  Vehicle: {currentBooking.vehicle?.vehicle_name} ({currentBooking.vehicle?.registration_number})
                </div>
                <div className="text-slate-500">
                  Period: {new Date(currentBooking.booking.rental_start_at).toLocaleDateString()} → {new Date(currentBooking.booking.rental_end_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4">No active trip on tour for this driver today.</div>
            )}
          </div>

          {/* Next Reservation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block">Next Upcoming Assignment</span>
            {nextBooking ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/dashboard/bookings/${nextBooking.booking.id}`}
                    className="font-mono font-black text-blue-500 hover:underline text-sm"
                  >
                    {nextBooking.booking.booking_number}
                  </Link>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 uppercase">
                    {nextBooking.booking.status}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-bold">
                  Hirer: {nextBooking.booking.customer?.full_name || 'Customer'}
                </div>
                <div className="text-slate-500">
                  Pickup: {new Date(nextBooking.booking.rental_start_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4">No upcoming trip reservations scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS HISTORY */}
      {activeTab === 'assignments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Driver Booking Assignment History
          </h3>
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Booking No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Rental Dates</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((bv: any) => (
                    <tr key={bv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <Link href={`/dashboard/bookings/${bv.booking.id}`} className="font-mono font-bold text-amber-500 hover:underline">
                          {bv.booking.booking_number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{bv.booking.customer?.full_name || 'N/A'}</td>
                      <td className="py-2.5 px-3">{bv.vehicle?.vehicle_name} ({bv.vehicle?.registration_number})</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {new Date(bv.booking.rental_start_at).toLocaleDateString()} → {new Date(bv.booking.rental_end_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                          {bv.booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No trip assignments recorded for this driver.</div>
          )}
        </div>
      )}

      {/* TAB 5: LEAVE / UNAVAILABILITY */}
      {activeTab === 'leave' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Driver Unavailability & Leave Schedule
            </h3>
            <button
              onClick={onOpenLeaveModal}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Set Leave</span>
            </button>
          </div>

          {leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Unavailability Type</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">End Date</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3 font-bold capitalize text-slate-900 dark:text-white">
                        {l.unavailability_type.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{new Date(l.start_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-mono">{new Date(l.end_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">{l.reason || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No unavailability or leave periods scheduled.</div>
          )}
        </div>
      )}
    </div>
  )
}
