import type { OceanVariable } from '../types/ocean'

/**
 * Deterministic demo reference (climatology) values.
 * NOT real climatology — same inputs always yield the same reference.
 */

function deterministicSeed(...parts: (string | number)[]): number {
  let h = 2166136261
  for (const part of parts) {
    const s = String(part)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
  }
  return (h >>> 0) / 4294967295
}

/** Demo reference value at a grid point — deterministic, not random. */
export function getDemoReferenceValue(
  lat: number,
  lon: number,
  depth: number,
  dateIso: string,
  variable: OceanVariable,
): number {
  const dateKey = dateIso.slice(0, 10)
  const t = deterministicSeed(lat.toFixed(3), lon.toFixed(3), depth, dateKey, variable)

  switch (variable) {
    case 'temperature':
      return 27.0 + (lat - 5) * 0.08 + (lon - 65) * 0.02 - depth * 0.004 + (t - 0.5) * 0.6
    case 'salinity':
      return 34.8 + (lat - 12) * 0.03 - depth * 0.0008 + (t - 0.5) * 0.2
    case 'chlorophyll':
      return 0.12 + (lat - 8) * 0.008 - depth * 0.00005 + t * 0.08
    case 'current':
      return 0.25 + depth * 0.001 + (lon - 72) * 0.01 + t * 0.35
  }
}

/** Regional centroid reference for summary panels. */
export function getDemoRegionalReference(
  latCenter: number,
  lonCenter: number,
  depth: number,
  dateIso: string,
  variable: OceanVariable,
): number {
  return getDemoReferenceValue(latCenter, lonCenter, depth, dateIso, variable)
}
