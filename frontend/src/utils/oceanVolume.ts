import * as THREE from 'three'
import { DEFAULT_REGION } from '../data/defaults'
import { OCEAN_DEPTHS } from '../data/depths'
import {
  GEO_MODEL_SURFACE_Y,
  INDIAN_OCEAN_VIEW_BOUNDS,
  latLonToWorld,
  type GeoBounds,
} from './geoProjection'

/** Visual height of the ocean column in scene units ( exaggerated ). */
export const OCEAN_COLUMN_HEIGHT = 0.22

/** Map selected depth (m) to a downward Y offset for the active model slice. */
export function depthToSliceOffset(
  depth: number,
  maxDepth = 1000,
  verticalExaggeration = 1,
): number {
  const t = Math.max(0, Math.min(1, depth / maxDepth))
  return -t * OCEAN_COLUMN_HEIGHT * verticalExaggeration
}

/** World Y for a horizontal depth reference plane. */
export function depthPlaneY(
  depth: number,
  maxDepth = 1000,
  verticalExaggeration = 1,
): number {
  return GEO_MODEL_SURFACE_Y + depthToSliceOffset(depth, maxDepth, verticalExaggeration)
}

/** Create semi-transparent horizontal depth reference planes across the model domain. */
export function createDepthReferencePlanes(
  depths: readonly number[] = OCEAN_DEPTHS,
  bounds: GeoBounds = DEFAULT_REGION,
  maxDepth = 1000,
  verticalExaggeration = 1,
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'depthReferencePlanes'

  const sw = latLonToWorld(bounds.lat_min, bounds.lon_min, 0, INDIAN_OCEAN_VIEW_BOUNDS)
  const ne = latLonToWorld(bounds.lat_max, bounds.lon_max, 0, INDIAN_OCEAN_VIEW_BOUNDS)
  const width = Math.abs(ne.x - sw.x)
  const depthSpan = Math.abs(ne.z - sw.z)
  const centerX = (sw.x + ne.x) / 2
  const centerZ = (sw.z + ne.z) / 2

  for (const d of depths) {
    const y = depthPlaneY(d, maxDepth, verticalExaggeration)
    const geometry = new THREE.PlaneGeometry(width, depthSpan)
    geometry.rotateX(-Math.PI / 2)
    const material = new THREE.MeshBasicMaterial({
      color: 0x19bcd6,
      transparent: true,
      opacity: 0.04,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(centerX, y, centerZ)
    mesh.userData = { depth: d }
    group.add(mesh)
  }

  return group
}

/** Highlight plane for the currently selected depth slice. */
export function createActiveDepthSlicePlane(
  bounds: GeoBounds = DEFAULT_REGION,
  _maxDepth = 1000,
  _verticalExaggeration = 1,
): THREE.Mesh {
  const sw = latLonToWorld(bounds.lat_min, bounds.lon_min, 0, INDIAN_OCEAN_VIEW_BOUNDS)
  const ne = latLonToWorld(bounds.lat_max, bounds.lon_max, 0, INDIAN_OCEAN_VIEW_BOUNDS)
  const width = Math.abs(ne.x - sw.x)
  const depthSpan = Math.abs(ne.z - sw.z)
  const centerX = (sw.x + ne.x) / 2
  const centerZ = (sw.z + ne.z) / 2

  const geometry = new THREE.PlaneGeometry(width, depthSpan)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({
    color: 0x48d5c3,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(centerX, GEO_MODEL_SURFACE_Y, centerZ)
  mesh.renderOrder = 9
  return mesh
}

export function updateDepthVolumePositions(
  group: THREE.Group,
  depths: readonly number[] = OCEAN_DEPTHS,
  maxDepth = 1000,
  verticalExaggeration = 1,
): void {
  depths.forEach((d, i) => {
    const child = group.children[i]
    if (child instanceof THREE.Mesh) {
      child.position.y = depthPlaneY(d, maxDepth, verticalExaggeration)
    }
  })
}

/** Subtle vertical water-column bounds for depth perception. */
export function createOceanColumnOutline(
  bounds: GeoBounds = DEFAULT_REGION,
  maxDepth = 1000,
  verticalExaggeration = 1,
): THREE.LineSegments {
  const corners = [
    latLonToWorld(bounds.lat_min, bounds.lon_min, GEO_MODEL_SURFACE_Y, INDIAN_OCEAN_VIEW_BOUNDS),
    latLonToWorld(bounds.lat_min, bounds.lon_max, GEO_MODEL_SURFACE_Y, INDIAN_OCEAN_VIEW_BOUNDS),
    latLonToWorld(bounds.lat_max, bounds.lon_max, GEO_MODEL_SURFACE_Y, INDIAN_OCEAN_VIEW_BOUNDS),
    latLonToWorld(bounds.lat_max, bounds.lon_min, GEO_MODEL_SURFACE_Y, INDIAN_OCEAN_VIEW_BOUNDS),
  ]
  const bottomY = depthPlaneY(maxDepth, maxDepth, verticalExaggeration)
  const positions: number[] = []

  for (const c of corners) {
    positions.push(c.x, c.y, c.z, c.x, bottomY, c.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0x19bcd6,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  )
}
