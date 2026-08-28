import type { DepthMatchKind, Instrument, OceanVariable } from './ocean'

export type AnalysisMode =
  | 'model'
  | 'observation'
  | 'difference'
  | 'absoluteError'
  | 'regionalValidation'

export interface SpatialValidationPoint {
  instrumentId: string
  latitude: number
  longitude: number
  model: number | null
  observation: number | null
  /** model − observation (display convention for difference mode) */
  difference: number | null
  absoluteError: number | null
  depthMatch: DepthMatchKind
  hasData: boolean
}

export interface RegionValidationStats {
  variable: OceanVariable
  unit: string
  matchedPlatforms: number
  meanBias: number | null
  mae: number | null
  rmse: number | null
  maxAbsoluteError: number | null
  medianAbsoluteError: number | null
}

export interface SpatialAnalysisSnapshot {
  points: SpatialValidationPoint[]
  region: RegionValidationStats
  /** Value range for the active analysis mode legend */
  legendMin: number | null
  legendMax: number | null
  hasData: boolean
}

export interface InstrumentProfileCacheEntry {
  instrument: Instrument
  profile: import('./ocean').InstrumentProfile
  observationTime: string
}
