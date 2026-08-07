import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  getDashboardHeaderData,
  getDashboardKPIs,
  getRevenueSeries,
  getFleetStatus,
  getTodayOperations,
  getBookingCalendar,
  getDashboardAlerts,
  getRecentBookings,
  getRecentActivity,
} from '@/lib/dashboard/dashboard-service'
import { getSanitizedContextForPeriod, generateDeterministicExecutiveBrief } from '@/lib/ai/management-intelligence-service'
import { calculateDeterministicForecast } from '@/lib/ai/ai-forecast-service'
import { RevenueOverviewChart } from '@/components/dashboard/revenue-overview-chart'
import { FleetStatusChart } from '@/components/dashboard/fleet-status-chart'
import { TodaysOperationsWidget } from '@/components/dashboard/todays-operations-widget'
import { BookingCalendarWidget } from '@/components/dashboard/booking-calendar-widget'
import { FinancialOverviewCard } from '@/components/dashboard/financial-overview-card'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { RecentBookingsTable } from '@/components/dashboard/recent-bookings-table'
import { RecentActivityTimeline } from '@/components/dashboard/recent-activity-timeline'
import { ManagementIntelligenceWidget } from '@/components/dashboard/management-intelligence-widget'
import {
  TrendingUp,
  CalendarCheck,
  Car,
  WalletCards,
  Users,
  UserRound,
  ArrowUpRight,
  Plus,
  Clock,
} from 'lucide-react'

