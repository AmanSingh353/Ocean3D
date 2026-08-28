/** Types matching FastAPI Pydantic response schemas (JSON field names). */

export interface ApiBounds {
  lat_min: number
  lat_max: number
  lon_min: number
  lon_max: number
}

export interface ApiGrid {
  latitudes: number[]
  longitudes: number[]
}

export interface ApiTemperatureField {
  variable: 'temperature'
  unit: '°C'
  date: string
  depth: number
  bounds: ApiBounds
  grid: ApiGrid
  values: number[][]
}

export interface ApiSalinityField {
  variable: 'salinity'
  unit: 'PSU'
  date: string
  depth: number
  bounds: ApiBounds
  grid: ApiGrid
  values: number[][]
}

export interface ApiChlorophyllField {
  variable: 'chlorophyll'
  unit: 'mg/m³'
  date: string
  depth: number
  bounds: ApiBounds
  grid: ApiGrid
  values: number[][]
}

export interface ApiCurrentField {
  variable: 'current'
  unit: 'm/s'
  date: string
  depth: number
  bounds: ApiBounds
  grid: ApiGrid
  u: number[][]
  v: number[][]
  magnitude: number[][]
}

export interface ApiVariableInfo {
  name: string
  unit: string
}

export interface ApiRegionInfo {
  lat_min: number
  lat_max: number
  lon_min: number
  lon_max: number
}

export interface ApiModelMetadata {
  variables: ApiVariableInfo[]
  depths: number[]
  dates: string[]
  region: ApiRegionInfo
}

export interface ApiInstrumentSummary {
  id: string
  type: 'argo' | 'glider'
  latitude: number
  longitude: number
  max_depth: number
  status: 'ACTIVE' | 'INACTIVE'
  last_updated: string
}

export interface ApiInstrument extends ApiInstrumentSummary {
  data_quality: 'GOOD' | 'FAIR' | 'POOR'
  platform_type: string
}

export interface ApiProfileObservation {
  depth: number
  value: number
}

export interface ApiProfileComparisonPoint {
  depth: number
  observation: number
  model: number
}

export interface ApiInstrumentProfile {
  instrument_id: string
  variable: 'temperature'
  unit: '°C'
  date: string
  observations: ApiProfileObservation[]
  comparison: ApiProfileComparisonPoint[]
}

export interface ApiHealthResponse {
  status: 'ok'
}
