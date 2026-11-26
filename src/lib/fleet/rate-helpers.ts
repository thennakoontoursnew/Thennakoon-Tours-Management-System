export type ServiceRateMode = 'self_drive' | 'with_driver'

/**
 * Returns the suggested selling daily rate for a vehicle based on whether
 * the rental is Self-Drive (without driver) or With Driver (chauffeur-driven).
 */
export function getSuggestedVehicleRate(vehicle: any, mode: ServiceRateMode): number {
  if (!vehicle) return 0
  if (mode === 'with_driver') {
    const withDriverRate = Number(vehicle.selling_daily_rate_with_driver || 0)
    return withDriverRate > 0 ? withDriverRate : Number(vehicle.daily_rate || 0)
  }
  return Number(vehicle.daily_rate || 0)
}
