import type { BufferAttribute } from 'three'
import type { ApiBounds, ApiGrid } from '../types/api'
import { isInsideGeoBounds, OCEAN_BASE_VERTEX_RGB } from './geoProjection'
import { isOnLand } from './landMask'

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

/** Apply per-vertex colors from an API lat/lon grid with land masking. */
export function colorGridVertices(
  colors: BufferAttribute,
  grid: ApiGrid,
  paintCell: (latIndex: number, lonIndex: number) => { r: number; g: number; b: number } | null,
): void {
  const cols = grid.longitudes.length
  for (let j = 0; j < grid.latitudes.length; j++) {
    for (let i = 0; i < grid.longitudes.length; i++) {
      const idx = j * cols + i
      const lat = grid.latitudes[j]
      const lon = grid.longitudes[i]
      if (isOnLand(lat, lon)) {
        setOceanBaseVertexColor(colors, idx)
        continue
      }
      const rgb = paintCell(j, i)
      if (!rgb) {
        setOceanBaseVertexColor(colors, idx)
        continue
      }
      colors.setXYZ(idx, rgb.r, rgb.g, rgb.b)
    }
  }
}
