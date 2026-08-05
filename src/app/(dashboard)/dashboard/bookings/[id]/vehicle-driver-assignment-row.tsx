'use client'

import { useState } from 'react'
import { Car, User, UserCheck, UserPlus } from 'lucide-react'
import DriverAssignmentModal from './driver-assignment-modal'

interface DriverDTO {
  id: string
  driver_code: string
  full_name: string
  mobile?: string | null
  status?: string | null
  license_expiry?: string | null
  license_number?: string | null
}

interface VehicleDriverAssignmentRowProps {
  bookingVehicleId: string
  bookingId: string
  vehicleName: string
  vehicleRate: number
  depositAmount: number
  allowedKm?: number | null
  extraKmCharge?: number | null
  currentDriverId?: string | null
  currentDriverName?: string | null
  currentDriverCode?: string | null
  rentalStartAt: string
  rentalEndAt: string
  drivers: DriverDTO[]
}

function formatNumberSafe(val: any, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function VehicleDriverAssignmentRow({
  bookingVehicleId,
  bookingId,
  vehicleName,
  vehicleRate,
  depositAmount,
  allowedKm,
  extraKmCharge,
  currentDriverId,
  currentDriverName,
  currentDriverCode,
  rentalStartAt,
  rentalEndAt,
  drivers,
}: VehicleDriverAssignmentRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Vehicle Details */}
        <div>
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Car size={16} className="text-amber-500" />
            <span>{vehicleName}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 space-x-3">
            <span>Rate: <strong className="font-mono">LKR {formatNumberSafe(vehicleRate)}</strong></span>
            <span>Deposit: <strong className="font-mono">LKR {formatNumberSafe(depositAmount)}</strong></span>
            {allowedKm && <span>Allowed: <strong>{String(allowedKm)} KM/day</strong></span>}
            {extraKmCharge && <span>Extra KM: <strong>LKR {formatNumberSafe(extraKmCharge)}/KM</strong></span>}
          </div>
        </div>

        {/* Right: Driver Assignment Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {currentDriverId && currentDriverName ? (
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <UserCheck size={14} className="text-amber-500" />
                <span>
                  Driver: <strong className="text-slate-900 dark:text-white">{currentDriverName}</strong> ({currentDriverCode || 'DRV'})
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
              >
                Change Driver
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 italic flex items-center gap-1">
                <User size={14} />
                <span>Driver: Not assigned</span>
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Assign Driver</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Driver Assignment Modal */}
      <DriverAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingVehicleId={bookingVehicleId}
        bookingId={bookingId}
        currentDriverId={currentDriverId}
        rentalStartAt={rentalStartAt}
        rentalEndAt={rentalEndAt}
        drivers={drivers}
        vehicleName={vehicleName}
      />
    </>
  )
}
