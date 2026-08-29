import type { OceanVariable } from '../types/ocean'

/** Demo value ranges for legend scaling and synthetic data alignment. */
export const VARIABLE_DEMO_RANGES: Record<OceanVariable, { min: number; max: number }> = {
  temperature: { min: 18, max: 24 },
  salinity: { min: 33, max: 37 },
  current: { min: 0, max: 1.5 },
  chlorophyll: { min: 0, max: 3 },
}

export function getVariableDemoRange(variable: OceanVariable): { min: number; max: number } {
  return VARIABLE_DEMO_RANGES[variable]
}

/** Resolve the color/legend range: prefer configured demo bounds, expand if data exceeds them slightly. */
export function resolveFieldDisplayRange(
  variable: OceanVariable,
  dataMin: number,
  dataMax: number,
): { min: number; max: number } {
  const configured = VARIABLE_DEMO_RANGES[variable]
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return configured
  }
  if (dataMin === dataMax) {
    const pad = (configured.max - configured.min) * 0.05
    return { min: dataMin - pad, max: dataMax + pad }
  }
  return {
    min: Math.min(configured.min, dataMin),
    max: Math.max(configured.max, dataMax),
  }
}
