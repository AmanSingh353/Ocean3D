export type OceanVariable = 'temperature' | 'current' | 'salinity' | 'chlorophyll'

export type InstrumentType = 'argo' | 'glider'

export interface Instrument {
  id: string
  type: InstrumentType
  name: string
  latitude: number
  longitude: number
  maxDepth: number
  currentDepth: number
  status: 'ACTIVE' | 'INACTIVE'
  dataQuality: 'GOOD' | 'FAIR' | 'POOR'
  instrumentLabel: string
  platformType: string
}

export interface ProfilePoint {
  depth: number
  model: number
  observation: number
  salinityModel?: number
  salinityObservation?: number
  chlorophyllModel?: number
  chlorophyllObservation?: number
  currentModel?: number
  currentObservation?: number
}

export interface ProfileSeries {
  variable: OceanVariable
  label: string
  unit: string
  points: {
    depth: number
    model: number | null
    observation: number | null
  }[]
}

export interface InstrumentProfile {
  instrumentId: string
  variable: OceanVariable
  date: string
  points: ProfilePoint[]
}

export type ValidationStatus = 'GOOD' | 'MODERATE' | 'POOR'

export type DepthMatchKind = 'exact' | 'interpolated' | 'unavailable'

export interface ValidationStats {
  variable: OceanVariable
  unit: string
  comparedDepth: number
  depthMatch: DepthMatchKind
  model: number | null
  observation: number | null
  /** Observation − model at compared depth */
  bias: number | null
  /** Model − observation at compared depth */
  difference: number | null
  meanBias: number
  mae: number
  rmse: number
  matchedPoints: number
  validationStatus: ValidationStatus
}

/** @deprecated Alias for ValidationStats */
export type ComparisonStats = ValidationStats

export interface ModelConfig {
  variable: OceanVariable
  unit: string
  depths: number[]
  temperatureRange: { min: number; max: number }
  dates: string[]
}
