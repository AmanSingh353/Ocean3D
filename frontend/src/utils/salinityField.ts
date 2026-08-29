import * as THREE from 'three'
import type { ApiSalinityField } from '../types/api'
import { getVariableDemoRange } from '../data/variables'
import { salinityToColor, type SalinityRange } from './salinityColor'
import { sceneToLatLon } from './temperatureField'
import { colorGridVertices, isInsideModelBounds, setOceanBaseVertexColor } from './fieldSampling'
import { getModelGridMeta, paintModelGridFromValues } from './modelGridGeometry'
import { isOnLand } from './landMask'

/** Compute min/max from the API grid, ignoring null/NaN values. */
export function getSalinityRange(field: ApiSalinityField): SalinityRange {
  let min = Infinity
  let max = -Infinity

  for (const row of field.values) {
    for (const value of row) {
      if (value == null || Number.isNaN(value)) continue
      if (value < min) min = value
      if (value > max) max = value
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return getVariableDemoRange('salinity')
  }

  if (min === max) {
    const demo = getVariableDemoRange('salinity')
    const pad = (demo.max - demo.min) * 0.05
    return { min: min - pad, max: max + pad }
  }

  return getVariableDemoRange('salinity')
}

/** Bilinear sample of the API salinity grid at a lat/lon point. */
export function sampleSalinityField(
  field: ApiSalinityField,
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

/** Apply API salinity colors to an existing BufferGeometry vertex color attribute. */
export function applySalinityFieldToGeometry(
  geometry: THREE.BufferGeometry,
  field: ApiSalinityField,
  range: SalinityRange,
): void {
  const positions = geometry.attributes.position
  const colors = geometry.attributes.color as THREE.BufferAttribute
  const meta = getModelGridMeta(geometry)

  if (meta?.cellVertexRanges) {
    paintModelGridFromValues(geometry, field.values, (salinity) => {
      const c = salinityToColor(salinity, range.min, range.max)
      return { r: c.r, g: c.g, b: c.b }
    })
    return
  }

  if (meta) {
    colorGridVertices(colors, meta.grid, (j, i) => {
      const salinity = field.values[j][i]
      const c = salinityToColor(salinity, range.min, range.max)
      return { r: c.r, g: c.g, b: c.b }
    })
    colors.needsUpdate = true
    return
  }

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const { lat, lon } = sceneToLatLon(x, z, field.bounds)
    if (isOnLand(lat, lon) || !isInsideModelBounds(lat, lon, field.bounds)) {
      setOceanBaseVertexColor(colors, i)
      continue
    }
    const salinity = sampleSalinityField(field, lat, lon)
    const c = salinityToColor(salinity, range.min, range.max)
    colors.setXYZ(i, c.r, c.g, c.b)
  }
  colors.needsUpdate = true
}
