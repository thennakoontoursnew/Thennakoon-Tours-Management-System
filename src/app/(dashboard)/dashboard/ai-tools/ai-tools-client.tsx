'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileText,
  HelpCircle,
  History,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { AIExecutiveBrief } from '@/components/ai/ai-executive-brief'
import { AIInsightsCenter } from '@/components/ai/ai-insights-center'
import { ForecastDashboard } from '@/components/ai/forecast-dashboard'
import { AskManagementAI } from '@/components/ai/ask-management-ai'
import { GeneratedReportHistory } from '@/components/ai/generated-report-history'
import { generateAIExecutiveBriefAction, generateAIForecastsAction } from './ai-actions'

interface AIToolsClientProps {
  initialBrief: any
  initialContext: any
  initialForecasts: any
  initialInsights: any[]
  initialReportHistory: any[]
  providerConfig: any
}

export function AIToolsClient({
  initialBrief,
  initialContext,
  initialForecasts,
  initialInsights,
  initialReportHistory,
  providerConfig,
}: AIToolsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'brief' | 'insights' | 'forecast' | 'ask' | 'history'>('brief')
  const [periodKey, setPeriodKey] = useState<string>('this_month')
  const [generating, setGenerating] = useState(false)

  const handleRegenerate = async () => {
    setGenerating(true)
    try {
      await generateAIExecutiveBriefAction(periodKey)
      await generateAIForecastsAction()
      router.refresh()
    } finally {
      setGenerating(false)
    }
  }

  const reportsGenerated = initialReportHistory.length
  const insightsGenerated = initialInsights.length
  const criticalInsights = initialInsights.filter((i) => i.priority === 'critical').length
  const forecastsGenerated = initialForecasts?.revenue30d ? 3 : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-amber-500" size={24} /> AI Management Intelligence Center
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Authoritative executive briefs, deterministic period comparisons, revenue forecasting, and allowlisted Q&A.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Analyzing...' : 'Generate AI Brief'}
          </button>
        </div>
      </div>

      {/* Provider Unconfigured Notice (Does NOT crash) */}
      {!providerConfig.isConfigured && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <span>
              <strong>AI Provider Not Configured: </strong>
              Operating in <strong>Authoritative Deterministic Mode</strong>. Domain services continue working normally.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded font-bold">
            NO_AI_KEY
          </span>
        </div>
      )}

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Reports Generated</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{reportsGenerated}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Total Insights</span>
          <span className="font-mono font-black text-amber-500 text-xl">{insightsGenerated}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Critical Alerts</span>
          <span className="font-mono font-black text-rose-500 text-xl">{criticalInsights}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Forecasts Active</span>
          <span className="font-mono font-black text-blue-500 text-xl">{forecastsGenerated}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Provider</span>
          <span className="font-mono font-bold text-emerald-600 text-sm truncate block uppercase">{providerConfig.provider}</span>
        </div>
      </div>

      {/* Date Filter & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'brief', label: 'Executive Brief', icon: Sparkles },
            { id: 'insights', label: 'Insights Center', icon: AlertCircle },
            { id: 'forecast', label: 'Revenue Forecast', icon: TrendingUp },
            { id: 'ask', label: 'Ask Management AI', icon: HelpCircle },
            { id: 'history', label: 'Report History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={periodKey}
            onChange={(e) => {
              setPeriodKey(e.target.value)
              generateAIExecutiveBriefAction(e.target.value)
            }}
            className="bg-transparent text-slate-900 dark:text-white text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'brief' && (
        <AIExecutiveBrief
          brief={initialBrief}
          context={initialContext}
          providerName={providerConfig.provider}
        />
      )}

      {activeTab === 'insights' && (
        <AIInsightsCenter insights={initialInsights} />
      )}

      {activeTab === 'forecast' && (
        <ForecastDashboard forecasts={initialForecasts} />
      )}

      {activeTab === 'ask' && (
        <AskManagementAI periodKey={periodKey} />
      )}

      {activeTab === 'history' && (
        <GeneratedReportHistory reports={initialReportHistory} />
      )}
    </div>
  )
}
