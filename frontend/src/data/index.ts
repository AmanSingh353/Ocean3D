export {
  OCEAN_DEPTHS,
  snapToNearestModelDepth,
  oceanDepthTicks,
  type OceanDepth,
} from './depths'
export {
  OCEAN_TIMESTAMPS,
  DEFAULT_OCEAN_DATE,
  type OceanTimestamp,
} from './timestamps'
export {
  VARIABLE_DEMO_RANGES,
  getVariableDemoRange,
  resolveFieldDisplayRange,
} from './variables'
export {
  OCEAN_MODEL_REGION,
  OCEAN_MODEL_CONFIG,
  defaultOceanModelGrid,
} from './oceanModelData'
export {
  OBSERVATION_PLATFORMS,
  type ObservationPlatformRef,
} from './observationData'
export {
  VALIDATION_REGION_PRESETS,
  DEFAULT_VALIDATION_REGION,
  isPointInValidationRegion,
  type ValidationRegionBounds,
} from './validationRegions'
export { DEMO_DATA_DISCLAIMER, type OceanModelSample, type ObservationSample } from './validationData'
export {
  VARIABLE_META,
  VARIABLE_OPTIONS,
  getVariableMeta,
  formatVariableValue,
  formatVariableTick,
  formatComparisonMetric,
  type VariableMeta,
} from './variableMeta'
