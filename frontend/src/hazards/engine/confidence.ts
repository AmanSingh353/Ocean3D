import type { HazardConfidenceLevel } from '../../types/hazard'
import type { HazardDefinition } from '../definitions'
import type { RiskDistribution } from '../../types/hazard'
import type { ValidationStats } from '../../types/ocean'
import type { RegionValidationStats } from '../../types/analysis'
import type { OceanVariable } from '../../types/ocean'

export interface ConfidenceInput {
  definition: HazardDefinition
  distribution: RiskDistribution
  comparison: ValidationStats | null
  regionValidation: RegionValidationStats | null
  matchedPlatformsInRegion: number
  hazardVariable: OceanVariable
  selectedVariable: OceanVariable
  fieldDateIso: string
  selectedDateIso: string
}

export interface ConfidenceResult {
  level: HazardConfidenceLevel
  note: string
  validationStatus: string | null
  spatialCoverage: number
  evidenceSummary: string[]
}

export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const {
    definition,
    distribution,
    comparison,
    regionValidation,
    matchedPlatformsInRegion,
    hazardVariable,
    selectedVariable,
    fieldDateIso,
    selectedDateIso,
  } = input

  const spatialCoverage =
    distribution.regionCells > 0 ? distribution.validCells / distribution.regionCells : 0

  const evidence: string[] = []
  let score = 0

  const variableMatch = hazardVariable === selectedVariable && comparison != null

  if (regionValidation?.validationStatus) {
    evidence.push(`Regional validation: ${regionValidation.validationStatus}`)
    if (regionValidation.validationStatus === 'GOOD') score += 3
    else if (regionValidation.validationStatus === 'MODERATE') score += 2
    else score += 1
  }

  if (comparison?.validationStatus) {
    evidence.push(`Platform validation: ${comparison.validationStatus}`)
    if (comparison.validationStatus === 'GOOD') score += 2
    else if (comparison.validationStatus === 'MODERATE') score += 1
  }

  if (
    comparison?.matchedPoints != null &&
    comparison.matchedPoints >= definition.confidenceRequirements.minMatchedObservations
  ) {
    evidence.push(`${comparison.matchedPoints} matched profile points`)
    score += 1
  }

  if (matchedPlatformsInRegion > 0) {
    evidence.push(`${matchedPlatformsInRegion} platform(s) in analyzed region`)
    if (matchedPlatformsInRegion >= 2) score += 1
  }

  if (spatialCoverage >= 0.5) {
    evidence.push(`Spatial coverage ${(spatialCoverage * 100).toFixed(0)}% of region cells`)
    score += 1
  }

  if (fieldDateIso.slice(0, 10) === selectedDateIso.slice(0, 10)) {
    evidence.push('Field timestamp matches selected event time')
    score += 1
  }

  if (variableMatch) {
    evidence.push('Observation comparison available for hazard variable at selected platform')
    score += 1
  } else if (comparison) {
    evidence.push(
      'Observation comparison is for a different variable — does not fully validate regional hazard field',
    )
  }

  const validationStatus =
    regionValidation?.validationStatus ?? comparison?.validationStatus ?? null

  if (score === 0 && !validationStatus) {
    return {
      level: 'NOT_ASSESSED',
      note: 'Confidence: Not available — insufficient validation data.',
      validationStatus: null,
      spatialCoverage,
      evidenceSummary: ['No validation evidence available for this hazard assessment.'],
    }
  }

  let level: HazardConfidenceLevel
  if (score >= 6) level = 'HIGH'
  else if (score >= 3) level = 'MODERATE'
  else level = 'LOW'

  return {
    level,
    note: `Confidence: ${level} — based on available validation evidence (not an RMSE-derived percentage).`,
    validationStatus,
    spatialCoverage,
    evidenceSummary: evidence,
  }
}
