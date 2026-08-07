'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit2, CheckCircle, XCircle, Building2, Phone, Banknote, Percent, ChevronRight, AlertCircle } from 'lucide-react'
import { createVehicleOwnerAction, updateVehicleOwnerAction, toggleVehicleOwnerStatusAction } from './owner-actions'

interface VehicleOwner {
  id: string
  owner_number: string
  full_name: string
  company_name?: string
  owner_type: string
  mobile?: string
  email?: string
  revenue_share_pct: number
  flat_rate_per_day?: number
  payment_terms: string
  is_active: boolean
  vehicle_count?: number
}

interface VehicleOwnersClientProps {
  owners: VehicleOwner[]
}

const OWNER_TYPES = ['individual', 'company', 'partnership']
const PAYMENT_TERMS = ['per_booking', 'weekly', 'monthly', 'quarterly']

function OwnerFormModal({ isOpen, onClose, editOwner }: { isOpen: boolean; onClose: () => void; editOwner?: VehicleOwner | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: editOwner?.full_name || '',
    company_name: editOwner?.company_name || '',
    owner_type: editOwner?.owner_type || 'individual',
    national_id: '',
    mobile: editOwner?.mobile || '',
    whatsapp: '',
    email: editOwner?.email || '',
    address: '',
    bank_name: '',
    bank_account_number: '',
    bank_branch: '',
    revenue_share_pct: editOwner?.revenue_share_pct?.toString() || '0',
    flat_rate_per_day: editOwner?.flat_rate_per_day?.toString() || '',
    payment_terms: editOwner?.payment_terms || 'monthly',
    notes: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      let result
      if (editOwner) {
        result = await updateVehicleOwnerAction(editOwner.id, form)
      } else {
        result = await createVehicleOwnerAction(form)
      }
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400/10 rounded-lg">
              <Users size={18} className="text-amber-600" />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base">
              {editOwner ? 'Edit Vehicle Owner' : 'New Vehicle Owner'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name <span className="text-rose-500">*</span></label>
              <input
                required
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Owner full name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Type</label>
              <select
                value={form.owner_type}
                onChange={(e) => setForm({ ...form, owner_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {OWNER_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Company name (if applicable)"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">National ID</label>
              <input
                type="text"
                value={form.national_id}
                onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="NIC / Passport"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Mobile</label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="+94 77 xxx xxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="+94 77 xxx xxxx"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="owner@email.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                placeholder="Owner address"
              />
            </div>
          </div>

          {/* Revenue Share */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-3 flex items-center gap-2">
              <Percent size={15} /> Revenue Share Agreement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Revenue Share %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.revenue_share_pct}
                  onChange={(e) => setForm({ ...form, revenue_share_pct: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Flat Rate / Day (LKR)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.flat_rate_per_day}
                  onChange={(e) => setForm({ ...form, flat_rate_per_day: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Terms</label>
                <select
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ').charAt(0).toUpperCase() + t.replace('_', ' ').slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Banking */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Bank name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Account Number</label>
              <input
                type="text"
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Account number"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
              <input
                type="text"
                value={form.bank_branch}
                onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Branch"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="Internal notes about this owner"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : editOwner ? 'Update Owner' : 'Create Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function VehicleOwnersClient({ owners }: VehicleOwnersClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editOwner, setEditOwner] = useState<VehicleOwner | null>(null)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = owners.filter((o) => {
    const q = search.toLowerCase()
    return (
      o.full_name.toLowerCase().includes(q) ||
      o.owner_number.toLowerCase().includes(q) ||
      (o.company_name || '').toLowerCase().includes(q) ||
      (o.mobile || '').includes(q)
    )
  })

  const handleToggleStatus = async (owner: VehicleOwner) => {
    setTogglingId(owner.id)
    try {
      await toggleVehicleOwnerStatusAction(owner.id, !owner.is_active)
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const handleEdit = (owner: VehicleOwner) => {
    setEditOwner(owner)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditOwner(null)
    setShowModal(true)
  }

  const activeCount = owners.filter((o) => o.is_active).length

  return (
    <>
      <OwnerFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditOwner(null) }}
        editOwner={editOwner}
      />

      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vehicle Owners & Partners</h1>
            <p className="text-slate-500 text-xs mt-1">Manage third-party vehicle suppliers, revenue share agreements, and payout tracking.</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm"
          >
            <Plus size={16} />
            Add Vehicle Owner
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Owners</span>
            <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{owners.length}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-emerald-500 block">Active</span>
            <span className="font-mono font-black text-emerald-500 text-xl">{activeCount}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Inactive</span>
            <span className="font-mono font-black text-slate-500 text-xl">{owners.length - activeCount}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-amber-500 block">Partner Vehicles</span>
            <span className="font-mono font-black text-amber-500 text-xl">{owners.reduce((s, o) => s + (o.vehicle_count || 0), 0)}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owners by name, number, company..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Users size={16} />
          </div>
        </div>

        {/* Owners Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No vehicle owners found</p>
              <p className="text-slate-400 text-xs mt-1">
                {search ? 'Try adjusting your search' : 'Add your first third-party vehicle owner to get started'}
              </p>
              {!search && (
                <button onClick={handleAdd} className="mt-4 px-4 py-2 text-sm font-bold bg-amber-400 text-slate-950 rounded-xl hover:bg-amber-300 transition-all">
                  <Plus size={14} className="inline mr-1" /> Add Owner
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Owner</th>
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Contact</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Revenue Share</th>
                    <th className="text-center text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Vehicles</th>
                    <th className="text-center text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Status</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            {owner.owner_type === 'company' ? (
                              <Building2 size={16} className="text-amber-600" />
                            ) : (
                              <Users size={16} className="text-amber-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{owner.full_name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{owner.owner_number}</div>
                            {owner.company_name && (
                              <div className="text-[10px] text-slate-500">{owner.company_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                          {owner.mobile && (
                            <span className="flex items-center gap-1"><Phone size={11} /> {owner.mobile}</span>
                          )}
                          {owner.email && <span>{owner.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {owner.revenue_share_pct > 0 ? `${owner.revenue_share_pct}%` : '—'}
                        </div>
                        {owner.flat_rate_per_day && (
                          <div className="text-[10px] text-slate-400 font-mono">LKR {Number(owner.flat_rate_per_day).toLocaleString()}/day</div>
                        )}
                        <div className="text-[10px] text-slate-400 capitalize">{owner.payment_terms.replace('_', ' ')}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{owner.vehicle_count || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          owner.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}>
                          {owner.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {owner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(owner)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Edit owner"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(owner)}
                            disabled={togglingId === owner.id}
                            className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${
                              owner.is_active
                                ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            title={owner.is_active ? 'Deactivate' : 'Reactivate'}
                          >
                            {togglingId === owner.id ? '...' : owner.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
