'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Car,
  Calendar,
  FileText,
  Wrench,
  DollarSign,
  ClipboardCheck,
  Image as ImageIcon,
  Calculator,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'

interface VehicleProfileTabsProps {
  vehicle: any
  allocations: any[]
  currentBooking: any
  nextBooking: any
  odometerLogs: any[]
  documents: any[]
  photos: any[]
  maintenance: any[]
  returnChecks: any[]
  financials: {
    collectedRevenue: number
    invoicedRevenue: number
    totalMaintenanceCost: number
    netContribution: number
  }
  userRole: string
  onOpenOdometerModal: () => void
  onOpenDocumentModal: () => void
}

export function VehicleProfileTabs({
  vehicle,
  allocations,
  currentBooking,
  nextBooking,
  odometerLogs,
  documents,
  photos,
  maintenance,
  returnChecks,
  financials,
  userRole,
  onOpenOdometerModal,
  onOpenDocumentModal,
}: VehicleProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'availability' | 'bookings' | 'documents' | 'maintenance' | 'financials' | 'inspections' | 'photos'
  >('overview')

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview & Specs', icon: Car },
    { id: 'availability', label: 'Availability & Calendar', icon: Calendar },
    { id: 'bookings', label: `Bookings (${allocations.length})`, icon: Calendar },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'maintenance', label: `Maintenance (${maintenance.length})`, icon: Wrench },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'inspections', label: `Inspections (${returnChecks.length})`, icon: ClipboardCheck },
    { id: 'photos', label: `Photos (${photos.length})`, icon: ImageIcon },
  ]

  const isFinanceAuthorized = ['owner', 'admin', 'manager', 'finance_staff'].includes(userRole)

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
                Identity & Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.category?.category_name || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand & Model</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Manufacture Year</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.manufacture_year || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registration Number</span>
                  <span className="font-mono font-bold text-amber-500">{vehicle.registration_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transmission</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{vehicle.transmission}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fuel Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{vehicle.fuel_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Passenger Seats</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.seat_count || 'N/A'} Seats</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vehicle Colour</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.colour || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ownership Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{vehicle.ownership_type || 'COMPANY'}</span>
                </div>
              </div>
            </div>

            {/* Odometer History Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Odometer & Mileage Log
                </h3>
                <button
                  onClick={onOpenOdometerModal}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Log Reading</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Odometer</span>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-xl">
                    {Number(vehicle.current_mileage || 0).toLocaleString()} KM
                  </div>
                </div>
                {vehicle.service_due_mileage && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Next Service Due</span>
                    <div className="font-mono font-bold text-amber-500 text-sm">
                      {Number(vehicle.service_due_mileage).toLocaleString()} KM
                    </div>
                  </div>
                )}
              </div>

              {odometerLogs.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {odometerLogs.slice(0, 4).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 uppercase">
                          {log.source_type}
                        </span>
                        <span className="font-mono font-bold">{Number(log.odometer).toLocaleString()} KM</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(log.recorded_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No manual odometer entries recorded yet.</div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Rates */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Rental Rates & Terms
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Daily Rate</span>
                  <div className="font-mono font-black text-amber-500 text-base">LKR {Number(vehicle.daily_rate || 0).toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Refundable Deposit</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">LKR {Number(vehicle.refundable_deposit || 0).toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Allowed KM / Day</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{vehicle.allowed_km_per_day || 100} KM</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Extra KM Charge</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">LKR {vehicle.extra_km_charge || 100} / KM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AVAILABILITY & CALENDAR */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Booking Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">Current Booking</span>
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
                    Period: {new Date(currentBooking.booking.rental_start_at).toLocaleDateString()} → {new Date(currentBooking.booking.rental_end_at).toLocaleDateString()}
                  </div>
                  {currentBooking.driver && (
                    <div className="text-slate-500 font-medium">
                      Driver: {currentBooking.driver.full_name} ({currentBooking.driver.mobile || 'N/A'})
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-4">No active booking on trip for this vehicle today.</div>
              )}
            </div>

            {/* Next Upcoming Booking Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block">Next Reservation</span>
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
                <div className="text-xs text-slate-400 italic py-4">No future upcoming reservations scheduled.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS HISTORY */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Vehicle Booking History Ledger
          </h3>
          {allocations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Booking No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Rental Dates</th>
                    <th className="py-2.5 px-3">Driver</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allocations.map((bv: any) => (
                    <tr key={bv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <Link href={`/dashboard/bookings/${bv.booking.id}`} className="font-mono font-bold text-amber-500 hover:underline">
                          {bv.booking.booking_number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{bv.booking.customer?.full_name || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {new Date(bv.booking.rental_start_at).toLocaleDateString()} → {new Date(bv.booking.rental_end_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">{bv.driver?.full_name || 'Not assigned'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">LKR {Number(bv.booking.grand_total || 0).toLocaleString()}</td>
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
            <div className="py-8 text-center text-xs text-slate-400 italic">No bookings recorded for this vehicle.</div>
          )}
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500">
              Vehicle Compliance Documents
            </h3>
            <button
              onClick={onOpenDocumentModal}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Document</span>
            </button>
          </div>

          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Document Type</th>
                    <th className="py-2.5 px-3">Doc Number</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc: any) => {
                    const health = calculateDocumentHealth(doc.expiry_date)
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="py-2.5 px-3 font-bold capitalize text-slate-900 dark:text-white">
                          {doc.document_type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{doc.document_number || 'N/A'}</td>
                        <td className="py-2.5 px-3">{doc.provider || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-mono">{doc.expiry_date || 'N/A'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${health.badgeColor}`}>
                            {health.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No legal compliance documents uploaded yet.</div>
          )}
        </div>
      )}

      {/* TAB 5: FINANCIALS */}
      {activeTab === 'financials' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Vehicle Financial Summary & Net Contribution
          </h3>

          {!isFinanceAuthorized ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <Lock size={16} />
              <span>Restricted Access: Financial metrics are accessible only to Owner, Admin, Manager, and Finance Staff roles.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Collected Revenue</span>
                <span className="font-mono font-black text-emerald-500 text-lg">
                  LKR {financials.collectedRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Completed Payments</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-lg">
                  LKR {financials.invoicedRevenue.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Maintenance Cost</span>
                <span className="font-mono font-black text-rose-500 text-lg">
                  LKR {financials.totalMaintenanceCost.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-amber-500 block">Net Contribution</span>
                <span className="font-mono font-black text-amber-500 text-lg">
                  LKR {financials.netContribution.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
