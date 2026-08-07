import { DataQualityRating, SanitizedAIContext } from './ai-types'

/**
 * Sanitizes and strips sensitive PII from raw data before building AI context.
 * Strips: passwords, tokens, API keys, NICs, passport numbers, full bank account numbers, private URLs.
 * Replaces customer names with customer codes or display names where appropriate.
 */
export function sanitizeAIContext(rawContext: any): SanitizedAIContext {
  const period = rawContext?.period || {
    periodKey: 'this_month',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    previousStartDate: new Date().toISOString().slice(0, 10),
    previousEndDate: new Date().toISOString().slice(0, 10),
  }

  // Determine Data Quality
  const completedRentals = Number(rawContext?.bookings?.completedRentals || 0)
  const totalBookings = Number(rawContext?.bookings?.totalBookings || 0)
  const collectedRev = Number(rawContext?.finance?.collectedRevenue || 0)

  let dataQuality: DataQualityRating = 'insufficient'
  if (completedRentals >= 20 || totalBookings >= 30) {
    dataQuality = 'excellent'
  } else if (completedRentals >= 10 || totalBookings >= 15) {
    dataQuality = 'good'
  } else if (completedRentals >= 1 || totalBookings >= 1) {
    dataQuality = 'limited'
  }

  const finance = {
    collectedRevenue: Number(collectedRev.toFixed(2)),
    invoicedRevenue: Number((rawContext?.finance?.invoicedRevenue || 0).toFixed(2)),
    outstandingBalance: Number((rawContext?.finance?.outstandingBalance || 0).toFixed(2)),
    overdueBalance: Number((rawContext?.finance?.overdueBalance || 0).toFixed(2)),
    expenses: Number((rawContext?.finance?.expenses || 0).toFixed(2)),
    netCashFlow: Number((collectedRev - Number(rawContext?.finance?.expenses || 0)).toFixed(2)),
    avgBookingValue: Number((rawContext?.finance?.avgBookingValue || 0).toFixed(2)),
    revenuePerVehicle: Number((rawContext?.finance?.revenuePerVehicle || 0).toFixed(2)),
  }

  const bookings = {
    totalBookings: Number(totalBookings),
    confirmedBookings: Number(rawContext?.bookings?.confirmedBookings || 0),
    completedRentals: Number(completedRentals),
    cancelledBookings: Number(rawContext?.bookings?.cancelledBookings || 0),
    noShows: Number(rawContext?.bookings?.noShows || 0),
    avgRentalDays: Number((rawContext?.bookings?.avgRentalDays || 0).toFixed(1)),
    cancellationRatePct: totalBookings > 0
      ? Number(((Number(rawContext?.bookings?.cancelledBookings || 0) / totalBookings) * 100).toFixed(1))
      : 0,
  }

  const totalFleet = Number(rawContext?.fleet?.totalFleet || 0)
  const onTrip = Number(rawContext?.fleet?.onTrip || 0)
  const utilizationRatePct = totalFleet > 0
    ? Number(((onTrip / totalFleet) * 100).toFixed(1))
    : 0

  const fleet = {
    totalFleet,
    available: Number(rawContext?.fleet?.available || 0),
    onTrip,
    maintenance: Number(rawContext?.fleet?.maintenance || 0),
    inspectionRequired: Number(rawContext?.fleet?.inspectionRequired || 0),
    utilizationRatePct,
    companyOwnedCount: Number(rawContext?.fleet?.companyOwnedCount || 0),
    externalOwnerCount: Number(rawContext?.fleet?.externalOwnerCount || 0),
    totalFuelCost: Number((rawContext?.fleet?.totalFuelCost || 0).toFixed(2)),
    totalMaintenanceCost: Number((rawContext?.fleet?.totalMaintenanceCost || 0).toFixed(2)),
    totalOwnerPayouts: Number((rawContext?.fleet?.totalOwnerPayouts || 0).toFixed(2)),
    avgKmPerLiter: Number((rawContext?.fleet?.avgKmPerLiter || 0).toFixed(1)),
  }

  const totalCustomers = Number(rawContext?.customers?.totalCustomers || 0)
  const leadCount = Number(rawContext?.customers?.leadCount || 0)
  const convertedLeads = Number(rawContext?.customers?.convertedLeads || 0)

  const customers = {
    totalCustomers,
    newCustomers: Number(rawContext?.customers?.newCustomers || 0),
    repeatCustomers: Number(rawContext?.customers?.repeatCustomers || 0),
    leadCount,
    convertedLeads,
    conversionRatePct: leadCount > 0
      ? Number(((convertedLeads / leadCount) * 100).toFixed(1))
      : 0,
  }

  const maintenance = {
    scheduledCount: Number(rawContext?.maintenance?.scheduledCount || 0),
    overdueCount: Number(rawContext?.maintenance?.overdueCount || 0),
    inspectionFailures: Number(rawContext?.maintenance?.inspectionFailures || 0),
    documentExpiringCount: Number(rawContext?.maintenance?.documentExpiringCount || 0),
  }

  const campaignSpend = Number(rawContext?.marketing?.campaignSpend || 0)
  const attributedRevenue = Number(rawContext?.marketing?.attributedRevenue || 0)

  const marketing = {
    campaignSpend: Number(campaignSpend.toFixed(2)),
    attributedRevenue: Number(attributedRevenue.toFixed(2)),
    roas: campaignSpend > 0 ? Number((attributedRevenue / campaignSpend).toFixed(2)) : 0,
    leadsGenerated: Number(rawContext?.marketing?.leadsGenerated || 0),
  }

  const reminders = {
    dueTodayCount: Number(rawContext?.reminders?.dueTodayCount || 0),
    overdueCount: Number(rawContext?.reminders?.overdueCount || 0),
    criticalCount: Number(rawContext?.reminders?.criticalCount || 0),
  }

  return {
    period,
    dataQuality,
    finance,
    bookings,
    fleet,
    customers,
    maintenance,
    marketing,
    reminders,
  }
}
