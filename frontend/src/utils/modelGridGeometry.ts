import * as THREE from 'three'
import type { ApiGrid } from '../types/api'
import {
  GEO_MODEL_SURFACE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
  type GeoBounds,
} from './geoProjection'
import { bilinearSampleGrid } from './fieldSampling'
import { isOnLand } from './landMask'
import { CELL_ALPHA_ATTR } from './modelFieldMaterial'

/** Sub-cells per API grid axis — finer mask along coastlines (110m land data). */
export const MODEL_GRID_SUBCELLS = 4

export interface ModelGridCellRange {
  latIndex: number
  lonIndex: number
  sampleLat: number
  sampleLon: number
  start: number
  count: number
}

export interface ModelGridGeometryMeta {
  grid: ApiGrid
  viewBounds: GeoBounds
  surfaceY: number
  cellVertexRanges: ModelGridCellRange[]
}

function pushCellQuad(
  corners: Array<{ lat: number; lon: number }>,
  surfaceY: number,
  viewBounds: GeoBounds,
  positions: number[],
  colors: number[],
  alphas: number[],
  geoLats: number[],
  geoLons: number[],
): number {
  const start = positions.length / 3

  for (const { lat, lon } of corners) {
    const { x, y, z } = latLonToWorld(lat, lon, surfaceY, viewBounds)
    positions.push(x, y, z)
    colors.push(0, 0, 0)
    alphas.push(0)
    geoLats.push(lat)
    geoLons.push(lon)
  }

  return start
}

/** Sub-cell is included when at least one corner lies over ocean. */
function subcellTouchesOcean(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  const corners: [number, number][] = [
    [latMin, lonMin],
    [latMin, lonMax],
    [latMax, lonMin],
    [latMax, lonMax],
  ]
  return corners.some(([lat, lon]) => !isOnLand(lat, lon))
}

/**
 * Build model mesh from geographic grid cells, sub-divided and clipped to ocean.
 * Each sub-cell quad uses corners at real (longitude, latitude) positions.
 * Per-vertex alpha starts at 0; valid ocean data sets alpha to 1 at paint time.
 */
export function createModelGridGeometry(
  grid: ApiGrid,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  surfaceY: number = GEO_MODEL_SURFACE_Y,
): THREE.BufferGeometry {
  const { latitudes, longitudes } = grid
  const positions: number[] = []
  const colors: number[] = []
  const alphas: number[] = []
  const geoLats: number[] = []
  const geoLons: number[] = []
  const cellVertexRanges: ModelGridCellRange[] = []

  for (let j = 0; j < latitudes.length - 1; j++) {
    for (let i = 0; i < longitudes.length - 1; i++) {
      const latMin = latitudes[j]
      const latMax = latitudes[j + 1]
      const lonMin = longitudes[i]
      const lonMax = longitudes[i + 1]

      const latSpan = latMax - latMin
      const lonSpan = lonMax - lonMin

      for (let sj = 0; sj < MODEL_GRID_SUBCELLS; sj++) {
        for (let si = 0; si < MODEL_GRID_SUBCELLS; si++) {
          const subLatMin = latMin + (latSpan * sj) / MODEL_GRID_SUBCELLS
          const subLatMax = latMin + (latSpan * (sj + 1)) / MODEL_GRID_SUBCELLS
          const subLonMin = lonMin + (lonSpan * si) / MODEL_GRID_SUBCELLS
          const subLonMax = lonMin + (lonSpan * (si + 1)) / MODEL_GRID_SUBCELLS

          if (!subcellTouchesOcean(subLatMin, subLatMax, subLonMin, subLonMax)) continue

          const corners = [
            { lat: subLatMin, lon: subLonMin },
            { lat: subLatMin, lon: subLonMax },
            { lat: subLatMax, lon: subLonMin },
            { lat: subLatMax, lon: subLonMax },
          ]

          const sampleLat = (subLatMin + subLatMax) / 2
          const sampleLon = (subLonMin + subLonMax) / 2
          const start = pushCellQuad(
            corners,
            surfaceY,
            viewBounds,
            positions,
            colors,
            alphas,
            geoLats,
            geoLons,
          )

          cellVertexRanges.push({
            latIndex: j,
            lonIndex: i,
            sampleLat,
            sampleLon,
            start,
            count: 4,
          })
        }
      }
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
  geometry.setAttribute(CELL_ALPHA_ATTR, new THREE.Float32BufferAttribute(alphas, 1))
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

export function getCellAlphaAttribute(
  geometry: THREE.BufferGeometry,
): THREE.BufferAttribute | null {
  const attr = geometry.getAttribute(CELL_ALPHA_ATTR)
  if (!attr || !(attr instanceof THREE.BufferAttribute)) return null
  return attr
}

export function clearModelFieldVisibility(geometry: THREE.BufferGeometry): void {
  const alphas = getCellAlphaAttribute(geometry)
  if (!alphas) return
  for (let i = 0; i < alphas.count; i++) {
    alphas.setX(i, 0)
  }
  alphas.needsUpdate = true
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

/** Paint ocean sub-cells; land corners and invalid data remain alpha = 0. */
export function paintModelGridFromValues(
  geometry: THREE.BufferGeometry,
  values: number[][],
  colorForValue: (value: number) => { r: number; g: number; b: number },
): void {
  const meta = getModelGridMeta(geometry)
  const colors = geometry.attributes.color as THREE.BufferAttribute
  const alphas = getCellAlphaAttribute(geometry)
  const geoLat = geometry.getAttribute('geoLat') as THREE.BufferAttribute | undefined
  const geoLon = geometry.getAttribute('geoLon') as THREE.BufferAttribute | undefined
  if (!meta || !alphas || !geoLat || !geoLon) return

  for (const cell of meta.cellVertexRanges) {
    const value = bilinearSampleGrid(values, meta.grid, cell.sampleLat, cell.sampleLon)
    const hasValue = value != null && !Number.isNaN(value)

    for (let v = cell.start; v < cell.start + cell.count; v++) {
      const lat = geoLat.getX(v)
      const lon = geoLon.getX(v)
      if (isOnLand(lat, lon) || !hasValue) {
        alphas.setX(v, 0)
        continue
      }
      const rgb = colorForValue(value!)
      colors.setXYZ(v, rgb.r, rgb.g, rgb.b)
      alphas.setX(v, 1)
    }
  }

  colors.needsUpdate = true
  alphas.needsUpdate = true
}
