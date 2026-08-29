import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_DATES, DEFAULT_DEPTHS } from '../data/defaults'
import { getVariableDemoRange } from '../data/variables'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  formatObservationTime,
  getComparisonAtDepth,
  getInstrument,
  getInstrumentProfile,
  getInstruments,
  getModelMetadata,
  getOceanFieldAtDepth,
  isAbortError,
  mapInstrument,
  mapInstrumentProfile,
  mapInstrumentSummary,
  toDateParam,
} from '../services/oceanApi'
import type { AnalysisMode, SpatialAnalysisSnapshot } from '../types/analysis'
import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiSalinityField,
  ApiTemperatureField,
} from '../types/api'
import type { OceanContextValue } from '../types/oceanState'
import type {
  ComparisonStats,
  Instrument,
  InstrumentProfile,
  OceanVariable,
} from '../types/ocean'
import { depthTicksFromMetadata, resolveApiDepth } from '../utils/depthUtils'
import type { CachedOceanField } from '../utils/fieldCache'
import { fieldCacheKey, OceanFieldCache } from '../utils/fieldCache'
import { getTemperatureRange } from '../utils/temperatureField'
import { getCurrentMagnitudeRange } from '../utils/currentField'
import { getSalinityRange } from '../utils/salinityField'
import { getChlorophyllRange } from '../utils/chlorophyllField'
import { InstrumentsCache } from '../utils/instrumentsCache'
import {
  computeSpatialAnalysisSnapshot,
  requiresSpatialProfiles,
} from '../utils/spatialValidation'

const DEFAULT_DATE = DEFAULT_DATES[DEFAULT_DATES.length - 1]
const DEPTH_DEBOUNCE_MS = 300
const TIMESTEP_ERROR = 'No data available for this timestep.'

export const OceanContext = createContext<OceanContextValue | null>(null)

interface OceanProviderProps {
  children: ReactNode
}

