import { AIForecastResult, ConfidenceLevel, DataQualityRating, ForecastType } from './ai-types'

export function calculateDeterministicForecast(options: {
  forecastType: ForecastType
  periodStart: string
  periodEnd: string
  historicalCompletedRevenue: number
  knownFutureBookingRevenue: number
  completedRentalsCount: number
  totalBookingsCount: number
  historicalDays: number
}): AIForecastResult {
  const {
    forecastType,
    periodStart,
    periodEnd,
    historicalCompletedRevenue,
    knownFutureBookingRevenue,
    completedRentalsCount,
    totalBookingsCount,
    historicalDays,
  } = options

  // 1. Data Quality Assessment
  let dataQuality: DataQualityRating = 'insufficient'
  if (completedRentalsCount >= 20 || totalBookingsCount >= 30) {
    dataQuality = 'excellent'
  } else if (completedRentalsCount >= 10 || totalBookingsCount >= 15) {
    dataQuality = 'good'
  } else if (completedRentalsCount >= 1 || totalBookingsCount >= 1) {
    dataQuality = 'limited'
  }

  // 2. Confidence Level Assessment
  let confidenceLevel: ConfidenceLevel = 'low'
  if (dataQuality === 'excellent' && knownFutureBookingRevenue > 0) {
    confidenceLevel = 'high'
  } else if (dataQuality === 'good' || (dataQuality === 'limited' && knownFutureBookingRevenue > 0)) {
    confidenceLevel = 'medium'
  } else {
    confidenceLevel = 'low'
  }

  // 3. Target Days Calculation
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const targetDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  // 4. Daily Run Rate Calculation
  const dailyHistoricalRate = historicalDays > 0 && historicalCompletedRevenue > 0
    ? historicalCompletedRevenue / historicalDays
    : 0

  const baselineProjectedRevenue = Number((dailyHistoricalRate * targetDays).toFixed(2))

  // Blend Known Future Bookings + Projected Baseline
  let forecastValue = 0
  if (knownFutureBookingRevenue > 0) {
    forecastValue = Number((knownFutureBookingRevenue + (baselineProjectedRevenue * 0.4)).toFixed(2))
  } else {
    forecastValue = baselineProjectedRevenue
  }

  // Margin of error based on confidence
  let marginPct = 0.35 // 35% default for low confidence
  if (confidenceLevel === 'high') marginPct = 0.15
  else if (confidenceLevel === 'medium') marginPct = 0.25

  const lowerBound = Number(Math.max(knownFutureBookingRevenue, forecastValue * (1 - marginPct)).toFixed(2))
  const upperBound = Number((forecastValue * (1 + marginPct)).toFixed(2))

  const methodology = `Historical daily baseline (${dailyHistoricalRate.toFixed(2)} LKR/day over ${historicalDays}d) + Known Future Bookings (${knownFutureBookingRevenue.toLocaleString()} LKR) with ±${(marginPct * 100).toFixed(0)}% confidence interval.`

  let explanation = ''
  if (dataQuality === 'insufficient') {
    explanation = 'Insufficient historical data available for this forecast period. Forecast represents a conservative baseline estimate.'
  } else if (knownFutureBookingRevenue > 0) {
    explanation = `Forecast incorporates LKR ${knownFutureBookingRevenue.toLocaleString()} in confirmed future booking pipeline plus projected daily historical run rate.`
  } else {
    explanation = `Forecast based on historical daily collection run rate of LKR ${dailyHistoricalRate.toLocaleString()}/day.`
  }

  return {
    forecast_type: forecastType,
    period_start: periodStart,
    period_end: periodEnd,
    forecast_value: forecastValue,
    lower_bound: lowerBound,
    upper_bound: upperBound,
    confidence_level: confidenceLevel,
    data_quality: dataQuality,
    methodology,
    data_snapshot: {
      historicalCompletedRevenue,
      knownFutureBookingRevenue,
      completedRentalsCount,
      totalBookingsCount,
      targetDays,
      dailyHistoricalRate,
    },
    explanation,
  }
}
