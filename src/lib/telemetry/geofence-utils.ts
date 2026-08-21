/**
 * Geofence & Telemetry Utilities for Fleet Tracking
 */

export interface LandmarkLocation {
  name: string
  lat: number
  lng: number
  radiusKm?: number
}

// Major Sri Lankan Transportation & Tourist Landmarks for Automatic Geofence Matching
export const SRI_LANKA_LANDMARKS: LandmarkLocation[] = [
  { name: 'Colombo Central Depot & HQ', lat: 6.9271, lng: 79.8612, radiusKm: 2.0 },
  { name: 'Bandaranaike International Airport (CMB)', lat: 7.1808, lng: 79.8841, radiusKm: 3.0 },
  { name: 'Negombo Coastal Strip', lat: 7.2083, lng: 79.8358, radiusKm: 3.0 },
  { name: 'Kandy Express Corridor', lat: 7.2906, lng: 80.6337, radiusKm: 3.0 },
  { name: 'Galle Fort & Highway Toll', lat: 6.0535, lng: 80.221, radiusKm: 2.5 },
  { name: 'Bentota Resort District', lat: 6.4231, lng: 79.9984, radiusKm: 2.5 },
  { name: 'Sigiriya Cultural Hub', lat: 7.957, lng: 80.7603, radiusKm: 4.0 },
  { name: 'Ella Mountain Pass', lat: 6.8667, lng: 81.0466, radiusKm: 3.0 },
  { name: 'Nuwara Eliya Hill Station', lat: 6.9497, lng: 80.7891, radiusKm: 3.0 },
  { name: 'Jaffna City Center', lat: 9.6615, lng: 80.0255, radiusKm: 4.0 },
  { name: 'Trincomalee Harbor', lat: 8.5874, lng: 81.2152, radiusKm: 3.5 },
  { name: 'Mirissa Beach Hub', lat: 5.9483, lng: 80.4578, radiusKm: 2.5 },
]

/**
 * Calculates distance in kilometers between two latitude/longitude points (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Resolves closest Sri Lankan landmark name or returns formatted coordinate text
 */
export function resolveGeofenceLocation(lat: number, lon: number): string {
  let closestLandmark: LandmarkLocation | null = null
  let minDistance = Infinity

  for (const landmark of SRI_LANKA_LANDMARKS) {
    const dist = calculateDistanceKm(lat, lon, landmark.lat, landmark.lng)
    if (dist < minDistance) {
      minDistance = dist
      closestLandmark = landmark
    }
  }

  if (closestLandmark && minDistance <= (closestLandmark.radiusKm || 3.0)) {
    return closestLandmark.name
  }

  if (closestLandmark && minDistance <= 15.0) {
    return `${minDistance.toFixed(1)} km from ${closestLandmark.name}`
  }

  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`
}

/**
 * Determines vehicle movement status based on speed, battery, and last telemetry timestamp
 */
export function determineTelemetryStatus(
  speedKmh: number,
  batteryLevel?: number | null,
  lastTelemetryAt?: string | Date | null
): 'moving' | 'stationary' | 'offline' | 'geofence_alert' {
  if (lastTelemetryAt) {
    const lastTime = new Date(lastTelemetryAt).getTime()
    const now = Date.now()
    const diffMinutes = (now - lastTime) / (1000 * 60)
    if (diffMinutes > 30) {
      return 'offline'
    }
  }

  if (Number(speedKmh) > 3.0) {
    return 'moving'
  }

  return 'stationary'
}
