import * as THREE from 'three'
import type { GeoBounds } from './geoProjection'
import {
  GEO_COASTLINE_Y,
  GEO_MARKER_Y,
  GEO_MODEL_SURFACE_Y,
  GEO_REFERENCE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
} from './geoProjection'
import type { ApiGrid } from '../types/api'
import {
  formatModelDomainSummary,
  gridCornerNodeLabels,
  MODEL_GRID_CONVENTIONS,
  SYNTHETIC_MODEL_DATA_NOTES,
} from './modelDomain'

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
  /** Optional elevation for world-coordinate projection (defaults to marker height). */
  y?: number
}

export function formatWorldCoordinates(lat: number, lon: number, y: number): string {
  const { x, y: wy, z } = latLonToWorld(lat, lon, y, INDIAN_OCEAN_VIEW_BOUNDS)
  return `world (${x.toFixed(2)}, ${wy.toFixed(2)}, ${z.toFixed(2)})`
}

/** Wireframe rectangle tracing geographic bounds corners (model or view extent). */
export function createBoundsOutlineGeometry(
  bounds: GeoBounds,
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
  y = GEO_MODEL_SURFACE_Y + 0.04,
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
    { lat: bounds.lat_min, lon: bounds.lon_min, label: `SW ${bounds.lat_min}°N ${bounds.lon_min}°E` },
    { lat: bounds.lat_min, lon: bounds.lon_max, label: `SE ${bounds.lat_min}°N ${bounds.lon_max}°E` },
    { lat: bounds.lat_max, lon: bounds.lon_max, label: `NE ${bounds.lat_max}°N ${bounds.lon_max}°E` },
    { lat: bounds.lat_max, lon: bounds.lon_min, label: `NW ${bounds.lat_max}°N ${bounds.lon_min}°E` },
  ]
}

/** Edge midpoints showing raster west/east/south/north bounds. */
export function boundsEdgeDebugPoints(bounds: GeoBounds): GeoDebugPoint[] {
  const latMid = (bounds.lat_min + bounds.lat_max) / 2
  const lonMid = (bounds.lon_min + bounds.lon_max) / 2
  return [
    { lat: latMid, lon: bounds.lon_min, label: `W ${bounds.lon_min}°E` },
    { lat: latMid, lon: bounds.lon_max, label: `E ${bounds.lon_max}°E` },
    { lat: bounds.lat_min, lon: lonMid, label: `S ${bounds.lat_min}°N` },
    { lat: bounds.lat_max, lon: lonMid, label: `N ${bounds.lat_max}°N` },
  ]
}

/** Build full geo-validation debug markers from API domain + instruments. */
export function buildGeoValidationDebugPoints(
  bounds: GeoBounds,
  grid: ApiGrid | null,
  instruments: readonly GeoDebugPoint[],
): GeoDebugPoint[] {
  const gridNodes = grid ? gridCornerNodeLabels(grid) : []
  return [
    ...instruments.map((p) => ({ ...p, y: GEO_MARKER_Y })),
    ...boundsCornerDebugPoints(bounds).map((p) => ({ ...p, y: GEO_MODEL_SURFACE_Y })),
    ...boundsEdgeDebugPoints(bounds).map((p) => ({ ...p, y: GEO_MODEL_SURFACE_Y })),
    ...gridNodes.map((n) => ({ ...n, y: GEO_MODEL_SURFACE_Y })),
    {
      lat: (bounds.lat_min + bounds.lat_max) / 2,
      lon: (bounds.lon_min + bounds.lon_max) / 2,
      y: GEO_MODEL_SURFACE_Y,
      label: formatModelDomainSummary(bounds),
    },
    {
      lat: bounds.lat_min + 0.5,
      lon: bounds.lon_min + 0.5,
      y: GEO_COASTLINE_Y,
      label: `Coast Y=${GEO_COASTLINE_Y} · Model Y=${GEO_MODEL_SURFACE_Y}`,
    },
  ]
}

/** Text block for geo-debug summary panel (dev only). */
export function buildGeoValidationSummary(
  bounds: GeoBounds,
  grid: ApiGrid | null,
  apiModelDepth: number,
  selectedDepth: number,
): string {
  const lines = [
    'GEO VALIDATION (dev)',
    formatModelDomainSummary(bounds),
    `Indexing: ${MODEL_GRID_CONVENTIONS.indexing}`,
    `Lat order: ${MODEL_GRID_CONVENTIONS.latitudeOrder}`,
    `Lon order: ${MODEL_GRID_CONVENTIONS.longitudeOrder}`,
    `World axes: ${MODEL_GRID_CONVENTIONS.worldAxes}`,
    `Transform: latLonToWorld (geoProjection.ts)`,
    `Requested depth: ${selectedDepth} m · Model depth: ${apiModelDepth} m`,
  ]
  if (grid) {
    lines.push(
      `Grid nodes: ${grid.latitudes.length}×${grid.longitudes.length}`,
      `Lat nodes: ${grid.latitudes[0]}…${grid.latitudes[grid.latitudes.length - 1]}`,
      `Lon nodes: ${grid.longitudes[0]}…${grid.longitudes[grid.longitudes.length - 1]}`,
    )
  }
  lines.push('', ...SYNTHETIC_MODEL_DATA_NOTES)
  return lines.join('\n')
}

/** @deprecated Use buildGeoValidationDebugPoints */
export function modelBoundsDebugPoints(
  bounds: GeoBounds,
  instruments: readonly GeoDebugPoint[],
): GeoDebugPoint[] {
  return buildGeoValidationDebugPoints(bounds, null, instruments)
}
