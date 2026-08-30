import type { HazardDefinition, HazardDataRequirement } from './definitions'
import { HAZARD_DEFINITIONS, HAZARD_DEFINITION_LIST } from './definitions'
import type { HazardDataAvailability, HazardId } from '../types/hazard'
import type { OceanVariable } from '../types/ocean'
import type { OceanFieldBundle } from '../utils/hazardFieldAccess'
import { getLoadedFieldForVariable } from '../utils/hazardFieldAccess'
import { getVariableMeta } from '../data/variableMeta'

export function getHazardDefinition(id: HazardId): HazardDefinition {
  return HAZARD_DEFINITIONS[id]
}

export function listHazardDefinitions(): HazardDefinition[] {
  return HAZARD_DEFINITION_LIST
}

export function getRequiredVariables(definition: HazardDefinition): OceanVariable[] {
  const vars = new Set<OceanVariable>()
  if (definition.primaryRequirement.kind === 'oceanVariable') {
    vars.add(definition.primaryRequirement.variable)
  }
  for (const req of definition.secondaryRequirements) {
    if (req.kind === 'oceanVariable') vars.add(req.variable)
  }
  return [...vars]
}

export function getPrimaryOceanVariable(definition: HazardDefinition): OceanVariable | null {
  if (definition.primaryRequirement.kind === 'oceanVariable') {
    return definition.primaryRequirement.variable
  }
  return null
}

export interface DataAvailabilityResult {
  available: boolean
  message: string
  primaryVariable: OceanVariable | null
  missingRequirements: string[]
  dataAvailability: HazardDataAvailability
}

function labelRequirement(req: HazardDataRequirement): string {
  return req.kind === 'oceanVariable' ? req.label : req.label
}

function buildUnavailableMessage(missing: string[]): string {
  if (missing.length === 0) {
    return 'Required ocean data unavailable for this hazard.'
  }
  return `Required ocean data unavailable for this hazard. Missing: ${missing.join(', ')}.`
}

function toDataAvailability(
  available: boolean,
  requiredVariable: string,
  missingRequirements: string[],
  message: string,
): HazardDataAvailability {
  return {
    available,
    statusLabel: available ? 'Available' : 'Unavailable',
    requiredVariable,
    missingRequirements,
    message,
  }
}

export function checkDataAvailability(
  definition: HazardDefinition,
  fields: OceanFieldBundle,
): DataAvailabilityResult {
  const requiredLabel =
    definition.primaryRequirement.kind === 'oceanVariable'
      ? definition.primaryRequirement.label
      : definition.primaryRequirement.label

  if (definition.architectureOnly || !definition.dataAvailableInDemo) {
    const missing = [
      definition.primaryRequirement,
      ...definition.secondaryRequirements,
    ].map(labelRequirement)
    const message =
      definition.unavailableMessage ?? buildUnavailableMessage(missing)
    return {
      available: false,
      message,
      primaryVariable: getPrimaryOceanVariable(definition),
      missingRequirements: missing,
      dataAvailability: toDataAvailability(false, requiredLabel, missing, message),
    }
  }

  const primaryVar = getPrimaryOceanVariable(definition)
  if (!primaryVar) {
    const missing = [labelRequirement(definition.primaryRequirement)]
    const message = buildUnavailableMessage(missing)
    return {
      available: false,
      message,
      primaryVariable: null,
      missingRequirements: missing,
      dataAvailability: toDataAvailability(false, requiredLabel, missing, message),
    }
  }

  const missing: string[] = []
  const primaryField = getLoadedFieldForVariable(primaryVar, fields)
  if (!primaryField) {
    missing.push(labelRequirement(definition.primaryRequirement))
  }

  const meta = getVariableMeta(primaryVar)
  const message =
    missing.length > 0
      ? buildUnavailableMessage(missing)
      : ''

  return {
    available: missing.length === 0,
    message,
    primaryVariable: primaryVar,
    missingRequirements: missing,
    dataAvailability: toDataAvailability(
      missing.length === 0,
      meta.label,
      missing,
      message || `Analyzing ${meta.label} field.`,
    ),
  }
}
