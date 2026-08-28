import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MODEL_CONFIG } from '../data/mockModel'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  formatObservationTime,
  getComparisonAtDepth,
  getChlorophyll,
  getCurrent,
  getInstrument,
  getInstrumentProfile,
  getInstruments,
  getModelMetadata,
  getSalinity,
  getTemperature,
  isAbortError,
  mapInstrument,
  mapInstrumentProfile,
  mapInstrumentSummary,
  snapDepth,
  toDateParam,
} from '../services/oceanApi'
import type { AnalysisMode, SpatialAnalysisSnapshot } from '../types/analysis'
import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from '../types/api'
import type { OceanContextValue } from '../types/oceanState'
import type {
  ComparisonStats,
  Instrument,
  InstrumentProfile,
  OceanVariable,
} from '../types/ocean'
import { getTemperatureRange } from '../utils/temperatureField'
import { getCurrentMagnitudeRange } from '../utils/currentField'
import { getSalinityRange } from '../utils/salinityField'
import { getChlorophyllRange } from '../utils/chlorophyllField'
import { computeSpatialAnalysisSnapshot } from '../utils/spatialValidation'

const DEFAULT_DATE = MODEL_CONFIG.dates[MODEL_CONFIG.dates.length - 1]
const DEPTH_DEBOUNCE_MS = 300

export const OceanContext = createContext<OceanContextValue | null>(null)

interface OceanProviderProps {
  children: ReactNode
}

