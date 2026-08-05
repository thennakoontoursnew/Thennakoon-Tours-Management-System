'use client'

import { useState } from 'react'
import { Car, User, UserCheck, UserPlus, Phone, ShieldCheck } from 'lucide-react'
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
  rentalDays?: number
  currentDriverId?: string | null
  currentDriverName?: string | null
  currentDriverCode?: string | null
  currentDriverMobile?: string | null
  currentDriverStatus?: string | null
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
  rentalDays = 1,
  currentDriverId,
  currentDriverName,
  currentDriverCode,
  currentDriverMobile,
  currentDriverStatus,
  rentalStartAt,
  rentalEndAt,
  drivers,
}: VehicleDriverAssignmentRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const lineTotal = vehicleRate * rentalDays + depositAmount

  return (
    <>
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Car size={16} />
            </div>
            <span>{vehicleName}</span>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Line Total: <strong className="text-amber-500 font-bold text-sm">LKR {formatNumberSafe(lineTotal)}</strong>
          </div>
        </div>

        {/* Grid Layout: Left Metric Chips | Right Driver Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left 7 Columns: Vehicle Metric Chips */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Rate</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                LKR {formatNumberSafe(vehicleRate)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deposit</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                LKR {formatNumberSafe(depositAmount)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allowed KM</div>
              <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                {allowedKm ? `${allowedKm} KM/day` : 'Unlimited'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Extra KM Rate</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                {extraKmCharge ? `LKR ${formatNumberSafe(extraKmCharge)}` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Driver Assignment Card */}
          <div className="lg:col-span-5">
            {currentDriverId && currentDriverName ? (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                    <UserCheck size={12} />
                    <span>Assigned Driver</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{currentDriverName}</span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">({currentDriverCode || 'DRV'})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone size={10} />
                      <span>{currentDriverMobile || 'No Phone'}</span>
                    </span>
                    {currentDriverStatus && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {currentDriverStatus}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer shrink-0"
                >
                  Change Driver
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Driver Status</div>
                  <div className="text-slate-500 italic flex items-center gap-1">
                    <User size={13} />
                    <span>Not assigned</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                >
                  <UserPlus size={13} />
                  <span>Assign Driver</span>
                </button>
              </div>
            )}
          </div>
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
