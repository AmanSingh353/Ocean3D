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

/** Ocean grid cell is renderable when it is not fully covered by land. */
export function isOceanCell(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
): boolean {
  const corners: [number, number][] = [
    [latMin, lonMin],
    [latMin, lonMax],
    [latMax, lonMin],
    [latMax, lonMax],
  ]
  if (corners.some(([lat, lon]) => !isOnLand(lat, lon))) return true
  const latCenter = (latMin + latMax) / 2
  const lonCenter = (lonMin + lonMax) / 2
  return !isOnLand(latCenter, lonCenter)
}
