import * as THREE from 'three'
import type { ApiGrid } from '../types/api'
import {
  GEO_MODEL_SURFACE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
  OCEAN_BASE_VERTEX_RGB,
  type GeoBounds,
} from './geoProjection'
import { isOceanCell } from './landMask'

export interface ModelGridGeometryMeta {
  grid: ApiGrid
  viewBounds: GeoBounds
  surfaceY: number
  /** Vertex index ranges [start, count] for each rendered ocean cell. */
  cellVertexRanges: Array<{ latIndex: number; lonIndex: number; start: number; count: number }>
}

/**
 * Build model mesh from geographic grid cells.
 * Each cell is a quad with corners at real (longitude, latitude) positions.
 */
export function createModelGridGeometry(
  grid: ApiGrid,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  surfaceY: number = GEO_MODEL_SURFACE_Y,
): THREE.BufferGeometry {
  const { latitudes, longitudes } = grid
  const positions: number[] = []
  const colors: number[] = []
  const geoLats: number[] = []
  const geoLons: number[] = []
  const cellVertexRanges: ModelGridGeometryMeta['cellVertexRanges'] = []

  for (let j = 0; j < latitudes.length - 1; j++) {
    for (let i = 0; i < longitudes.length - 1; i++) {
      const latMin = latitudes[j]
      const latMax = latitudes[j + 1]
      const lonMin = longitudes[i]
      const lonMax = longitudes[i + 1]
      if (!isOceanCell(latMin, latMax, lonMin, lonMax)) continue

      const start = positions.length / 3
      const corners = [
        { lat: latMin, lon: lonMin },
        { lat: latMin, lon: lonMax },
        { lat: latMax, lon: lonMin },
        { lat: latMax, lon: lonMax },
      ]

      for (const { lat, lon } of corners) {
        const { x, y, z } = latLonToWorld(lat, lon, surfaceY, viewBounds)
        positions.push(x, y, z)
        colors.push(OCEAN_BASE_VERTEX_RGB.r, OCEAN_BASE_VERTEX_RGB.g, OCEAN_BASE_VERTEX_RGB.b)
        geoLats.push(lat)
        geoLons.push(lon)
      }

      cellVertexRanges.push({
        latIndex: j,
        lonIndex: i,
        start,
        count: 4,
      })
    }
  }

  const indices: number[] = []
  for (let v = 0; v < positions.length / 3; v += 4) {
    indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('geoLat', new THREE.Float32BufferAttribute(geoLats, 1))
  geometry.setAttribute('geoLon', new THREE.Float32BufferAttribute(geoLons, 1))
  geometry.userData = {
    grid,
    viewBounds,
    surfaceY,
    cellVertexRanges,
  } satisfies ModelGridGeometryMeta
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function getModelGridMeta(
  geometry: THREE.BufferGeometry,
): ModelGridGeometryMeta | null {
  const meta = geometry.userData as Partial<ModelGridGeometryMeta> | undefined
  if (!meta?.grid) return null
  return meta as ModelGridGeometryMeta
}

export function gridsEqual(a: ApiGrid, b: ApiGrid): boolean {
  if (a.latitudes.length !== b.latitudes.length || a.longitudes.length !== b.longitudes.length) {
    return false
  }
  return (
    a.latitudes.every((v, i) => v === b.latitudes[i]) &&
    a.longitudes.every((v, i) => v === b.longitudes[i])
  )
}

/** Paint each ocean cell from grid values (south-west node indexing). */
export function paintModelGridFromValues(
  geometry: THREE.BufferGeometry,
  values: number[][],
  colorForValue: (value: number) => { r: number; g: number; b: number },
): void {
  const meta = getModelGridMeta(geometry)
  const colors = geometry.attributes.color as THREE.BufferAttribute
  if (!meta) return

  for (const cell of meta.cellVertexRanges) {
    const value = values[cell.latIndex]?.[cell.lonIndex]
    if (value == null || Number.isNaN(value)) continue
    const rgb = colorForValue(value)
    for (let v = cell.start; v < cell.start + cell.count; v++) {
      colors.setXYZ(v, rgb.r, rgb.g, rgb.b)
    }
  }
  colors.needsUpdate = true
}
