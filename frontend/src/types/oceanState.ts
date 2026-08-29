import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from './api'
import type {
  AnalysisMode,
  RegionValidationStats,
  SpatialAnalysisSnapshot,
  TransectEndpoints,
  ValidationRegionBounds,
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
  verticalSectionSourceMode: import('../utils/verticalSectionData').VerticalSectionDisplayMode
  profilesById: Map<string, InstrumentProfile>
  spatialAnalysis: SpatialAnalysisSnapshot | null
  regionValidation: RegionValidationStats | null
  isSpatialProfilesLoading: boolean
  spatialProfilesError: string | null
  validationRegion: ValidationRegionBounds
  validationLayerEnabled: boolean
  regionPickActive: boolean
  regionPickHint: string | null
  transect: TransectEndpoints
  transectPickActive: boolean
  transectPickHint: string | null
  isMetadataLoading: boolean
  metadataError: string | null
  isModelLoading: boolean
  isInstrumentsLoading: boolean
  isProfileLoading: boolean
  /** True while fetching data for the currently selected timestep */
  isTimestepLoading: boolean
  timestepError: string | null
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
  setValidationRegion: (region: ValidationRegionBounds) => void
  setValidationLayerEnabled: (enabled: boolean) => void
  toggleRegionPick: () => void
  handleRegionMapPick: (lat: number, lon: number) => void
  toggleTransectPick: () => void
  handleTransectMapPick: (lat: number, lon: number) => void
  resetTransect: () => void
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
