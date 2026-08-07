'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingStatus, getValidNextTransitions, STATUS_LABELS } from '@/lib/bookings/booking-workflow'
import { executeBookingTransitionAction } from '@/app/(dashboard)/dashboard/bookings/[id]/booking-actions'
import { VehicleReadyModal } from './vehicle-ready-modal'
import { RecordReturnModal } from './record-return-modal'
import { BookingCancellationModal } from './booking-cancellation-modal'
import { BookingCloseModal } from './booking-close-modal'
import { CheckCircle2, Play, CornerDownLeft, CheckSquare, Lock, XCircle, AlertTriangle } from 'lucide-react'

interface BookingStatusActionsProps {
  bookingId: string
  currentStatus: BookingStatus
  userRole: string
  userId?: string
  balanceDue: number
  pickupOdometer?: number
  allowedKmTotal?: number
  extraKmRate?: number
}

export function BookingStatusActions({
  bookingId,
  currentStatus,
  userRole,
  userId,
  balanceDue,
  pickupOdometer = 50000,
  allowedKmTotal = 500,
  extraKmRate = 100,
}: BookingStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalType, setModalType] = useState<'ready' | 'return' | 'cancel' | 'noshow' | 'close' | null>(null)

  const isOwner = userRole === 'owner'
  const validNext = getValidNextTransitions(currentStatus)

  const handleExecuteTransition = async (targetStatus: BookingStatus, payload?: any) => {
    setLoading(true)
    try {
      const result = await executeBookingTransitionAction(bookingId, targetStatus, payload)

      if (!result.success) {
        alert(result.message)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert(`Error updating booking status: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (validNext.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
        <Lock size={14} />
        <span>Lifecycle Completed</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Confirmed -> Ready */}
        {validNext.includes('ready') && (
          <button
            onClick={() => setModalType('ready')}
            disabled={loading}
            className="px-3.5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Mark Vehicle Ready</span>
          </button>
        )}

        {/* Ready -> On Trip */}
        {validNext.includes('on_trip') && (
          <button
            onClick={() => {
              if (confirm('Confirm starting trip? Vehicle will be handed over to hirer and set to On Trip status.')) {
                handleExecuteTransition('on_trip')
              }
            }}
            disabled={loading}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Play size={15} />
            <span>Start Trip (Handover)</span>
          </button>
        )}

        {/* On Trip -> Returned */}
        {validNext.includes('returned') && (
          <button
            onClick={() => setModalType('return')}
            disabled={loading}
            className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <CornerDownLeft size={15} />
            <span>Record Vehicle Return</span>
          </button>
        )}

        {/* Returned -> Completed */}
        {validNext.includes('completed') && (
          <button
            onClick={() => {
              if (confirm('Confirm completing booking? Ensure return checklist and charges have been reviewed.')) {
                handleExecuteTransition('completed')
              }
            }}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <CheckSquare size={15} />
            <span>Complete Booking</span>
          </button>
        )}

        {/* Completed -> Closed */}
        {validNext.includes('closed') && (
          <button
            onClick={() => setModalType('close')}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Lock size={15} />
            <span>Close Booking</span>
          </button>
        )}

        {/* Cancel Booking */}
        {validNext.includes('cancelled') && (
          <button
            onClick={() => setModalType('cancel')}
            disabled={loading}
            className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <XCircle size={15} />
            <span>Cancel Booking</span>
          </button>
        )}

        {/* No Show */}
        {validNext.includes('no_show') && (
          <button
            onClick={() => setModalType('noshow')}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertTriangle size={15} />
            <span>No Show</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <VehicleReadyModal
        isOpen={modalType === 'ready'}
        onClose={() => setModalType(null)}
        onSubmit={async (handoverData) => {
          await handleExecuteTransition('ready', { handoverData })
        }}
      />

      <RecordReturnModal
        isOpen={modalType === 'return'}
        onClose={() => setModalType(null)}
        initialPickupOdometer={pickupOdometer}
        allowedKmTotal={allowedKmTotal}
        configuredExtraKmRate={extraKmRate}
        onSubmit={async (returnData) => {
          await handleExecuteTransition('returned', { returnData })
        }}
      />

      <BookingCancellationModal
        isOpen={modalType === 'cancel' || modalType === 'noshow'}
        isNoShow={modalType === 'noshow'}
        onClose={() => setModalType(null)}
        onSubmit={async (reason, notes) => {
          const target = modalType === 'noshow' ? 'no_show' : 'cancelled'
          await handleExecuteTransition(target, { reason, handoverData: { notes } })
        }}
      />

      <BookingCloseModal
        isOpen={modalType === 'close'}
        balanceDue={balanceDue}
        isOwner={isOwner}
        onClose={() => setModalType(null)}
        onSubmit={async (overrideReason) => {
          await handleExecuteTransition('closed', { overrideReason })
        }}
      />
    </>
  )
}
