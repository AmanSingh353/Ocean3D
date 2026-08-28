import * as THREE from 'three'
import type { ApiCurrentField } from '../types/api'
import { DEFAULT_REGION } from '../data/defaults'
import { latLonToSceneXZ, INDIAN_OCEAN_VIEW_BOUNDS } from './geoProjection'
import { sceneToLatLon } from './temperatureField'

export interface CurrentSample {
  u: number
  v: number
  magnitude: number
}

/** Bilinear sample of u/v/magnitude from the API current grid. */
export function sampleCurrentField(
  field: ApiCurrentField,
  lat: number,
  lon: number,
): CurrentSample {
  const { latitudes, longitudes } = field.grid
  const latClamped = Math.max(
    latitudes[0],
    Math.min(latitudes[latitudes.length - 1], lat),
  )
  const lonClamped = Math.max(
    longitudes[0],
    Math.min(longitudes[longitudes.length - 1], lon),
  )

  let latIdx = latitudes.findIndex((v) => v >= latClamped)
  if (latIdx <= 0) latIdx = 1
  let lonIdx = longitudes.findIndex((v) => v >= lonClamped)
  if (lonIdx <= 0) lonIdx = 1

  const lat0 = latitudes[latIdx - 1]
  const lat1 = latitudes[latIdx]
  const lon0 = longitudes[lonIdx - 1]
  const lon1 = longitudes[lonIdx]

  const latT = lat1 === lat0 ? 0 : (latClamped - lat0) / (lat1 - lat0)
  const lonT = lon1 === lon0 ? 0 : (lonClamped - lon0) / (lon1 - lon0)

  function bilinear(grid: number[][]): number {
    const v00 = grid[latIdx - 1][lonIdx - 1]
    const v01 = grid[latIdx - 1][lonIdx]
    const v10 = grid[latIdx][lonIdx - 1]
    const v11 = grid[latIdx][lonIdx]
    const top = v00 + lonT * (v01 - v00)
    const bottom = v10 + lonT * (v11 - v10)
    return top + latT * (bottom - top)
  }

  return {
    u: bilinear(field.u),
    v: bilinear(field.v),
    magnitude: bilinear(field.magnitude),
  }
}

export function getCurrentMagnitudeRange(field: ApiCurrentField): {
  min: number
  max: number
} {
  let min = Infinity
  let max = -Infinity
  for (const row of field.magnitude) {
    for (const value of row) {
      if (value == null || Number.isNaN(value)) continue
      if (value < min) min = value
      if (value > max) max = value
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1.5 }
  }
  if (min === max) {
    return { min: 0, max: max + 0.1 }
  }
  return { min, max }
}

/** Arrow grid positions within the model data domain (geographic). */
export const CURRENT_ARROW_POSITIONS: readonly { x: number; z: number }[] = (() => {
  const bounds = DEFAULT_REGION
  const positions: { x: number; z: number }[] = []
  for (let lat = bounds.lat_min; lat <= bounds.lat_max; lat += 3) {
    for (let lon = bounds.lon_min; lon <= bounds.lon_max; lon += 4) {
      positions.push(latLonToSceneXZ(lat, lon, INDIAN_OCEAN_VIEW_BOUNDS))
    }
  }
  return positions
})()

function disposeArrowHelper(arrow: THREE.ArrowHelper): void {
  arrow.line.geometry.dispose()
  if (Array.isArray(arrow.line.material)) {
    arrow.line.material.forEach((m) => m.dispose())
  } else {
    arrow.line.material.dispose()
  }
  arrow.cone.geometry.dispose()
  if (Array.isArray(arrow.cone.material)) {
    arrow.cone.material.forEach((m) => m.dispose())
  } else {
    arrow.cone.material.dispose()
  }
}

/** Rebuild current vector arrows from API u/v data — does not recreate the scene. */
export function applyCurrentFieldToGroup(
  group: THREE.Group,
  field: ApiCurrentField,
): void {
  while (group.children.length > 0) {
    const child = group.children[0]
    group.remove(child)
    if (child instanceof THREE.ArrowHelper) {
      disposeArrowHelper(child)
    }
  }

  const { max } = getCurrentMagnitudeRange(field)
  const maxMag = max > 0 ? max : 1

  for (const { x, z } of CURRENT_ARROW_POSITIONS) {
    const { lat, lon } = sceneToLatLon(x, z, field.bounds)
    const { u, v, magnitude } = sampleCurrentField(field, lat, lon)

    const dir = new THREE.Vector3(u, 0, -v)
    if (dir.lengthSq() < 1e-8) {
      dir.set(1, 0, 0)
    }
    dir.normalize()

    const len = 1.2 + 2.8 * (magnitude / maxMag)
    group.add(
      new THREE.ArrowHelper(dir, new THREE.Vector3(x, 0.3, z), len, 0x19bcd6, 0.5, 0.35),
    )
  }
}
