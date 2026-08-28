import type { ModelConfig } from '../types/ocean'
import { DEFAULT_DATES, DEFAULT_DEPTHS } from './defaults'

export { VARIABLE_OPTIONS, getVariableMeta, formatVariableValue } from './variableMeta'
export { DEFAULT_DEPTHS, DEFAULT_DATES, DEFAULT_REGION } from './defaults'
export {
  formatDisplayDate,
  formatShortDate,
  formatHeaderDate,
} from '../utils/dateFormat'

/** Bootstrap config before API metadata loads. */
export const MODEL_CONFIG: ModelConfig = {
  variable: 'temperature',
  unit: '°C',
  depths: [...DEFAULT_DEPTHS],
  temperatureRange: { min: 8, max: 31 },
  dates: [...DEFAULT_DATES],
}

/** @deprecated Prefer ocean.availableDepths from context */
export const DEPTH_TICKS = [...DEFAULT_DEPTHS]
