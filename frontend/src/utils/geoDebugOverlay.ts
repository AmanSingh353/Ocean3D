import * as THREE from 'three'
import type { GeoBounds } from './geoProjection'
import {
  GEO_MODEL_SURFACE_Y,
  GEO_REFERENCE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
} from './geoProjection'

/** Enable with `?geoDebug=1` in development — overlays are hidden in production builds. */
export function isGeoDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('geoDebug')
}

export interface GeoDebugPoint {
  lat: number
  lon: number
  label: string
}

/** Wireframe rectangle tracing geographic bounds corners (model or view extent). */
export function createBoundsOutlineGeometry(
  bounds: GeoBounds,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_MODEL_SURFACE_Y + 0.05,
): THREE.BufferGeometry {
  const sw = latLonToWorld(bounds.lat_min, bounds.lon_min, y, viewBounds)
  const se = latLonToWorld(bounds.lat_min, bounds.lon_max, y, viewBounds)
  const ne = latLonToWorld(bounds.lat_max, bounds.lon_max, y, viewBounds)
  const nw = latLonToWorld(bounds.lat_max, bounds.lon_min, y, viewBounds)

  const positions = new Float32Array([
    sw.x, sw.y, sw.z, se.x, se.y, se.z,
    se.x, se.y, se.z, ne.x, ne.y, ne.z,
    ne.x, ne.y, ne.z, nw.x, nw.y, nw.z,
    nw.x, nw.y, nw.z, sw.x, sw.y, sw.z,
  ])

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

/** Cross markers at arbitrary lat/lon verification points. */
export function createGeoReferenceMarkersGeometry(
  points: readonly GeoDebugPoint[],
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_REFERENCE_Y + 0.06,
  arm = 0.55,
): THREE.BufferGeometry {
  const positions: number[] = []

  for (const { lat, lon } of points) {
    const center = latLonToWorld(lat, lon, y, viewBounds)
    positions.push(
      center.x - arm, center.y, center.z,
      center.x + arm, center.y, center.z,
      center.x, center.y, center.z - arm,
      center.x, center.y, center.z + arm,
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/** Corner labels for a geographic bounds rectangle. */
export function boundsCornerDebugPoints(bounds: GeoBounds): GeoDebugPoint[] {
  return [
    { lat: bounds.lat_min, lon: bounds.lon_min, label: `${bounds.lat_min}°N ${bounds.lon_min}°E` },
    { lat: bounds.lat_min, lon: bounds.lon_max, label: `${bounds.lat_min}°N ${bounds.lon_max}°E` },
    { lat: bounds.lat_max, lon: bounds.lon_max, label: `${bounds.lat_max}°N ${bounds.lon_max}°E` },
    { lat: bounds.lat_max, lon: bounds.lon_min, label: `${bounds.lat_max}°N ${bounds.lon_min}°E` },
  ]
}
