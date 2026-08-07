import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, AlertTriangle, UserSquare2, Phone, Calendar } from 'lucide-react'
import { getDriver360Profile } from '@/lib/drivers/driver-service'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'
import { DriverProfileClientWrapper } from './driver-profile-client-wrapper'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DriverDetailPage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID parameter format strictly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = 'viewer'
  if (user?.id) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (prof?.role) userRole = prof.role
  }

  const canEdit = ['owner', 'manager', 'operations_staff'].includes(userRole)

  // Fetch 360 Driver Profile Data
  const profileData = await getDriver360Profile(supabase, id)
  if (!profileData) {
    notFound()
  }

  const { driver } = profileData

  const licHealth = calculateDocumentHealth(driver.license_expiry)
  const polHealth = calculateDocumentHealth(driver.police_clearance_expiry)
  const medHealth = calculateDocumentHealth(driver.medical_expiry)

  const hasComplianceAlert =
    licHealth.status === 'expired' ||
    licHealth.status === 'expiring_soon' ||
    polHealth.status === 'expired' ||
    polHealth.status === 'expiring_soon' ||
    medHealth.status === 'expired' ||
    medHealth.status === 'expiring_soon'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {driver.driver_code}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  driver.status === 'available'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : driver.status === 'assigned'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    : driver.status === 'on_trip'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : driver.status === 'on_leave'
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                {driver.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{driver.full_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <Link
              href={`/dashboard/drivers/${driver.id}/edit`}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Edit size={15} />
              <span>Edit Driver</span>
            </Link>
          )}
        </div>
      </div>

      {/* Compliance Expiry Warning Banner */}
      {hasComplianceAlert && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 shadow-xs">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block text-rose-900 dark:text-rose-200">Legal Document Compliance Warning</span>
            License: {licHealth.label} &bull; Police Clearance: {polHealth.label} &bull; Medical Clearance: {medHealth.label}
          </div>
        </div>
      )}

      {/* Driver Profile Client Wrapper */}
      <DriverProfileClientWrapper driver={driver} profileData={profileData} userRole={userRole} />
    </div>
  )
}
