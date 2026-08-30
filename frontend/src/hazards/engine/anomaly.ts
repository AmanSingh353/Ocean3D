import { getDemoReferenceValue } from '../../data/demoClimatology'
import type { OceanVariable } from '../../types/ocean'

export interface AnomalyResult {
  value: number
  reference: number
  anomaly: number
  anomalyPercent: number | null
}

export function calculateAnomaly(
  currentValue: number,
  referenceValue: number,
): AnomalyResult {
  const anomaly = currentValue - referenceValue
  const anomalyPercent =
    referenceValue !== 0
      ? Number(((anomaly / Math.abs(referenceValue)) * 100).toFixed(1))
      : null
  return {
    value: currentValue,
    reference: referenceValue,
    anomaly: Number(anomaly.toFixed(3)),
    anomalyPercent,
  }
}

export function getReferenceValue(
  lat: number,
  lon: number,
  depth: number,
  dateIso: string,
  variable: OceanVariable,
): number {
  return getDemoReferenceValue(lat, lon, depth, dateIso, variable)
}
