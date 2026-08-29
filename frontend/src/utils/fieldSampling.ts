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

/** Bilinear sample of a regular lat/lon grid (ascending lat/lon arrays). */
export function bilinearSampleGrid(
  values: number[][],
  grid: ApiGrid,
  lat: number,
  lon: number,
): number | null {
  const { latitudes, longitudes } = grid
  if (latitudes.length === 0 || longitudes.length === 0) return null

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

  const v00 = values[latIdx - 1]?.[lonIdx - 1]
  const v01 = values[latIdx - 1]?.[lonIdx]
  const v10 = values[latIdx]?.[lonIdx - 1]
  const v11 = values[latIdx]?.[lonIdx]

  if ([v00, v01, v10, v11].some((v) => v == null || Number.isNaN(v))) return null

  const top = v00! + lonT * (v01! - v00!)
  const bottom = v10! + lonT * (v11! - v10!)
  return top + latT * (bottom - top)
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
