import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Car,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Clock,
  Upload,
} from 'lucide-react'
import VehicleImageGallery from './vehicle-image-gallery'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canEdit = ['owner', 'manager', 'operations_staff'].includes(profile?.role || '')

  // Fetch vehicle with category & images
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_categories(name), vehicle_images(*)')
    .eq('id', id)
    .single()

  if (error || !vehicle) {
    notFound()
  }

  const checkExpiryWarning = (dateStr?: string | null) => {
    if (!dateStr) return { status: 'none', text: 'Not specified' }
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    if (diff < 0) return { status: 'expired', text: `Expired (${dateStr})` }
    if (diff <= 30) return { status: 'warning', text: `Due in ${Math.ceil(diff)} days (${dateStr})` }
    return { status: 'valid', text: `Valid until ${dateStr}` }
  }

  const insStatus = checkExpiryWarning(vehicle.insurance_expiry)
  const revStatus = checkExpiryWarning(vehicle.revenue_license_expiry)
  const emiStatus = checkExpiryWarning(vehicle.emission_test_expiry)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {vehicle.vehicle_code}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {vehicle.registration_number}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                vehicle.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                vehicle.status === 'maintenance' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {vehicle.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{vehicle.vehicle_name}</h1>
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/dashboard/vehicles/${vehicle.id}/edit`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Edit size={15} />
            <span>Edit Vehicle</span>
          </Link>
        )}
      </div>

      {/* Expiry Alert Warning Banner if any document is near expiry */}
      {(insStatus.status === 'expired' || insStatus.status === 'warning' || revStatus.status === 'expired' || revStatus.status === 'warning') && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block text-rose-900 dark:text-rose-200">Legal Compliance Expiry Warning</span>
            One or more compliance documents require immediate renewal. Insurance: {insStatus.text} &bull; Revenue License: {revStatus.text}
          </div>
        </div>
      )}

      {/* Image Vault & Gallery */}
      <VehicleImageGallery vehicleId={vehicle.id} images={vehicle.vehicle_images || []} canEdit={canEdit} />

      {/* Details Specs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Vehicle Identity & Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.vehicle_categories?.name || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand / Model</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.brand} {vehicle.model}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Year</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle.manufacture_year || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transmission</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{vehicle.transmission}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fuel Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{vehicle.fuel_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Mileage</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{Number(vehicle.current_mileage).toLocaleString()} KM</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Rental Pricing & Rates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Daily Rate</span>
                <span className="font-black text-amber-500 text-sm">LKR {Number(vehicle.daily_rate).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Refundable Deposit</span>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm">LKR {Number(vehicle.refundable_deposit).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Allowed KM / Day</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{vehicle.allowed_km_per_day || 100} KM</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Extra KM Charge</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">LKR {vehicle.extra_km_charge || 100}</span>
              </div>
            </div>
          </div>

          {/* Future Ready Placeholder Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Fleet Operational Records
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {['Availability Calendar', 'Bookings', 'Maintenance', 'Expenses', 'Documents'].map((tab, idx) => (
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
                This section will be activated in a future phase for date-based fleet availability, bookings ledger, and maintenance logs.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Compliance Dates */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
              Legal Compliance Dates
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Insurance Expiry</span>
                <span className={`font-bold block ${insStatus.status === 'expired' || insStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {insStatus.text}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Revenue License Expiry</span>
                <span className={`font-bold block ${revStatus.status === 'expired' || revStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {revStatus.text}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Emission Test Expiry</span>
                <span className={`font-bold block ${emiStatus.status === 'expired' || emiStatus.status === 'warning' ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {emiStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
