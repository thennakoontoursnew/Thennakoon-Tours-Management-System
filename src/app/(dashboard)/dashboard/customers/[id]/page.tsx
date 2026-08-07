import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Plus, Phone, MessageSquare, AlertTriangle, ShieldAlert, FileText, Calendar } from 'lucide-react'
import { getCustomer360Profile, normalizePhone } from '@/lib/crm/crm-service'
import { CustomerProfileClientWrapper } from './customer-profile-client-wrapper'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
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

  const canEdit = ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff'].includes(userRole)

  // Fetch full 360 Customer Profile Data
  const profileData = await getCustomer360Profile(supabase, id)
  if (!profileData) {
    notFound()
  }

  const { customer, stats } = profileData
  const phoneNorm = normalizePhone(customer.whatsapp || customer.mobile)
  const waUrl = phoneNorm.e164 ? `https://wa.me/${phoneNorm.e164.replace('+', '')}` : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {customer.customer_code}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  customer.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : customer.status === 'blacklisted'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                {customer.status}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  customer.risk_flag === 'restricted'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : customer.risk_flag === 'watch'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                Risk: {customer.risk_flag || 'normal'}
              </span>
              {stats.isRepeatCustomer && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  Repeat Customer ({stats.completedRentals} Rentals)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{customer.full_name}</h1>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>
          )}

          <Link
            href={`/dashboard/quotations/new?customer_id=${customer.id}`}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>New Quotation</span>
          </Link>

          {canEdit && (
            <Link
              href={`/dashboard/customers/${customer.id}/edit`}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Edit size={14} />
              <span>Edit Customer</span>
            </Link>
          )}
        </div>
      </div>

      {/* Restricted Risk Warning Banner */}
      {customer.risk_flag === 'restricted' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 shadow-xs">
          <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold block text-rose-900 dark:text-rose-200">Restricted Customer Risk Flag</span>
            This customer is flagged as RESTRICTED. Reason: {customer.risk_reason || 'Manual staff restriction'}. Manager/Owner authorization required for new bookings.
          </div>
        </div>
      )}

      {/* 360 Profile Client Wrapper */}
      <CustomerProfileClientWrapper customer={customer} profileData={profileData} userRole={userRole} />
    </div>
  )
}
