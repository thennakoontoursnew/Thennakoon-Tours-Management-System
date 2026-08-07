import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Filter, Search, Plus, MessageSquare } from 'lucide-react'
import { getLeadPipelineKPIs } from '@/lib/crm/crm-service'
import { LeadsClientWrapper } from './leads-client-wrapper'

export const metadata = {
  title: 'Leads & Enquiries Pipeline — Thennakoon Tours',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    source?: string
    status?: string
    priority?: string
  }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const sourceFilter = params.source || 'all'
  const statusFilter = params.status || 'all'
  const priorityFilter = params.priority || 'all'

  const supabase = await createClient()

  // Fetch Lead Pipeline KPIs
  const kpis = await getLeadPipelineKPIs(supabase)

  // Build query
  let query = supabase.from('crm_leads').select('*').order('created_at', { ascending: false })

  if (search) {
    query = query.or(`prospect_name.ilike.%${search}%,mobile.ilike.%${search}%,lead_number.ilike.%${search}%`)
  }

  if (sourceFilter !== 'all') query = query.eq('source', sourceFilter)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter)

  const { data: leads } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Leads & Enquiries Pipeline</h1>
          <p className="text-slate-500 text-xs mt-1">CRM enquiry intake, lead qualification, quotation generation, and conversion analytics.</p>
        </div>
      </div>

      {/* Lead KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Pipeline</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{kpis.totalLeads}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">New Enquiries</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.newLeads}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Quotations Sent</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.quotationsSent}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Won Deals</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.wonLeads}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Lost Enquiries</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.lostLeads}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Conversion Rate</span>
          <span className="font-mono font-black text-purple-500 text-xl">{kpis.conversionRate}%</span>
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
              placeholder="Search lead number, prospect name, phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="source"
            defaultValue={sourceFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone_call">Phone Call</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="website">Website</option>
            <option value="google">Google</option>
            <option value="walk_in">Walk-in</option>
            <option value="referral">Referral</option>
          </select>

          <select
            name="status"
            defaultValue={statusFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="quotation_sent">Quotation Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <button
            type="submit"
            className="py-2 px-4 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Leads Table Client Wrapper */}
      <LeadsClientWrapper leads={leads || []} />
    </div>
  )
}
