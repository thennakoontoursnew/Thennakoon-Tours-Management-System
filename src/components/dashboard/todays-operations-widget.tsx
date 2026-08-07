'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TodayOperationsData, OperationalBookingRecord } from '@/lib/dashboard/dashboard-service'
import { CalendarCheck, ArrowUpRight, UserX, Car, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface TodaysOperationsWidgetProps {
  operations: TodayOperationsData
}

export function TodaysOperationsWidget({ operations }: TodaysOperationsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'pickups' | 'returns' | 'active' | 'missing'>('pickups')

  const { pickups = [], returns = [], activeTrips = [], driverMissing = [] } = operations || {}

  const getActiveList = (): OperationalBookingRecord[] => {
    if (activeTab === 'pickups') return pickups
    if (activeTab === 'returns') return returns
    if (activeTab === 'active') return activeTrips
    return driverMissing
  }

  const currentList = getActiveList()

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Today&apos;s Operations</h2>
            <p className="text-[11px] text-slate-400">Live operational dispatch & return monitoring</p>
          </div>
        </div>

        <Link
          href="/dashboard/bookings"
          className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
        >
          <span>All Bookings</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Operational Group Counter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'pickups'
              ? 'bg-amber-400/10 border-amber-400 text-slate-900 dark:text-white'
              : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Pickups Today</span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{pickups.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-amber-400/10 border-amber-400 text-slate-900 dark:text-white'
              : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Returns Today</span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{returns.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-amber-400/10 border-amber-400 text-slate-900 dark:text-white'
              : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Trips</span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{activeTrips.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('missing')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'missing'
              ? 'bg-rose-500/10 border-rose-500 text-rose-500'
              : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-rose-500 block flex items-center gap-1">
            {driverMissing.length > 0 && <AlertTriangle size={12} className="text-rose-500" />}
            <span>Driver Missing</span>
          </span>
          <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{driverMissing.length}</span>
        </button>
      </div>

      {/* Record List */}
      <div className="space-y-2 min-h-[160px]">
        {currentList.length > 0 ? (
          currentList.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-500 text-xs">{rec.booking_number}</span>
                  <span className="text-slate-900 dark:text-white font-bold text-xs">{rec.customer_name}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Car size={12} className="text-slate-400" />
                    <span>{rec.vehicle_name}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{rec.pickup_location || 'HQ'}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {activeTab === 'missing' && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold">
                    UNASSIGNED
                  </span>
                )}
                <Link
                  href={`/dashboard/bookings/${rec.id}`}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs"
                >
                  Manage Booking
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 size={24} className="text-emerald-500 mx-auto opacity-80" />
            <p className="text-xs text-slate-400">No operational records for this category today.</p>
          </div>
        )}
      </div>
    </div>
  )
}
