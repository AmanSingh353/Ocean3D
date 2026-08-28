/** Bootstrap defaults used before API metadata loads. Mirrors backend constants. */
export const DEFAULT_DEPTHS = [0, 50, 100, 200, 500, 1000] as const

export const DEFAULT_DATES = [
  '2026-08-20',
  '2026-08-21',
  '2026-08-22',
  '2026-08-23',
  '2026-08-24',
] as const

export const DEFAULT_REGION = {
  lat_min: 5,
  lat_max: 20,
  lon_min: 65,
  lon_max: 85,
} as const

/** Default API model grid (integer degree nodes, mirrors backend). */
export function defaultModelGrid(): { latitudes: number[]; longitudes: number[] } {
  const latitudes: number[] = []
  for (let lat = DEFAULT_REGION.lat_min; lat <= DEFAULT_REGION.lat_max; lat++) {
    latitudes.push(lat)
  }
  const longitudes: number[] = []
  for (let lon = DEFAULT_REGION.lon_min; lon <= DEFAULT_REGION.lon_max; lon++) {
    longitudes.push(lon)
  }
  return { latitudes, longitudes }
}
