import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Yellow brand accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-400"></div>

        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <ShieldAlert size={32} />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          You do not have the required permissions to access this module. If you believe this is an error, please contact the system owner or your administrator.
        </p>

        <Link
          href="/dashboard"
          className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-2.5 px-4 rounded-lg text-center cursor-pointer shadow-md hover:shadow-amber-400/20 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
