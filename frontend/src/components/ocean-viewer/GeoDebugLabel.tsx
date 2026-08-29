import type * as THREE from 'three'
import { projectSceneToScreen } from '../../utils/geoProjection'

interface GeoDebugLabelProps {
  lat: number
  lon: number
  sceneX: number
  sceneY: number
  sceneZ: number
  camera: THREE.Camera | null
  hostWidth: number
  hostHeight: number
  label?: string
}

/** Temporary debug label projected from geographic scene coordinates. */
export function GeoDebugLabel({
  lat,
  lon,
  sceneX,
  sceneY,
  sceneZ,
  camera,
  hostWidth,
  hostHeight,
  label,
}: GeoDebugLabelProps) {
  if (!camera || hostWidth <= 0 || hostHeight <= 0) return null

  const screen = projectSceneToScreen(sceneX, sceneY, sceneZ, camera, hostWidth, hostHeight)
  if (!screen.visible) return null

  return (
    <div
      className="geo-debug-label"
      style={{
        left: `${screen.x}px`,
        top: `${screen.y - 28}px`,
      }}
    >
      {label ?? `${lat.toFixed(1)}°N · ${lon.toFixed(1)}°E`}
    </div>
  )
}
