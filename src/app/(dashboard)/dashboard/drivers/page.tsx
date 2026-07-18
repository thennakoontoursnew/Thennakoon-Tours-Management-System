import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, Archive, UserSquare2, Phone, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function DriversPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const statusFilter = params.status || 'all'
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

  // Build query
  let query = supabase
    .from('drivers')
    .select('*, driver_documents(id)', { count: 'exact' })
    .eq('is_archived', false)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,driver_code.ilike.%${search}%,mobile.ilike.%${search}%,nic.ilike.%${search}%,license_number.ilike.%${search}%`)
  }

  if (statusFilter !== 'all') query = query.eq('status', statusFilter)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: drivers, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / pageSize)

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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Driver Management</h1>
          <p className="text-slate-500 text-xs mt-1">Manage tour drivers, driving licenses, medical clearances, and document vaults.</p>
        </div>
        <div className="flex items-center gap-3">
          {canArchive && (
            <Link
              href="/dashboard/drivers/archived"
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Archive size={15} />
              <span>Archived</span>
            </Link>
          )}
          {canCreate && (
            <Link
              href="/dashboard/drivers/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              <span>New Driver</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 md:col-span-3">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search driver code, name, mobile, NIC, license..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="status"
            defaultValue={statusFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="submit"
            className="py-2 px-4 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Filter size={14} />
            <span>Apply Filters</span>
          </button>
        </form>
      </div>

      {/* Driver List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {drivers && drivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">License Number</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {drivers.map((d) => {
                  const licWarn = checkExpiryWarning(d.license_expiry)
                  const polWarn = checkExpiryWarning(d.police_clearance_expiry)

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{d.driver_code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{d.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIC: {d.nic}</div>
                      </td>
                      <td className="py-3 px-4 flex items-center gap-1"><Phone size={12} className="text-slate-400" />{d.mobile}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{d.license_number}</td>
                      <td className="py-3 px-4">
                        {licWarn || polWarn ? (
                          <div className="flex items-center gap-1 text-rose-500 font-bold text-[10px]">
                            <AlertTriangle size={12} />
                            <span>{licWarn ? `Lic ${licWarn.text}` : `Police ${polWarn?.text}`}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                            <CheckCircle size={11} /> Verified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          d.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          d.status === 'assigned' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          d.status === 'on_leave' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/drivers/${d.id}`}
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
            <UserSquare2 size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Drivers Found</p>
            <p className="text-xs text-slate-400">Add a new driver record to register tour drivers.</p>
          </div>
        )}
      </div>
    </div>
  )
}
