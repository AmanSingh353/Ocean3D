import * as THREE from 'three'
import { ShapeUtils } from 'three/src/extras/ShapeUtils.js'
import type {
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  Position,
} from '../types/geojson'
import {
  GEO_COASTLINE_Y,
  GEO_REFERENCE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
  type GeoBounds,
} from './geoProjection'

/** Shared 2D map projection used by all geographic layers (X = lon, Z = lat). */
function ringToMapPoints(ring: Position[], viewBounds: GeoBounds): THREE.Vector2[] {
  return ring.map(([lon, lat]) => {
    const { x, z } = latLonToWorld(lat, lon, GEO_REFERENCE_Y, viewBounds)
    return new THREE.Vector2(x, z)
  })
}

function pushMapLine(
  ring: Position[],
  positions: number[],
  viewBounds: GeoBounds,
  y: number,
): void {
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]
    const [lon2, lat2] = ring[i + 1]
    const p1 = latLonToWorld(lat1, lon1, y, viewBounds)
    const p2 = latLonToWorld(lat2, lon2, y, viewBounds)
    positions.push(p1.x, y, p1.z, p2.x, y, p2.z)
  }
}

/**
 * Triangulate a GeoJSON polygon ring set directly in scene XZ space.
 * Avoids ShapeGeometry + rotateX, which mirrored land north/south relative to coastlines.
 */
function polygonToGeometry(
  rings: Position[][],
  viewBounds: GeoBounds,
  y: number,
): THREE.BufferGeometry | null {
  const exterior = rings[0]
  if (!exterior || exterior.length < 4) return null

  const contour = ringToMapPoints(exterior, viewBounds)
  const holes = rings
    .slice(1)
    .filter((ring) => ring.length >= 4)
    .map((ring) => ringToMapPoints(ring, viewBounds))

  const triangles = ShapeUtils.triangulateShape(contour, holes)
  const vertices2d: THREE.Vector2[] = [...contour]
  for (const hole of holes) vertices2d.push(...hole)

  const positions: number[] = []
  for (const [a, b, c] of triangles) {
    for (const idx of [a, b, c]) {
      const v = vertices2d[idx]
      positions.push(v.x, y, v.y)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function collectLandGeometries(
  geometry: GeoJsonGeometry,
  viewBounds: GeoBounds,
  y: number,
  out: THREE.BufferGeometry[],
): void {
  if (geometry.type === 'Polygon') {
    const g = polygonToGeometry(geometry.coordinates, viewBounds, y)
    if (g) out.push(g)
    return
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      const g = polygonToGeometry(poly, viewBounds, y)
      if (g) out.push(g)
    }
  }
}

function collectCoastlinePositions(
  geometry: GeoJsonGeometry,
  positions: number[],
  viewBounds: GeoBounds,
  y: number,
): void {
  if (geometry.type === 'LineString') {
    pushMapLine(geometry.coordinates, positions, viewBounds, y)
    return
  }
  if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      pushMapLine(line, positions, viewBounds, y)
    }
    return
  }
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      pushMapLine(ring, positions, viewBounds, y)
    }
    return
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        pushMapLine(ring, positions, viewBounds, y)
      }
    }
  }
}

/** Build land-fill meshes from Natural Earth (or similar) land polygons. */
export function createLandGeometriesFromGeoJSON(
  collection: GeoJsonFeatureCollection,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_REFERENCE_Y + 0.02,
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = []
  for (const feature of collection.features) {
    collectLandGeometries(feature.geometry, viewBounds, y, geometries)
  }
  return geometries
}

/** Build coastline line segments from Natural Earth coastline GeoJSON. */
export function createCoastlineGeometryFromGeoJSON(
  collection: GeoJsonFeatureCollection,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_COASTLINE_Y,
): THREE.BufferGeometry {
  const positions: number[] = []
  for (const feature of collection.features) {
    collectCoastlinePositions(feature.geometry, positions, viewBounds, y)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/** Subtle lat/lon graticule for geographic reference. */
export function createGraticuleGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  step = 10,
  y = GEO_REFERENCE_Y + 0.01,
): THREE.BufferGeometry {
  const positions: number[] = []

  const latStart = Math.ceil(viewBounds.lat_min / step) * step
  for (let lat = latStart; lat <= viewBounds.lat_max; lat += step) {
    pushMapLine(
      [
        [viewBounds.lon_min, lat],
        [viewBounds.lon_max, lat],
      ],
      positions,
      viewBounds,
      y,
    )
  }

  const lonStart = Math.ceil(viewBounds.lon_min / step) * step
  for (let lon = lonStart; lon <= viewBounds.lon_max; lon += step) {
    pushMapLine(
      [
        [lon, viewBounds.lat_min],
        [lon, viewBounds.lat_max],
      ],
      positions,
      viewBounds,
      y,
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/** Build a flat quad from geographic bounds corners (no rotation transforms). */
export function createBoundsQuadGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_REFERENCE_Y,
): THREE.BufferGeometry {
  const sw = latLonToWorld(viewBounds.lat_min, viewBounds.lon_min, y, viewBounds)
  const se = latLonToWorld(viewBounds.lat_min, viewBounds.lon_max, y, viewBounds)
  const ne = latLonToWorld(viewBounds.lat_max, viewBounds.lon_max, y, viewBounds)
  const nw = latLonToWorld(viewBounds.lat_max, viewBounds.lon_min, y, viewBounds)

  const positions = new Float32Array([
    sw.x, y, sw.z, se.x, y, se.z, nw.x, y, nw.z,
    se.x, y, se.z, ne.x, y, ne.z, nw.x, y, nw.z,
  ])

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
