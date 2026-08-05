'use client'

import { useState } from 'react'
import { Car, User, UserCheck, UserPlus } from 'lucide-react'
import DriverAssignmentModal from './driver-assignment-modal'

interface VehicleDriverAssignmentRowProps {
  bv: any
  veh: any
  drv: any
  bookingId: string
  rentalStartAt: string
  rentalEndAt: string
  drivers: any[]
  formatNumberSafe: (val: any) => string
}

export default function VehicleDriverAssignmentRow({
  bv,
  veh,
  drv,
  bookingId,
  rentalStartAt,
  rentalEndAt,
  drivers,
  formatNumberSafe,
}: VehicleDriverAssignmentRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const vehicleName = veh ? `${veh.vehicle_name} (${veh.registration_number})` : `Vehicle ID: ${bv.vehicle_id}`

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
            <span>Rate: <strong className="font-mono">LKR {formatNumberSafe(bv.vehicle_rate)}</strong></span>
            <span>Deposit: <strong className="font-mono">LKR {formatNumberSafe(bv.deposit_amount)}</strong></span>
            {bv.allowed_km && <span>Allowed: <strong>{String(bv.allowed_km)} KM/day</strong></span>}
            {bv.extra_km_charge && <span>Extra KM: <strong>LKR {formatNumberSafe(bv.extra_km_charge)}/KM</strong></span>}
          </div>
        </div>

        {/* Right: Driver Assignment Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {drv ? (
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <UserCheck size={14} className="text-amber-500" />
                <span>
                  Driver: <strong className="text-slate-900 dark:text-white">{drv.full_name}</strong> ({drv.driver_code})
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
        bookingVehicleId={bv.id}
        bookingId={bookingId}
        currentDriverId={bv.driver_id}
        rentalStartAt={rentalStartAt}
        rentalEndAt={rentalEndAt}
        drivers={drivers}
        vehicleName={vehicleName}
      />
    </>
  )
}
