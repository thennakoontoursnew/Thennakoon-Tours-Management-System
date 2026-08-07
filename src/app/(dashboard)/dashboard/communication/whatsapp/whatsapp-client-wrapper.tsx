'use client'

import { useState } from 'react'
import { MessageSquare, Send, Phone, User, Copy, Check } from 'lucide-react'
import { formatWhatsAppPhone } from '@/lib/utils/whatsapp'
import { logCommunicationAction } from '../../reminders/reminder-actions'

interface WhatsAppClientWrapperProps {
  templates: any[]
  customers: any[]
}

export function WhatsAppClientWrapper({ templates, customers }: WhatsAppClientWrapperProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0]?.template_key || 'quotation_followup')
  const [customMessage, setCustomMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const selectedTemplate = templates.find((t) => t.template_key === selectedTemplateKey)

  // Token replacement
  const getRenderedMessage = () => {
    let msg = customMessage || selectedTemplate?.message_body || ''
    if (selectedCustomer) {
      msg = msg.replace(/{{CustomerName}}/g, selectedCustomer.full_name || 'Valued Customer')
      msg = msg.replace(/{{BookingNumber}}/g, 'TT-BK-10001')
      msg = msg.replace(/{{QuotationNumber}}/g, 'TT-QT-10001')
      msg = msg.replace(/{{InvoiceNumber}}/g, 'TT-IN-10001')
      msg = msg.replace(/{{ReceiptNumber}}/g, 'RCT-2026-10001')
      msg = msg.replace(/{{Amount}}/g, '75,000')
      msg = msg.replace(/{{BalanceDue}}/g, '25,000')
      msg = msg.replace(/{{DueDate}}/g, new Date().toISOString().slice(0, 10))
    }
    return msg
  }

  const handleOpenWhatsApp = async () => {
    if (!selectedCustomer) return
    const targetPhone = selectedCustomer.whatsapp || selectedCustomer.mobile
    if (!targetPhone) {
      alert('Selected customer has no valid WhatsApp or Mobile phone number.')
      return
    }

    const rendered = getRenderedMessage()
    const formattedPhone = formatWhatsAppPhone(targetPhone)
    const encoded = encodeURIComponent(rendered)
    const url = `https://wa.me/${formattedPhone}?text=${encoded}`

    // Record Communication Log
    await logCommunicationAction({
      channel: 'whatsapp',
      recipient_type: 'customer',
      recipient_id: selectedCustomer.id,
      recipient_address: formattedPhone,
      template_key: selectedTemplateKey,
      message: rendered,
      status: 'opened',
    })

    window.open(url, '_blank')
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getRenderedMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            WhatsApp Message Dispatcher
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Select Customer / Contact</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.whatsapp || c.mobile || 'No Phone'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Select Message Template</label>
              <select
                value={selectedTemplateKey}
                onChange={(e) => {
                  setSelectedTemplateKey(e.target.value)
                  setCustomMessage('')
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.template_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Message Content (Editable)</label>
            <textarea
              rows={5}
              value={customMessage || selectedTemplate?.message_body || ''}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              <span>Open WhatsApp & Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message Preview Box */}
      <div className="space-y-6">
        <div className="bg-emerald-950/20 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
            <MessageSquare size={16} />
            <span>WhatsApp Live Message Preview</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans shadow-2xs">
            {getRenderedMessage()}
          </div>
          <p className="text-[10px] text-slate-400">
            Clicking <span className="font-bold text-emerald-500">Open WhatsApp</span> will launch WhatsApp Web or WhatsApp Desktop app pre-filled with this message.
          </p>
        </div>
      </div>
    </div>
  )
}
