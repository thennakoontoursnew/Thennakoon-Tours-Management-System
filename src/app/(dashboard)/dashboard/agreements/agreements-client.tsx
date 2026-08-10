'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { NewOwnerAgreementModal } from '@/components/agreements/new-owner-agreement-modal'
import { updateOwnerAgreementStatusAction } from './agreement-actions'

interface AgreementsClientProps {
  kpis: {
    totalAgreements: number
    userAgreementsCount: number
    ownerAgreementsCount: number
    activeAgreementsCount: number
    expiringSoonCount: number
  }
  userAgreements: any[]
  ownerAgreements: any[]
  owners: any[]
  vehicles: any[]
}

export function AgreementsClient({
  kpis,
  userAgreements,
  ownerAgreements,
  owners,
  vehicles,
}: AgreementsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'user' | 'owner'>('user')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewOwnerModal, setShowNewOwnerModal] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await updateOwnerAgreementStatusAction(id, status)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Status update failed')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter User Agreements
  const filteredUserAgreements = userAgreements.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.agreement_number?.toLowerCase().includes(q) ||
      item.booking?.booking_number?.toLowerCase().includes(q) ||
      item.customer?.full_name?.toLowerCase().includes(q) ||
      item.customer?.mobile?.toLowerCase().includes(q)
    )
  })

  // Filter Owner Agreements
  const filteredOwnerAgreements = ownerAgreements.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const ownerName = item.owner?.full_name || ''
    const ownerCode = item.owner?.owner_number || ''
    return (
      item.agreement_number?.toLowerCase().includes(q) ||
      ownerName.toLowerCase().includes(q) ||
      ownerCode.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Modal for creating Owner Agreement */}
      <NewOwnerAgreementModal
        owners={owners}
        vehicles={vehicles}
        isOpen={showNewOwnerModal}
        onClose={() => setShowNewOwnerModal(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-amber-500" /> Agreements Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized repository for User Agreements and Owner Agreements.
          </p>
        </div>

        <button
          onClick={() => setShowNewOwnerModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={15} /> New Owner Agreement
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">TOTAL AGREEMENTS</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{kpis.totalAgreements}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">USER AGREEMENTS</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.userAgreementsCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">OWNER AGREEMENTS</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.ownerAgreementsCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">ACTIVE</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.activeAgreementsCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">EXPIRING SOON</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.expiringSoonCount}</span>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Exact Official Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            User Agreement ({kpis.userAgreementsCount})
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Owner Agreement ({kpis.ownerAgreementsCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agreement no, customer, owner, booking ref..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* TAB 1: USER AGREEMENT */}
      {activeTab === 'user' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {filteredUserAgreements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Agreement No</th>
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">User / Customer</th>
                    <th className="py-3.5 px-4">Rental Period</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {filteredUserAgreements.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{item.agreement_number}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.booking?.booking_number}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.customer?.full_name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{item.customer?.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {new Date(item.rental_start_at).toLocaleDateString()} to {new Date(item.rental_end_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/agreements/${item.id}/preview`}
                          className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Printer size={13} />
                          <span>PDF</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No User Agreements found</p>
              <p className="text-xs text-slate-400">User Agreements are generated automatically from confirmed bookings.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OWNER AGREEMENT */}
      {activeTab === 'owner' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {filteredOwnerAgreements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Agreement No</th>
                    <th className="py-3.5 px-4">Vehicle Owner</th>
                    <th className="py-3.5 px-4">Covered Vehicles</th>
                    <th className="py-3.5 px-4">Agreement Period</th>
                    <th className="py-3.5 px-4">Settlement Rule</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {filteredOwnerAgreements.map((item) => {
                    const vehicleList = (item.vehicles || []).map((v: any) => v.vehicle?.registration_number || v.vehicle?.vehicle_name).filter(Boolean).join(', ')

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-500">{item.agreement_number}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.owner?.full_name || 'Vehicle Owner'}</div>
                          <div className="text-[11px] text-slate-400">{item.owner?.owner_number}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] max-w-xs truncate">
                          {vehicleList || 'All Partner Vehicles'}
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          {item.agreement_start_date} to {item.agreement_end_date || 'Open-ended'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {item.settlement_rule}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-amber-500/10 text-amber-600 border border-amber-200'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <Link
                            href={`/dashboard/agreements/owner/${item.id}`}
                            className="p-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <FileText size={13} />
                            <span>View</span>
                          </Link>
                          {item.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'active')}
                              disabled={updatingId === item.id}
                              className="px-2 py-1 rounded bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-600"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Owner Agreements recorded yet</p>
              <p className="text-xs text-slate-400">Click "New Owner Agreement" above to register a partner agreement.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
