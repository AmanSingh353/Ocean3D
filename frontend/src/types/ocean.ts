export type OceanVariable = 'temperature' | 'current' | 'salinity'

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
}

export interface InstrumentProfile {
  instrumentId: string
  variable: OceanVariable
  date: string
  points: ProfilePoint[]
}

export interface ComparisonStats {
  model: number
  observation: number
  difference: number
  rmse: number
}

export interface ModelConfig {
  variable: OceanVariable
  unit: string
  depths: number[]
  temperatureRange: { min: number; max: number }
  dates: string[]
}
