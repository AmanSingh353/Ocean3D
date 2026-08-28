import * as THREE from 'three'
import type {
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  Position,
} from '../types/geojson'
import {
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToSceneXZ,
  type GeoBounds,
} from './geoProjection'

function appendLineRing(
  ring: Position[],
  positions: number[],
  viewBounds: GeoBounds,
  elevation: number,
): void {
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]
    const [lon2, lat2] = ring[i + 1]
    const p1 = latLonToSceneXZ(lat1, lon1, viewBounds)
    const p2 = latLonToSceneXZ(lat2, lon2, viewBounds)
    positions.push(p1.x, elevation, p1.z, p2.x, elevation, p2.z)
  }
}

function polygonToGeometry(
  rings: Position[][],
  viewBounds: GeoBounds,
  elevation: number,
): THREE.BufferGeometry | null {
  const exterior = rings[0]
  if (!exterior || exterior.length < 4) return null

  const shape = new THREE.Shape()
  const [lon0, lat0] = exterior[0]
  const start = latLonToSceneXZ(lat0, lon0, viewBounds)
  shape.moveTo(start.x, start.z)

  for (let i = 1; i < exterior.length; i++) {
    const [lon, lat] = exterior[i]
    const p = latLonToSceneXZ(lat, lon, viewBounds)
    shape.lineTo(p.x, p.z)
  }

  for (let h = 1; h < rings.length; h++) {
    const ring = rings[h]
    if (ring.length < 4) continue
    const hole = new THREE.Path()
    const [hlon0, hlat0] = ring[0]
    const hStart = latLonToSceneXZ(hlat0, hlon0, viewBounds)
    hole.moveTo(hStart.x, hStart.z)
    for (let i = 1; i < ring.length; i++) {
      const [lon, lat] = ring[i]
      const p = latLonToSceneXZ(lat, lon, viewBounds)
      hole.lineTo(p.x, p.z)
    }
    shape.holes.push(hole)
  }

  const geometry = new THREE.ShapeGeometry(shape)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, elevation, 0)
  return geometry
}

function collectLandGeometries(
  geometry: GeoJsonGeometry,
  viewBounds: GeoBounds,
  elevation: number,
  out: THREE.BufferGeometry[],
): void {
  if (geometry.type === 'Polygon') {
    const g = polygonToGeometry(geometry.coordinates, viewBounds, elevation)
    if (g) out.push(g)
    return
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      const g = polygonToGeometry(poly, viewBounds, elevation)
      if (g) out.push(g)
    }
  }
}

function collectCoastlinePositions(
  geometry: GeoJsonGeometry,
  positions: number[],
  viewBounds: GeoBounds,
  elevation: number,
): void {
  if (geometry.type === 'LineString') {
    appendLineRing(geometry.coordinates, positions, viewBounds, elevation)
    return
  }
  if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      appendLineRing(line, positions, viewBounds, elevation)
    }
    return
  }
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      appendLineRing(ring, positions, viewBounds, elevation)
    }
    return
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        appendLineRing(ring, positions, viewBounds, elevation)
      }
    }
  }
}

/** Build land-fill meshes from Natural Earth (or similar) land polygons. */
export function createLandGeometriesFromGeoJSON(
  collection: GeoJsonFeatureCollection,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  elevation = 0.13,
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = []
  for (const feature of collection.features) {
    collectLandGeometries(feature.geometry, viewBounds, elevation, geometries)
  }
  return geometries
}

/** Build coastline line segments from Natural Earth coastline GeoJSON. */
export function createCoastlineGeometryFromGeoJSON(
  collection: GeoJsonFeatureCollection,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  elevation = 0.16,
): THREE.BufferGeometry {
  const positions: number[] = []
  for (const feature of collection.features) {
    collectCoastlinePositions(feature.geometry, positions, viewBounds, elevation)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/** Subtle lat/lon graticule for geographic reference. */
export function createGraticuleGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  step = 10,
  elevation = 0.08,
): THREE.BufferGeometry {
  const positions: number[] = []

  const latStart = Math.ceil(viewBounds.lat_min / step) * step
  for (let lat = latStart; lat <= viewBounds.lat_max; lat += step) {
    appendLineRing(
      [
        [viewBounds.lon_min, lat],
        [viewBounds.lon_max, lat],
      ],
      positions,
      viewBounds,
      elevation,
    )
  }

  const lonStart = Math.ceil(viewBounds.lon_min / step) * step
  for (let lon = lonStart; lon <= viewBounds.lon_max; lon += step) {
    appendLineRing(
      [
        [lon, viewBounds.lat_min],
        [lon, viewBounds.lat_max],
      ],
      positions,
      viewBounds,
      elevation,
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}
