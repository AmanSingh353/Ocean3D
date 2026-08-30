import type { ThresholdBands } from '../../data/hazardThresholds'
import { classifyByThreshold } from '../../data/hazardThresholds'
import type { RiskLevel } from '../../types/hazard'
import type { ThresholdMode } from '../definitions'
import { calculateAnomaly } from './anomaly'

export function calculateHazardLevel(
  mode: ThresholdMode,
  value: number,
  reference: number,
  bands: ThresholdBands,
): RiskLevel {
  if (mode === 'absolute') {
    return classifyByThreshold(value, bands)
  }
  const { anomaly } = calculateAnomaly(value, reference)
  return classifyByThreshold(Math.abs(anomaly), bands)
}
