import Link from 'next/link'
import { checkOwnerExists } from '../../auth-actions'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const { exists } = await checkOwnerExists()

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
        </div>

        {!exists && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs leading-normal">
            <span className="font-bold block mb-1">System is not initialized.</span>
            To get started, please register the system owner account.
            <Link
              href="/owner-setup"
              className="mt-2.5 block text-center bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-md transition-colors"
            >
              Configure Owner Profile
            </Link>
          </div>
        )}

        {exists && <LoginForm />}

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  )
}
