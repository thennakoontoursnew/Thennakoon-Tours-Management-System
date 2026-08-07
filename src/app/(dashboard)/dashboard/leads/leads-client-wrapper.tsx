'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Phone, MessageSquare, ChevronRight, UserPlus, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { NewLeadModal } from '@/components/crm/new-lead-modal'
import { normalizePhone } from '@/lib/crm/crm-service'
import { createLeadAction, updateLeadStatusAction, convertLeadToCustomerAction } from './lead-actions'

interface LeadsClientWrapperProps {
  leads: any[]
}

export function LeadsClientWrapper({ leads }: LeadsClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (newStatus === 'lost') {
      const reason = prompt('Please enter the reason for marking this lead as LOST (e.g. Price, Vehicle Unavailable, Competitor):', 'Price')
      if (!reason) return
      await updateLeadStatusAction(leadId, 'lost', reason)
    } else {
      await updateLeadStatusAction(leadId, newStatus)
    }
    router.refresh()
  }

  const handleConvert = async (leadId: string) => {
    try {
      const res = await convertLeadToCustomerAction(leadId)
      if (res.customer_id) {
        router.push(`/dashboard/customers/${res.customer_id}`)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>New Lead Enquiry</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {leads && leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Lead Number</th>
                  <th className="py-3 px-4">Prospect Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Interested Vehicle</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {leads.map((l) => {
                  const phoneNorm = normalizePhone(l.whatsapp || l.mobile)
                  const waUrl = phoneNorm.e164 ? `https://wa.me/${phoneNorm.e164.replace('+', '')}` : null

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{l.lead_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {l.prospect_name}
                        {l.customer_id && (
                          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                            Linked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-0.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{l.mobile}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-500 hover:text-emerald-600 p-0.5"
                              title="Open WhatsApp Chat"
                            >
                              <MessageSquare size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium">{l.source.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{l.interested_vehicle_name || 'General Inquiry'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                          l.priority === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {l.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l.id, e.target.value)}
                          className={`py-1 px-2.5 rounded-lg text-xs font-bold border uppercase ${
                            l.status === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            l.status === 'lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            l.status === 'quotation_sent' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="quotation_sent">Quotation Sent</option>
                          <option value="negotiating">Negotiating</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {!l.customer_id && (
                          <button
                            onClick={() => handleConvert(l.id)}
                            className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold hover:bg-purple-500/20 cursor-pointer"
                            title="Convert Prospect into Customer record"
                          >
                            Convert to Customer
                          </button>
                        )}
                        <Link
                          href={`/dashboard/quotations/new?lead_id=${l.id}&customer_id=${l.customer_id || ''}`}
                          className="px-2.5 py-1 bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 rounded-lg text-xs font-bold hover:bg-amber-400/20"
                        >
                          Create Quotation
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
            <MessageSquare size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Leads Recorded</p>
            <p className="text-xs text-slate-400">Capture new enquiries to populate your sales CRM pipeline.</p>
          </div>
        )}
      </div>

      <NewLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (leadData) => {
          await createLeadAction(leadData)
          router.refresh()
        }}
      />
    </>
  )
}
