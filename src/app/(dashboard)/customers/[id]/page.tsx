import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Building,
  Calendar,
  CreditCard,
  MapPin,
  Tag as TagIcon,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { CustomerNotesSection } from './customer-notes-section'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canEdit = ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff'].includes(profile?.role || '')

  // Fetch customer with notes and tags
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, customer_notes(*, profiles(full_name)), customer_tag_assignments(*, customer_tags(*))')
    .eq('id', id)
    .single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {customer.customer_code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                customer.status === 'blacklisted' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {customer.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{customer.full_name}</h1>
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Edit size={15} />
            <span>Edit Customer</span>
          </Link>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Information & Future Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Contact Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Client Profile Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{customer.customer_type}</span>
              </div>
              {customer.company_name && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Company Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.company_name}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Phone size={13} className="text-amber-500" />
                  {customer.mobile}
                </span>
              </div>
              {customer.whatsapp && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.whatsapp}</span>
                </div>
              )}
              {customer.email && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail size={13} className="text-amber-500" />
                    {customer.email}
                  </span>
                </div>
              )}
              {customer.nic && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIC Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.nic}</span>
                </div>
              )}
              {customer.passport_number && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Passport Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.passport_number}</span>
                </div>
              )}
              {customer.driving_license_number && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driving License</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.driving_license_number}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Address</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {[customer.address_line_1, customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lead Source</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{customer.source || 'Walk In'}</span>
              </div>
            </div>
          </div>

          {/* Future Ready Placeholder Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Customer Transactional History
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {['Quotations', 'Bookings', 'Invoices', 'Payments', 'Reviews'].map((tab, idx) => (
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
                This section will be activated in a future phase for real-time quotation history, bookings, and billing ledgers.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Notes Timeline & Tags */}
        <div className="space-y-6">
          <CustomerNotesSection customerId={customer.id} initialNotes={customer.customer_notes || []} />
        </div>
      </div>
    </div>
  )
}
