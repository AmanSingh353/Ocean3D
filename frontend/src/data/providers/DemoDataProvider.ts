import {
  getInstrument,
  getInstrumentProfile,
  getInstruments,
  getModelMetadata,
  getOceanFieldAtDepth,
  mapInstrument,
  mapInstrumentProfile,
} from '../../services/oceanApi'
import type { OceanDataProvider } from './types'

/** Default provider — wraps existing legacy demo API routes unchanged. */
export const demoDataProvider: OceanDataProvider = {
  mode: 'demo',
  getModelMetadata,
  getOceanFieldAtDepth,
  getInstruments,
  getInstrument,
  getInstrumentProfile,
  mapInstrument,
  mapInstrumentProfile,
}
