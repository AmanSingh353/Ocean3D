import * as THREE from 'three'
import {
  GEO_REFERENCE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToSceneXYZ,
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

  const base = latLonToSceneXYZ(lat, lon, y0, viewBounds)
  const top = latLonToSceneXYZ(lat, lon, y1, viewBounds)
  positions.push(base.x, base.y, base.z, top.x, top.y, top.z)

  const latWest = latLonToSceneXYZ(lat, viewBounds.lon_min, y0, viewBounds)
  const latEast = latLonToSceneXYZ(lat, viewBounds.lon_max, y0, viewBounds)
  positions.push(latWest.x, latWest.y, latWest.z, latEast.x, latEast.y, latEast.z)

  const lonSouth = latLonToSceneXYZ(viewBounds.lat_min, lon, y0, viewBounds)
  const lonNorth = latLonToSceneXYZ(viewBounds.lat_max, lon, y0, viewBounds)
  positions.push(lonSouth.x, lonSouth.y, lonSouth.z, lonNorth.x, lonNorth.y, lonNorth.z)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}
