import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from './api'
import type {
  AnalysisMode,
  RegionValidationStats,
  SpatialAnalysisSnapshot,
} from './analysis'
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
  /** Depth sent to the model field API for the active variable */
  apiModelDepth: number
  selectedVariable: OceanVariable
  selectedInstrumentId: string | null
  selectedInstrument: Instrument | null
  availableDepths: number[]
  availableDates: string[]
  depthTicks: number[]
  regionLabel: string
  oceanData: ApiTemperatureField | null
  currentData: ApiCurrentField | null
  salinityData: ApiSalinityField | null
  chlorophyllData: ApiChlorophyllField | null
  instruments: Instrument[]
  instrumentProfile: InstrumentProfile | null
  comparison: ComparisonStats | null
  observationTime: string
  analysisMode: AnalysisMode
  spatialAnalysis: SpatialAnalysisSnapshot | null
  regionValidation: RegionValidationStats | null
  isSpatialProfilesLoading: boolean
  spatialProfilesError: string | null
  isMetadataLoading: boolean
  metadataError: string | null
  isModelLoading: boolean
  isInstrumentsLoading: boolean
  isProfileLoading: boolean
  modelError: string | null
  profileError: string | null
  instrumentsError: string | null
  apiError: string | null
}

export interface OceanDataActions {
  setSelectedDate: (date: string) => void
  setSelectedDepth: (depth: number) => void
  setSelectedVariable: (variable: OceanVariable) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  selectInstrument: (id: string) => void
  clearInstrumentSelection: () => void
  retryOceanData: () => void
}

export type OceanContextValue = OceanDataState &
  OceanDataActions & {
    dateIndex: number
    setDateIndex: (index: number) => void
    colorScaleMin: number
    colorScaleMax: number
    setColorScale: (min: number, max: number) => void
    currentScaleMin: number
    currentScaleMax: number
    salinityScaleMin: number
    salinityScaleMax: number
    chlorophyllScaleMin: number
    chlorophyllScaleMax: number
    isLoading: boolean
    error: string | null
  }
