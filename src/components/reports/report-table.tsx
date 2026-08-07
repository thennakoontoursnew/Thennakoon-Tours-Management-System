'use client'

import { useState } from 'react'
import { Download, Printer, FileText } from 'lucide-react'
import { generateCsvString } from '@/lib/reports/report-service'

interface ReportTableProps {
  reportName: string
  headers: string[]
  rows: any[][]
  totals?: { label: string; value: string }[]
}

export function ReportTable({ reportName, headers, rows, totals }: ReportTableProps) {
  const [search, setSearch] = useState('')

  const filteredRows = rows.filter((row) =>
    row.some((cell) => String(cell || '').toLowerCase().includes(search.toLowerCase()))
  )

  const handleDownloadCsv = () => {
    const csvContent = generateCsvString(headers, filteredRows)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">{reportName} Data Table</h3>
          <p className="text-[11px] text-slate-400">Displaying {filteredRows.length} report records</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search report table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          />

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {filteredRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {totals && totals.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={headers.length} className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-6 text-xs text-slate-900 dark:text-white">
                      {totals.map((t, idx) => (
                        <div key={idx}>
                          <span className="text-slate-400 font-semibold">{t.label}: </span>
                          <span className="font-mono font-bold text-amber-500">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400 italic">No matching records found for this report filter.</div>
      )}
    </div>
  )
}
