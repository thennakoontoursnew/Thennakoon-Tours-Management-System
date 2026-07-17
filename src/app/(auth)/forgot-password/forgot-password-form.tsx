'use client'

import { useState } from 'react'
import { requestPasswordReset } from '../../auth-actions'
import { Loader2 } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Password reset request failed.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold leading-relaxed">
          <span className="font-bold block mb-1">Reset link sent!</span>
          If an account exists for {email}, you will receive a reset link shortly. Check your inbox and spam folder.
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          disabled={loading || success}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
          placeholder="name@thennakoontours.com"
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || success}
        className="w-full mt-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-amber-400/20 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending Link...
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>
    </form>
  )
}
