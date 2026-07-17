import { redirect } from 'next/navigation'
import { checkOwnerExists } from '../auth-actions'
import { OwnerSetupForm } from './owner-setup-form'

export default async function OwnerSetupPage() {
  const { exists } = await checkOwnerExists()

  if (exists) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Yellow brand accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-400"></div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-amber-400 tracking-wider">THENNAKOON TOURS</h1>
          <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mt-1">
            Management System
          </p>
          <div className="mt-6">
            <h2 className="text-xl font-bold text-white">System Owner Registration</h2>
            <p className="text-slate-400 text-xs mt-2">
              Setup the initial administrator profile. Only one active owner profile is permitted.
            </p>
          </div>
        </div>

        <OwnerSetupForm />
      </div>
    </div>
  )
}
