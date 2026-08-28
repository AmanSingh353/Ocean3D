import type { ApiCurrentField, ApiTemperatureField } from './api'
import type {
  ComparisonStats,
  Instrument,
  InstrumentProfile,
  OceanVariable,
} from './ocean'

/** Central ocean data state driven by the FastAPI backend. */
export interface OceanDataState {
  selectedDate: string
  selectedDepth: number
  selectedVariable: OceanVariable
  selectedInstrumentId: string | null
  selectedInstrument: Instrument | null
  oceanData: ApiTemperatureField | null
  currentData: ApiCurrentField | null
  instruments: Instrument[]
  instrumentProfile: InstrumentProfile | null
  comparison: ComparisonStats | null
  observationTime: string
  isModelLoading: boolean
  isInstrumentsLoading: boolean
  isProfileLoading: boolean
  modelError: string | null
  profileError: string | null
  apiError: string | null
}

export interface OceanDataActions {
  setSelectedDate: (date: string) => void
  setSelectedDepth: (depth: number) => void
  setSelectedVariable: (variable: OceanVariable) => void
  selectInstrument: (id: string) => void
  clearInstrumentSelection: () => void
  retryOceanData: () => void
}

export type OceanContextValue = OceanDataState &
  OceanDataActions & {
    availableDates: string[]
    dateIndex: number
    setDateIndex: (index: number) => void
    colorScaleMin: number
    colorScaleMax: number
    setColorScale: (min: number, max: number) => void
    currentScaleMin: number
    currentScaleMax: number
    isLoading: boolean
    error: string | null
  }
