import * as THREE from 'three'
import type { ApiBounds, ApiTemperatureField } from '../types/api'
import {
  temperatureToColor,
  type TemperatureRange,
} from './temperatureColor'
import { worldToLatLon, INDIAN_OCEAN_VIEW_BOUNDS } from './geoProjection'
import { colorGridVertices, bilinearSampleGrid, isInsideModelBounds, setOceanBaseVertexColor } from './fieldSampling'
import { getModelGridMeta, paintModelGridFromValues } from './modelGridGeometry'
import { isOnLand } from './landMask'

/** Map Three.js scene X/Z to geographic coordinates within the view domain. */
export function sceneToLatLon(
  x: number,
  z: number,
  _bounds?: ApiBounds,
): { lat: number; lon: number } {
  return worldToLatLon(x, z, INDIAN_OCEAN_VIEW_BOUNDS)
}

/** Compute min/max from the API grid, ignoring null/NaN values. */
export function getTemperatureRange(field: ApiTemperatureField): TemperatureRange {
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
    return { min: 0, max: 1 }
  }

  if (min === max) {
    return { min: min - 0.5, max: max + 0.5 }
  }

  return { min, max }
}

/** Bilinear sample of the API temperature grid at a lat/lon point. */
export function sampleTemperatureField(
  field: ApiTemperatureField,
  lat: number,
  lon: number,
): number {
  return bilinearSampleGrid(field.values, field.grid, lat, lon) ?? 0
}

/** Apply API temperature colors to an existing BufferGeometry vertex color attribute. */
export function applyTemperatureFieldToGeometry(
  geometry: THREE.BufferGeometry,
  field: ApiTemperatureField,
  range: TemperatureRange,
): void {
  const positions = geometry.attributes.position
  const colors = geometry.attributes.color as THREE.BufferAttribute
  const meta = getModelGridMeta(geometry)

  if (meta?.cellVertexRanges) {
    paintModelGridFromValues(geometry, field.values, (temp) => {
      const c = temperatureToColor(temp, range.min, range.max)
      return { r: c.r, g: c.g, b: c.b }
    })
    return
  }

  if (meta) {
    colorGridVertices(colors, meta.grid, (j, i) => {
      const temp = field.values[j][i]
      const c = temperatureToColor(temp, range.min, range.max)
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
    const temp = sampleTemperatureField(field, lat, lon)
    const c = temperatureToColor(temp, range.min, range.max)
    colors.setXYZ(i, c.r, c.g, c.b)
  }
  colors.needsUpdate = true
}
