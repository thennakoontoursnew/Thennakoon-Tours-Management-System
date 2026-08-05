'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { assignBookingVehicleDriver } from '../booking-actions'
import { User, X, Search, ShieldAlert, CheckCircle, Loader2, UserMinus } from 'lucide-react'

interface Driver {
  id: string
  driver_code: string
  full_name: string
  mobile?: string | null
  status?: string | null
  license_expiry?: string | null
  license_number?: string | null
}

interface DriverAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  bookingVehicleId: string
  bookingId: string
  currentDriverId?: string | null
  rentalStartAt: string
  rentalEndAt: string
  drivers: Driver[]
  vehicleName: string
}

export default function DriverAssignmentModal({
  isOpen,
  onClose,
  bookingVehicleId,
  bookingId,
  currentDriverId,
  drivers,
  vehicleName,
}: DriverAssignmentModalProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [loadingDriverId, setLoadingDriverId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredDrivers = drivers.filter((d) => {
    const q = search.toLowerCase()
    return (
      d.full_name.toLowerCase().includes(q) ||
      d.driver_code.toLowerCase().includes(q) ||
      (d.mobile && d.mobile.includes(q))
    )
  })

  const handleAssign = async (driverId: string | null) => {
    try {
      setLoadingDriverId(driverId || 'REMOVE')
      setErrorMessage(null)
      setSuccessMessage(null)

      const res = await assignBookingVehicleDriver(bookingVehicleId, bookingId, driverId)

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update driver assignment.')
        return
      }

      setSuccessMessage(driverId ? 'Driver assigned successfully!' : 'Driver removed successfully!')
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 500)
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during driver assignment.')
    } finally {
      setLoadingDriverId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="text-amber-500" size={20} />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Assign Driver — {vehicleName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search driver by name, code, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Remove Driver Action if assigned */}
        {currentDriverId && (
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Current Assigned Driver</span>
            <button
              onClick={() => handleAssign(null)}
              disabled={loadingDriverId === 'REMOVE'}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingDriverId === 'REMOVE' ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
              <span>Remove Driver</span>
            </button>
          </div>
        )}

        {/* Drivers List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredDrivers.length > 0 ? (
            filteredDrivers.map((d) => {
              const isAssigned = d.id === currentDriverId
              const isExpired = d.license_expiry && new Date(d.license_expiry) < new Date()
              const isLoading = loadingDriverId === d.id

              return (
                <div
                  key={d.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    isAssigned
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono text-amber-500 text-[11px]">{d.driver_code}</span>
                      <span>{d.full_name}</span>
                      {isAssigned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                          Assigned
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 space-x-3">
                      <span>Mobile: {d.mobile || 'N/A'}</span>
                      {d.license_expiry && (
                        <span className={isExpired ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                          License: {isExpired ? `Expired (${d.license_expiry})` : `Expires ${d.license_expiry}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAssigned ? (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Current</span>
                    ) : (
                      <button
                        onClick={() => handleAssign(d.id)}
                        disabled={Boolean(isExpired) || Boolean(loadingDriverId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isExpired
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                        <span>{isExpired ? 'License Expired' : 'Assign'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No active drivers found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
