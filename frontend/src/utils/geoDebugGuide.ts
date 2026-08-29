import * as THREE from 'three'
import {
  GEO_REFERENCE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
  type GeoBounds,
} from './geoProjection'

/** Lat/lon crosshair + vertical guide for coordinate verification. */
export function createGeoDebugGuideGeometry(
  lat: number,
  lon: number,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  const positions: number[] = []
  const y0 = GEO_REFERENCE_Y
  const y1 = GEO_REFERENCE_Y + 2.2

  const base = latLonToWorld(lat, lon, y0, viewBounds)
  const top = latLonToWorld(lat, lon, y1, viewBounds)
  positions.push(base.x, base.y, base.z, top.x, top.y, top.z)

  const latWest = latLonToWorld(lat, viewBounds.lon_min, y0, viewBounds)
  const latEast = latLonToWorld(lat, viewBounds.lon_max, y0, viewBounds)
  positions.push(latWest.x, latWest.y, latWest.z, latEast.x, latEast.y, latEast.z)

  const lonSouth = latLonToWorld(viewBounds.lat_min, lon, y0, viewBounds)
  const lonNorth = latLonToWorld(viewBounds.lat_max, lon, y0, viewBounds)
  positions.push(lonSouth.x, lonSouth.y, lonSouth.z, lonNorth.x, lonNorth.y, lonNorth.z)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}
