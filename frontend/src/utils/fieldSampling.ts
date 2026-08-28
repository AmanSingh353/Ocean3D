import type { BufferAttribute } from 'three'
import type { ApiBounds } from '../types/api'
import { isInsideGeoBounds, OCEAN_BASE_VERTEX_RGB } from './geoProjection'

/** Whether a lat/lon lies within the API model grid bounds. */
export function isInsideModelBounds(
  lat: number,
  lon: number,
  bounds: ApiBounds,
): boolean {
  return isInsideGeoBounds(lat, lon, bounds)
}

export function setOceanBaseVertexColor(colors: BufferAttribute, index: number): void {
  colors.setXYZ(index, OCEAN_BASE_VERTEX_RGB.r, OCEAN_BASE_VERTEX_RGB.g, OCEAN_BASE_VERTEX_RGB.b)
}
