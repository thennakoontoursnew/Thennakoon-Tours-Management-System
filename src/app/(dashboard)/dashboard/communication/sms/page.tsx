import { MessageSquare, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'SMS Gateway — Thennakoon Tours',
}

export default function SMSCommunicationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">SMS Gateway & Mobile Alerts</h1>
        <p className="text-slate-500 text-xs mt-1">SMS provider interface shell, template segment calculator, and dispatch logging.</p>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <span className="font-bold block text-amber-900 dark:text-amber-200">SMS Gateway Credentials Not Configured</span>
          A paid SMS gateway service (such as Dialog BizSMS, Mobitel, or Twilio) is required to send live SMS messages. SMS architecture is prepared and ready for API key entry.
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
          SMS Dispatch Interface Shell
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Recipient Mobile Phone</label>
            <input
              type="text"
              placeholder="+94 77 123 4567"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              disabled
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Message Text</label>
            <textarea
              rows={3}
              placeholder="SMS text body..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              disabled
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Character Count: 0 / 160 (1 Segment)</span>
            <button
              disabled
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed"
            >
              Gateway Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
