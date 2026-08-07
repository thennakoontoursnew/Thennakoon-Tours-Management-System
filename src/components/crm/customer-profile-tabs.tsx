'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  FileText,
  Calendar,
  DollarSign,
  FileCheck,
  MessageSquare,
  ShieldAlert,
  Plus,
  Lock,
  ChevronRight,
  Phone,
  Mail,
  Building,
  Tag,
  Clock,
} from 'lucide-react'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'

interface CustomerProfileTabsProps {
  customer: any
  quotations: any[]
  bookings: any[]
  agreements: any[]
  invoices: any[]
  payments: any[]
  documents: any[]
  notes: any[]
  leads: any[]
  financials: {
    totalInvoiced: number
    collectedLifetimeValue: number
    outstandingBalance: number
    overdueBalance: number
  }
  stats: {
    completedRentals: number
    totalBookings: number
    isRepeatCustomer: boolean
  }
  userRole: string
  onOpenNoteModal: () => void
  onOpenDocumentModal: () => void
}

export function CustomerProfileTabs({
  customer,
  quotations,
  bookings,
  agreements,
  invoices,
  payments,
  documents,
  notes,
  leads,
  financials,
  stats,
  userRole,
  onOpenNoteModal,
  onOpenDocumentModal,
}: CustomerProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'quotations' | 'bookings' | 'agreements' | 'invoices' | 'documents' | 'notes' | 'leads'
  >('overview')

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview & 360 View', icon: User },
    { id: 'quotations', label: `Quotations (${quotations.length})`, icon: FileText },
    { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Calendar },
    { id: 'agreements', label: `Agreements (${agreements.length})`, icon: FileCheck },
    { id: 'invoices', label: `Invoices & Payments (${invoices.length})`, icon: DollarSign },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileCheck },
    { id: 'notes', label: `Internal Notes (${notes.length})`, icon: MessageSquare },
    { id: 'leads', label: `Leads & Enquiries (${leads.length})`, icon: Clock },
  ]

  const isFinanceAuthorized = ['owner', 'admin', 'manager', 'finance_staff'].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Identity & Personal Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                Customer Identity & Contact Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{customer.customer_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Company Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.company_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIC / Passport</span>
                  <span className="font-mono font-bold text-amber-500">{customer.nic || customer.passport_number || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer.whatsapp || customer.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{customer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nationality</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.nationality || 'Sri Lankan'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer Since</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {customer.address_line_1 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Billing Address</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {customer.address_line_1} {customer.address_line_2} {customer.city} {customer.country}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Lifetime Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                Financial Lifetime Value (CLV)
              </h3>
              {!isFinanceAuthorized ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                  <Lock size={16} />
                  <span>Restricted Access: Financial summary is accessible only to Owner, Admin, Manager, and Finance Staff roles.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Collected CLV</span>
                    <span className="font-mono font-black text-emerald-500 text-base">
                      LKR {financials.collectedLifetimeValue.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Completed Payments</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      LKR {financials.totalInvoiced.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-rose-500 block">Outstanding Bal</span>
                    <span className="font-mono font-bold text-rose-500 text-sm">
                      LKR {financials.outstandingBalance.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-purple-500 block">Completed Rentals</span>
                    <span className="font-mono font-bold text-purple-500 text-sm">{stats.completedRentals} Rentals</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preferences & Staff Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Quick Actions & Contact
              </h3>
              <div className="space-y-2">
                <button
                  onClick={onOpenNoteModal}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Internal Staff Note</span>
                </button>

                <button
                  onClick={onOpenDocumentModal}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-purple-500 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Verification Document</span>
                </button>
              </div>
            </div>

            {/* Recent Staff Notes Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Internal Notes</h3>
                <span className="text-[10px] text-slate-400">{notes.length} total</span>
              </div>
              {notes.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {notes.slice(0, 3).map((n: any) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 uppercase">
                          {n.note_type}
                        </span>
                        <span className="text-[9px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{n.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No staff notes recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Sales Quotation History
          </h3>
          {quotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Quotation No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quotations.map((q: any) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <Link href={`/dashboard/quotations/${q.id}`} className="font-mono font-bold text-amber-500 hover:underline">
                          {q.quotation_number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{q.quotation_date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">LKR {Number(q.grand_total || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No quotations issued for this customer.</div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Customer Booking History
          </h3>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Booking No</th>
                    <th className="py-2.5 px-3">Rental Dates</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <Link href={`/dashboard/bookings/${b.id}`} className="font-mono font-bold text-amber-500 hover:underline">
                          {b.booking_number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(b.rental_start_at).toLocaleDateString()} → {new Date(b.rental_end_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">LKR {Number(b.grand_total || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No bookings recorded for this customer.</div>
          )}
        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500">
              Customer Identity & Compliance Documents
            </h3>
            <button
              onClick={onOpenDocumentModal}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Document</span>
            </button>
          </div>

          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Document Type</th>
                    <th className="py-2.5 px-3">Doc Number</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc: any) => {
                    const health = calculateDocumentHealth(doc.expiry_date)
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="py-2.5 px-3 font-bold capitalize text-slate-900 dark:text-white">
                          {doc.document_type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{doc.document_number || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-mono">{doc.expiry_date || 'N/A'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${health.badgeColor}`}>
                            {health.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No identity documents added yet.</div>
          )}
        </div>
      )}

      {/* TAB 7: INTERNAL NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Internal Staff Notes & Communication Log
            </h3>
            <button
              onClick={onOpenNoteModal}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Note</span>
            </button>
          </div>

          {notes.length > 0 ? (
            <div className="space-y-3 text-xs">
              {notes.map((n: any) => (
                <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase">
                        {n.note_type}
                      </span>
                      {n.is_important && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 uppercase">
                          Important
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{n.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">No internal staff notes recorded yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
