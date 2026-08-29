import type { GeoJsonGeometry, Position } from '../types/geojson'
import { INDIAN_OCEAN_LAND } from '../data/indianOceanMap'

type LandPolygon = Position[][]

let landPolygons: LandPolygon[] | null = null

function collectLandPolygons(geometry: GeoJsonGeometry, out: LandPolygon[]): void {
  if (geometry.type === 'Polygon') {
    out.push(geometry.coordinates)
    return
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) out.push(poly)
  }
}

function getLandPolygons(): LandPolygon[] {
  if (!landPolygons) {
    landPolygons = []
    for (const feature of INDIAN_OCEAN_LAND.features) {
      collectLandPolygons(feature.geometry, landPolygons)
    }
  }
  return landPolygons
}

/** Ray-casting point-in-ring test. GeoJSON ring uses [longitude, latitude]. */
function pointInRing(lon: number, lat: number, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/** Whether a geographic point falls on land (Natural Earth 110m mask). */
export function isOnLand(lat: number, lon: number): boolean {
  for (const polygon of getLandPolygons()) {
    const exterior = polygon[0]
    if (!exterior || !pointInRing(lon, lat, exterior)) continue
    for (let h = 1; h < polygon.length; h++) {
      if (pointInRing(lon, lat, polygon[h])) return false
    }
    return true
  }
  return false
}

/** Whether any sample point in a cell lies over ocean. */
export function cellHasOcean(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  const latCenter = (latMin + latMax) / 2
  const lonCenter = (lonMin + lonMax) / 2
  const samples: [number, number][] = [
    [latMin, lonMin],
    [latMin, lonMax],
    [latMax, lonMin],
    [latMax, lonMax],
    [latCenter, lonCenter],
  ]
  return samples.some(([lat, lon]) => !isOnLand(lat, lon))
}

/** Sub-cell is rendered only when its center is over ocean. */
export function isOceanSubcell(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  const latCenter = (latMin + latMax) / 2
  const lonCenter = (lonMin + lonMax) / 2
  return !isOnLand(latCenter, lonCenter)
}

/** @deprecated Use isOceanSubcell — kept for callers expecting coarse cell tests. */
export function isOceanCell(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  return isOceanSubcell(latMin, latMax, lonMin, lonMax)
}
