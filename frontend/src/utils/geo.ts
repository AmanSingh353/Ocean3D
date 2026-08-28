import { latLonToOverlayPercent } from './geoProjection'

/** Map geographic coordinates to overlay marker position (fallback projection). */
export function latLonToScenePercent(
  lat: number,
  lon: number,
): { x: number; y: number } {
  return latLonToOverlayPercent(lat, lon)
}

export {
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToSceneXZ,
  latLonToOverlayPercent,
  projectSceneToScreen,
  boundsSceneSize,
} from './geoProjection'
