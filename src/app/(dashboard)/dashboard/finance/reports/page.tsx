import { createClient } from '@/lib/supabase/server'
import { FileBarChart } from 'lucide-react'
import {
  getFinanceSummaryKPIs,
  getPaymentMethodBreakdown,
  getCustomerStatementLedger,
  getAccountsReceivableAging,
} from '@/lib/finance/finance-service'
import { FinanceReportsClient } from './reports-client'

interface PageProps {
  searchParams: Promise<{ period?: string; customer_id?: string }>
}

export default async function FinanceReportsPage({ searchParams }: PageProps) {
  const { period = 'this_month', customer_id } = await searchParams
  const supabase = await createClient()

  // Fetch Customers for Statement dropdown
  const { data: customersList } = await supabase
    .from('customers')
    .select('id, full_name, company_name, mobile')
    .eq('is_archived', false)
    .order('full_name', { ascending: true })

  const customers = customersList || []
  const targetCustomerId = customer_id || (customers[0]?.id ?? '')

  const [kpis, paymentMethods, agingReport, customerStatement] = await Promise.all([
    getFinanceSummaryKPIs(supabase, period),
    getPaymentMethodBreakdown(supabase, period),
    getAccountsReceivableAging(supabase),
    targetCustomerId ? getCustomerStatementLedger(supabase, targetCustomerId) : Promise.resolve(undefined),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400">
            <FileBarChart size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Finance Reports & Statements</h1>
            <p className="text-xs text-slate-500 mt-0.5">Financial overview, collection analysis, customer ledger statements & AR aging report.</p>
          </div>
        </div>
      </div>

      <FinanceReportsClient
        initialKPIs={kpis}
        paymentMethods={paymentMethods}
        agingReport={agingReport}
        customers={customers}
        initialStatement={customerStatement}
        currentPeriod={period}
        currentCustomerId={targetCustomerId}
      />
    </div>
  )
}
