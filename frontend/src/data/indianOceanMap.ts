import type { GeoJsonFeatureCollection } from '../types/geojson'
import landData from './indianOceanLand.json'
import coastlineData from './indianOceanCoastline.json'

/** Natural Earth 110m land polygons clipped to the Indian Ocean view domain. */
export const INDIAN_OCEAN_LAND = landData as unknown as GeoJsonFeatureCollection

/** Natural Earth 110m coastlines clipped to the Indian Ocean view domain. */
export const INDIAN_OCEAN_COASTLINE = coastlineData as unknown as GeoJsonFeatureCollection
