import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiSalinityField,
  ApiTemperatureField,
} from '../types/api'
import type { ValidationRegionBounds } from '../data/validationRegions'
import { isPointInValidationRegion } from '../data/validationRegions'
import { getDemoReferenceValue } from '../data/demoClimatology'
import {
  classifyByThreshold,
  DEMO_HAZARD_THRESHOLDS,
  maxRiskLevel,
} from '../data/hazardThresholds'
import { HAZARD_EVENT_LABELS, getHazardCategoryMeta } from '../data/hazardCategories'
import type {
  HazardAssessment,
  HazardCategoryId,
  HazardGridSnapshot,
  HazardIndicatorResult,
  RiskLevel,
} from '../types/hazard'
import type { OceanVariable } from '../types/ocean'
import { getVariableMeta } from '../data/variableMeta'
import { bilinearSampleGrid } from './fieldSampling'

type ModelFields = {
  temperature: ApiTemperatureField | null
  current: ApiCurrentField | null
  salinity: ApiSalinityField | null
  chlorophyll: ApiChlorophyllField | null
}

function isValid(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function computeAnomaly(current: number, reference: number): { anomaly: number; percent: number | null } {
  const anomaly = current - reference
  const percent =
    reference !== 0 ? Number(((anomaly / Math.abs(reference)) * 100).toFixed(1)) : null
  return { anomaly, percent }
}

function currentDirectionDeg(u: number, v: number): number {
  const deg = (Math.atan2(v, u) * 180) / Math.PI
  return deg < 0 ? deg + 360 : Number(deg.toFixed(0))
}

function sampleVariableAtPoint(
  fields: ModelFields,
  variable: OceanVariable,
  lat: number,
  lon: number,
): number | null {
  switch (variable) {
    case 'temperature': {
      const f = fields.temperature
      if (!f) return null
      return bilinearSampleGrid(f.values, f.grid, lat, lon)
    }
    case 'salinity': {
      const f = fields.salinity
      if (!f) return null
      return bilinearSampleGrid(f.values, f.grid, lat, lon)
    }
    case 'chlorophyll': {
      const f = fields.chlorophyll
      if (!f) return null
      return bilinearSampleGrid(f.values, f.grid, lat, lon)
    }
    case 'current': {
      const f = fields.current
      if (!f) return null
      return bilinearSampleGrid(f.magnitude, f.grid, lat, lon)
    }
  }
}

function sampleCurrentComponents(
  fields: ModelFields,
  lat: number,
  lon: number,
): { speed: number | null; direction: number | null } {
  const f = fields.current
  if (!f) return { speed: null, direction: null }
  const u = bilinearSampleGrid(f.u, f.grid, lat, lon)
  const v = bilinearSampleGrid(f.v, f.grid, lat, lon)
  if (!isValid(u) || !isValid(v)) return { speed: null, direction: null }
  const speed = Math.sqrt(u * u + v * v)
  return { speed: Number(speed.toFixed(3)), direction: currentDirectionDeg(u, v) }
}

function classifyVariableRisk(
  variable: OceanVariable,
  currentValue: number,
  referenceValue: number,
): RiskLevel {
  if (variable === 'current') {
    return classifyByThreshold(currentValue, DEMO_HAZARD_THRESHOLDS.currentSpeed)
  }
  const { anomaly } = computeAnomaly(currentValue, referenceValue)
  const bands = DEMO_HAZARD_THRESHOLDS.anomaly[variable]
  return classifyByThreshold(Math.abs(anomaly), bands)
}

function buildIndicator(
  id: string,
  label: string,
  variable: OceanVariable,
  lat: number,
  lon: number,
  depth: number,
  dateIso: string,
  fields: ModelFields,
): HazardIndicatorResult {
  const meta = getVariableMeta(variable)
  const currentValue = sampleVariableAtPoint(fields, variable, lat, lon)
  const referenceValue = getDemoReferenceValue(lat, lon, depth, dateIso, variable)
  const currentParts = variable === 'current' ? sampleCurrentComponents(fields, lat, lon) : { speed: null, direction: null }

  if (!isValid(currentValue)) {
    return {
      id,
      label,
      variable,
      unit: meta.unit,
      currentValue: null,
      referenceValue,
      anomaly: null,
      anomalyPercent: null,
      currentSpeed: currentParts.speed,
      currentDirectionDeg: currentParts.direction,
      riskLevel: 'LOW',
    }
  }

  const { anomaly, percent } = computeAnomaly(currentValue, referenceValue)
  const riskLevel = classifyVariableRisk(variable, currentValue, referenceValue)

  return {
    id,
    label,
    variable,
    unit: meta.unit,
    currentValue: Number(currentValue.toFixed(3)),
    referenceValue: Number(referenceValue.toFixed(3)),
    anomaly: Number(anomaly.toFixed(3)),
    anomalyPercent: percent,
    currentSpeed: currentParts.speed ?? (variable === 'current' ? Number(currentValue.toFixed(3)) : null),
    currentDirectionDeg: currentParts.direction,
    riskLevel,
  }
}

function categoryVariables(category: HazardCategoryId, selectedVariable: OceanVariable): OceanVariable[] {
  switch (category) {
    case 'cycloneOceanConditions':
      return ['temperature', 'current']
    case 'stormSurgeSupport':
      return ['current', 'temperature']
    case 'marineAnomaly':
      return [selectedVariable]
    case 'strongCurrent':
      return ['current']
  }
}

function computeGridRisk(
  fields: ModelFields,
  variable: OceanVariable,
  depth: number,
  dateIso: string,
  region: ValidationRegionBounds,
): HazardGridSnapshot | null {
  const field =
    variable === 'temperature'
      ? fields.temperature
      : variable === 'salinity'
        ? fields.salinity
        : variable === 'chlorophyll'
          ? fields.chlorophyll
          : fields.current

  if (!field) return null

  const grid = field.grid
  const riskLevels: RiskLevel[][] = []

  for (let j = 0; j < grid.latitudes.length; j++) {
    const row: RiskLevel[] = []
    for (let i = 0; i < grid.longitudes.length; i++) {
      const lat = grid.latitudes[j]
      const lon = grid.longitudes[i]
      if (!isPointInValidationRegion(lat, lon, region)) {
        row.push('LOW')
        continue
      }
      const ref = getDemoReferenceValue(lat, lon, depth, dateIso, variable)
      let val: number | null = null
      if (variable === 'current' && fields.current) {
        val = fields.current.magnitude[j]?.[i] ?? null
      } else if ('values' in field) {
        val = field.values[j]?.[i] ?? null
      }
      if (!isValid(val)) {
        row.push('LOW')
        continue
      }
      row.push(classifyVariableRisk(variable, val, ref))
    }
    riskLevels.push(row)
  }

  return { grid, riskLevels }
}

function buildExplanation(
  indicators: HazardIndicatorResult[],
  category: HazardCategoryId,
  validationQuality: HazardAssessment['validationQuality'],
  hasObservations: boolean,
): string[] {
  const lines: string[] = []

  for (const ind of indicators) {
    if (ind.currentValue == null) continue
    if (ind.variable === 'current' && ind.riskLevel !== 'LOW') {
      lines.push(
        `Current speed (${ind.currentValue} ${ind.unit}) exceeds configured demo threshold (${ind.riskLevel.toLowerCase()})`,
      )
    } else if (ind.variable !== 'current' && ind.anomaly != null) {
      const bands = DEMO_HAZARD_THRESHOLDS.anomaly[ind.variable]
      if (Math.abs(ind.anomaly) > bands.low) {
        const sign = ind.anomaly >= 0 ? '+' : ''
        lines.push(
          `${ind.label} anomaly ${sign}${ind.anomaly} ${ind.unit} vs demo reference (${ind.riskLevel.toLowerCase()})`,
        )
      }
    }
  }

  if (lines.length === 0) {
    lines.push('No demo hazard thresholds exceeded in the selected region.')
  }

  if (category === 'stormSurgeSupport') {
    lines.push('Coastal flooding assessment requires operational coastal model data — not available in demo.')
  }
  if (category === 'cycloneOceanConditions') {
    lines.push('Cyclone detection requires atmospheric forecast data — not available in demo.')
  }

  if (hasObservations) {
    lines.push('Region contains observation/model comparison data.')
  }

  if (validationQuality) {
    lines.push(`Model validation quality: ${validationQuality}`)
  } else {
    lines.push('Model validation quality: not assessed for this view.')
  }

  return lines
}

export interface HazardEngineInput {
  category: HazardCategoryId
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedDate: string
  region: ValidationRegionBounds
  fields: ModelFields
  validationQuality: HazardAssessment['validationQuality']
  hasObservationsInRegion: boolean
}

export function computeHazardAssessment(input: HazardEngineInput): HazardAssessment | null {
  const { category, selectedVariable, selectedDepth, selectedDate, region, fields } = input
  const latCenter = (region.latMin + region.latMax) / 2
  const lonCenter = (region.lonMin + region.lonMax) / 2
  const variables = categoryVariables(category, selectedVariable)

  const indicators: HazardIndicatorResult[] = variables.map((v) =>
    buildIndicator(
      v,
      getVariableMeta(v).label,
      v,
      latCenter,
      lonCenter,
      selectedDepth,
      selectedDate,
      fields,
    ),
  )

  if (indicators.every((i) => i.currentValue == null)) return null

  const eventStatus = indicators.reduce(
    (max, ind) => maxRiskLevel(max, ind.riskLevel),
    'LOW' as RiskLevel,
  )

  const primaryIndicator =
    indicators.reduce((best, ind) =>
      RISK_LEVEL_ORDER.indexOf(ind.riskLevel) > RISK_LEVEL_ORDER.indexOf(best.riskLevel) ? ind : best,
    indicators[0])

  const overlayVariable =
    category === 'strongCurrent'
      ? 'current'
      : category === 'marineAnomaly'
        ? selectedVariable
        : 'current'

  const gridSnapshot = computeGridRisk(
    fields,
    overlayVariable,
    selectedDepth,
    selectedDate,
    region,
  )

  const dataConfidence = input.validationQuality ?? 'NOT_AVAILABLE'

  return {
    category,
    categoryLabel: getHazardCategoryMeta(category).label,
    eventStatus,
    eventLabel: HAZARD_EVENT_LABELS[category],
    affectedRegion: region,
    primaryIndicator,
    indicators,
    explanation: buildExplanation(
      indicators,
      category,
      input.validationQuality,
      input.hasObservationsInRegion,
    ),
    dataConfidence,
    validationQuality: input.validationQuality,
    confidenceNote:
      dataConfidence === 'NOT_AVAILABLE'
        ? 'Confidence: Not available — insufficient validation data.'
        : 'Validation quality affects confidence in hazard indicators.',
    lastUpdated: selectedDate,
    gridSnapshot,
    isDemo: true,
  }
}

const RISK_LEVEL_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
