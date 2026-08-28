import type {
  AnalysisMode,
  RegionValidationStats,
  SpatialAnalysisSnapshot,
  SpatialValidationPoint,
} from '../types/analysis'
import type { DepthMatchKind, Instrument, InstrumentProfile, OceanVariable } from '../types/ocean'
import { getVariableMeta } from '../data/variableMeta'
import { sampleAtDepth } from './sampleAtDepth'
import {
  extractMatchedPairs,
} from './validationMetrics'

export function buildSpatialValidationPoint(
  instrument: Instrument,
  profile: InstrumentProfile,
  depth: number,
  variable: OceanVariable,
): SpatialValidationPoint {
  const pairs = extractMatchedPairs(profile, variable)
  const sample = sampleAtDepth(pairs, depth)

  if (!sample) {
    return {
      instrumentId: instrument.id,
      latitude: instrument.latitude,
      longitude: instrument.longitude,
      model: null,
      observation: null,
      difference: null,
      absoluteError: null,
      depthMatch: 'unavailable',
      hasData: false,
    }
  }

  const difference = sample.model - sample.observation
  const absoluteError = Math.abs(difference)

  return {
    instrumentId: instrument.id,
    latitude: instrument.latitude,
    longitude: instrument.longitude,
    model: sample.model,
    observation: sample.observation,
    difference,
    absoluteError,
    depthMatch: sample.depthMatch,
    hasData: true,
  }
}

export function computeRegionValidationStats(
  points: SpatialValidationPoint[],
  variable: OceanVariable,
): RegionValidationStats {
  const meta = getVariableMeta(variable)
  const valid = points.filter((p) => p.hasData && p.model != null && p.observation != null)

  if (valid.length === 0) {
    return {
      variable,
      unit: meta.unit,
      matchedPlatforms: 0,
      meanBias: null,
      mae: null,
      rmse: null,
      maxAbsoluteError: null,
      medianAbsoluteError: null,
    }
  }

  const biases = valid.map((p) => p.observation! - p.model!)
  const absErrors = valid.map((p) => p.absoluteError!)
  const squared = biases.map((b) => b * b)
  const sortedAbs = [...absErrors].sort((a, b) => a - b)

  const meanBias = biases.reduce((a, b) => a + b, 0) / biases.length
  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length
  const rmse = Math.sqrt(squared.reduce((a, b) => a + b, 0) / squared.length)
  const maxAbsoluteError = Math.max(...absErrors)
  const medianAbsoluteError =
    sortedAbs.length % 2 === 0
      ? (sortedAbs[sortedAbs.length / 2 - 1] + sortedAbs[sortedAbs.length / 2]) / 2
      : sortedAbs[Math.floor(sortedAbs.length / 2)]

  return {
    variable,
    unit: meta.unit,
    matchedPlatforms: valid.length,
    meanBias,
    mae,
    rmse,
    maxAbsoluteError,
    medianAbsoluteError,
  }
}

export function getAnalysisValueFromPoint(
  point: SpatialValidationPoint,
  mode: AnalysisMode,
): number | null {
  return getAnalysisValue(point, mode)
}

function getAnalysisValue(point: SpatialValidationPoint, mode: AnalysisMode): number | null {
  switch (mode) {
    case 'model':
      return point.model
    case 'observation':
      return point.observation
    case 'difference':
    case 'regionalValidation':
      return point.difference
    case 'absoluteError':
      return point.absoluteError
  }
}

/** Whether this mode requires platform profile data to be loaded. */
export function requiresSpatialProfiles(mode: AnalysisMode): boolean {
  return mode !== 'model'
}

/** Mesh overlay uses platform-influence coloring (not plain model field). */
export function usesSpatialMeshOverlay(mode: AnalysisMode, validationLayerEnabled: boolean): boolean {
  if (mode === 'regionalValidation') return validationLayerEnabled
  return mode !== 'model'
}

export function computeSpatialAnalysisSnapshot(
  instruments: Instrument[],
  profilesById: Map<string, InstrumentProfile>,
  depth: number,
  variable: OceanVariable,
  mode: AnalysisMode,
): SpatialAnalysisSnapshot {
  const points = instruments.map((instrument) => {
    const profile = profilesById.get(instrument.id)
    if (!profile) {
      return {
        instrumentId: instrument.id,
        latitude: instrument.latitude,
        longitude: instrument.longitude,
        model: null,
        observation: null,
        difference: null,
        absoluteError: null,
        depthMatch: 'unavailable' as DepthMatchKind,
        hasData: false,
      }
    }
    return buildSpatialValidationPoint(instrument, profile, depth, variable)
  })

  const region = computeRegionValidationStats(points, variable)
  const validValues = points
    .filter((p) => p.hasData)
    .map((p) => getAnalysisValue(p, mode))
    .filter((v): v is number => v != null && Number.isFinite(v))

  let legendMin: number | null = null
  let legendMax: number | null = null

  if (validValues.length > 0) {
    if (mode === 'difference' || mode === 'regionalValidation') {
      const maxAbs = Math.max(...validValues.map(Math.abs))
      legendMin = -maxAbs
      legendMax = maxAbs
    } else if (mode === 'absoluteError') {
      legendMin = 0
      legendMax = Math.max(...validValues)
      if (legendMax <= 0) {
        legendMax = 0.001
      }
    } else {
      legendMin = Math.min(...validValues)
      legendMax = Math.max(...validValues)
      if (legendMin === legendMax) {
        legendMin -= 0.5
        legendMax += 0.5
      }
    }
  }

  return {
    points,
    region,
    legendMin,
    legendMax,
    hasData: validValues.length > 0,
  }
}

/** Degrees lat/lon — vertices within this distance of a platform use its analysis value. */
export const PLATFORM_INFLUENCE_DEG = 1.25

export function geoDistanceDeg(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const dLat = latA - latB
  const dLon = lonA - lonB
  return Math.sqrt(dLat * dLat + dLon * dLon)
}

export function findNearestSpatialPoint(
  lat: number,
  lon: number,
  points: SpatialValidationPoint[],
): SpatialValidationPoint | null {
  let nearest: SpatialValidationPoint | null = null
  let nearestDist = Infinity

  for (const point of points) {
    if (!point.hasData) continue
    const dist = geoDistanceDeg(lat, lon, point.latitude, point.longitude)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = point
    }
  }

  if (!nearest || nearestDist > PLATFORM_INFLUENCE_DEG) return null
  return nearest
}
