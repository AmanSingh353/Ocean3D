import type { ValidationRegionBounds } from '../../data/validationRegions'
import { isPointInValidationRegion } from '../../data/validationRegions'
import type { HazardDefinition } from '../definitions'
import type { HazardGridSnapshot, RiskDistribution, RiskLevel } from '../../types/hazard'
import type { OceanVariable } from '../../types/ocean'
import { isOnLand } from '../../utils/landMask'
import {
  getGridValues,
  isValidCellValue,
  type OceanField,
} from '../../utils/hazardFieldAccess'
import { calculateHazardLevel } from './classify'
import { getReferenceValue } from './anomaly'

export interface SpatialRiskResult {
  snapshot: HazardGridSnapshot
  distribution: RiskDistribution
  peakValue: number | null
  meanValue: number | null
  peakLocation: { lat: number; lon: number } | null
  centreValue: number | null
  centreReference: number | null
  centreAnomaly: number | null
}

export function calculateSpatialRisk(
  definition: HazardDefinition,
  field: OceanField,
  variable: OceanVariable,
  depth: number,
  dateIso: string,
  region: ValidationRegionBounds,
): SpatialRiskResult {
  const grid = field.grid
  const values = getGridValues(field, variable)
  const riskLevels: RiskLevel[][] = []
  const analyzed: boolean[][] = []
  const distribution: RiskDistribution = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    CRITICAL: 0,
    validCells: 0,
    regionCells: 0,
  }

  let peakValue: number | null = null
  let peakLocation: { lat: number; lon: number } | null = null
  let valueSum = 0

  const latCenter = (region.latMin + region.latMax) / 2
  const lonCenter = (region.lonMin + region.lonMax) / 2
  let centreValue: number | null = null
  let centreReference: number | null = null
  let centreAnomaly: number | null = null
  let centreDist = Infinity

  if (!values) {
    return emptySpatialResult(grid)
  }

  for (let j = 0; j < grid.latitudes.length; j++) {
    const riskRow: RiskLevel[] = []
    const analyzedRow: boolean[] = []
    for (let i = 0; i < grid.longitudes.length; i++) {
      const lat = grid.latitudes[j]
      const lon = grid.longitudes[i]

      if (!isPointInValidationRegion(lat, lon, region) || isOnLand(lat, lon)) {
        riskRow.push('LOW')
        analyzedRow.push(false)
        continue
      }

      distribution.regionCells++
      const val = values[j]?.[i] ?? null

      if (!isValidCellValue(val)) {
        riskRow.push('LOW')
        analyzedRow.push(false)
        continue
      }

      const ref = definition.anomalyRule.usesDemoReference
        ? getReferenceValue(lat, lon, depth, dateIso, variable)
        : 0

      const risk = calculateHazardLevel(
        definition.thresholdRule.mode,
        val,
        ref,
        definition.thresholdRule.bands,
      )

      riskRow.push(risk)
      analyzedRow.push(true)
      distribution.validCells++
      distribution[risk]++
      valueSum += val

      if (peakValue == null || val > peakValue) {
        peakValue = val
        peakLocation = { lat, lon }
      }

      const dist = Math.hypot(lat - latCenter, lon - lonCenter)
      if (dist < centreDist) {
        centreDist = dist
        centreValue = val
        centreReference = ref
        centreAnomaly = val - ref
      }
    }
    riskLevels.push(riskRow)
    analyzed.push(analyzedRow)
  }

  const meanValue =
    distribution.validCells > 0
      ? Number((valueSum / distribution.validCells).toFixed(3))
      : null

  return {
    snapshot: { grid, riskLevels, analyzed },
    distribution,
    peakValue: peakValue != null ? Number(peakValue.toFixed(3)) : null,
    meanValue,
    peakLocation,
    centreValue: centreValue != null ? Number(centreValue.toFixed(3)) : null,
    centreReference: centreReference != null ? Number(centreReference.toFixed(3)) : null,
    centreAnomaly: centreAnomaly != null ? Number(centreAnomaly.toFixed(3)) : null,
  }
}

function emptySpatialResult(grid: HazardGridSnapshot['grid']): SpatialRiskResult {
  return {
    snapshot: { grid, riskLevels: [], analyzed: [] },
    distribution: { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0, validCells: 0, regionCells: 0 },
    peakValue: null,
    meanValue: null,
    peakLocation: null,
    centreValue: null,
    centreReference: null,
    centreAnomaly: null,
  }
}
