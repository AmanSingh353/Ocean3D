import type { OceanVariable } from '../../types/ocean'
import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiInstrument,
  ApiInstrumentProfile,
  ApiInstrumentSummary,
  ApiModelMetadata,
  ApiSalinityField,
  ApiTemperatureField,
} from '../../types/api'
import type { Instrument, InstrumentProfile } from '../../types/ocean'

/** Contract for ocean data access — demo or API-backed. */
export interface OceanDataProvider {
  readonly mode: 'demo' | 'api'
  getModelMetadata(signal?: AbortSignal): Promise<ApiModelMetadata>
  getOceanFieldAtDepth(
    variable: OceanVariable,
    depth: number,
    date: string,
    signal?: AbortSignal,
  ): Promise<
    | ApiTemperatureField
    | ApiCurrentField
    | ApiSalinityField
    | ApiChlorophyllField
  >
  getInstruments(date: string, signal?: AbortSignal): Promise<ApiInstrumentSummary[]>
  getInstrument(id: string, date: string, signal?: AbortSignal): Promise<ApiInstrument>
  getInstrumentProfile(
    id: string,
    date: string,
    signal?: AbortSignal,
  ): Promise<ApiInstrumentProfile>
  mapInstrument(api: ApiInstrument, depth: number): Instrument
  mapInstrumentProfile(api: ApiInstrumentProfile): InstrumentProfile
}
