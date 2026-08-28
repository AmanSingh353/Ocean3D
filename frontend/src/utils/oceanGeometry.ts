import * as THREE from 'three'
import type { ApiBounds } from '../types/api'
import type { CoastlinePolyline } from '../data/indianOceanCoastlines'
import {
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToSceneXZ,
  type GeoBounds,
} from './geoProjection'

/** Build line segments geometry for coastlines at y = elevation. */
export function createCoastlineGeometry(
  polylines: CoastlinePolyline[],
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  elevation = 0.14,
): THREE.BufferGeometry {
  const positions: number[] = []

  for (const line of polylines) {
    const coords = line.coordinates
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i]
      const [lon2, lat2] = coords[i + 1]
      const p1 = latLonToSceneXZ(lat1, lon1, viewBounds)
      const p2 = latLonToSceneXZ(lat2, lon2, viewBounds)
      positions.push(p1.x, elevation, p1.z, p2.x, elevation, p2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/** Geographic model-data surface aligned to API bounds within the view domain. */
export function createModelSurfaceGeometry(
  dataBounds: ApiBounds,
  segmentsX = 14,
  segmentsZ = 10,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const colors: number[] = []

  for (let j = 0; j <= segmentsZ; j++) {
    for (let i = 0; i <= segmentsX; i++) {
      const lon =
        dataBounds.lon_min +
        (i / segmentsX) * (dataBounds.lon_max - dataBounds.lon_min)
      const lat =
        dataBounds.lat_min +
        (j / segmentsZ) * (dataBounds.lat_max - dataBounds.lat_min)
      const { x, z } = latLonToSceneXZ(lat, lon, viewBounds)
      vertices.push(x, 0, z)
      colors.push(0.04, 0.09, 0.12)
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

/** Full-view dark ocean base plane. */
export function createOceanBaseGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  const sw = latLonToSceneXZ(viewBounds.lat_min, viewBounds.lon_min, viewBounds)
  const ne = latLonToSceneXZ(viewBounds.lat_max, viewBounds.lon_max, viewBounds)
  const width = Math.abs(ne.x - sw.x)
  const depth = Math.abs(ne.z - sw.z)
  const centerX = (sw.x + ne.x) / 2
  const centerZ = (sw.z + ne.z) / 2

  const geometry = new THREE.PlaneGeometry(width, depth, 1, 1)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(centerX, 0, centerZ)
  return geometry
}

/** Depth slice plane sized to model data bounds. */
export function createDepthSliceGeometry(
  dataBounds: ApiBounds,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  const sw = latLonToSceneXZ(dataBounds.lat_min, dataBounds.lon_min, viewBounds)
  const ne = latLonToSceneXZ(dataBounds.lat_max, dataBounds.lon_max, viewBounds)
  const width = Math.abs(ne.x - sw.x)
  const depth = Math.abs(ne.z - sw.z)
  const centerX = (sw.x + ne.x) / 2
  const centerZ = (sw.z + ne.z) / 2

  const geometry = new THREE.PlaneGeometry(width, depth, 1, 1)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(centerX, 0, centerZ)
  return geometry
}
