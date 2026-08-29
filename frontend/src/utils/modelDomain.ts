import type { ApiBounds, ApiGrid } from '../types/api'
import { DEFAULT_REGION } from '../data/defaults'

/**
 * Grid/data conventions for the Ocean3D MVP synthetic model.
 * Matches backend OceanDataService (ocean_data.py).
 */
export const MODEL_GRID_CONVENTIONS = {
  /** values[latIndex][lonIndex] — latitude is the outer (row) index. */
  indexing: '[latitude_index][longitude_index]' as const,
  /** latitudes[] ascending south → north. */
  latitudeOrder: 'ascending-south-to-north' as const,
  /** longitudes[] ascending west → east. */
  longitudeOrder: 'ascending-west-to-east' as const,
  /** +X = east, north = −Z (see geoProjection.ts latLonToWorld). */
  worldAxes: '+X=east, +Z=south, north=−Z' as const,
} as const

/**
 * Synthetic/demo model limitations — land-sea mask is NOT embedded in field data.
 * Coastal clipping uses Natural Earth 110m polygons (geo land mask), separate from API values.
 */
export const SYNTHETIC_MODEL_DATA_NOTES = [
  'Demo model: rectangular domain from API bounds/metadata.',
  'No native land-sea mask in field values; ocean clipping uses Natural Earth 110m land polygons.',
  'Finite domain edge is geographic (W/E/S/N from API), not a renderer artifact.',
] as const

/** Geographic bounds derived from grid node arrays (source of truth when API bounds match). */
export function boundsFromGrid(grid: ApiGrid): ApiBounds {
  const { latitudes, longitudes } = grid
  if (latitudes.length === 0 || longitudes.length === 0) {
    return { ...DEFAULT_REGION }
  }
  return {
    lat_min: latitudes[0],
    lat_max: latitudes[latitudes.length - 1],
    lon_min: longitudes[0],
    lon_max: longitudes[longitudes.length - 1],
  }
}

/** Prefer explicit API bounds; fall back to grid-derived bounds. */
export function resolveModelBounds(
  bounds: ApiBounds | null | undefined,
  grid: ApiGrid | null | undefined,
): ApiBounds {
  if (bounds) return bounds
  if (grid) return boundsFromGrid(grid)
  return { ...DEFAULT_REGION }
}

/** Human-readable domain summary for geo-debug. */
export function formatModelDomainSummary(bounds: ApiBounds): string {
  return [
    `Model domain: ${bounds.lon_min}°E – ${bounds.lon_max}°E`,
    `${bounds.lat_min}°N – ${bounds.lat_max}°N`,
  ].join(' · ')
}

/** Validate grid node ordering matches documented conventions. */
export function validateGridOrientation(grid: ApiGrid): {
  ok: boolean
  messages: string[]
} {
  const messages: string[] = []
  const { latitudes, longitudes } = grid

  if (latitudes.length >= 2 && latitudes[0] >= latitudes[latitudes.length - 1]) {
    messages.push('latitudes must ascend south→north')
  }
  if (longitudes.length >= 2 && longitudes[0] >= longitudes[longitudes.length - 1]) {
    messages.push('longitudes must ascend west→east')
  }

  return { ok: messages.length === 0, messages }
}

/** Grid corner node coordinates for geo-debug verification. */
export function gridCornerNodeLabels(grid: ApiGrid): Array<{ lat: number; lon: number; label: string }> {
  if (grid.latitudes.length === 0 || grid.longitudes.length === 0) return []

  const latMin = grid.latitudes[0]
  const latMax = grid.latitudes[grid.latitudes.length - 1]
  const lonMin = grid.longitudes[0]
  const lonMax = grid.longitudes[grid.longitudes.length - 1]

  return [
    { lat: latMin, lon: lonMin, label: `grid[0][0] ${latMin}°N ${lonMin}°E` },
    { lat: latMin, lon: lonMax, label: `grid[0][n] ${latMin}°N ${lonMax}°E` },
    { lat: latMax, lon: lonMin, label: `grid[n][0] ${latMax}°N ${lonMin}°E` },
    { lat: latMax, lon: lonMax, label: `grid[n][n] ${latMax}°N ${lonMax}°E` },
  ]
}
