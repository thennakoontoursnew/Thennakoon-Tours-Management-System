import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Car, AlertTriangle, Plus, Calculator, FileText } from 'lucide-react'
import { getVehicleProfileData, calculateDocumentHealth } from '@/lib/fleet/fleet-service'
import { VehicleProfileClientWrapper } from './vehicle-profile-client-wrapper'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: PageProps) {
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

  // Fetch full vehicle profile data via fleet service passing supabase client
  const profileData = await getVehicleProfileData(supabase, id)
  if (!profileData) {
    notFound()
  }

  const { vehicle } = profileData

  const insHealth = calculateDocumentHealth(vehicle.insurance_expiry)
  const revHealth = calculateDocumentHealth(vehicle.revenue_license_expiry)
  const emiHealth = calculateDocumentHealth(vehicle.emission_test_expiry)

  const hasComplianceAlert =
    insHealth.status === 'expired' ||
    insHealth.status === 'expiring_soon' ||
    revHealth.status === 'expired' ||
    revHealth.status === 'expiring_soon' ||
    emiHealth.status === 'expired' ||
    emiHealth.status === 'expiring_soon'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vehicles"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {vehicle.vehicle_code}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {vehicle.registration_number}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  vehicle.status === 'available'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : vehicle.status === 'maintenance'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : vehicle.status === 'on_trip' || vehicle.status === 'rented'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                {vehicle.status.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase border border-slate-200 dark:border-slate-700">
                {vehicle.ownership_type || 'Company'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{vehicle.vehicle_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings/new"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>Create Booking</span>
          </Link>

          {canEdit && (
            <Link
              href={`/dashboard/vehicles/${vehicle.id}/edit`}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Edit size={15} />
              <span>Edit Vehicle</span>
            </Link>
          )}
        </div>
      </div>

      {/* Compliance Expiry Warning Banner */}
      {hasComplianceAlert && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 shadow-xs">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block text-rose-900 dark:text-rose-200">Legal Compliance Expiry Warning</span>
            One or more vehicle compliance documents require renewal. Insurance: {insHealth.label} &bull; Revenue License: {revHealth.label} &bull; Emission Test: {emiHealth.label}
          </div>
        </div>
      )}

      {/* Profile Client Wrapper Component */}
      <VehicleProfileClientWrapper
        vehicle={vehicle}
        profileData={profileData}
        userRole={userRole}
        userId={user?.id}
      />
    </div>
  )
}
