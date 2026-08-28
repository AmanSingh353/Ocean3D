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

/** Three.js horizontal scene size (X axis = longitude). */
export const GEO_SCENE_WIDTH = 54

/** Three.js depth (Z axis = latitude, north is −Z). */
export const GEO_SCENE_DEPTH =
  GEO_SCENE_WIDTH *
  ((INDIAN_OCEAN_VIEW_BOUNDS.lat_max - INDIAN_OCEAN_VIEW_BOUNDS.lat_min) /
    (INDIAN_OCEAN_VIEW_BOUNDS.lon_max - INDIAN_OCEAN_VIEW_BOUNDS.lon_min))

export type GeoBounds = Pick<ApiBounds, 'lat_min' | 'lat_max' | 'lon_min' | 'lon_max'>

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

/** Map latitude/longitude to Three.js X/Z using equirectangular projection. */
export function latLonToSceneXZ(
  lat: number,
  lon: number,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  sceneWidth = GEO_SCENE_WIDTH,
  sceneDepth = GEO_SCENE_DEPTH,
): { x: number; z: number } {
  const lonSpan = bounds.lon_max - bounds.lon_min
  const latSpan = bounds.lat_max - bounds.lat_min
  const lonT = lonSpan > 0 ? (lon - bounds.lon_min) / lonSpan : 0.5
  const latT = latSpan > 0 ? (bounds.lat_max - lat) / latSpan : 0.5
  return {
    x: lonT * sceneWidth - sceneWidth / 2,
    z: latT * sceneDepth - sceneDepth / 2,
  }
}

/** Map latitude/longitude to a full scene position on the geographic reference plane. */
export function latLonToSceneXYZ(
  lat: number,
  lon: number,
  y: number = GEO_REFERENCE_Y,
  bounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): { x: number; y: number; z: number } {
  const { x, z } = latLonToSceneXZ(lat, lon, bounds)
  return { x, y, z }
}

/** Inverse projection: scene X/Z → latitude/longitude. */
export function sceneXZToLatLon(
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
  const sw = latLonToSceneXZ(bounds.lat_min, bounds.lon_min, viewBounds)
  const ne = latLonToSceneXZ(bounds.lat_max, bounds.lon_max, viewBounds)
  return {
    width: Math.abs(ne.x - sw.x),
    depth: Math.abs(ne.z - sw.z),
    centerX: (sw.x + ne.x) / 2,
    centerZ: (sw.z + ne.z) / 2,
  }
}
