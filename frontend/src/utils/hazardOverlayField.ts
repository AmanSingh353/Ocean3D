import type { BufferAttribute } from 'three'
import type { HazardGridSnapshot, RiskLevel } from '../types/hazard'
import { colorGridVertices } from './fieldSampling'
import { isOnLand } from './landMask'

const RISK_RGB: Record<RiskLevel, { r: number; g: number; b: number }> = {
  LOW: { r: 0.05, g: 0.35, b: 0.55 },
  MODERATE: { r: 0.85, g: 0.75, b: 0.1 },
  HIGH: { r: 0.95, g: 0.45, b: 0.08 },
  CRITICAL: { r: 0.9, g: 0.12, b: 0.15 },
}

/** Blend hazard risk colors only on analyzed in-region cells; leave others unchanged. */
export function blendHazardOverlayOnGeometry(
  colors: BufferAttribute,
  snapshot: HazardGridSnapshot,
  blend = 0.45,
): void {
  const { grid, riskLevels, analyzed } = snapshot
  const cols = grid.longitudes.length

  for (let j = 0; j < grid.latitudes.length; j++) {
    for (let i = 0; i < grid.longitudes.length; i++) {
      if (!analyzed[j]?.[i]) continue

      const idx = j * cols + i
      const lat = grid.latitudes[j]
      const lon = grid.longitudes[i]
      if (isOnLand(lat, lon)) continue

      const risk = riskLevels[j]?.[i] ?? 'LOW'
      const hazard = RISK_RGB[risk]
      const r0 = colors.getX(idx)
      const g0 = colors.getY(idx)
      const b0 = colors.getZ(idx)

      colors.setXYZ(
        idx,
        r0 * (1 - blend) + hazard.r * blend,
        g0 * (1 - blend) + hazard.g * blend,
        b0 * (1 - blend) + hazard.b * blend,
      )
    }
  }
  colors.needsUpdate = true
}

/** Standalone hazard-only coloring (when ocean field hidden). */
export function applyHazardOverlayToGeometry(
  colors: BufferAttribute,
  snapshot: HazardGridSnapshot,
): void {
  colorGridVertices(colors, snapshot.grid, (j, i) => {
    if (!snapshot.analyzed[j]?.[i]) return null
    const risk = snapshot.riskLevels[j]?.[i] ?? 'LOW'
    return RISK_RGB[risk]
  })
}

export { RISK_RGB }
