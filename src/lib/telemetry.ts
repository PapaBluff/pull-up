export const GEOFENCE_THRESHOLD_FEET = 300

export function calculateDistanceInFeet(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8 // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceMiles = R * c
  const distanceFeet = distanceMiles * 5280
  return Math.round(distanceFeet)
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}
