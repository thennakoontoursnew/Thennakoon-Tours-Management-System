import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, Archive, Car, ChevronRight, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    transmission?: string
    fuel?: string
    page?: string
  }>
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const categoryFilter = params.category || 'all'
  const statusFilter = params.status || 'all'
  const transmissionFilter = params.transmission || 'all'
  const fuelFilter = params.fuel || 'all'
  const page = parseInt(params.page || '1', 10)
  const pageSize = 10

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canCreate = ['owner', 'manager', 'operations_staff'].includes(profile?.role || '')
  const canArchive = ['owner', 'manager'].includes(profile?.role || '')

  // Fetch Categories for filter dropdown
  const { data: categories } = await supabase.from('vehicle_categories').select('id, name').order('name')

  // Build query
  let query = supabase
    .from('vehicles')
    .select('*, vehicle_categories(name), vehicle_images(public_url, is_primary)', { count: 'exact' })
    .eq('is_archived', false)

  if (search) {
    query = query.or(`vehicle_name.ilike.%${search}%,vehicle_code.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,registration_number.ilike.%${search}%`)
  }

  if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (transmissionFilter !== 'all') query = query.eq('transmission', transmissionFilter)
  if (fuelFilter !== 'all') query = query.eq('fuel_type', fuelFilter)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: vehicles, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / pageSize)

  // Helper for expiry warning check (due within 30 days or expired)
  const checkExpiryWarning = (dateStr?: string | null) => {
    if (!dateStr) return null
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    if (diff < 0) return { status: 'expired', text: 'Expired' }
    if (diff <= 30) return { status: 'warning', text: `Due in ${Math.ceil(diff)}d` }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vehicle Fleet Management</h1>
          <p className="text-slate-500 text-xs mt-1">Manage vehicles, categories, legal compliance dates, and operational status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vehicles/categories"
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Categories
          </Link>
          {canArchive && (
            <Link
              href="/dashboard/vehicles/archived"
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Archive size={15} />
              <span>Archived</span>
            </Link>
          )}
          {canCreate && (
            <Link
              href="/dashboard/vehicles/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              <span>New Vehicle</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search code, name, reg no..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="category"
            defaultValue={categoryFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={statusFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="on_trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            name="transmission"
            defaultValue={transmissionFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">Transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>

          <button
            type="submit"
            className="py-2 px-4 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Vehicle Grid / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {vehicles && vehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4">Compliance Warnings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {vehicles.map((v) => {
                  const primaryImg = v.vehicle_images?.find((img: any) => img.is_primary)?.public_url || v.vehicle_images?.[0]?.public_url
                  const insWarn = checkExpiryWarning(v.insurance_expiry)
                  const revWarn = checkExpiryWarning(v.revenue_license_expiry)

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
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
                            <div className="font-bold text-slate-900 dark:text-white">{v.vehicle_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{v.vehicle_code} &bull; {v.brand} {v.model} ({v.manufacture_year || 'N/A'})</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{v.registration_number}</td>
                      <td className="py-3 px-4">{v.vehicle_categories?.name || 'Uncategorized'}</td>
                      <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">LKR {Number(v.daily_rate).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {insWarn || revWarn ? (
                          <div className="flex items-center gap-1 text-rose-500 font-bold text-[10px]">
                            <AlertTriangle size={12} />
                            <span>{insWarn ? `Insurance ${insWarn.text}` : `Rev Lic ${revWarn?.text}`}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                            <CheckCircle size={11} /> Valid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          v.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          v.status === 'maintenance' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          v.status === 'on_trip' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/vehicles/${v.id}`}
                          className="p-1.5 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-amber-500 text-xs font-semibold"
                        >
                          <span>View</span>
                          <ChevronRight size={14} />
                        </Link>
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
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Vehicles Found</p>
            <p className="text-xs text-slate-400">Add a new vehicle to populate your fleet catalog.</p>
          </div>
        )}
      </div>
    </div>
  )
}
