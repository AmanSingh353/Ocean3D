import * as THREE from 'three'
import type { ApiBounds } from '../types/api'
import {
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToSceneXZ,
  OCEAN_BASE_VERTEX_RGB,
  type GeoBounds,
} from './geoProjection'
import { createBoundsQuadGeometry } from './geoJsonMap'

/**
 * Model visualization grid spanning the full geographic view domain.
 * Each vertex is placed at an actual lat/lon — field coloring fills the API model extent.
 */
export function createViewSurfaceGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  segmentsX = 28,
  segmentsZ = 22,
): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const colors: number[] = []

  for (let j = 0; j <= segmentsZ; j++) {
    for (let i = 0; i <= segmentsX; i++) {
      const lon =
        viewBounds.lon_min +
        (i / segmentsX) * (viewBounds.lon_max - viewBounds.lon_min)
      const lat =
        viewBounds.lat_min +
        (j / segmentsZ) * (viewBounds.lat_max - viewBounds.lat_min)
      const { x, z } = latLonToSceneXZ(lat, lon, viewBounds)
      vertices.push(x, 0, z)
      colors.push(OCEAN_BASE_VERTEX_RGB.r, OCEAN_BASE_VERTEX_RGB.g, OCEAN_BASE_VERTEX_RGB.b)
    }
  }

  const cols = segmentsX + 1
  for (let j = 0; j < segmentsZ; j++) {
    for (let i = 0; i < segmentsX; i++) {
      const a = j * cols + i
      const b = a + 1
      const c = a + cols
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

/** @deprecated Use createViewSurfaceGeometry */
export function createModelSurfaceGeometry(
  _dataBounds: ApiBounds,
  segmentsX = 28,
  segmentsZ = 22,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  return createViewSurfaceGeometry(viewBounds, segmentsX, segmentsZ)
}

/** Full-view dark ocean base plane aligned to geographic corners. */
export function createOceanBaseGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  return createBoundsQuadGeometry(viewBounds, -0.01)
}

/** Depth slice plane sized to model data bounds. */
export function createDepthSliceGeometry(
  dataBounds: ApiBounds,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  const sw = latLonToSceneXZ(dataBounds.lat_min, dataBounds.lon_min, viewBounds)
  const se = latLonToSceneXZ(dataBounds.lat_min, dataBounds.lon_max, viewBounds)
  const ne = latLonToSceneXZ(dataBounds.lat_max, dataBounds.lon_max, viewBounds)
  const nw = latLonToSceneXZ(dataBounds.lat_max, dataBounds.lon_min, viewBounds)

  const positions = new Float32Array([
    sw.x, 0, sw.z, se.x, 0, se.z, nw.x, 0, nw.z,
    se.x, 0, se.z, ne.x, 0, ne.z, nw.x, 0, nw.z,
  ])

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
