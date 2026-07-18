import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, Archive, UserCheck, Phone, Mail, Building, Tag, ChevronRight } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    type?: string
    status?: string
    source?: string
    page?: string
  }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const typeFilter = params.type || 'all'
  const statusFilter = params.status || 'all'
  const sourceFilter = params.source || 'all'
  const page = parseInt(params.page || '1', 10)
  const pageSize = 10

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canCreate = ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff'].includes(profile?.role || '')
  const canArchive = ['owner', 'manager'].includes(profile?.role || '')

  // Build query
  let query = supabase
    .from('customers')
    .select('*, customer_tag_assignments(tag_id, customer_tags(name))', { count: 'exact' })
    .eq('is_archived', false)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,customer_code.ilike.%${search}%,company_name.ilike.%${search}%,mobile.ilike.%${search}%,nic.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (typeFilter !== 'all') query = query.eq('customer_type', typeFilter)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (sourceFilter !== 'all') query = query.eq('source', sourceFilter)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: customers, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Management</h1>
          <p className="text-slate-500 text-xs mt-1">Manage individual and corporate client profiles, tags, and contact records.</p>
        </div>
        <div className="flex items-center gap-3">
          {canArchive && (
            <Link
              href="/dashboard/customers/archived"
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Archive size={15} />
              <span>Archived</span>
            </Link>
          )}
          {canCreate && (
            <Link
              href="/dashboard/customers/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              <span>New Customer</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search code, name, mobile, NIC..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="type"
            defaultValue={typeFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>

          <select
            name="status"
            defaultValue={statusFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blacklisted">Blacklisted</option>
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

      {/* Customer List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{c.customer_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.full_name}</div>
                      {c.company_name && <div className="text-[10px] text-slate-400 flex items-center gap-1"><Building size={10} />{c.company_name}</div>}
                    </td>
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{c.mobile}</div>
                      {c.email && <div className="flex items-center gap-1 text-slate-400 text-[10px]"><Mail size={10} />{c.email}</div>}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium">{c.customer_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        c.status === 'blacklisted' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="p-1.5 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-amber-500 text-xs font-semibold"
                      >
                        <span>View</span>
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <UserCheck size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Customers Found</p>
            <p className="text-xs text-slate-400">Try adjusting your filter parameters or create a new customer record.</p>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Showing page {page} of {totalPages} ({count} total records)</span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/customers?page=${page - 1}&search=${search}&type=${typeFilter}&status=${statusFilter}`}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/customers?page=${page + 1}&search=${search}&type=${typeFilter}&status=${statusFilter}`}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
