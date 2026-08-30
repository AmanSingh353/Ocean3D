import { getVariableMeta } from '../../data/variableMeta'
import type {
  HazardAssessment,
  HazardAnalysisStatus,
  HazardEngineInput,
  HazardIndicatorResult,
  HazardDataAvailability,
  RiskLevel,
  TimelineHazardSummary,
} from '../../types/hazard'
import type { OceanVariable } from '../../types/ocean'
import { bilinearSampleGrid } from '../../utils/fieldSampling'
import { getLoadedFieldForVariable, type OceanField } from '../../utils/hazardFieldAccess'
import {
  checkDataAvailability,
  getHazardDefinition,
  getRequiredVariables,
} from '../registry'
import { calculateSpatialRisk } from './spatialRisk'
import { calculateConfidence } from './confidence'
import { createHazardEvent } from './event'
import { buildEventLabel, generateHazardExplanation } from './explanation'

const RISK_LEVEL_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']

function buildSecondaryIndicator(
  variable: OceanVariable,
  lat: number,
  lon: number,
  _depth: number,
  _dateIso: string,
  fields: HazardEngineInput['fields'],
): HazardIndicatorResult {
  const meta = getVariableMeta(variable)
  const field = getLoadedFieldForVariable(variable, fields)
  let currentValue: number | null = null
  let currentDirectionDeg: number | null = null

  if (field) {
    const values =
      variable === 'current' && 'magnitude' in field
        ? field.magnitude
        : 'values' in field
          ? field.values
          : null
    if (values) {
      currentValue = bilinearSampleGrid(values, field.grid, lat, lon)
    }
    if (variable === 'current' && field && 'u' in field) {
      const u = bilinearSampleGrid(field.u, field.grid, lat, lon)
      const v = bilinearSampleGrid(field.v, field.grid, lat, lon)
      if (typeof u === 'number' && typeof v === 'number') {
        const deg = (Math.atan2(v, u) * 180) / Math.PI
        currentDirectionDeg = deg < 0 ? deg + 360 : Number(deg.toFixed(0))
      }
    }
  }

  return {
    id: variable,
    label: meta.label,
    variable,
    unit: meta.unit,
    currentValue: currentValue != null ? Number(currentValue.toFixed(3)) : null,
    referenceValue: null,
    anomaly: null,
    anomalyPercent: null,
    currentSpeed: variable === 'current' ? currentValue : null,
    currentDirectionDeg,
    riskLevel: 'LOW',
  }
}

function emptyAssessment(
  input: HazardEngineInput,
  status: HazardAnalysisStatus,
  statusMessage: string,
  dataAvailability?: HazardDataAvailability,
): HazardAssessment {
  const definition = getHazardDefinition(input.hazardId)
  const availability = checkDataAvailability(definition, input.fields)
  const primaryVar = getRequiredVariables(definition)[0] ?? 'temperature'
  const meta = getVariableMeta(primaryVar)

  return {
    status,
    statusMessage,
    hazardId: input.hazardId,
    categoryLabel: definition.name,
    hazardVariable: primaryVar,
    analyzedDepth: input.apiModelDepth,
    analyzedDate: input.selectedDate,
    eventStatus: 'LOW',
    eventLabel: statusMessage,
    affectedRegion: input.region,
    dataAvailability: dataAvailability ?? availability.dataAvailability,
    event: null,
    primaryIndicator: {
      id: primaryVar,
      label: meta.label,
      variable: primaryVar,
      unit: meta.unit,
      currentValue: null,
      referenceValue: null,
      anomaly: null,
      anomalyPercent: null,
      currentSpeed: null,
      currentDirectionDeg: null,
      riskLevel: 'LOW',
    },
    indicators: [],
    riskDistribution: {
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      CRITICAL: 0,
      validCells: 0,
      regionCells: 0,
    },
    peakValue: null,
    meanValue: null,
    explanation: [statusMessage],
    whyFlagged: [statusMessage],
    monitoringGuidance: [],
    dataLimitations: [
      'Demo synthetic data — not operational observations.',
      definition.thresholdRule.demoDisclaimer,
    ],
    confidence: 'NOT_ASSESSED',
    confidenceNote: 'Confidence: Not available — insufficient validation data.',
    validationStatus: null,
    lastUpdated: input.selectedDate,
    gridSnapshot: null,
    timelineSummary: null,
    isDemo: true,
  }
}

