import type { ModelConfig } from '../types/ocean'
import { OCEAN_DEPTHS } from './depths'
import { OCEAN_TIMESTAMPS } from './timestamps'
import { VARIABLE_DEMO_RANGES } from './variables'

/** Indian Ocean model domain — mirrors backend LAT/LON bounds. */
export const OCEAN_MODEL_REGION = {
  lat_min: 5,
  lat_max: 20,
  lon_min: 65,
  lon_max: 85,
} as const

/** Default integer-degree grid nodes for bootstrap rendering before API load. */
export function defaultOceanModelGrid(): { latitudes: number[]; longitudes: number[] } {
  const latitudes: number[] = []
  for (let lat = OCEAN_MODEL_REGION.lat_min; lat <= OCEAN_MODEL_REGION.lat_max; lat++) {
    latitudes.push(lat)
  }
  const longitudes: number[] = []
  for (let lon = OCEAN_MODEL_REGION.lon_min; lon <= OCEAN_MODEL_REGION.lon_max; lon++) {
    longitudes.push(lon)
  }
  return { latitudes, longitudes }
}

/** Bootstrap model config before `/api/model/metadata` loads. */
export const OCEAN_MODEL_CONFIG: ModelConfig = {
  variable: 'temperature',
  unit: '°C',
  depths: [...OCEAN_DEPTHS],
  temperatureRange: VARIABLE_DEMO_RANGES.temperature,
  dates: [...OCEAN_TIMESTAMPS],
}
