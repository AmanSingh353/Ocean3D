import * as THREE from 'three'
import type { ApiBounds } from '../types/api'

/** Geographic extent of the 3D map base (Indian Ocean + surrounding coastlines). */
export const INDIAN_OCEAN_VIEW_BOUNDS: ApiBounds = {
  lat_min: -12,
  lat_max: 28,
  lon_min: 42,
  lon_max: 100,
}

/** Subtle vertex color for ocean areas outside the API model grid. */
export const OCEAN_BASE_VERTEX_RGB = { r: 0.035, g: 0.078, b: 0.11 } as const

/** Shared Y plane for geographic map layers (land, coastlines, graticule). */
export const GEO_REFERENCE_Y = 0

/** Model scalar field surface — slightly above land fill to prevent z-fighting. */
export const GEO_MODEL_SURFACE_Y = GEO_REFERENCE_Y + 0.05

/** Coastline outline sits above the model raster to avoid z-fighting. */
export const GEO_COASTLINE_Y = GEO_MODEL_SURFACE_Y + 0.03

/** Observation marker height above the geographic reference plane. */
export const GEO_MARKER_Y = GEO_REFERENCE_Y + 0.35

/** Three.js horizontal scene size (X axis = longitude). */
export const GEO_SCENE_WIDTH = 54

/** Three.js depth (Z axis = latitude, north is −Z). */
export const GEO_SCENE_DEPTH =
  GEO_SCENE_WIDTH *
  ((INDIAN_OCEAN_VIEW_BOUNDS.lat_max - INDIAN_OCEAN_VIEW_BOUNDS.lat_min) /
    (INDIAN_OCEAN_VIEW_BOUNDS.lon_max - INDIAN_OCEAN_VIEW_BOUNDS.lon_min))

export type GeoBounds = Pick<ApiBounds, 'lat_min' | 'lat_max' | 'lon_min' | 'lon_max'>

export interface WorldPosition {
  x: number
  y: number
  z: number
}

export interface SceneXZ {
  x: number
  z: number
}

/**
 * Canonical geographic coordinate system for Ocean3D.
 *
 * Projection: equirectangular normalization within `bounds`, mapped to Three.js XZ.
 * - +X = east (longitude increases)
 * - +Z = south (latitude decreases; north = −Z)
 * - +Y = elevation above the reference plane
 *
 * Grid/data ordering: latitude arrays ascend south→north; longitude arrays ascend west→east.
 * No scene rotation, mirroring, or scale compensation is applied to geographic layers.
 */
export function projectLatLonToXZ(
  lat: number,
  lon: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  sceneWidth = GEO_SCENE_WIDTH,
  sceneDepth = GEO_SCENE_DEPTH,
): SceneXZ {
  const lonSpan = bounds.lon_max - bounds.lon_min
  const latSpan = bounds.lat_max - bounds.lat_min
  const lonT = lonSpan > 0 ? (lon - bounds.lon_min) / lonSpan : 0.5
  const latT = latSpan > 0 ? (bounds.lat_max - lat) / latSpan : 0.5
  return {
    x: lonT * sceneWidth - sceneWidth / 2,
    z: latT * sceneDepth - sceneDepth / 2,
  }
}

/** Map latitude/longitude to Three.js world coordinates (canonical transform). */
export function latLonToWorld(
  lat: number,
  lon: number,
  y: number = GEO_REFERENCE_Y,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): WorldPosition {
  const { x, z } = projectLatLonToXZ(lat, lon, bounds)
  return { x, y, z }
}

/** Map latitude/longitude to Three.js world coordinates as a Vector3. */
export function latLonToWorldVector3(
  lat: number,
  lon: number,
  y: number = GEO_REFERENCE_Y,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.Vector3 {
  const { x, z } = projectLatLonToXZ(lat, lon, bounds)
  return new THREE.Vector3(x, y, z)
}

/** Inverse of latLonToWorld for the horizontal plane (ignores Y). */
export function worldToLatLon(
  x: number,
  z: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  sceneWidth = GEO_SCENE_WIDTH,
  sceneDepth = GEO_SCENE_DEPTH,
): { lat: number; lon: number } {
  const lonSpan = bounds.lon_max - bounds.lon_min
  const latSpan = bounds.lat_max - bounds.lat_min
  const lonT = (x + sceneWidth / 2) / sceneWidth
  const latT = (z + sceneDepth / 2) / sceneDepth
  return {
    lon: bounds.lon_min + lonT * lonSpan,
    lat: bounds.lat_max - latT * latSpan,
  }
}

export function isInsideGeoBounds(
  lat: number,
  lon: number,
  bounds: GeoBounds,
): boolean {
  return (
    lat >= bounds.lat_min &&
    lat <= bounds.lat_max &&
    lon >= bounds.lon_min &&
    lon <= bounds.lon_max
  )
}

/** @deprecated Use latLonToWorld — retained for call-site compatibility. */
export function latLonToSceneXZ(
  lat: number,
  lon: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  sceneWidth = GEO_SCENE_WIDTH,
  sceneDepth = GEO_SCENE_DEPTH,
): SceneXZ {
  return projectLatLonToXZ(lat, lon, bounds, sceneWidth, sceneDepth)
}

/** @deprecated Use latLonToWorld — retained for call-site compatibility. */
export function latLonToSceneXYZ(
  lat: number,
  lon: number,
  y: number = GEO_REFERENCE_Y,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): WorldPosition {
  return latLonToWorld(lat, lon, y, bounds)
}

/** @deprecated Use worldToLatLon — retained for call-site compatibility. */
export function sceneXZToLatLon(
  x: number,
  z: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  sceneWidth = GEO_SCENE_WIDTH,
  sceneDepth = GEO_SCENE_DEPTH,
): { lat: number; lon: number } {
  return worldToLatLon(x, z, bounds, sceneWidth, sceneDepth)
}

/** Project a scene point to screen pixel coordinates within the canvas host. */
export function projectSceneToScreen(
  x: number,
  y: number,
  z: number,
  camera: THREE.Camera,
  hostWidth: number,
  hostHeight: number,
): { x: number; y: number; visible: boolean } {
  const vec = new THREE.Vector3(x, y, z)
  vec.project(camera)
  return {
    x: (vec.x * 0.5 + 0.5) * hostWidth,
    y: (-vec.y * 0.5 + 0.5) * hostHeight,
    visible: vec.z >= -1 && vec.z <= 1,
  }
}

/** CSS overlay fallback when 3D projection is unavailable (matches view bounds). */
export function latLonToOverlayPercent(
  lat: number,
  lon: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): { x: number; y: number } {
  const xPct = ((lon - bounds.lon_min) / (bounds.lon_max - bounds.lon_min)) * 100
  const yPct = ((bounds.lat_max - lat) / (bounds.lat_max - bounds.lat_min)) * 100
  return {
    x: Math.max(2, Math.min(98, xPct)),
    y: Math.max(2, Math.min(98, yPct)),
  }
}

/** Width/depth of a geographic rectangle in scene units. */
export function boundsSceneSize(
  bounds: GeoBounds,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): { width: number; depth: number; centerX: number; centerZ: number } {
  const sw = latLonToWorld(bounds.lat_min, bounds.lon_min, GEO_REFERENCE_Y, viewBounds)
  const ne = latLonToWorld(bounds.lat_max, bounds.lon_max, GEO_REFERENCE_Y, viewBounds)
  return {
    width: Math.abs(ne.x - sw.x),
    depth: Math.abs(ne.z - sw.z),
    centerX: (sw.x + ne.x) / 2,
    centerZ: (sw.z + ne.z) / 2,
  }
}
