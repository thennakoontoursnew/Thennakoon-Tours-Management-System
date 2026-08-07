import { createClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { WhatsAppClientWrapper } from './whatsapp-client-wrapper'

export const metadata = {
  title: 'WhatsApp Communication — Thennakoon Tours',
}

export default async function WhatsAppCommunicationPage() {
  const supabase = await createClient()

  // Fetch Templates
  const { data: templates } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Fetch Customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, mobile, whatsapp')
    .eq('is_archived', false)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">WhatsApp Communication Center</h1>
        <p className="text-slate-500 text-xs mt-1">Manual WhatsApp chat dispatcher, template selection, and pre-filled message logs.</p>
      </div>

      {/* WhatsApp Client Wrapper */}
      <WhatsAppClientWrapper templates={templates || []} customers={customers || []} />
    </div>
  )
}
