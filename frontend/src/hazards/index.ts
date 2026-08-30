/** Public multi-hazard engine API — keep UI decoupled from engine internals. */
export {
  hazardDefinitions,
  HAZARD_DEFINITIONS,
  HAZARD_DEFINITION_LIST,
  type HazardDefinition,
} from './definitions'

export {
  getHazardDefinition,
  listHazardDefinitions,
  getRequiredVariables,
  getPrimaryOceanVariable,
  checkDataAvailability,
  type DataAvailabilityResult,
} from './registry'

export {
  runMultiHazardEngine as runHazardEngine,
  runMultiHazardEngine,
  calculateAnomaly,
  calculateHazardLevel,
  calculateSpatialRisk,
  calculateConfidence,
  createHazardEvent,
  generateHazardExplanation,
  buildEventLabel,
} from './engine'

export type { HazardResult, HazardAssessment } from '../types/hazard'
