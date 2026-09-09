'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Car,
  Search,
  Filter,
  ChevronRight,
  Phone,
  MessageSquare,
  ShieldCheck,
  ClipboardCheck,
  PlusCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  Building2,
  UserCheck,
} from 'lucide-react'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'
import { NewInspectionModal } from '@/components/maintenance/new-inspection-modal'
import { OnboardingManagementModal } from '@/components/maintenance/onboarding-management-modal'
import {
  createVehicleInspectionAction,
  recordVehicleOnboardingInspectionAction,
  resolveOnboardingManagementDecisionAction,
} from '../maintenance/maintenance-actions'

interface VehiclesClientTableProps {
  vehicles: any[]
  categories: any[]
  searchParams: {
    search?: string
    category?: string
    status?: string
    transmission?: string
    fuel?: string
    tab?: string
  }
}

function formatWhatsAppUrl(phone?: string | null): string | null {
  if (!phone) return null
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  if (cleaned.startsWith('0')) cleaned = '94' + cleaned.slice(1)
  return `https://wa.me/${cleaned}`
}

export function VehiclesClientTable({ vehicles, categories, searchParams }: VehiclesClientTableProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'in_house' | 'on_call'>(
    (searchParams.tab as 'all' | 'in_house' | 'on_call') || 'all'
  )
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.category || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.status || 'all')
  const [transmissionFilter, setTransmissionFilter] = useState(searchParams.transmission || 'all')

  // Modal States
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false)
  const [inspectionVehicleId, setInspectionVehicleId] = useState<string | undefined>(undefined)

  const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false)
  const [selectedVehicleForMgmt, setSelectedVehicleForMgmt] = useState<any>(null)

  // Client-side Tab & Filter Logic
  const filteredVehicles = vehicles.filter((v) => {
    // 1. Tab Filter
    if (activeTab === 'in_house') {
      const isOwnerHeld = v.holding_type === 'owner_held' || v.status === 'available_on_call' || v.status === 'standby_pool'
      if (isOwnerHeld) return false
    } else if (activeTab === 'on_call') {
      const isOwnerHeld = v.holding_type === 'owner_held' || ['available_on_call', 'standby_pool', 'pending_management_approval'].includes(v.status)
      if (!isOwnerHeld) return false
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = (v.vehicle_name || '').toLowerCase().includes(q)
      const matchCode = (v.vehicle_code || '').toLowerCase().includes(q)
      const matchReg = (v.registration_number || '').toLowerCase().includes(q)
      const matchOwner = (v.owner_contact_name || '').toLowerCase().includes(q) || (v.owner?.full_name || '').toLowerCase().includes(q)
      if (!matchName && !matchCode && !matchReg && !matchOwner) return false
    }

    // 3. Category Filter
    if (categoryFilter !== 'all' && v.category_id !== categoryFilter) return false

    // 4. Status Filter
    if (statusFilter !== 'all' && v.status !== statusFilter) return false

    // 5. Transmission Filter
    if (transmissionFilter !== 'all' && v.transmission !== transmissionFilter) return false

    return true
  })

  // Counts for Segment Tabs
  const inHouseCount = vehicles.filter((v) => v.holding_type !== 'owner_held' && v.status !== 'available_on_call' && v.status !== 'standby_pool').length
  const onCallCount = vehicles.filter((v) => v.holding_type === 'owner_held' || ['available_on_call', 'standby_pool', 'pending_management_approval'].includes(v.status)).length

  return (
    <div className="space-y-4">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Car size={15} />
          <span>All Vehicles</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full font-mono bg-slate-950/10 dark:bg-white/10 font-black">
            {vehicles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('in_house')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'in_house'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 size={15} />
          <span>In-House Fleet</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full font-mono bg-white/20 font-black">
            {inHouseCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('on_call')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'on_call'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck size={15} />
          <span>On-Call / Partner Fleet</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full font-mono bg-white/20 font-black">
            {onCallCount}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reg number, vehicle name, owner..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (In-House)</option>
            <option value="available_on_call">Available On-Call</option>
            <option value="pending_inspection">Pending Inspection</option>
            <option value="pending_management_approval">Pending Mgmt Review</option>
            <option value="standby_pool">Standby Pool</option>
            <option value="inspection_failed">Inspection Failed</option>
            <option value="reserved">Reserved</option>
            <option value="on_trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredVehicles && filteredVehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle & Owner</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Rates (Customer / Payout)</th>
                  <th className="py-3 px-4">Document Expiry Alerts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Contextual Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {filteredVehicles.map((v) => {
                  const primaryImg =
                    v.primary_photo_url ||
                    v.vehicle_images?.find((img: any) => img.is_primary)?.public_url ||
                    v.vehicle_images?.[0]?.public_url

                  const insHealth = calculateDocumentHealth(v.insurance_expiry)
                  const revHealth = calculateDocumentHealth(v.revenue_license_expiry)

                  const ownerName = v.owner_contact_name || v.owner?.full_name
                  const ownerPhone = v.owner_contact_phone || v.owner?.mobile
                  const waUrl = formatWhatsAppUrl(ownerPhone)

                  const isPendingInspection = v.status === 'pending_inspection'
                  const isPendingMgmt = v.status === 'pending_management_approval'
                  const isOnCall = v.status === 'available_on_call'
                  const isFailedOrRejected = v.status === 'inspection_failed' || v.status === 'rejected'

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      {/* Vehicle & Owner Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {primaryImg ? (
                              <img src={primaryImg} alt={v.vehicle_name} className="w-full h-full object-cover" />
                            ) : (
                              <Car size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{v.vehicle_name}</span>
                              {v.holding_type === 'owner_held' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                  Owner Held
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {v.vehicle_code} &bull; {v.brand} {v.model} ({v.manufacture_year || 'N/A'})
                            </div>

                            {/* Owner Pill with Direct Phone Call & WhatsApp Icons */}
                            {ownerName && (
                              <div className="text-[10px] text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mt-1 font-medium bg-purple-500/10 px-2 py-0.5 rounded-md w-max border border-purple-500/20">
                                <UserCheck size={11} className="text-purple-500" />
                                <span>Owner: <strong>{ownerName}</strong></span>
                                {ownerPhone && (
                                  <div className="flex items-center gap-1.5 ml-1 border-l border-purple-300 dark:border-purple-700 pl-1.5">
                                    <a
                                      href={`tel:${ownerPhone}`}
                                      title={`Call Owner (${ownerPhone})`}
                                      className="p-0.5 text-blue-600 hover:text-blue-500 transition-colors"
                                    >
                                      <Phone size={12} />
                                    </a>
                                    {waUrl && (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`WhatsApp Owner (${ownerPhone})`}
                                        className="p-0.5 text-emerald-600 hover:text-emerald-500 transition-colors"
                                      >
                                        <MessageSquare size={12} />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reg Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {v.registration_number}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">{v.vehicle_categories?.name || 'Uncategorized'}</td>

                      {/* Rates */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          LKR {Number(v.daily_rate || 0).toLocaleString()} /day
                        </div>
                        {v.agreed_payout_rate ? (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            Payout: LKR {Number(v.agreed_payout_rate).toLocaleString()}
                          </div>
                        ) : null}
                      </td>

                      {/* Document Expiry Warnings */}
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          {insHealth.status === 'missing' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-600 border-amber-500/30">
                              ⚠️ Missing Insurance Expiry
                            </span>
                          ) : insHealth.status === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-rose-500/10 text-rose-600 border-rose-500/30">
                              Expired: {v.insurance_expiry}
                            </span>
                          ) : insHealth.status === 'expiring_soon' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Expiring: {insHealth.daysRemaining}d left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Insurance: Valid ({insHealth.daysRemaining}d)
                            </span>
                          )}
                        </div>

                        <div>
                          {revHealth.status === 'missing' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-600 border-amber-500/30">
                              ⚠️ Missing Revenue License Expiry
                            </span>
                          ) : revHealth.status === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-rose-500/10 text-rose-600 border-rose-500/30">
                              Expired: {v.revenue_license_expiry}
                            </span>
                          ) : revHealth.status === 'expiring_soon' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Expiring: {revHealth.daysRemaining}d left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Rev Lic: Valid ({revHealth.daysRemaining}d)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                            v.status === 'available'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : v.status === 'available_on_call'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : v.status === 'pending_inspection'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : v.status === 'pending_management_approval'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse'
                              : v.status === 'standby_pool'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : v.status === 'inspection_failed'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : v.status === 'maintenance'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : v.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {v.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Contextual Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPendingInspection ? (
                            <button
                              onClick={() => {
                                setInspectionVehicleId(v.id)
                                setIsInspectionModalOpen(true)
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <ClipboardCheck size={14} />
                              <span>Start Inspection</span>
                            </button>
                          ) : isPendingMgmt ? (
                            <button
                              onClick={() => {
                                setSelectedVehicleForMgmt(v)
                                setIsMgmtModalOpen(true)
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs animate-pulse"
                            >
                              <ShieldCheck size={14} />
                              <span>Review & Set Payout</span>
                            </button>
                          ) : isOnCall ? (
                            <Link
                              href={`/dashboard/bookings/new?vehicle_id=${v.id}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Send size={13} />
                              <span>Assign to Trip</span>
                            </Link>
                          ) : isFailedOrRejected ? (
                            <button
                              onClick={() => {
                                setInspectionVehicleId(v.id)
                                setIsInspectionModalOpen(true)
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <RefreshCw size={13} />
                              <span>Re-Inspect</span>
                            </button>
                          ) : null}

                          <Link
                            href={`/dashboard/vehicles/${v.id}`}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                          >
                            <span>Profile</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <Car size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Vehicles Match Criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or tab selection.</p>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      <NewInspectionModal
        isOpen={isInspectionModalOpen}
        vehicles={vehicles}
        categories={categories}
        initialVehicleId={inspectionVehicleId}
        onClose={() => {
          setIsInspectionModalOpen(false)
          setInspectionVehicleId(undefined)
        }}
        onSubmit={async (inspectionData) => {
          if (inspectionData.mode === 'onboarding') {
            await recordVehicleOnboardingInspectionAction(inspectionData)
          } else {
            await createVehicleInspectionAction(inspectionData)
          }
          router.refresh()
        }}
      />

      {/* Onboarding Management Modal */}
      <OnboardingManagementModal
        isOpen={isMgmtModalOpen}
        vehicle={selectedVehicleForMgmt}
        onClose={() => {
          setIsMgmtModalOpen(false)
          setSelectedVehicleForMgmt(null)
        }}
        onSave={async (decisionInput) => {
          await resolveOnboardingManagementDecisionAction(decisionInput)
          router.refresh()
        }}
      />
    </div>
  )
}
