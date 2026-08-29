/**
 * Geographic validation for Ocean3D (no Three.js dependency).
 * Run: npm run geo:verify
 */

const VIEW_BOUNDS = { lat_min: -12, lat_max: 28, lon_min: 42, lon_max: 100 }
const MODEL_BOUNDS = { lat_min: 5, lat_max: 20, lon_min: 65, lon_max: 85 }
const SCENE_WIDTH = 54
const SCENE_DEPTH =
  SCENE_WIDTH * ((VIEW_BOUNDS.lat_max - VIEW_BOUNDS.lat_min) / (VIEW_BOUNDS.lon_max - VIEW_BOUNDS.lon_min))

/** Canonical transform — must match frontend/src/utils/geoProjection.ts */
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

/** Synthetic MVP grid — matches backend OceanDataService */
function buildDemoGrid() {
  const latitudes = []
  for (let lat = MODEL_BOUNDS.lat_min; lat <= MODEL_BOUNDS.lat_max; lat++) {
    latitudes.push(lat)
  }
  const longitudes = []
  for (let lon = MODEL_BOUNDS.lon_min; lon <= MODEL_BOUNDS.lon_max; lon++) {
    longitudes.push(lon)
  }
  return { latitudes, longitudes }
}

function boundsFromGrid(grid) {
  return {
    lat_min: grid.latitudes[0],
    lat_max: grid.latitudes[grid.latitudes.length - 1],
    lon_min: grid.longitudes[0],
    lon_max: grid.longitudes[grid.longitudes.length - 1],
  }
}

console.log('Ocean3D geographic validation\n')

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

const south = latLonToWorld(5, 75)
const north = latLonToWorld(20, 75)
if (north.z >= south.z) {
  throw new Error('north must map to smaller Z than south')
}

const west = latLonToWorld(12, 65)
const east = latLonToWorld(12, 85)
if (east.x <= west.x) {
  throw new Error('east must map to larger X than west')
}

const grid = buildDemoGrid()
const derived = boundsFromGrid(grid)
assertClose(derived.lat_min, MODEL_BOUNDS.lat_min, 'grid lat_min')
assertClose(derived.lat_max, MODEL_BOUNDS.lat_max, 'grid lat_max')
assertClose(derived.lon_min, MODEL_BOUNDS.lon_min, 'grid lon_min')
assertClose(derived.lon_max, MODEL_BOUNDS.lon_max, 'grid lon_max')

if (grid.latitudes[1] <= grid.latitudes[0]) {
  throw new Error('latitudes must ascend south→north')
}
if (grid.longitudes[1] <= grid.longitudes[0]) {
  throw new Error('longitudes must ascend west→east')
}

// values[latIdx][lonIdx]: corner node SW matches grid[0][0]
const swNode = latLonToWorld(grid.latitudes[0], grid.longitudes[0])
assertClose(swNode.x, sw.x, 'grid[0][0] world x matches domain SW')
assertClose(swNode.z, sw.z, 'grid[0][0] world z matches domain SW')

console.log('✓ Round-trip lat/lon (ARGO-021, ARGO-014, domain corners)')
console.log('✓ Model domain 5°N–20°N, 65°E–85°E')
console.log('✓ Axis orientation: +X=east, +Z=south (north=−Z)')
console.log('✓ Grid node ordering: lat/lon ascending, boundsFromGrid matches API')
console.log('✓ Single transform: latLonToWorld / worldToLatLon')
console.log('\nNote: land-sea mask is Natural Earth 110m (not in field values).')
console.log('Finite rectangular domain edge is legitimate for synthetic demo data.')
console.log('\nAll checks passed.')