export function runMultiHazardEngine(input: HazardEngineInput): HazardAssessment {
  const definition = getHazardDefinition(input.hazardId)

  if (input.isFieldLoading) {
    return emptyAssessment(input, 'no_data', 'Loading ocean field data...')
  }

  const availability = checkDataAvailability(definition, input.fields)
  if (!availability.available) {
    return emptyAssessment(input, 'no_data', availability.message, availability.dataAvailability)
  }

  const hazardVariable = availability.primaryVariable!
  const primaryField = getLoadedFieldForVariable(hazardVariable, input.fields)!

  const fieldDate = primaryField.date.slice(0, 10)
  const requestDate = input.selectedDate.slice(0, 10)
  if (fieldDate !== requestDate) {
    return emptyAssessment(
      input,
      'no_data',
      'Ocean field data does not match the selected timestamp.',
    )
  }

  const spatial = calculateSpatialRisk(
    definition,
    primaryField,
    hazardVariable,
    input.apiModelDepth,
    input.selectedDate,
    input.region,
  )

  if (spatial.distribution.validCells === 0) {
    return emptyAssessment(
      input,
      'insufficient',
      'Insufficient data for hazard analysis — no valid ocean grid cells in the selected region.',
    )
  }

  const eventStatus =
    ([...RISK_LEVEL_ORDER].reverse() as RiskLevel[]).find(
      (level) => spatial.distribution[level] > 0,
    ) ?? 'LOW'

  const eventLabel = buildEventLabel(
    definition,
    eventStatus,
    spatial.distribution.HIGH,
    spatial.distribution.CRITICAL,
  )

  const confidenceResult = calculateConfidence({
    definition,
    distribution: spatial.distribution,
    comparison: input.comparison,
    regionValidation: input.regionValidation,
    matchedPlatformsInRegion: input.matchedPlatformsInRegion,
    hazardVariable,
    selectedVariable: input.selectedVariable,
    fieldDateIso: primaryField.date,
    selectedDateIso: input.selectedDate,
  })

  const currentField =
    hazardVariable === 'current' ? (primaryField as OceanField) : input.fields.current

  const event = createHazardEvent({
    definition,
    hazardVariable,
    region: input.region,
    selectedDate: input.selectedDate,
    depth: primaryField.depth,
    spatial,
    eventStatus,
    eventLabel,
    confidence: confidenceResult.level,
    validationStatus: confidenceResult.validationStatus,
    currentField,
    availableTimestepCount: input.availableTimestepCount,
    previousPeakValue: input.previousPeakValue,
  })

  const { whyFlagged, monitoringGuidance, dataLimitations } = generateHazardExplanation(
    definition,
    event,
    confidenceResult,
    input.hasObservationsInRegion,
    input.matchedPlatformsInRegion,
  )

  const latCenter = (input.region.latMin + input.region.latMax) / 2
  const lonCenter = (input.region.lonMin + input.region.lonMax) / 2

  const indicators: HazardIndicatorResult[] = getRequiredVariables(definition).map((v) =>
    buildSecondaryIndicator(v, latCenter, lonCenter, input.apiModelDepth, input.selectedDate, input.fields),
  )

  const primaryIndicator: HazardIndicatorResult = {
    id: hazardVariable,
    label: event.primaryIndicator,
    variable: hazardVariable,
    unit: event.primaryUnit,
    currentValue: event.centreValue,
    referenceValue: event.referenceValue,
    anomaly: event.anomaly,
    anomalyPercent:
      event.anomaly != null && event.referenceValue != null && event.referenceValue !== 0
        ? Number(((event.anomaly / Math.abs(event.referenceValue)) * 100).toFixed(1))
        : null,
    currentSpeed: hazardVariable === 'current' ? event.peakValue : null,
    currentDirectionDeg: event.currentDirectionDeg,
    riskLevel: eventStatus,
  }

  const timelineSummary: TimelineHazardSummary = {
    eventStatus,
    peakValue: event.peakValue,
    anomaly: event.anomaly,
    affectedCells: event.affectedCells,
    confidence: event.confidence,
  }

  return {
    status: 'success',
    statusMessage: eventLabel,
    hazardId: input.hazardId,
    categoryLabel: definition.name,
    hazardVariable,
    analyzedDepth: primaryField.depth,
    analyzedDate: primaryField.date,
    eventStatus,
    eventLabel,
    affectedRegion: input.region,
    dataAvailability: availability.dataAvailability,
    event,
    primaryIndicator,
    indicators,
    riskDistribution: spatial.distribution,
    peakValue: spatial.peakValue,
    meanValue: spatial.meanValue,
    explanation: whyFlagged,
    whyFlagged,
    monitoringGuidance,
    dataLimitations,
    confidence: confidenceResult.level,
    confidenceNote: confidenceResult.note,
    validationStatus: confidenceResult.validationStatus,
    lastUpdated: primaryField.date,
    gridSnapshot: spatial.snapshot,
    timelineSummary,
    isDemo: true,
  }
}

export {
  getHazardDefinition,
  getRequiredVariables,
  checkDataAvailability,
} from '../registry'
export { calculateAnomaly } from './anomaly'
export { calculateHazardLevel } from './classify'
export { calculateSpatialRisk } from './spatialRisk'
export { calculateConfidence } from './confidence'
export { createHazardEvent } from './event'
export { generateHazardExplanation, buildEventLabel } from './explanation'
