import type { HazardDefinition } from '../definitions'
import type {
  HazardEvent,
  HazardConfidenceLevel,
  HazardTrend,
  RiskLevel,
} from '../../types/hazard'
import type { ValidationRegionBounds } from '../../data/validationRegions'
import type { SpatialRiskResult } from './spatialRisk'
import type { OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import { bilinearSampleGrid } from '../../utils/fieldSampling'
import type { OceanField } from '../../utils/hazardFieldAccess'

export interface CreateHazardEventInput {
  definition: HazardDefinition
  hazardVariable: OceanVariable
  region: ValidationRegionBounds
  selectedDate: string
  depth: number
  spatial: SpatialRiskResult
  eventStatus: RiskLevel
  eventLabel: string
  confidence: HazardConfidenceLevel
  validationStatus: string | null
  currentField: OceanField | null
  availableTimestepCount: number
  previousPeakValue: number | null
}

function directionFromUV(u: number, v: number): number {
  const deg = (Math.atan2(v, u) * 180) / Math.PI
  return deg < 0 ? deg + 360 : Number(deg.toFixed(0))
}

/** Deterministic event ID from hazard type, region, timestamp, and depth. */
export function buildDeterministicEventId(
  hazardId: string,
  regionId: string,
  dateIso: string,
  depth: number,
): string {
  const datePart = dateIso.slice(0, 10)
  const depthPart = Math.round(depth)
  return `${hazardId}-${regionId}-${datePart}-${depthPart}`
}

function computeTrend(
  availableTimestepCount: number,
  currentPeak: number | null,
  previousPeak: number | null,
): HazardTrend {
  if (availableTimestepCount <= 1) return 'not_assessed'
  if (currentPeak == null || previousPeak == null) return 'not_assessed'

  const delta = currentPeak - previousPeak
  const threshold = Math.max(Math.abs(previousPeak) * 0.05, 0.01)
  if (Math.abs(delta) < threshold) return 'stable'
  return delta > 0 ? 'rising' : 'falling'
}

export function createHazardEvent(input: CreateHazardEventInput): HazardEvent {
  const {
    definition,
    hazardVariable,
    region,
    selectedDate,
    depth,
    spatial,
    eventStatus,
    eventLabel,
    confidence,
    validationStatus,
    currentField,
    availableTimestepCount,
    previousPeakValue,
  } = input

  const meta = getVariableMeta(hazardVariable)
  const dist = spatial.distribution

  let currentDirectionDeg: number | null = null
  if (hazardVariable === 'current' && currentField && 'u' in currentField && spatial.peakLocation) {
    const { lat, lon } = spatial.peakLocation
    const u = bilinearSampleGrid(currentField.u, currentField.grid, lat, lon)
    const v = bilinearSampleGrid(currentField.v, currentField.grid, lat, lon)
    if (typeof u === 'number' && typeof v === 'number' && Number.isFinite(u) && Number.isFinite(v)) {
      currentDirectionDeg = directionFromUV(u, v)
    }
  }

  const eventId = buildDeterministicEventId(definition.id, region.id, selectedDate, depth)
  const trend = computeTrend(availableTimestepCount, spatial.peakValue, previousPeakValue)

  return {
    eventId,
    hazardId: definition.id,
    hazardName: definition.name,
    status: eventStatus,
    eventLabel,
    region,
    startTime: selectedDate,
    latestUpdate: selectedDate,
    primaryIndicator: meta.label,
    primaryUnit: meta.unit,
    depth,
    peakValue: spatial.peakValue,
    meanValue: spatial.meanValue,
    centreValue: spatial.centreValue,
    referenceValue: spatial.centreReference,
    anomaly: spatial.centreAnomaly,
    peakLocation: spatial.peakLocation,
    currentDirectionDeg,
    affectedCells: dist.validCells,
    moderateCells: dist.MODERATE,
    highRiskCells: dist.HIGH,
    criticalCells: dist.CRITICAL,
    confidence,
    validationStatus,
    trend,
  }
}

export function formatHazardTrend(trend: HazardTrend, availableTimestepCount: number): string {
  switch (trend) {
    case 'rising':
      return 'Rising vs previous timestep'
    case 'falling':
      return 'Falling vs previous timestep'
    case 'stable':
      return 'Stable vs previous timestep'
    case 'not_assessed':
    default:
      return availableTimestepCount <= 1
        ? 'Trend not assessed — single timestep.'
        : 'Trend not assessed — insufficient comparison data.'
  }
}
