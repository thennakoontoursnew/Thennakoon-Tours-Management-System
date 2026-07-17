'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerOwner } from '../auth-actions'
import { ownerSetupSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { Loader2, Eye, EyeOff } from 'lucide-react'

type FormValues = z.infer<typeof ownerSetupSchema>

export function OwnerSetupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ownerSetupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      const result = await registerOwner(values)
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Setup failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <input
          type="text"
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
          placeholder="e.g. Priyantha Thennakoon"
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
          placeholder="owner@thennakoontours.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-3.5 pr-10 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
            placeholder="••••••••"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
          placeholder="••••••••"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-rose-400 text-xs mt-1.5 font-medium">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-amber-400/20 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating Profile...
          </>
        ) : (
          'Configure System Owner'
        )}
      </button>
    </form>
  )
}