export const metadata = {
  title: 'Executive & Operations Dashboard — Thennakoon Tours',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch Header Data
  const headerData = await getDashboardHeaderData(user?.id)

  // Safe Isolated Data Fetching
  const [
    kpis,
    revenueData,
    fleetData,
    operationsData,
    calendarEvents,
    alertsData,
    recentBookings,
    recentActivity,
    aiData,
  ] = await Promise.all([
    getDashboardKPIs(headerData.role).catch((err) => {
      console.error('Error fetching KPIs:', err)
      return {
        totalRevenue: 0,
        monthRevenue: 0,
        revenueGrowthPct: null,
        activeBookingsCount: 0,
        todayPickupsCount: 0,
        availableVehiclesCount: 0,
        totalFleetCount: 0,
        outstandingBalance: 0,
        overdueBalance: 0,
        totalCustomersCount: 0,
        activeDriversCount: 0,
      }
    }),

    getRevenueSeries('30d').catch((err) => {
      console.error('Error fetching revenue series:', err)
      return {
        series: [],
        summary: { totalInvoiced: 0, totalCollected: 0, outstanding: 0, collectionRate: 0 },
      }
    }),

    getFleetStatus().catch((err) => {
      console.error('Error fetching fleet status:', err)
      return { items: [], totalFleet: 0 }
    }),

    getTodayOperations().catch((err) => {
      console.error('Error fetching today operations:', err)
      return { pickups: [], returns: [], activeTrips: [], driverMissing: [] }
    }),

    getBookingCalendar(2026, 8).catch((err) => {
      console.error('Error fetching booking calendar:', err)
      return []
    }),

    getDashboardAlerts().catch((err) => {
      console.error('Error fetching alerts:', err)
      return []
    }),

    getRecentBookings(6).catch((err) => {
      console.error('Error fetching recent bookings:', err)
      return []
    }),

    getRecentActivity(8).catch((err) => {
      console.error('Error fetching recent activity:', err)
      return []
    }),

    getSanitizedContextForPeriod(supabase, 'this_month').catch(() => null),
  ])

  const isFinanceAuthorized = ['owner', 'admin', 'manager', 'finance_staff'].includes(headerData.role)

  // AI Widget calculations
  const sanitizedContext = aiData?.sanitized
  const brief = sanitizedContext ? generateDeterministicExecutiveBrief(sanitizedContext, aiData.comparisons) : null
  const topInsights = brief?.recommendedActions || []
  const criticalCount = (alertsData || []).filter((a: any) => a.severity === 'high' || a.severity === 'critical').length

  const todayStr = new Date().toISOString().slice(0, 10)
  const d30Future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const forecast30d = sanitizedContext
    ? calculateDeterministicForecast({
        forecastType: 'revenue_30d',
        periodStart: todayStr,
        periodEnd: d30Future,
        historicalCompletedRevenue: sanitizedContext.finance.collectedRevenue,
        knownFutureBookingRevenue: 0,
        completedRentalsCount: sanitizedContext.bookings.completedRentals,
        totalBookingsCount: sanitizedContext.bookings.totalBookings,
        historicalDays: 30,
      }).forecast_value
    : 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock size={13} />
            <span>{headerData.todayFormatted} (Asia/Colombo)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {headerData.greeting}, {headerData.firstName}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening at Thennakoon Tours today.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/quotations/new"
            className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>New Quotation</span>
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>New Booking</span>
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>New Customer</span>
          </Link>
          {isFinanceAuthorized && (
            <Link
              href="/dashboard/invoices"
              className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>New Invoice</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Primary KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue (Finance Authorized Only) */}
        {isFinanceAuthorized ? (
          <Link
            href="/dashboard/invoices"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              LKR {kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>Completed Payments</span>
            </div>
          </Link>
        ) : (
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-400 font-mono">Restricted Access</div>
            <div className="text-[11px] text-slate-400">Finance Role Only</div>
          </div>
        )}

        {/* Active Bookings */}
        <Link
          href="/dashboard/bookings"
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bookings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.activeBookingsCount}</div>
          <div className="text-[11px] text-amber-500 font-semibold flex items-center justify-between">
            <span>Today&apos;s Pickups: {kpis.todayPickupsCount}</span>
            <ArrowUpRight size={13} />
          </div>
        </Link>

        {/* Available Vehicles */}
        <Link
          href="/dashboard/vehicles"
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Fleet</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Car size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.availableVehiclesCount}</div>
          <div className="text-[11px] text-purple-500 font-semibold flex items-center justify-between">
            <span>Total Fleet: {kpis.totalFleetCount}</span>
            <ArrowUpRight size={13} />
          </div>
        </Link>

        {/* Outstanding Balance */}
        {isFinanceAuthorized ? (
          <Link
            href="/dashboard/invoices"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <WalletCards size={18} />
              </div>
            </div>
            <div className="text-xl font-black text-rose-500 dark:text-rose-400 font-mono">
              LKR {kpis.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-rose-400 font-semibold">
              Overdue: LKR {kpis.overdueBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </Link>
        ) : (
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</span>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <WalletCards size={18} />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-400 font-mono">Restricted Access</div>
            <div className="text-[11px] text-slate-400">Finance Role Only</div>
          </div>
        )}

        {/* Total Customers */}
        <Link
          href="/dashboard/customers"
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.totalCustomersCount}</div>
          <div className="text-[11px] text-indigo-500 font-semibold flex items-center justify-between">
            <span>Customer Directory</span>
            <ArrowUpRight size={13} />
          </div>
        </Link>

        {/* Active Drivers */}
        <Link
          href="/dashboard/drivers"
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-amber-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Drivers</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <UserRound size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{kpis.activeDriversCount}</div>
          <div className="text-[11px] text-cyan-500 font-semibold flex items-center justify-between">
            <span>Driver Roster</span>
            <ArrowUpRight size={13} />
          </div>
        </Link>
      </div>

      {/* 2.5 Stage 12: Compact Management Intelligence Widget */}
      <ManagementIntelligenceWidget
        insights={topInsights}
        forecast30d={forecast30d}
        criticalAlertCount={criticalCount}
      />

      {/* 3. Revenue Overview & Fleet Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueOverviewChart
            initialSeries={revenueData.series}
            initialSummary={revenueData.summary}
          />
        </div>
        <div>
          <FleetStatusChart
            items={fleetData.items}
            totalFleet={fleetData.totalFleet}
          />
        </div>
      </div>

      {/* 4. Booking Calendar & Today's Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingCalendarWidget initialEvents={calendarEvents} />
        </div>
        <div>
          <TodaysOperationsWidget operations={operationsData} />
        </div>
      </div>

      {/* 5. Financial Overview & Alerts Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isFinanceAuthorized ? (
          <FinancialOverviewCard summary={revenueData.summary} />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <WalletCards size={32} className="opacity-50" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Financial Overview Restricted</h3>
            <p className="text-xs max-w-xs">Detailed cash flow metrics are restricted to authorized finance roles.</p>
          </div>
        )}

        <AlertsPanel alerts={alertsData} />
      </div>

      {/* 6. Recent Bookings Table */}
      <RecentBookingsTable bookings={recentBookings} />

      {/* 7. Recent Activity Timeline Stream */}
      <RecentActivityTimeline activities={recentActivity} />
    </div>
  )
}
