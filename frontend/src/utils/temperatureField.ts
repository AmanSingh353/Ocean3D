import * as THREE from 'three'
import type { ApiBounds, ApiTemperatureField } from '../types/api'
import { temperatureToColor } from './temperatureColor'

/** Map Three.js scene X/Z to geographic coordinates within API bounds. */
export function sceneToLatLon(
  x: number,
  z: number,
  bounds: ApiBounds,
  sceneWidth = 28,
  sceneDepth = 18,
): { lat: number; lon: number } {
  const lon =
    bounds.lon_min +
    ((x + sceneWidth / 2) / sceneWidth) * (bounds.lon_max - bounds.lon_min)
  const lat =
    bounds.lat_max -
    ((z + sceneDepth / 2) / sceneDepth) * (bounds.lat_max - bounds.lat_min)
  return { lat, lon }
}

/** Bilinear sample of the API temperature grid at a lat/lon point. */
export function sampleTemperatureField(
  field: ApiTemperatureField,
  lat: number,
  lon: number,
): number {
  const { latitudes, longitudes } = field.grid
  const latClamped = Math.max(
    latitudes[0],
    Math.min(latitudes[latitudes.length - 1], lat),
  )
  const lonClamped = Math.max(
    longitudes[0],
    Math.min(longitudes[longitudes.length - 1], lon),
  )

  let latIdx = latitudes.findIndex((v) => v >= latClamped)
  if (latIdx <= 0) latIdx = 1
  let lonIdx = longitudes.findIndex((v) => v >= lonClamped)
  if (lonIdx <= 0) lonIdx = 1

  const lat0 = latitudes[latIdx - 1]
  const lat1 = latitudes[latIdx]
  const lon0 = longitudes[lonIdx - 1]
  const lon1 = longitudes[lonIdx]

  const latT = lat1 === lat0 ? 0 : (latClamped - lat0) / (lat1 - lat0)
  const lonT = lon1 === lon0 ? 0 : (lonClamped - lon0) / (lon1 - lon0)

  const v00 = field.values[latIdx - 1][lonIdx - 1]
  const v01 = field.values[latIdx - 1][lonIdx]
  const v10 = field.values[latIdx][lonIdx - 1]
  const v11 = field.values[latIdx][lonIdx]

  const top = v00 + lonT * (v01 - v00)
  const bottom = v10 + lonT * (v11 - v10)
  return top + latT * (bottom - top)
}

/** Apply API temperature colors to an existing BufferGeometry vertex color attribute. */
export function applyTemperatureFieldToGeometry(
  geometry: THREE.BufferGeometry,
  field: ApiTemperatureField,
): void {
  const positions = geometry.attributes.position
  const colors = geometry.attributes.color as THREE.BufferAttribute

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const { lat, lon } = sceneToLatLon(x, z, field.bounds)
    const temp = sampleTemperatureField(field, lat, lon)
    const c = temperatureToColor(temp)
    colors.setXYZ(i, c.r, c.g, c.b)
  }
  colors.needsUpdate = true
}