export function OceanProvider({ children }: OceanProviderProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([...DEFAULT_DATES])
  const [availableDepths, setAvailableDepths] = useState<number[]>([...DEFAULT_DEPTHS])
  const [regionLabel, setRegionLabel] = useState('INDIAN OCEAN')
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_DATE)
  const [selectedDepth, setSelectedDepth] = useState(100)
  const [selectedVariable, setSelectedVariable] =
    useState<OceanVariable>('temperature')
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null)
  const [apiModelDepth, setApiModelDepth] = useState(100)

  const [oceanData, setOceanData] = useState<ApiTemperatureField | null>(null)
  const [currentData, setCurrentData] = useState<ApiCurrentField | null>(null)
  const [salinityData, setSalinityData] = useState<ApiSalinityField | null>(null)
  const [chlorophyllData, setChlorophyllData] = useState<ApiChlorophyllField | null>(null)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null)
  const [instrumentProfile, setInstrumentProfile] = useState<InstrumentProfile | null>(null)
  const [comparison, setComparison] = useState<ComparisonStats | null>(null)
  const [observationTime, setObservationTime] = useState('')
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('model')
  const [spatialProfilesLoading, setSpatialProfilesLoading] = useState(false)
  const [spatialProfilesError, setSpatialProfilesError] = useState<string | null>(null)
  const [spatialProfilesVersion, setSpatialProfilesVersion] = useState(0)

  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isInstrumentsLoading, setIsInstrumentsLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [instrumentsError, setInstrumentsError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const [colorScaleMin, setColorScaleMin] = useState(getVariableDemoRange('temperature').min)
  const [colorScaleMax, setColorScaleMax] = useState(getVariableDemoRange('temperature').max)
  const [refreshToken, setRefreshToken] = useState(0)

  const selectedDepthRef = useRef(selectedDepth)
  selectedDepthRef.current = selectedDepth

  const profileCacheRef = useRef<
    Map<string, { instrument: Instrument; profile: InstrumentProfile; observationTime: string }>
  >(new Map())
  const fieldCacheRef = useRef(new OceanFieldCache())
  const instrumentsCacheRef = useRef(new InstrumentsCache())

  const profileCacheKey = useCallback(
    (instrumentId: string, date: string) => `${instrumentId}:${toDateParam(date)}`,
    [],
  )

  const applyCachedProfile = useCallback(
    (cached: { instrument: Instrument; profile: InstrumentProfile; observationTime: string }) => {
      const depth = selectedDepthRef.current
      setSelectedInstrument({ ...cached.instrument, currentDepth: depth })
      setInstrumentProfile(cached.profile)
      setObservationTime(cached.observationTime)
    },
    [],
  )

  const debouncedDepth = useDebouncedValue(selectedDepth, DEPTH_DEBOUNCE_MS)
  const resolvedApiDepth = useMemo(
    () => resolveApiDepth(selectedVariable, debouncedDepth, availableDepths),
    [selectedVariable, debouncedDepth, availableDepths],
  )

  const depthTicks = useMemo(
    () => depthTicksFromMetadata(availableDepths),
    [availableDepths],
  )

  const dateIndex = useMemo(() => {
    const idx = availableDates.indexOf(selectedDate)
    return idx >= 0 ? idx : availableDates.length - 1
  }, [availableDates, selectedDate])

  const temperatureRange = useMemo(
    () => (oceanData ? getTemperatureRange(oceanData) : null),
    [oceanData],
  )
  const currentMagnitudeRange = useMemo(
    () => (currentData ? getCurrentMagnitudeRange(currentData) : null),
    [currentData],
  )
  const salinityRange = useMemo(
    () => (salinityData ? getSalinityRange(salinityData) : null),
    [salinityData],
  )
  const chlorophyllRange = useMemo(
    () => (chlorophyllData ? getChlorophyllRange(chlorophyllData) : null),
    [chlorophyllData],
  )

  useEffect(() => {
    if (temperatureRange) {
      setColorScaleMin(temperatureRange.min)
      setColorScaleMax(temperatureRange.max)
    }
  }, [temperatureRange])

  const applyField = useCallback((variable: OceanVariable, field: CachedOceanField) => {
    switch (variable) {
      case 'temperature':
        setOceanData(field as ApiTemperatureField)
        break
      case 'current':
        setCurrentData(field as ApiCurrentField)
        break
      case 'salinity':
        setSalinityData(field as ApiSalinityField)
        break
      case 'chlorophyll':
        setChlorophyllData(field as ApiChlorophyllField)
        break
    }
  }, [])

  const clearField = useCallback((variable: OceanVariable) => {
    switch (variable) {
      case 'temperature':
        setOceanData(null)
        break
      case 'current':
        setCurrentData(null)
        break
      case 'salinity':
        setSalinityData(null)
        break
      case 'chlorophyll':
        setChlorophyllData(null)
        break
    }
  }, [])

  const setDateIndex = useCallback(
    (index: number) => {
      const date = availableDates[index]
      if (date) setSelectedDate(date)
    },
    [availableDates],
  )

  const setColorScale = useCallback((min: number, max: number) => {
    setColorScaleMin(min)
    setColorScaleMax(max)
  }, [])

  const selectInstrument = useCallback((id: string) => {
    setSelectedInstrumentId(id)
  }, [])

  const clearInstrumentSelection = useCallback(() => {
    setSelectedInstrumentId(null)
  }, [])

  const retryOceanData = useCallback(() => {
    setApiError(null)
    setModelError(null)
    setProfileError(null)
    setInstrumentsError(null)
    setSpatialProfilesError(null)
    setMetadataError(null)
    fieldCacheRef.current.clear()
    instrumentsCacheRef.current.clear()
    setRefreshToken((t) => t + 1)
  }, [])

  // Model metadata — dates, depths, region from API
  useEffect(() => {
    const controller = new AbortController()
    setIsMetadataLoading(true)
    setMetadataError(null)

    getModelMetadata(controller.signal)
      .then((metadata) => {
        if (controller.signal.aborted) return
        const dates = metadata.dates.map((d) => toDateParam(d))
        const depths = metadata.depths.length > 0 ? metadata.depths : [...DEFAULT_DEPTHS]
        if (dates.length > 0) {
          setAvailableDates(dates)
          setSelectedDate((prev) => (dates.includes(prev) ? prev : dates[dates.length - 1]))
        }
        setAvailableDepths(depths)
        setRegionLabel('INDIAN OCEAN')
        setMetadataError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        console.error('[Ocean3D] Failed to load model metadata:', error)
        setMetadataError('Unable to load model metadata. Using defaults.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsMetadataLoading(false)
      })

    return () => controller.abort()
  }, [refreshToken])

  // Unified model field fetch with cache
  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = fieldCacheKey(selectedVariable, resolvedApiDepth, selectedDate)
    const cached = fieldCacheRef.current.get(cacheKey)

    setApiModelDepth(resolvedApiDepth)

    if (cached) {
      applyField(selectedVariable, cached)
      setIsModelLoading(false)
      setModelError(null)
      return () => controller.abort()
    }

    setIsModelLoading(true)
    setModelError(null)

    getOceanFieldAtDepth(selectedVariable, resolvedApiDepth, selectedDate, controller.signal)
      .then((field) => {
        if (controller.signal.aborted) return
        fieldCacheRef.current.set(cacheKey, field)
        applyField(selectedVariable, field)
        setApiModelDepth(field.depth ?? resolvedApiDepth)
        setApiError(null)
        setModelError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load ocean field:', error)
        setModelError(TIMESTEP_ERROR)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsModelLoading(false)
      })

    return () => controller.abort()
  }, [
    selectedVariable,
    resolvedApiDepth,
    selectedDate,
    refreshToken,
    applyField,
    clearField,
  ])

  // Instruments — refetch when date changes (cached per date)
  useEffect(() => {
    const controller = new AbortController()
    const dateKey = toDateParam(selectedDate)
    const cached = instrumentsCacheRef.current.get(dateKey)

    if (cached) {
      const depth = selectedDepthRef.current
      setInstruments(cached.map((inst) => ({ ...inst, currentDepth: depth })))
      setIsInstrumentsLoading(false)
      setInstrumentsError(null)
      return () => controller.abort()
    }

    setIsInstrumentsLoading(true)
    setInstrumentsError(null)

    getInstruments(selectedDate, controller.signal)
      .then((apiInstruments) => {
        if (controller.signal.aborted) return
        const depth = selectedDepthRef.current
        const mapped = apiInstruments.map((item) => mapInstrumentSummary(item, depth))
        instrumentsCacheRef.current.set(dateKey, mapped)
        setInstruments(mapped)
        setInstrumentsError(null)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load instruments:', error)
        setInstrumentsError(TIMESTEP_ERROR)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsInstrumentsLoading(false)
      })

    return () => controller.abort()
  }, [selectedDate, refreshToken])

  useEffect(() => {
    setInstruments((prev) => prev.map((inst) => ({ ...inst, currentDepth: selectedDepth })))
    setSelectedInstrument((prev) => (prev ? { ...prev, currentDepth: selectedDepth } : prev))
  }, [selectedDepth])

  // Instrument detail + profile
  useEffect(() => {
    if (!selectedInstrumentId) {
      setSelectedInstrument(null)
      setInstrumentProfile(null)
      setComparison(null)
      setObservationTime('')
      setProfileError(null)
      setIsProfileLoading(false)
      return
    }

    const controller = new AbortController()
    const requestedId = selectedInstrumentId
    const cacheKey = profileCacheKey(requestedId, selectedDate)
    const cached = profileCacheRef.current.get(cacheKey)

    setProfileError(null)

    if (cached) {
      applyCachedProfile(cached)
      setIsProfileLoading(false)
      return () => controller.abort()
    }

    setIsProfileLoading(true)
    setSelectedInstrument(null)
    setInstrumentProfile(null)
    setComparison(null)
    setObservationTime('')

    Promise.all([
      getInstrument(requestedId, selectedDate, controller.signal),
      getInstrumentProfile(requestedId, selectedDate, controller.signal),
    ])
      .then(([instrumentData, profileData]) => {
        if (controller.signal.aborted) return
        const depth = selectedDepthRef.current
        const mappedInstrument = mapInstrument(instrumentData, depth)
        const mappedProfile = mapInstrumentProfile(profileData)
        const formattedTime = formatObservationTime(instrumentData.last_updated)

        profileCacheRef.current.set(cacheKey, {
          instrument: mappedInstrument,
          profile: mappedProfile,
          observationTime: formattedTime,
        })

        setSelectedInstrument(mappedInstrument)
        setInstrumentProfile(mappedProfile)
        setObservationTime(formattedTime)
        setProfileError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load instrument observation:', error)
        setSelectedInstrument(null)
        setInstrumentProfile(null)
        setComparison(null)
        setObservationTime('')
        setProfileError('No matching observation found.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsProfileLoading(false)
      })

    return () => controller.abort()
  }, [selectedInstrumentId, selectedDate, refreshToken, profileCacheKey, applyCachedProfile])

  useEffect(() => {
    if (!instrumentProfile) {
      setComparison(null)
      return
    }
    setComparison(getComparisonAtDepth(instrumentProfile, selectedDepth, selectedVariable))
  }, [instrumentProfile, selectedDepth, selectedVariable])

  const profilesById = useMemo(() => {
    const map = new Map<string, InstrumentProfile>()
    for (const inst of instruments) {
      const cached = profileCacheRef.current.get(profileCacheKey(inst.id, selectedDate))
      if (cached) map.set(inst.id, cached.profile)
    }
    return map
  }, [instruments, selectedDate, profileCacheKey, spatialProfilesVersion, instrumentProfile, analysisMode])

  useEffect(() => {
    if (!requiresSpatialProfiles(analysisMode) || instruments.length === 0) {
      setSpatialProfilesLoading(false)
      setSpatialProfilesError(null)
      return
    }

    const controller = new AbortController()
    const missing = instruments.filter(
      (inst) => !profileCacheRef.current.has(profileCacheKey(inst.id, selectedDate)),
    )

    if (missing.length === 0) {
      setSpatialProfilesLoading(false)
      setSpatialProfilesError(null)
      return () => controller.abort()
    }

    setSpatialProfilesLoading(true)
    setSpatialProfilesError(null)

    Promise.all(
      missing.map(async (inst) => {
        const [instrumentData, profileData] = await Promise.all([
          getInstrument(inst.id, selectedDate, controller.signal),
          getInstrumentProfile(inst.id, selectedDate, controller.signal),
        ])
        const depth = selectedDepthRef.current
        profileCacheRef.current.set(profileCacheKey(inst.id, selectedDate), {
          instrument: mapInstrument(instrumentData, depth),
          profile: mapInstrumentProfile(profileData),
          observationTime: formatObservationTime(instrumentData.last_updated),
        })
      }),
    )
      .then(() => {
        if (controller.signal.aborted) return
        setSpatialProfilesVersion((v) => v + 1)
        setSpatialProfilesError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load spatial validation profiles:', error)
        setSpatialProfilesError('Unable to load platform validation data')
      })
      .finally(() => {
        if (!controller.signal.aborted) setSpatialProfilesLoading(false)
      })

    return () => controller.abort()
  }, [analysisMode, instruments, selectedDate, refreshToken, profileCacheKey])

  const spatialAnalysis = useMemo<SpatialAnalysisSnapshot | null>(() => {
    if (!requiresSpatialProfiles(analysisMode)) return null
    return computeSpatialAnalysisSnapshot(
      instruments,
      profilesById,
      selectedDepth,
      selectedVariable,
      analysisMode,
    )
  }, [analysisMode, instruments, profilesById, selectedDepth, selectedVariable])

  const isTimestepLoading =
    isModelLoading ||
    isInstrumentsLoading ||
    (selectedInstrumentId != null && isProfileLoading) ||
    (requiresSpatialProfiles(analysisMode) && spatialProfilesLoading)

  const timestepError = modelError ?? instrumentsError ?? profileError ?? spatialProfilesError

  const isLoading = isMetadataLoading || isTimestepLoading
  const error = apiError ?? metadataError ?? (isTimestepLoading ? null : timestepError)

  const value = useMemo<OceanContextValue>(
    () => ({
      availableDates,
      availableDepths,
      depthTicks,
      regionLabel,
      selectedDate,
      setSelectedDate,
      dateIndex,
      setDateIndex,
      selectedDepth,
      setSelectedDepth,
      apiModelDepth,
      selectedVariable,
      setSelectedVariable,
      selectedInstrumentId,
      selectedInstrument,
      selectInstrument,
      clearInstrumentSelection,
      oceanData,
      currentData,
      salinityData,
      chlorophyllData,
      instruments,
      instrumentProfile,
      comparison,
      observationTime,
      analysisMode,
      setAnalysisMode,
      spatialAnalysis,
      regionValidation: spatialAnalysis?.region ?? null,
      isSpatialProfilesLoading: spatialProfilesLoading,
      spatialProfilesError,
      isMetadataLoading,
      metadataError,
      isModelLoading,
      isInstrumentsLoading,
      isProfileLoading,
      isTimestepLoading,
      timestepError,
      isLoading,
      modelError,
      profileError,
      instrumentsError,
      apiError,
      error,
      retryOceanData,
      colorScaleMin,
      colorScaleMax,
      setColorScale,
      currentScaleMin: currentMagnitudeRange?.min ?? getVariableDemoRange('current').min,
      currentScaleMax: currentMagnitudeRange?.max ?? getVariableDemoRange('current').max,
      salinityScaleMin: salinityRange?.min ?? getVariableDemoRange('salinity').min,
      salinityScaleMax: salinityRange?.max ?? getVariableDemoRange('salinity').max,
      chlorophyllScaleMin: chlorophyllRange?.min ?? getVariableDemoRange('chlorophyll').min,
      chlorophyllScaleMax: chlorophyllRange?.max ?? getVariableDemoRange('chlorophyll').max,
    }),
    [
      availableDates,
      availableDepths,
      depthTicks,
      regionLabel,
      selectedDate,
      dateIndex,
      setDateIndex,
      selectedDepth,
      apiModelDepth,
      selectedVariable,
      selectedInstrumentId,
      selectedInstrument,
      selectInstrument,
      clearInstrumentSelection,
      oceanData,
      currentData,
      salinityData,
      chlorophyllData,
      instruments,
      instrumentProfile,
      comparison,
      observationTime,
      analysisMode,
      spatialAnalysis,
      spatialProfilesLoading,
      spatialProfilesError,
      isMetadataLoading,
      metadataError,
      isModelLoading,
      isInstrumentsLoading,
      isProfileLoading,
      isTimestepLoading,
      timestepError,
      isLoading,
      modelError,
      profileError,
      instrumentsError,
      apiError,
      error,
      retryOceanData,
      colorScaleMin,
      colorScaleMax,
      setColorScale,
      currentMagnitudeRange,
      salinityRange,
      chlorophyllRange,
    ],
  )

  return <OceanContext.Provider value={value}>{children}</OceanContext.Provider>
}
