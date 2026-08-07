'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Calendar, Sparkles } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GeneratedReportHistoryProps {
  reports: any[]
}

export function GeneratedReportHistory({ reports }: GeneratedReportHistoryProps) {
  const [selectedReport, setSelectedReport] = useState<any | null>(null)

  const exportPdf = (rep: any) => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('THENNAKOON TOURS MANAGEMENT SYSTEM', 14, 15)
    doc.setFontSize(12)
    doc.text(`AI ${rep.report_type.toUpperCase()} MANAGEMENT REPORT`, 14, 23)
    doc.setFontSize(10)
    doc.text(`Report Number: ${rep.report_number}`, 14, 30)
    doc.text(`Period: ${rep.period_start} to ${rep.period_end}`, 14, 36)
    doc.text(`Generated At: ${new Date(rep.generated_at).toLocaleString()}`, 14, 42)
    doc.text(`Provider: ${rep.provider}`, 14, 48)

    const output = rep.ai_output || {}

    if (output.businessPerformanceSummary) {
      doc.setFontSize(11)
      doc.text('Executive Summary:', 14, 58)
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(output.businessPerformanceSummary, 180)
      doc.text(lines, 14, 64)
    }

    if (rep.metric_snapshot?.finance) {
      const fin = rep.metric_snapshot.finance
      autoTable(doc, {
        startY: 85,
        head: [['Financial Metric', 'Value']],
        body: [
          ['Collected Revenue', `LKR ${Number(fin.collectedRevenue || 0).toLocaleString()}`],
          ['Invoiced Revenue', `LKR ${Number(fin.invoicedRevenue || 0).toLocaleString()}`],
          ['Outstanding Receivables', `LKR ${Number(fin.outstandingBalance || 0).toLocaleString()}`],
          ['Operating Expenses', `LKR ${Number(fin.expenses || 0).toLocaleString()}`],
          ['Net Cash Flow', `LKR ${Number(fin.netCashFlow || 0).toLocaleString()}`],
        ],
      })
    }

    doc.save(`${rep.report_number}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Modal View for Snapshot */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">{selectedReport.report_number}</h3>
                <p className="text-xs text-slate-400">Type: {selectedReport.report_type} &bull; Period: {selectedReport.period_start} to {selectedReport.period_end}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <strong className="font-bold block text-slate-900 dark:text-white">Business Summary Snapshot:</strong>
                <p>{selectedReport.ai_output?.businessPerformanceSummary || 'No summary text available.'}</p>
              </div>

              {selectedReport.ai_output?.revenuePerformanceSummary && (
                <div>
                  <strong className="font-bold block mb-1">Revenue Performance:</strong>
                  <p>{selectedReport.ai_output.revenuePerformanceSummary}</p>
                </div>
              )}

              {selectedReport.ai_output?.fleetPerformanceSummary && (
                <div>
                  <strong className="font-bold block mb-1">Fleet Performance:</strong>
                  <p>{selectedReport.ai_output.fleetPerformanceSummary}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => exportPdf(selectedReport)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 italic">
            No historical AI reports generated yet. Click "Generate Executive Brief" above to create your first snapshot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Report Number</th>
                  <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Type</th>
                  <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Period</th>
                  <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Provider</th>
                  <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Generated At</th>
                  <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-xs">{rep.report_number}</td>
                    <td className="px-4 py-3 text-xs capitalize text-slate-700 dark:text-slate-300">{rep.report_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{rep.period_start} → {rep.period_end}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{rep.provider}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(rep.generated_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(rep)}
                          className="p-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => exportPdf(rep)}
                          className="p-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
