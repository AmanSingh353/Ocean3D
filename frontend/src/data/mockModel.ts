import type { ModelConfig } from '../types/ocean'
import { DEFAULT_DEPTHS } from './defaults'
import { OCEAN_MODEL_CONFIG } from './oceanModelData'

export { VARIABLE_OPTIONS, getVariableMeta, formatVariableValue } from './variableMeta'
export { DEFAULT_DEPTHS, DEFAULT_DATES, DEFAULT_REGION } from './defaults'
export {
  formatDisplayDate,
  formatShortDate,
  formatHeaderDate,
} from '../utils/dateFormat'

/** Bootstrap config before API metadata loads. */
export const MODEL_CONFIG: ModelConfig = OCEAN_MODEL_CONFIG

/** @deprecated Prefer ocean.availableDepths from context */
export const DEPTH_TICKS = [...DEFAULT_DEPTHS]
