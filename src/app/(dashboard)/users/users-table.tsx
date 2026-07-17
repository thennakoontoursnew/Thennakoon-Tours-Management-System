'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react'
import { toggleUserActive, createStaffUser } from './user-actions'

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  phone: string | null
  last_login_at: string | null
  created_at: string
}

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'booking_staff', label: 'Booking Staff' },
  { value: 'operations_staff', label: 'Operations Staff' },
  { value: 'marketing_staff', label: 'Marketing Staff' },
  { value: 'finance_staff', label: 'Finance Staff' },
  { value: 'viewer', label: 'Viewer' },
]

function getRoleLabel(role: string) {
  const found = ROLES.find((r) => r.value === role)
  return found?.label ?? role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    booking_staff: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30',
    operations_staff: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    marketing_staff: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/30',
    finance_staff: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30',
    viewer: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${colors[role] ?? colors.viewer}`}
    >
      <ShieldCheck size={10} />
      {getRoleLabel(role)}
    </span>
  )
}

function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'viewer',
    phone: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await createStaffUser(form)
      if (result.success) {
        onCreated()
        onClose()
      } else {
        setError(result.error || 'Failed to create staff user.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Create Staff Account</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                placeholder="e.g. Kasun Perera"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                placeholder="staff@thennakoontours.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                placeholder="+94 77 000 0000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Min. 8 chars, uppercase, number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-2 px-5 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsersTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[]
  currentUserId: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = profiles.filter((p) => {
    const matchSearch =
      !search ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || p.role === roleFilter
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active)
    return matchSearch && matchRole && matchStatus
  })

  const handleToggleActive = async (userId: string, currentState: boolean) => {
    setActionLoading(userId)
    setActionError(null)
    const result = await toggleUserActive(userId, !currentState)
    if (!result.success) setActionError(result.error || 'Action failed.')
    setActionLoading(null)
    router.refresh()
  }

  return (
    <>
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => router.refresh()}
        />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <UserPlus size={13} />
            Add Staff
          </button>
        </div>

        {actionError && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold">
            {actionError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 px-5 py-3">
                  User
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 px-5 py-3">
                  Role
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 px-5 py-3 hidden md:table-cell">
                  Last Login
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 px-5 py-3">
                  Status
                </th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={28} className="opacity-40" />
                      <p className="text-xs font-semibold">No users match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((profile) => {
                  const isCurrentUser = profile.id === currentUserId
                  const isOwner = profile.role === 'owner'
                  const isLoading = actionLoading === profile.id

                  return (
                    <tr
                      key={profile.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              {profile.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-900 dark:text-slate-100 font-semibold text-xs truncate">
                              {profile.full_name}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-amber-500 dark:text-amber-400 text-[10px] font-bold">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={profile.role} />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {profile.last_login_at
                            ? format(new Date(profile.last_login_at), 'dd MMM yyyy, HH:mm')
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {profile.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle size={9} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-full">
                            <XCircle size={9} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {!isOwner && !isCurrentUser ? (
                          <button
                            onClick={() => handleToggleActive(profile.id, profile.is_active)}
                            disabled={isLoading}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border cursor-pointer transition-colors disabled:opacity-50 ${
                              profile.is_active
                                ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 size={10} className="animate-spin inline" />
                            ) : profile.is_active ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-600">
                            {isOwner ? 'Protected' : 'Current user'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Showing {filtered.length} of {profiles.length} users
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <Users size={12} />
            <span className="text-[10px]">{profiles.length} total</span>
          </div>
        </div>
      </div>
    </>
  )
}
