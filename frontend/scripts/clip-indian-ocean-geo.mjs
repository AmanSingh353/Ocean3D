/**
 * Clip Natural Earth 110m land/coastline GeoJSON to the Indian Ocean view domain.
 * Run: node scripts/clip-indian-ocean-geo.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Matches frontend INDIAN_OCEAN_VIEW_BOUNDS with margin for partial features. */
const CLIP_BOUNDS = {
  lat_min: -18,
  lat_max: 32,
  lon_min: 35,
  lon_max: 105,
}

function getFeatureBbox(coordinates, type) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  const visit = (lon, lat) => {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  const walkCoords = (coords, depth) => {
    if (depth === 0) {
      visit(coords[0], coords[1])
      return
    }
    for (const c of coords) walkCoords(c, depth - 1)
  }

  if (type === 'Polygon') walkCoords(coordinates, 2)
  else if (type === 'MultiPolygon') walkCoords(coordinates, 3)
  else if (type === 'LineString') walkCoords(coordinates, 1)
  else if (type === 'MultiLineString') walkCoords(coordinates, 2)

  return { minLon, maxLon, minLat, maxLat }
}

function intersectsBounds(bbox) {
  return !(
    bbox.maxLon < CLIP_BOUNDS.lon_min ||
    bbox.minLon > CLIP_BOUNDS.lon_max ||
    bbox.maxLat < CLIP_BOUNDS.lat_min ||
    bbox.minLat > CLIP_BOUNDS.lat_max
  )
}

function clipCollection(inputPath, outputPath) {
  const geo = JSON.parse(readFileSync(inputPath, 'utf8'))
  const features = geo.features.filter((f) => {
    const bbox = getFeatureBbox(f.geometry.coordinates, f.geometry.type)
    return intersectsBounds(bbox)
  })

  const out = {
    type: 'FeatureCollection',
    name: geo.name ?? 'indian_ocean_clip',
    features,
  }

  writeFileSync(outputPath, JSON.stringify(out))
  console.log(`${outputPath}: ${features.length} features (from ${geo.features.length})`)
}

const dataDir = join(__dirname, '..', 'src', 'data')
clipCollection(
  join(__dirname, 'ne_110m_land.geojson'),
  join(dataDir, 'indianOceanLand.json'),
)
clipCollection(
  join(__dirname, 'ne_110m_coastline.geojson'),
  join(dataDir, 'indianOceanCoastline.json'),
)
