import * as THREE from 'three'
import { INDIAN_OCEAN_VIEW_BOUNDS, worldToLatLon } from './geoProjection'

/** Raycast from screen pointer to the ocean horizontal plane (y = 0). */
export function pickLatLonFromPointer(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
): { lat: number; lon: number } | null {
  const rect = canvas.getBoundingClientRect()
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const hit = new THREE.Vector3()
  if (!raycaster.ray.intersectPlane(plane, hit)) return null
  return worldToLatLon(hit.x, hit.z, INDIAN_OCEAN_VIEW_BOUNDS)
}

export function boundsFromCorners(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): { latMin: number; latMax: number; lonMin: number; lonMax: number } {
  return {
    latMin: Math.min(a.lat, b.lat),
    latMax: Math.max(a.lat, b.lat),
    lonMin: Math.min(a.lon, b.lon),
    lonMax: Math.max(a.lon, b.lon),
  }
}
