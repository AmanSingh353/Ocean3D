import type { HazardDefinition } from '../definitions'

import type { HazardEvent, RiskLevel } from '../../types/hazard'

import type { ConfidenceResult } from './confidence'



export interface HazardExplanationResult {

  whyFlagged: string[]

  monitoringGuidance: string[]

  dataLimitations: string[]

}



export function generateHazardExplanation(

  definition: HazardDefinition,

  event: HazardEvent,

  confidence: ConfidenceResult,

  hasObservationsInRegion: boolean,

  matchedPlatformsInRegion: number,

): HazardExplanationResult {

  const whyFlagged: string[] = []

  const dataLimitations: string[] = [

    'Demo synthetic data — not operational observations.',

    definition.thresholdRule.demoDisclaimer,

    'Requires operational forecast confirmation for any real-world decision.',

  ]



  if (definition.architectureOnly) {

    return {

      whyFlagged: [definition.unavailableMessage ?? 'Required ocean data unavailable for this hazard.'],

      monitoringGuidance: [

        'This hazard type is architecture-only until required datasets are connected.',

      ],

      dataLimitations,

    }

  }



  if (definition.anomalyRule.usesDemoReference) {

    dataLimitations.push(

      'Baseline/reference values are deterministic demo references — not operational climatology.',

    )

  }



  if (definition.id === 'tsunamiSupport') {

    dataLimitations.push(

      'Tsunami assessment cannot be inferred from temperature, current, or salinity fields alone.',

    )

  }



  if (event.peakValue != null && event.status !== 'LOW') {

    whyFlagged.push(

      `Regional peak ${event.primaryIndicator.toLowerCase()} (${event.peakValue} ${event.primaryUnit}) exceeds the configured demo ${event.status.toLowerCase()} threshold.`,

    )

  } else if (event.peakValue != null) {

    whyFlagged.push(

      `Regional peak ${event.primaryIndicator.toLowerCase()} is ${event.peakValue} ${event.primaryUnit} — within demo LOW classification.`,

    )

  }



  if (event.anomaly != null && Math.abs(event.anomaly) > 0 && definition.anomalyRule.enabled) {

    const sign = event.anomaly >= 0 ? '+' : ''

    whyFlagged.push(

      `Centre anomaly is ${sign}${event.anomaly} ${event.primaryUnit} relative to demo reference.`,

    )

  }



  if (event.highRiskCells > 0) {

    whyFlagged.push(`${event.highRiskCells} grid cell(s) classified HIGH in analyzed region.`)

  }

  if (event.criticalCells > 0) {

    whyFlagged.push(`${event.criticalCells} grid cell(s) classified CRITICAL in analyzed region.`)

  }

  if (event.affectedCells > 0) {

    whyFlagged.push(`${event.affectedCells} valid grid cell(s) analyzed in ${event.region.label}.`)

  }



  if (hasObservationsInRegion) {

    whyFlagged.push(

      `Observation/model validation available at ${matchedPlatformsInRegion} matched platform(s) in region.`,

    )

    whyFlagged.push(

      'A single platform comparison does not validate the entire regional hazard field.',

    )

  }



  if (confidence.level !== 'NOT_ASSESSED') {

    whyFlagged.push(`Current confidence classification is ${confidence.level}.`)

  }



  for (const line of confidence.evidenceSummary) {

    if (!whyFlagged.includes(line)) whyFlagged.push(line)

  }



  if (whyFlagged.length === 0) {

    whyFlagged.push('No demo hazard thresholds exceeded in the selected region.')

  }



  return {

    whyFlagged,

    monitoringGuidance: buildMonitoringGuidance(event.status, definition.name),

    dataLimitations,

  }

}



function buildMonitoringGuidance(status: RiskLevel, hazardName: string): string[] {

  const guidance: string[] = [

    'Continue monitoring the affected region and review updated model/observation data.',

  ]



  if (status === 'HIGH' || status === 'CRITICAL') {

    guidance.push(

      `Elevated ${hazardName.toLowerCase()} indicators present — seek operational forecast confirmation before any response action.`,

    )

  } else {

    guidance.push('Current demo indicators remain below elevated thresholds in the analyzed region.')

  }



  guidance.push('Do not treat demo hazard output as an operational warning or evacuation order.')



  return guidance

}



export function buildEventLabel(

  definition: HazardDefinition,

  eventStatus: RiskLevel,

  highRiskCells: number,

  criticalCells: number,

): string {

  const elevated = highRiskCells + criticalCells > 0



  if (definition.primaryRequirement.kind === 'oceanVariable') {

    const label = definition.primaryRequirement.label.toLowerCase()

    if (elevated || eventStatus === 'HIGH' || eventStatus === 'CRITICAL') {

      return `Elevated ${label} conditions detected in the selected region.`

    }

    return `No elevated ${label} conditions detected in the selected region.`

  }



  return elevated

    ? `Elevated conditions indicated in demo analysis for ${definition.name}.`

    : `No elevated conditions detected for ${definition.name} in demo analysis.`

}

