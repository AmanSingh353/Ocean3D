/** Re-exports from multi-hazard registry for backward compatibility. */
export {
  getHazardDefinition,
  listHazardDefinitions,
  getRequiredVariables,
  getPrimaryOceanVariable,
  checkDataAvailability,
} from '../hazards/registry'

export { HAZARD_DEFINITION_LIST as HAZARD_CATEGORIES } from '../hazards/definitions'

import type { HazardId } from '../types/hazard'
import { getHazardDefinition, getPrimaryOceanVariable, getRequiredVariables } from '../hazards/registry'
import type { OceanVariable } from '../types/ocean'

export function getHazardCategoryConfig(id: HazardId) {
  const def = getHazardDefinition(id)
  return {
    id: def.id,
    label: def.name,
    description: def.description,
    primaryVariable: getPrimaryOceanVariable(def) ?? ('temperature' as OceanVariable),
    secondaryVariables: [] as OceanVariable[],
    allowsVariableSelection: def.id === 'marineHeatAnomaly',
  }
}

export function resolveHazardVariable(hazardId: HazardId): OceanVariable | null {
  return getPrimaryOceanVariable(getHazardDefinition(hazardId))
}

export function getAnalysisVariables(hazardId: HazardId): OceanVariable[] {
  return getRequiredVariables(getHazardDefinition(hazardId))
}

export function getHazardCategoryMeta(id: HazardId) {
  const def = getHazardDefinition(id)
  return { id: def.id, label: def.name, description: def.description }
}

export const MARINE_ANOMALY_VARIABLES: OceanVariable[] = ['temperature', 'salinity', 'chlorophyll']
