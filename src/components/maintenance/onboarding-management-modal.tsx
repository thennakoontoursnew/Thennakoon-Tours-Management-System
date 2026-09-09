'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, X, Phone, Building2, UserCheck, Bookmark, Ban } from 'lucide-react'

interface OnboardingManagementModalProps {
  isOpen: boolean
  vehicle: {
    id: string
    registration_number: string
    vehicle_name: string
    brand?: string
    model?: string
    owner_contact_name?: string | null
    owner_contact_phone?: string | null
    agreed_payout_rate?: number | null
    holding_type?: string | null
    status?: string
  } | null
  onClose: () => void
  onSave: (input: {
    vehicleId: string
    decision: 'fleet_partner_on_call' | 'in_house_fleet' | 'standby_pool' | 'rejected'
    agreedPayoutRate?: number
    holdingType?: 'in_house' | 'owner_held'
    managementNotes?: string
  }) => Promise<void>
}

export function OnboardingManagementModal({ isOpen, vehicle, onClose, onSave }: OnboardingManagementModalProps) {
  const [decision, setDecision] = useState<'fleet_partner_on_call' | 'in_house_fleet' | 'standby_pool' | 'rejected'>('fleet_partner_on_call')
  const [agreedPayoutRate, setAgreedPayoutRate] = useState<string>('')
  const [holdingType, setHoldingType] = useState<'in_house' | 'owner_held'>('owner_held')
  const [managementNotes, setManagementNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (vehicle) {
      setAgreedPayoutRate(vehicle.agreed_payout_rate ? String(vehicle.agreed_payout_rate) : '')
      setHoldingType((vehicle.holding_type as 'in_house' | 'owner_held') || 'owner_held')
    }
  }, [vehicle])

  if (!isOpen || !vehicle) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        vehicleId: vehicle.id,
        decision,
        agreedPayoutRate: agreedPayoutRate ? Number(agreedPayoutRate) : undefined,
        holdingType,
        managementNotes: managementNotes || undefined,
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const decisionOptions = [
    {
      id: 'fleet_partner_on_call',
      title: 'On-Call Partner Fleet (Owner-Held)',
      desc: 'Owner retains vehicle. Onboarded to dispatch directory. Owner Agreement generated on booking dispatch.',
      icon: Phone,
      border: 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      defaultHolding: 'owner_held' as const,
    },
    {
      id: 'in_house_fleet',
      title: 'In-House Company Fleet (Yard Handover)',
      desc: 'Vehicle handed over to company premises. Ready for immediate dispatch from company yard.',
      icon: Building2,
      border: 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      defaultHolding: 'in_house' as const,
    },
    {
      id: 'standby_pool',
      title: 'Emergency Standby Pool',
      desc: 'Rates mismatched or conditional. Vehicle retained in standby directory for peak demand overflow.',
      icon: Bookmark,
      border: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      defaultHolding: 'owner_held' as const,
    },
    {
      id: 'rejected',
      title: 'Reject Vehicle Intake',
      desc: 'Terms or inspection not acceptable. Vehicle status marked as rejected.',
      icon: Ban,
      border: 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
      defaultHolding: 'owner_held' as const,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Management Review & Rate Negotiation</h2>
              <p className="text-[11px] text-slate-400">Technical Inspection PASSED — Set owner agreement terms & holding type</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Vehicle Summary Card */}
        <div className="px-6 py-3 bg-purple-500/5 dark:bg-purple-950/20 border-b border-purple-500/10 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.vehicle_name}</span>
            <span className="ml-2 font-mono text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded-md">
              {vehicle.registration_number}
            </span>
          </div>
          {vehicle.owner_contact_name && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <UserCheck size={13} className="text-purple-500" />
              <span>Owner: <strong className="text-slate-800 dark:text-slate-200">{vehicle.owner_contact_name}</strong></span>
              {vehicle.owner_contact_phone && (
                <a href={`tel:${vehicle.owner_contact_phone}`} className="text-purple-600 dark:text-purple-400 underline font-mono">
                  {vehicle.owner_contact_phone}
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Decision Options */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Management Decision <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {decisionOptions.map((opt) => {
                const Icon = opt.icon
                const isSelected = decision === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setDecision(opt.id as any)
                      setHoldingType(opt.defaultHolding)
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${opt.border} ${
                      isSelected ? opt.activeBorder : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={isSelected}
                      onChange={() => {
                        setDecision(opt.id as any)
                        setHoldingType(opt.defaultHolding)
                      }}
                      className="mt-1 accent-purple-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Icon size={14} className="text-slate-500" />
                          {opt.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeClass}`}>
                          {opt.id === 'fleet_partner_on_call' ? 'Status: available_on_call' : opt.id === 'in_house_fleet' ? 'Status: available' : opt.id === 'standby_pool' ? 'Status: standby_pool' : 'Status: rejected'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rates & Holding Details */}
          {decision !== 'rejected' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Agreed Payout Rate (LKR / Day)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-xs">LKR</span>
                  <input
                    type="number"
                    value={agreedPayoutRate}
                    onChange={(e) => setAgreedPayoutRate(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full pl-11 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Vehicle Holding Mode
                </label>
                <select
                  value={holdingType}
                  onChange={(e) => setHoldingType(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="owner_held">Owner-Held (Dispatched on Demand)</option>
                  <option value="in_house">In-House (Stored in Company Yard)</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Management Notes / Negotiated Terms</label>
            <textarea
              rows={2}
              value={managementNotes}
              onChange={(e) => setManagementNotes(e.target.value)}
              placeholder="e.g. Negotiated LKR 12,000/day payout. Owner retains custody; dispatch notice required 2 hours prior."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              {loading ? 'Saving Decision...' : 'Save Management Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
