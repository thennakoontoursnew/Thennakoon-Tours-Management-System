'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UserRound,
  CalendarCheck,
  Car,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

interface DriverPortalClientProps {
  portalData: any
}

export function DriverPortalClient({ portalData }: DriverPortalClientProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')

  const drivers = portalData.drivers || []
  const assignedTrips = portalData.assignedTrips || []
  const todayTrips = portalData.todayTrips || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserRound size={24} className="text-amber-500" /> Driver Mobile Duty Portal
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Mobile-optimized duty schedule, trip handovers, passenger details, and trip tracking.
          </p>
        </div>

        {/* Driver selector */}
        {drivers.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400">Select Driver:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
            >
              <option value="">All Drivers (Duty Roster)</option>
              {drivers.map((d: any) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Active Drivers</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{drivers.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Today's Duty Trips</span>
          <span className="font-mono font-black text-amber-500 text-xl">{todayTrips.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Total Assigned Trips</span>
          <span className="font-mono font-black text-blue-500 text-xl">{assignedTrips.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Portal Status</span>
          <span className="font-mono font-bold text-emerald-600 text-xs block uppercase">ONLINE</span>
        </div>
      </div>

      {/* Assigned Duty Trips List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Assigned Driver Duty Trips</h2>
          <span className="text-xs text-slate-400">{assignedTrips.length} trips</span>
        </div>

        {assignedTrips.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">No assigned duty trips found for drivers.</div>
        ) : (
          <div className="space-y-3">
            {assignedTrips.map((t: any) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{t.booking?.booking_number || 'TRIP'}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                      {t.booking?.status || 'Active'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.booking?.rental_start_at?.slice(0, 10)} → {t.booking?.rental_end_at?.slice(0, 10)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                      <Car size={14} className="text-amber-500 shrink-0" />
                      <span>{t.vehicle?.vehicle_name || 'Vehicle'} ({t.vehicle?.registration_number || 'Reg'})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{t.booking?.pickup_location || 'Pickup'} → {t.booking?.dropoff_location || 'Dropoff'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                      <UserRound size={14} className="text-blue-500 shrink-0" />
                      <span>Passenger: {t.booking?.customer?.full_name || 'Customer'}</span>
                    </div>
                    {t.booking?.customer?.mobile && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <a href={`tel:${t.booking.customer.mobile}`} className="text-amber-600 dark:text-amber-400 hover:underline">{t.booking.customer.mobile}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
