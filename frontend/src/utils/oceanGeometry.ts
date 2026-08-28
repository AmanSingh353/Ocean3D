import * as THREE from 'three'
import { GEO_REFERENCE_Y, INDIAN_OCEAN_VIEW_BOUNDS, type GeoBounds } from './geoProjection'
import { createBoundsQuadGeometry } from './geoJsonMap'

/** Full-view dark ocean base plane aligned to geographic corners. */
export function createOceanBaseGeometry(
  viewBounds: GeoBounds = INDIAN_OCEAN_VIEW_BOUNDS,
): THREE.BufferGeometry {
  return createBoundsQuadGeometry(viewBounds, GEO_REFERENCE_Y - 0.02)
}
