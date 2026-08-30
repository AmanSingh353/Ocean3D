import type { OceanVariable } from './ocean'
import type { ValidationRegionBounds } from '../data/validationRegions'
import type { OceanFieldBundle } from '../utils/hazardFieldAccess'
import type { ValidationStats } from './ocean'
import type { RegionValidationStats } from './analysis'

/** Configurable multi-hazard identifier. */
export type HazardId =
  | 'strongCurrent'
  | 'marineHeatAnomaly'
  | 'salinityAnomaly'
  | 'extremeWaveStormSurge'
  | 'tsunamiSupport'

/** @deprecated Use HazardId — kept for gradual migration. */
export type HazardCategoryId = HazardId

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export type HazardAnalysisStatus = 'no_data' | 'insufficient' | 'success'

export type HazardConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'NOT_ASSESSED'

export type HazardTrend = 'rising' | 'falling' | 'stable' | 'not_assessed'

export interface HazardDataAvailability {
  available: boolean
  statusLabel: 'Available' | 'Unavailable'
  requiredVariable: string
  missingRequirements: string[]
  message: string
}

export interface RiskDistribution {
  LOW: number
  MODERATE: number
  HIGH: number
  CRITICAL: number
  validCells: number
  regionCells: number
}

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
  analyzed: boolean[][]
}

export interface HazardEvent {
  eventId: string
  hazardId: HazardId
  hazardName: string
  status: RiskLevel
  eventLabel: string
  region: ValidationRegionBounds
  startTime: string
  latestUpdate: string
  primaryIndicator: string
  primaryUnit: string
  depth: number
  peakValue: number | null
  meanValue: number | null
  centreValue: number | null
  referenceValue: number | null
  anomaly: number | null
  peakLocation: { lat: number; lon: number } | null
  currentDirectionDeg: number | null
  affectedCells: number
  moderateCells: number
  highRiskCells: number
  criticalCells: number
  confidence: HazardConfidenceLevel
  validationStatus: string | null
  trend: HazardTrend
}

export interface TimelineHazardSummary {
  eventStatus: RiskLevel
  peakValue: number | null
  anomaly: number | null
  affectedCells: number
  confidence: HazardConfidenceLevel
}

/** Full hazard engine output consumed by UI layers. */
export type HazardResult = HazardAssessment

export interface HazardAssessment {
  status: HazardAnalysisStatus
  statusMessage: string
  hazardId: HazardId
  categoryLabel: string
  hazardVariable: OceanVariable
  analyzedDepth: number
  analyzedDate: string
  eventStatus: RiskLevel
  eventLabel: string
  affectedRegion: ValidationRegionBounds
  dataAvailability: HazardDataAvailability
  event: HazardEvent | null
  primaryIndicator: HazardIndicatorResult
  indicators: HazardIndicatorResult[]
  riskDistribution: RiskDistribution
  peakValue: number | null
  meanValue: number | null
  explanation: string[]
  whyFlagged: string[]
  monitoringGuidance: string[]
  dataLimitations: string[]
  confidence: HazardConfidenceLevel
  confidenceNote: string
  validationStatus: string | null
  lastUpdated: string
  gridSnapshot: HazardGridSnapshot | null
  timelineSummary: TimelineHazardSummary | null
  isDemo: true
}

export interface HazardEngineInput {
  hazardId: HazardId
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedDate: string
  apiModelDepth: number
  region: ValidationRegionBounds
  fields: OceanFieldBundle
  comparison: ValidationStats | null
  regionValidation: RegionValidationStats | null
  hasObservationsInRegion: boolean
  matchedPlatformsInRegion: number
  isFieldLoading: boolean
  availableTimestepCount: number
  previousPeakValue: number | null
}
