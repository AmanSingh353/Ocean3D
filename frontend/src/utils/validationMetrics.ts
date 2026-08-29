import type { InstrumentProfile, OceanVariable, ProfilePoint, ValidationStats } from '../types/ocean'
import { formatComparisonMetric, getVariableMeta } from '../data/variableMeta'
import { sampleAtDepthWithMeta } from './sampleAtDepth'

/** RMSE thresholds per variable — adjust in this file only. */
export const VALIDATION_RMSE_THRESHOLDS: Record<
  OceanVariable,
  { good: number; moderate: number }
> = {
  temperature: { good: 0.5, moderate: 1.0 },
  salinity: { good: 0.15, moderate: 0.35 },
  chlorophyll: { good: 0.1, moderate: 0.25 },
  current: { good: 0.05, moderate: 0.15 },
}

export type ValidationStatus = 'GOOD' | 'MODERATE' | 'POOR'

export type DepthMatchKind = 'exact' | 'interpolated' | 'unavailable'

export interface MatchedProfilePair {
  depth: number
  model: number
  observation: number
  error: number
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Extract overlapping model/observation pairs from API profile data only. */
export function extractMatchedPairs(
  profile: InstrumentProfile,
  variable: OceanVariable,
): MatchedProfilePair[] {
  const pairs: MatchedProfilePair[] = []

  for (const point of profile.points) {
    const values = extractPairValues(point, variable)
    if (!values) continue
    pairs.push({
      depth: point.depth,
      model: values.model,
      observation: values.observation,
      error: values.observation - values.model,
    })
  }

  return pairs.sort((a, b) => a.depth - b.depth)
}

function extractPairValues(
  point: ProfilePoint,
  variable: OceanVariable,
): { model: number; observation: number } | null {
  switch (variable) {
    case 'temperature':
      if (!isValidNumber(point.model) || !isValidNumber(point.observation)) return null
      return { model: point.model, observation: point.observation }
    case 'salinity':
      if (!isValidNumber(point.salinityModel) || !isValidNumber(point.salinityObservation)) {
        return null
      }
      return { model: point.salinityModel, observation: point.salinityObservation }
    case 'chlorophyll':
      if (
        !isValidNumber(point.chlorophyllModel) ||
        !isValidNumber(point.chlorophyllObservation)
      ) {
        return null
      }
      return { model: point.chlorophyllModel, observation: point.chlorophyllObservation }
    case 'current':
      if (!isValidNumber(point.currentModel) || !isValidNumber(point.currentObservation)) {
        return null
      }
      return { model: point.currentModel, observation: point.currentObservation }
  }
}

export function getValidationStatus(
  rmse: number,
  variable: OceanVariable,
): ValidationStatus {
  const thresholds = VALIDATION_RMSE_THRESHOLDS[variable]
  if (rmse <= thresholds.good) return 'GOOD'
  if (rmse <= thresholds.moderate) return 'MODERATE'
  return 'POOR'
}

export function computePearsonCorrelation(pairs: MatchedProfilePair[]): number | null {
  if (pairs.length < 2) return null
  const xs = pairs.map((p) => p.model)
  const ys = pairs.map((p) => p.observation)
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const den = Math.sqrt(denX * denY)
  if (den <= 0) return null
  return Number((num / den).toFixed(4))
}

export function computeValidationStats(
  profile: InstrumentProfile,
  depth: number,
  variable: OceanVariable,
  mapModelDepth?: number | null,
): ValidationStats | null {
  const meta = getVariableMeta(variable)
  const pairs = extractMatchedPairs(profile, variable)

  if (pairs.length === 0) return null

  const errors = pairs.map((p) => p.error)
  const absErrors = errors.map(Math.abs)
  const squaredErrors = errors.map((e) => e * e)

  const meanBias = errors.reduce((a, b) => a + b, 0) / errors.length
  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length)
  const correlation = computePearsonCorrelation(pairs)

  const depthOutcome = sampleAtDepthWithMeta(pairs, depth)
  const depthSample = depthOutcome.result
  const bias =
    depthSample != null ? depthSample.observation - depthSample.model : null
  const difference =
    depthSample != null ? depthSample.model - depthSample.observation : null

  return {
    variable,
    unit: meta.unit,
    comparedDepth: depth,
    depthMatch: depthSample?.depthMatch ?? 'unavailable',
    modelLevelLower: depthSample?.bracketLower ?? null,
    modelLevelUpper: depthSample?.bracketUpper ?? null,
    mapModelDepth: mapModelDepth ?? null,
    model:
      depthSample != null
        ? Number(formatComparisonMetric(depthSample.model, variable))
        : null,
    observation:
      depthSample != null
        ? Number(formatComparisonMetric(depthSample.observation, variable))
        : null,
    bias: bias != null ? Number(formatComparisonMetric(bias, variable)) : null,
    difference:
      difference != null ? Number(formatComparisonMetric(difference, variable)) : null,
    meanBias: Number(formatComparisonMetric(meanBias, variable)),
    mae: Number(formatComparisonMetric(mae, variable)),
    rmse: Number(formatComparisonMetric(rmse, variable)),
    correlation,
    matchedPoints: pairs.length,
    validationStatus: getValidationStatus(rmse, variable),
    depthSampleError: depthOutcome.failure,
  }
}
