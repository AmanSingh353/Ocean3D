import type { AnalysisMode } from '../types/analysis'
import type { Instrument, InstrumentProfile, OceanVariable } from '../types/ocean'
import { OCEAN_DEPTHS } from '../data/depths'
import { resolveApiDepth } from '../utils/depthUtils'
import { extractMatchedPairs } from '../utils/validationMetrics'
import { sampleAtDepth } from '../utils/sampleAtDepth'

export interface TransectEndpoint {
  lat: number
  lon: number
}

export interface TransectSpec {
  start: TransectEndpoint
  end: TransectEndpoint
  sampleCount: number
}

export interface VerticalSectionCell {
  lat: number
  lon: number
  distanceKm: number
  depth: number
  modelLevel: number
  model: number | null
  observation: number | null
  difference: number | null
  absoluteError: number | null
  instrumentId: string | null
  hasObservation: boolean
}

export interface VerticalSectionGrid {
  distancesKm: number[]
  depths: number[]
  cells: VerticalSectionCell[][]
  /** Display value per cell for the active section mode */
  displayValues: (number | null)[][]
  legendMin: number
  legendMax: number
}

export type VerticalSectionDisplayMode = 'model' | 'observation' | 'difference' | 'absoluteError'

const LAT_MIN = 5
const LAT_MAX = 20
const LON_MIN = 65
const LON_MAX = 85

/** Max distance (km) from transect sample to count platform observation influence. */
const PLATFORM_PROXIMITY_KM = 85

function dateIndex(date: string): number {
  const dates = ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24']
  const idx = dates.indexOf(date.slice(0, 10))
  return idx >= 0 ? idx : dates.length - 1
}

