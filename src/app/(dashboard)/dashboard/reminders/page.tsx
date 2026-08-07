import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell, Search, Filter } from 'lucide-react'
import { getReminderCenterSummary, syncSystemReminders } from '@/lib/reminders/reminder-service'
import { RemindersClientWrapper } from './reminders-client-wrapper'

export const metadata = {
  title: 'Reminder Center — Thennakoon Tours Management System',
}

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string }>
}

export default async function RemindersPage({ searchParams }: PageProps) {
  const { status, type } = await searchParams
  const supabase = await createClient()

  // Trigger system reminder synchronization safely
  await syncSystemReminders(supabase)

  // Fetch KPI Summary
  const kpis = await getReminderCenterSummary(supabase)

  // Fetch Reminders list
  let query = supabase.from('reminders').select('*').order('due_at', { ascending: true })

  if (status && status !== 'all') query = query.eq('status', status)
  if (type && type !== 'all') query = query.eq('reminder_type', type)

  const { data: reminders } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reminder Center</h1>
          <p className="text-slate-500 text-xs mt-1">Operational task reminders, invoice due alerts, lead follow-ups, and compliance expiry management.</p>
        </div>
      </div>

      {/* Reminder KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Due Today</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.dueToday}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Overdue</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.overdue}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Upcoming</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.upcoming}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Completed</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.completed}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Dismissed</span>
          <span className="font-mono font-black text-slate-400 text-xl">{kpis.dismissed}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-600 block">Critical Alerts</span>
          <span className="font-mono font-black text-rose-600 text-xl">{kpis.critical}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            name="status"
            defaultValue={status || 'all'}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="due">Due Today</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            name="type"
            defaultValue={type || 'all'}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Reminder Types</option>
            <option value="invoice_overdue">Invoice Overdue</option>
            <option value="lead_followup">Lead Follow-up</option>
            <option value="general">General Task</option>
            <option value="payment_followup">Payment Follow-up</option>
          </select>
        </form>
      </div>

      {/* Reminders Table Client Wrapper */}
      <RemindersClientWrapper reminders={reminders || []} />
    </div>
  )
}
