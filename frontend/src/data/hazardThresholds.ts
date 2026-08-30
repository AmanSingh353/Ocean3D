import type { OceanVariable } from '../types/ocean'
import type { RiskLevel } from '../types/hazard'

/**
 * DEMO hazard thresholds — illustrative only.
 * Replace with scientifically validated thresholds from authoritative sources
 * before any operational use.
 */
export const DEMO_HAZARD_THRESHOLD_DISCLAIMER =
  'Demo hazard analysis — thresholds and results are illustrative and not an operational warning.'

export interface ThresholdBands {
  /** Values at or below this are LOW (for anomaly magnitude or absolute speed). */
  low: number
  moderate: number
  high: number
  /** Values above high are CRITICAL. */
}

export const DEMO_HAZARD_THRESHOLDS: {
  anomaly: Record<Exclude<OceanVariable, 'current'>, ThresholdBands>
  currentSpeed: ThresholdBands
} = {
  anomaly: {
    temperature: { low: 0.5, moderate: 1.0, high: 1.5 },
    salinity: { low: 0.2, moderate: 0.4, high: 0.6 },
    chlorophyll: { low: 0.05, moderate: 0.15, high: 0.3 },
  },
  currentSpeed: { low: 0.5, moderate: 1.0, high: 1.5 },
}

/** Provisional demo rules mapping validation RMSE status to data confidence. */
export const DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER =
  'Validation quality rules are provisional demo classifications until scientifically validated.'

export const RISK_LEVEL_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']

export function maxRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_LEVEL_ORDER.indexOf(a) >= RISK_LEVEL_ORDER.indexOf(b) ? a : b
}

/** Classify absolute magnitude against demo threshold bands. */
export function classifyByThreshold(magnitude: number, bands: ThresholdBands): RiskLevel {
  if (magnitude <= bands.low) return 'LOW'
  if (magnitude <= bands.moderate) return 'MODERATE'
  if (magnitude <= bands.high) return 'HIGH'
  return 'CRITICAL'
}
