import type { OceanVariable } from './ocean'
import type { ValidationRegionBounds } from '../data/validationRegions'

/** Demo hazard risk classification — not an operational warning level. */
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

/** Hazard category architecture — ocean-condition support, not cyclone prediction. */
export type HazardCategoryId =
  | 'cycloneOceanConditions'
  | 'stormSurgeSupport'
  | 'marineAnomaly'
  | 'strongCurrent'

export interface HazardCategoryMeta {
  id: HazardCategoryId
  label: string
  description: string
}

/** Qualitative data confidence derived from validation quality rules. */
export type DataConfidenceQuality = 'GOOD' | 'MODERATE' | 'LIMITED' | 'NOT_AVAILABLE'

export interface HazardIndicatorResult {
  id: string
  label: string
  variable: OceanVariable
  unit: string
  currentValue: number | null
  referenceValue: number | null
  anomaly: number | null
  anomalyPercent: number | null
  currentSpeed: number | null
  currentDirectionDeg: number | null
  riskLevel: RiskLevel
}

export interface HazardGridSnapshot {
  grid: { latitudes: number[]; longitudes: number[] }
  riskLevels: RiskLevel[][]
}

export interface HazardAssessment {
  category: HazardCategoryId
  categoryLabel: string
  eventStatus: RiskLevel
  eventLabel: string
  affectedRegion: ValidationRegionBounds
  primaryIndicator: HazardIndicatorResult
  indicators: HazardIndicatorResult[]
  explanation: string[]
  dataConfidence: DataConfidenceQuality
  validationQuality: DataConfidenceQuality | null
  confidenceNote: string
  lastUpdated: string
  gridSnapshot: HazardGridSnapshot | null
  isDemo: true
}
