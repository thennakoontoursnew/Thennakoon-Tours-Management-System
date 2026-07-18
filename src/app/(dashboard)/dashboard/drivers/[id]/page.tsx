import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react'
import DriverDocumentVault from './driver-document-vault'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DriverDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canEdit = ['owner', 'manager', 'operations_staff'].includes(profile?.role || '')

  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*, driver_documents(*)')
    .eq('id', id)
    .single()

  if (error || !driver) {
    notFound()
  }

  const checkExpiryWarning = (dateStr?: string | null) => {
    if (!dateStr) return { status: 'none', text: 'Not specified' }
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    if (diff < 0) return { status: 'expired', text: `Expired (${dateStr})` }
    if (diff <= 30) return { status: 'warning', text: `Due in ${Math.ceil(diff)} days (${dateStr})` }
    return { status: 'valid', text: `Valid until ${dateStr}` }
  }

  const licStatus = checkExpiryWarning(driver.license_expiry)
  const polStatus = checkExpiryWarning(driver.police_clearance_expiry)
  const medStatus = checkExpiryWarning(driver.medical_expiry)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/drivers"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {driver.driver_code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                driver.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                driver.status === 'assigned' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {driver.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{driver.full_name}</h1>
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/dashboard/drivers/${driver.id}/edit`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Edit size={15} />
            <span>Edit Driver</span>
          </Link>
        )}
      </div>

      {/* Compliance Expiry Alert Banner */}
      {(licStatus.status === 'expired' || licStatus.status === 'warning' || polStatus.status === 'expired' || polStatus.status === 'warning') && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block text-rose-900 dark:text-rose-200">Driver License / Clearance Expiry Warning</span>
            Driving License: {licStatus.text} &bull; Police Clearance: {polStatus.text}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Driver Profile Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Driver Personal & License Profile
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIC Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.nic}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Phone size={12} className="text-amber-500" />
                  {driver.mobile}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">License Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.license_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date Joined</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{driver.date_joined || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Contact</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{driver.emergency_contact_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Phone</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{driver.emergency_contact_phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Private Document Vault */}
          <DriverDocumentVault driverId={driver.id} documents={driver.driver_documents || []} canEdit={canEdit} />

          {/* Future Ready Placeholder Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Driver Performance & History
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {['Assigned Trips', 'Performance', 'Payments', 'Incidents'].map((tab, idx) => (
                <button
                  key={idx}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="py-8 text-center space-y-2 bg-slate-50 dark:bg-slate-850 rounded-xl p-4">
              <Clock size={24} className="mx-auto text-amber-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 3 Module Integration</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                This section will be activated in a future phase for trip assignments, driver ratings, and wage payment history.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Legal Expiries */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
              Compliance Expiry Dates
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Driving License Expiry</span>
                <span className={`font-bold block ${licStatus.status === 'expired' || licStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {licStatus.text}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Police Clearance Expiry</span>
                <span className={`font-bold block ${polStatus.status === 'expired' || polStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {polStatus.text}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Medical Clearance Expiry</span>
                <span className={`font-bold block ${medStatus.status === 'expired' || medStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {medStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
