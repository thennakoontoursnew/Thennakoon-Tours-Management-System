import { Loader2 } from 'lucide-react'

export default function BookingDetailLoading() {
  return (
    <div className="py-24 text-center space-y-3">
      <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
      <p className="text-xs font-bold text-slate-500">Loading Booking Details...</p>
    </div>
  )
}