export function OceanProvider({ children }: OceanProviderProps) {
  const [availableDates, setAvailableDates] = useState<string[]>(MODEL_CONFIG.dates)
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE)
  const [selectedDepth, setSelectedDepth] = useState(100)
  const [selectedVariable, setSelectedVariable] =
    useState<OceanVariable>('temperature')
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(
    null,
  )

  const [oceanData, setOceanData] = useState<ApiTemperatureField | null>(null)
  const [currentData, setCurrentData] = useState<ApiCurrentField | null>(null)
  const [salinityData, setSalinityData] = useState<ApiSalinityField | null>(null)
  const [chlorophyllData, setChlorophyllData] = useState<ApiChlorophyllField | null>(null)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(
    null,
  )
  const [instrumentProfile, setInstrumentProfile] =
    useState<InstrumentProfile | null>(null)
  const [comparison, setComparison] = useState<ComparisonStats | null>(null)
  const [observationTime, setObservationTime] = useState('')
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('model')
  const [spatialProfilesLoading, setSpatialProfilesLoading] = useState(false)
  const [spatialProfilesError, setSpatialProfilesError] = useState<string | null>(null)
  const [spatialProfilesVersion, setSpatialProfilesVersion] = useState(0)

  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isInstrumentsLoading, setIsInstrumentsLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const [colorScaleMin, setColorScaleMin] = useState(8)
  const [colorScaleMax, setColorScaleMax] = useState(31)
  const [refreshToken, setRefreshToken] = useState(0)

  const selectedDepthRef = useRef(selectedDepth)
  selectedDepthRef.current = selectedDepth

  const profileCacheRef = useRef<
    Map<
      string,
      {
        instrument: Instrument
        profile: InstrumentProfile
        observationTime: string
      }
    >
  >(new Map())

  const profileCacheKey = useCallback(
    (instrumentId: string, date: string) => `${instrumentId}:${toDateParam(date)}`,
    [],
  )

  const applyCachedProfile = useCallback(
    (cached: {
      instrument: Instrument
      profile: InstrumentProfile
      observationTime: string
    }) => {
      const depth = selectedDepthRef.current
      setSelectedInstrument({ ...cached.instrument, currentDepth: depth })
      setInstrumentProfile(cached.profile)
      setObservationTime(cached.observationTime)
    },
    [],
  )

  const debouncedDepth = useDebouncedValue(selectedDepth, DEPTH_DEBOUNCE_MS)
  const apiDepth = useMemo(() => snapDepth(debouncedDepth), [debouncedDepth])
  const apiCurrentDepth = useMemo(
    () => Math.max(0, Math.min(1000, Math.round(debouncedDepth))),
    [debouncedDepth],
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
    setRefreshToken((t) => t + 1)
  }, [])

  // Model metadata — populate available dates from API
  useEffect(() => {
    const controller = new AbortController()
    getModelMetadata(controller.signal)
      .then((metadata) => {
        const dates = metadata.dates.map((d) => toDateParam(d))
        if (dates.length > 0) {
          setAvailableDates(dates)
          setSelectedDate((prev) => (dates.includes(prev) ? prev : dates[dates.length - 1]))
        }
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        console.error('[Ocean3D] Failed to load model metadata:', error)
      })
    return () => controller.abort()
  }, [refreshToken])

  // Temperature field — only when temperature variable is selected
  useEffect(() => {
    if (selectedVariable !== 'temperature') return

    const controller = new AbortController()
    setIsModelLoading(true)
    setModelError(null)

    getTemperature(apiDepth, selectedDate, controller.signal)
      .then((field) => {
        if (controller.signal.aborted) return
        setOceanData(field)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load temperature field:', error)
        const message = 'Unable to load ocean data.'
        setModelError(message)
        setApiError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsModelLoading(false)
      })

    return () => controller.abort()
  }, [selectedVariable, apiDepth, selectedDate, refreshToken])

  // Current field — only when current variable is selected
  useEffect(() => {
    if (selectedVariable !== 'current') return

    const controller = new AbortController()
    setIsModelLoading(true)
    setModelError(null)

    getCurrent(apiCurrentDepth, selectedDate, controller.signal)
      .then((field) => {
        if (controller.signal.aborted) return
        setCurrentData(field)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load current field:', error)
        const message = 'Unable to load ocean data.'
        setModelError(message)
        setApiError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsModelLoading(false)
      })

    return () => controller.abort()
  }, [selectedVariable, apiCurrentDepth, selectedDate, refreshToken])

  // Salinity field — only when salinity variable is selected
  useEffect(() => {
    if (selectedVariable !== 'salinity') return

    const controller = new AbortController()
    setIsModelLoading(true)
    setModelError(null)

    getSalinity(apiCurrentDepth, selectedDate, controller.signal)
      .then((field) => {
        if (controller.signal.aborted) return
        setSalinityData(field)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load salinity field:', error)
        const message = 'Unable to load ocean data.'
        setModelError(message)
        setApiError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsModelLoading(false)
      })

    return () => controller.abort()
  }, [selectedVariable, apiCurrentDepth, selectedDate, refreshToken])

  // Chlorophyll field — only when chlorophyll variable is selected
  useEffect(() => {
    if (selectedVariable !== 'chlorophyll') return

    const controller = new AbortController()
    setIsModelLoading(true)
    setModelError(null)

    getChlorophyll(apiCurrentDepth, selectedDate, controller.signal)
      .then((field) => {
        if (controller.signal.aborted) return
        setChlorophyllData(field)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load chlorophyll field:', error)
        const message = 'Unable to load ocean data.'
        setModelError(message)
        setApiError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsModelLoading(false)
      })

    return () => controller.abort()
  }, [selectedVariable, apiCurrentDepth, selectedDate, refreshToken])

  // Instruments — refetch when date changes
  useEffect(() => {
    const controller = new AbortController()
    setIsInstrumentsLoading(true)

    getInstruments(selectedDate, controller.signal)
      .then((apiInstruments) => {
        if (controller.signal.aborted) return
        const depth = selectedDepthRef.current
        setInstruments(
          apiInstruments.map((item) => mapInstrumentSummary(item, depth)),
        )
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load instruments:', error)
        setApiError('Unable to load ocean data.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsInstrumentsLoading(false)
      })

    return () => controller.abort()
  }, [selectedDate, refreshToken])

  // Sync marker depth locally without refetching
  useEffect(() => {
    setInstruments((prev) =>
      prev.map((inst) => ({ ...inst, currentDepth: selectedDepth })),
    )
    setSelectedInstrument((prev) =>
      prev ? { ...prev, currentDepth: selectedDepth } : prev,
    )
  }, [selectedDepth])

  // Instrument detail + profile when selection or date changes
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
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        console.error('[Ocean3D] Failed to load instrument observation:', error)
        setSelectedInstrument(null)
        setInstrumentProfile(null)
        setComparison(null)
        setObservationTime('')
        setProfileError('Observation data unavailable')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsProfileLoading(false)
      })

    return () => controller.abort()
  }, [selectedInstrumentId, selectedDate, refreshToken, profileCacheKey, applyCachedProfile])

  // Recompute comparison when depth or selected variable changes (profile already loaded)
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

  // Batch-fetch platform profiles for spatial analysis (reuses profile cache)
  useEffect(() => {
    if (analysisMode === 'model' || instruments.length === 0) {
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
    if (analysisMode === 'model') return null
    return computeSpatialAnalysisSnapshot(
      instruments,
      profilesById,
      selectedDepth,
      selectedVariable,
      analysisMode,
    )
  }, [analysisMode, instruments, profilesById, selectedDepth, selectedVariable])

  const isLoading = isModelLoading || isInstrumentsLoading
  const error = apiError ?? modelError

  const value = useMemo<OceanContextValue>(
    () => ({
      availableDates,
      selectedDate,
      setSelectedDate,
      dateIndex,
      setDateIndex,
      selectedDepth,
      setSelectedDepth,
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
      isModelLoading,
      isInstrumentsLoading,
      isProfileLoading,
      isLoading,
      modelError,
      profileError,
      apiError,
      error,
      retryOceanData,
      colorScaleMin,
      colorScaleMax,
      setColorScale,
      currentScaleMin: currentMagnitudeRange?.min ?? 0,
      currentScaleMax: currentMagnitudeRange?.max ?? 1.5,
      salinityScaleMin: salinityRange?.min ?? 30,
      salinityScaleMax: salinityRange?.max ?? 37,
      chlorophyllScaleMin: chlorophyllRange?.min ?? 0.01,
      chlorophyllScaleMax: chlorophyllRange?.max ?? 1,
    }),
    [
      availableDates,
      selectedDate,
      dateIndex,
      setDateIndex,
      selectedDepth,
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
      setAnalysisMode,
      spatialAnalysis,
      spatialProfilesLoading,
      spatialProfilesError,
      isModelLoading,
      isInstrumentsLoading,
      isProfileLoading,
      isLoading,
      modelError,
      profileError,
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
