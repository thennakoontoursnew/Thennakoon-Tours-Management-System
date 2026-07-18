'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { login, logout } from '../../auth-actions'
import { loginSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, LogOut, AlertCircle } from 'lucide-react'

type FormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Check for error searchParams
  const redirectError = searchParams.get('error')
  let initialError: string | null = null

  if (redirectError === 'unauthorized') {
    initialError = 'Your session has expired or you do not have permission.'
  } else if (redirectError === 'inactive') {
    initialError = 'This account has been deactivated. Please contact your system administrator.'
  } else if (redirectError === 'profile_missing') {
    initialError = 'User profile was not found. Please contact the administrator or re-login.'
  } else if (redirectError === 'configuration') {
    initialError = 'System configuration error: Missing environment settings.'
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      const result = await login(values)
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Invalid credentials.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSession = async () => {
    setResetting(true)
    try {
      await logout()
    } catch {
      // Force navigation to clean login page
      router.push('/login')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-5">
      {(error || initialError) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="font-semibold leading-normal">{error || initialError}</span>
          </div>
          {redirectError && (
            <button
              type="button"
              onClick={handleResetSession}
              disabled={resetting}
              className="mt-2 text-amber-400 hover:text-amber-300 underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {resetting ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              Sign Out & Clear Session Cookies
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-amber-400 disabled:opacity-50 transition-colors"
            placeholder="name@thennakoontours.com"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-amber-400/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