/** Deterministic demo sampling — mirrors backend `ocean_data.py` formulas. */
export function sampleDemoModelValue(
  variable: OceanVariable,
  lat: number,
  lon: number,
  depth: number,
  date: string,
): number {
  const dayIndex = dateIndex(date)
  const latC = Math.max(LAT_MIN, Math.min(LAT_MAX, lat))
  const lonC = Math.max(LON_MIN, Math.min(LON_MAX, lon))

  switch (variable) {
    case 'temperature': {
      const surface = 23.6 - 0.1 * (latC - LAT_MIN) - 0.08 * dayIndex
      const thermocline = 1 / (1 + Math.exp(-(depth - 120) / 38))
      const deep = 18.4 + 0.02 * dayIndex
      const base = surface - (surface - deep) * thermocline
      const lonVar = 0.45 * Math.sin(((lonC - 72) * Math.PI) / 12)
      const latVar = 0.3 * Math.cos(((latC - 12) * Math.PI) / 8)
      const anomaly =
        0.55 *
        Math.sin(latC * 0.65 + lonC * 0.48) *
        Math.cos(lonC * 0.28 - latC * 0.19) *
        (1 - depth / 1000)
      return Math.max(18, Math.min(24, base + lonVar + latVar + anomaly))
    }
    case 'salinity': {
      const surface = 35.8 + 0.04 * (lonC - 75) - 0.03 * (latC - 12) - 0.012 * dayIndex
      const halocline = 1 / (1 + Math.exp(-(depth - 90) / 35))
      const deep = 34.2 + 0.006 * dayIndex
      const base = surface - (surface - deep) * halocline * 0.22
      const lonVar = 0.22 * Math.sin(((lonC - 72) * Math.PI) / 10)
      const latVar = 0.16 * Math.cos(((latC - 10) * Math.PI) / 7)
      const anomaly =
        0.18 *
        Math.sin(latC * 0.52 + lonC * 0.41) *
        Math.cos(lonC * 0.31 - latC * 0.17) *
        (1 - depth / 1000)
      return Math.max(33, Math.min(37, base + lonVar + latVar + anomaly))
    }
    case 'current': {
      const depthFactor = Math.max(0.12, 1 - depth / 1200)
      const u =
        (0.42 * Math.sin(((lonC - 72) * Math.PI) / 12 + dayIndex * 0.12) +
          0.28 * Math.sin(latC * 0.65 + lonC * 0.48)) *
        depthFactor
      const v =
        (0.34 * Math.cos(((latC - 12) * Math.PI) / 8 - depth * 0.002) +
          0.22 * Math.cos(lonC * 0.28 - latC * 0.19)) *
        depthFactor
      let mag = Math.sqrt(u * u + v * v)
      if (mag > 1.35) mag = 1.35
      return Math.min(1.5, mag)
    }
    case 'chlorophyll': {
      const surface = 1.45 - 0.03 * (latC - LAT_MIN) + 0.018 * dayIndex
      const depthDecay = Math.exp(-depth / 85)
      const base = surface * depthDecay
      const coastal = 0.42 * Math.exp(-((lonC - 68) ** 2) / 18) * depthDecay
      const patch =
        0.32 *
        Math.sin(latC * 0.58 + lonC * 0.43 + dayIndex * 0.15) *
        Math.cos(lonC * 0.33 - latC * 0.21) *
        depthDecay
      return Math.max(0, Math.min(3, base + coastal + patch))
    }
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function interpolateTransectPoints(
  start: TransectEndpoint,
  end: TransectEndpoint,
  count: number,
): { lat: number; lon: number; distanceKm: number }[] {
  const totalKm = haversineKm(start.lat, start.lon, end.lat, end.lon)
  const points: { lat: number; lon: number; distanceKm: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1)
    points.push({
      lat: start.lat + t * (end.lat - start.lat),
      lon: start.lon + t * (end.lon - start.lon),
      distanceKm: t * totalKm,
    })
  }
  return points
}

function findNearestInstrument(
  lat: number,
  lon: number,
  instruments: Instrument[],
): { instrument: Instrument; distanceKm: number } | null {
  let best: { instrument: Instrument; distanceKm: number } | null = null
  for (const instrument of instruments) {
    const distanceKm = haversineKm(lat, lon, instrument.latitude, instrument.longitude)
    if (distanceKm > PLATFORM_PROXIMITY_KM) continue
    if (!best || distanceKm < best.distanceKm) {
      best = { instrument, distanceKm }
    }
  }
  return best
}

function observationAtDepth(
  profile: InstrumentProfile,
  variable: OceanVariable,
  depth: number,
): number | null {
  const pairs = extractMatchedPairs(profile, variable)
  const sample = sampleAtDepth(pairs, depth)
  return sample?.observation ?? null
}

export function resolveVerticalSectionDisplayMode(
  analysisMode: AnalysisMode,
  sourceMode: VerticalSectionDisplayMode,
): VerticalSectionDisplayMode {
  if (analysisMode !== 'verticalSection') return 'model'
  return sourceMode
}

export function analysisModeToSectionSource(mode: AnalysisMode): VerticalSectionDisplayMode {
  switch (mode) {
    case 'observation':
      return 'observation'
    case 'difference':
      return 'difference'
    case 'absoluteError':
      return 'absoluteError'
    default:
      return 'model'
  }
}

function displayValueForMode(
  cell: VerticalSectionCell,
  mode: VerticalSectionDisplayMode,
): number | null {
  switch (mode) {
    case 'model':
      return cell.model
    case 'observation':
      return cell.hasObservation ? cell.observation : null
    case 'difference':
      return cell.difference
    case 'absoluteError':
      return cell.absoluteError
  }
}

function computeLegendRange(
  values: (number | null)[][],
  mode: VerticalSectionDisplayMode,
  variable: OceanVariable,
): { min: number; max: number } {
  const flat = values.flat().filter((v): v is number => v != null && Number.isFinite(v))
  if (flat.length === 0) {
    if (mode === 'difference') return { min: -1, max: 1 }
    if (mode === 'absoluteError') return { min: 0, max: 1 }
    const defaults: Record<OceanVariable, { min: number; max: number }> = {
      temperature: { min: 18, max: 24 },
      salinity: { min: 33, max: 37 },
      current: { min: 0, max: 1.5 },
      chlorophyll: { min: 0, max: 3 },
    }
    return defaults[variable]
  }

  if (mode === 'difference') {
    const span = Math.max(...flat.map(Math.abs), 0.01)
    return { min: -span, max: span }
  }

  if (mode === 'absoluteError') {
    return { min: 0, max: Math.max(...flat, 0.01) }
  }

  return { min: Math.min(...flat), max: Math.max(...flat) }
}

export function buildVerticalSectionGrid(
  transect: TransectSpec,
  variable: OceanVariable,
  date: string,
  options: {
    depths?: readonly number[]
    availableDepths?: number[]
    displayMode?: VerticalSectionDisplayMode
    instruments?: Instrument[]
    profilesById?: Map<string, InstrumentProfile>
  } = {},
): VerticalSectionGrid {
  const depths = options.depths ?? OCEAN_DEPTHS
  const availableDepths = options.availableDepths ?? [...OCEAN_DEPTHS]
  const displayMode = options.displayMode ?? 'model'
  const instruments = options.instruments ?? []
  const profilesById = options.profilesById ?? new Map()

  const horizontal = interpolateTransectPoints(transect.start, transect.end, transect.sampleCount)

  const cells: VerticalSectionCell[][] = depths.map((depth) => {
    const modelLevel = resolveApiDepth(variable, depth, availableDepths)
    return horizontal.map(({ lat, lon, distanceKm }) => {
      const model = sampleDemoModelValue(variable, lat, lon, depth, date)
      const nearest = findNearestInstrument(lat, lon, instruments)
      let observation: number | null = null
      let instrumentId: string | null = null

      if (nearest) {
        const profile = profilesById.get(nearest.instrument.id)
        if (profile) {
          observation = observationAtDepth(profile, variable, depth)
          if (observation != null) instrumentId = nearest.instrument.id
        }
      }

      const difference =
        model != null && observation != null ? model - observation : null
      const absoluteError = difference != null ? Math.abs(difference) : null

      return {
        lat,
        lon,
        distanceKm,
        depth,
        modelLevel,
        model,
        observation,
        difference,
        absoluteError,
        instrumentId,
        hasObservation: observation != null,
      }
    })
  })

  const displayValues = cells.map((row) =>
    row.map((cell) => displayValueForMode(cell, displayMode)),
  )

  const { min: legendMin, max: legendMax } = computeLegendRange(
    displayValues,
    displayMode,
    variable,
  )

  return {
    distancesKm: horizontal.map((p) => p.distanceKm),
    depths: [...depths],
    cells,
    displayValues,
    legendMin,
    legendMax,
  }
}

export const DEFAULT_TRANSECT = {
  start: { lat: 10, lon: 68 },
  end: { lat: 16, lon: 82 },
  sampleCount: 48,
} as const
