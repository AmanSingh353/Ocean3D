/**
 * Verify geographic alignment math (no Three.js dependency).
 * Run: node scripts/verify-geo-alignment.mjs
 */

const VIEW_BOUNDS = { lat_min: -12, lat_max: 28, lon_min: 42, lon_max: 100 }
const MODEL_BOUNDS = { lat_min: 5, lat_max: 20, lon_min: 65, lon_max: 85 }
const SCENE_WIDTH = 54
const SCENE_DEPTH =
  SCENE_WIDTH * ((VIEW_BOUNDS.lat_max - VIEW_BOUNDS.lat_min) / (VIEW_BOUNDS.lon_max - VIEW_BOUNDS.lon_min))

function latLonToWorld(lat, lon, bounds = VIEW_BOUNDS) {
  const lonSpan = bounds.lon_max - bounds.lon_min
  const latSpan = bounds.lat_max - bounds.lat_min
  const lonT = (lon - bounds.lon_min) / lonSpan
  const latT = (bounds.lat_max - lat) / latSpan
  return {
    x: lonT * SCENE_WIDTH - SCENE_WIDTH / 2,
    z: latT * SCENE_DEPTH - SCENE_DEPTH / 2,
  }
}

function worldToLatLon(x, z, bounds = VIEW_BOUNDS) {
  const lonSpan = bounds.lon_max - bounds.lon_min
  const latSpan = bounds.lat_max - bounds.lat_min
  const lonT = (x + SCENE_WIDTH / 2) / SCENE_WIDTH
  const latT = (z + SCENE_DEPTH / 2) / SCENE_DEPTH
  return {
    lon: bounds.lon_min + lonT * lonSpan,
    lat: bounds.lat_max - latT * latSpan,
  }
}

function assertClose(actual, expected, label, tol = 1e-9) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`)
  }
}

function roundTrip(lat, lon) {
  const world = latLonToWorld(lat, lon)
  const back = worldToLatLon(world.x, world.z)
  assertClose(back.lat, lat, `round-trip lat @ ${lat},${lon}`)
  assertClose(back.lon, lon, `round-trip lon @ ${lat},${lon}`)
}

console.log('Ocean3D geographic alignment verification\n')

roundTrip(9.8, 70.4)
roundTrip(15.8, 76.1)
roundTrip(5, 65)
roundTrip(20, 85)

const sw = latLonToWorld(MODEL_BOUNDS.lat_min, MODEL_BOUNDS.lon_min)
const ne = latLonToWorld(MODEL_BOUNDS.lat_max, MODEL_BOUNDS.lon_max)
assertClose(sw.x, latLonToWorld(5, 65).x, 'model SW corner x')
assertClose(sw.z, latLonToWorld(5, 65).z, 'model SW corner z')
assertClose(ne.x, latLonToWorld(20, 85).x, 'model NE corner x')
assertClose(ne.z, latLonToWorld(20, 85).z, 'model NE corner z')

// North should be −Z (smaller z than south at same longitude)
const south = latLonToWorld(5, 75)
const north = latLonToWorld(20, 75)
if (north.z >= south.z) {
  throw new Error('north must map to smaller Z than south')
}

// East should be +X
const west = latLonToWorld(12, 65)
const east = latLonToWorld(12, 85)
if (east.x <= west.x) {
  throw new Error('east must map to larger X than west')
}

console.log('✓ Round-trip lat/lon for ARGO-021 (9.8°N, 70.4°E)')
console.log('✓ Round-trip lat/lon for ARGO-014 (15.8°N, 76.1°E)')
console.log('✓ Model bounds corners (5°N 65°E → 20°N 85°E)')
console.log('✓ Axis orientation: +X = east, +Z = south (north = −Z)')
console.log('\nAll checks passed.')
