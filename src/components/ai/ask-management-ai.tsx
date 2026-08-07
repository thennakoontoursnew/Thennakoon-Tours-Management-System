'use client'

import { useState } from 'react'
import { AskManagementAIResult } from '@/lib/ai/ai-types'
import { Search, Sparkles, Send, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react'
import { askManagementAIAction } from '@/app/(dashboard)/dashboard/ai-tools/ai-actions'

interface AskManagementAIProps {
  periodKey: string
}

const SAMPLE_QUESTIONS = [
  'How much revenue did we collect this month?',
  'Which vehicles are currently on trip or in maintenance?',
  'What is our outstanding customer invoice balance?',
  'What is the current lead conversion rate?',
  'Give me an executive management performance overview.',
]

export function AskManagementAI({ periodKey }: AskManagementAIProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AskManagementAIResult | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (queryText?: string) => {
    const textToSubmit = queryText || question
    if (!textToSubmit || !textToSubmit.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await askManagementAIAction(textToSubmit, periodKey)
      if (res.error) {
        setError(res.error)
      } else if (res.result) {
        setResult(res.result)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to query management intelligence')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Input Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-400/10 text-amber-500 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ask Management AI</h3>
            <p className="text-[11px] text-slate-400">Natural-language analytics Q&A built on authoritative ERP metric context.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How much revenue did we collect this month?"
              className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loading ? 'Analyzing...' : <><Send size={15} /> Ask AI</>}
          </button>
        </form>

        {/* Sample Question Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Suggested Management Queries</span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((sq) => (
              <button
                key={sq}
                onClick={() => {
                  setQuestion(sq)
                  handleSearch(sq)
                }}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 transition-all text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Query Result Display */}
      {result && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Intent Classification: <strong className="font-mono text-amber-500 uppercase">{result.intent}</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-200">
              {result.confidence} Confidence
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">"{result.question}"</h4>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {result.answer}
            </p>
          </div>

          {/* Evidence Pills */}
          {result.evidence && result.evidence.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Supporting Metric Evidence</span>
              <div className="flex flex-wrap gap-2">
                {result.evidence.map((ev, idx) => (
                  <span key={idx} className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono text-amber-800 dark:text-amber-300">
                    {ev.metric}: <strong>{typeof ev.value === 'number' ? ev.value.toLocaleString() : ev.value} {ev.unit || ''}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
