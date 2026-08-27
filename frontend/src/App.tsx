import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { ControlPanel } from './components/controls/ControlPanel'
import { OceanViewer } from './components/ocean-viewer/OceanViewer'
import type { ViewMode } from './components/ocean-viewer/VisualizationToolbar'
import { ObservationPanel } from './components/observation/ObservationPanel'
import { Timeline } from './components/timeline/Timeline'
import { MODEL_CONFIG } from './data/mockModel'
import {
  formatObservationTime,
  getComparisonAtDepth,
  getInstrument,
  getInstrumentProfile,
  getInstruments,
  getModelMetadata,
  getTemperatureField,
  isAbortError,
  mapInstrument,
  mapInstrumentProfile,
  mapInstrumentSummary,
  snapDepth,
} from './services/oceanApi'
import type { ApiTemperatureField } from './types/api'
import type { Instrument, InstrumentProfile, OceanVariable } from './types/ocean'
import type { ComparisonStats } from './types/ocean'

const INITIAL_DATE = MODEL_CONFIG.dates[MODEL_CONFIG.dates.length - 1]

function App() {
  const [selectedVariable, setSelectedVariable] =
    useState<OceanVariable>('temperature')
  const [selectedDepth, setSelectedDepth] = useState(100)
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(
    null,
  )
  const [dateIndex, setDateIndex] = useState(MODEL_CONFIG.dates.length - 1)
  const [modelLayerEnabled, setModelLayerEnabled] = useState(true)
  const [modelOpacity, setModelOpacity] = useState(100)
  const [showArgo, setShowArgo] = useState(true)
  const [showGliders, setShowGliders] = useState(true)
  const [showCurrents, setShowCurrents] = useState(true)
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [colorScaleMin, setColorScaleMin] = useState(8)
  const [colorScaleMax, setColorScaleMax] = useState(31)
  const [viewMode, setViewMode] = useState<ViewMode>('rotate')
  const [resetToken, setResetToken] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [observationOpen, setObservationOpen] = useState(false)

  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [temperatureField, setTemperatureField] =
    useState<ApiTemperatureField | null>(null)
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(
    null,
  )
  const [profile, setProfile] = useState<InstrumentProfile | null>(null)
  const [comparison, setComparison] = useState<ComparisonStats | null>(null)
  const [observationTime, setObservationTime] = useState('')

  const [modelLoading, setModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const selectedDepthRef = useRef(selectedDepth)
  selectedDepthRef.current = selectedDepth

  const currentDate = MODEL_CONFIG.dates[dateIndex]
  const apiDepth = useMemo(() => snapDepth(selectedDepth), [selectedDepth])

  // Model metadata once on mount (date/depth config could drive UI later)
  useEffect(() => {
    const controller = new AbortController()
    getModelMetadata(controller.signal).catch((error) => {
      if (isAbortError(error)) return
      // Non-blocking: metadata is not required for the current UI
    })
    return () => controller.abort()
  }, [])

  // Temperature field: fetch only when snapped API depth or date changes
  useEffect(() => {
    const controller = new AbortController()
    setModelLoading(true)
    setModelError(null)

    getTemperatureField(apiDepth, currentDate, controller.signal)
      .then((field) => {
        setTemperatureField(field)
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        const message =
          error instanceof Error &&
          error.message === 'Unable to connect to Ocean3D API'
            ? error.message
            : 'Unable to load ocean field'
        setModelError(message)
        setApiError(
          error instanceof Error &&
            error.message === 'Unable to connect to Ocean3D API'
            ? 'Unable to connect to Ocean3D API'
            : null,
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setModelLoading(false)
      })

    return () => controller.abort()
  }, [apiDepth, currentDate])

  // Instruments: fetch once — marker positions are static; list date only affects last_updated (unused in UI)
  useEffect(() => {
    const controller = new AbortController()

    getInstruments(INITIAL_DATE, controller.signal)
      .then((apiInstruments) => {
        const depth = selectedDepthRef.current
        setInstruments(
          apiInstruments.map((item) => mapInstrumentSummary(item, depth)),
        )
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setInstruments([])
        if (
          error instanceof Error &&
          error.message === 'Unable to connect to Ocean3D API'
        ) {
          setApiError('Unable to connect to Ocean3D API')
        }
      })

    return () => controller.abort()
  }, [])

  // Keep marker/tooltip depth in sync without refetching instruments
  useEffect(() => {
    setInstruments((prev) =>
      prev.map((inst) => ({ ...inst, currentDepth: selectedDepth })),
    )
    setSelectedInstrument((prev) =>
      prev ? { ...prev, currentDepth: selectedDepth } : prev,
    )
  }, [selectedDepth])

  // Instrument profile: fetch when selection or date changes — not on depth changes
  useEffect(() => {
    if (!selectedInstrumentId) {
      setSelectedInstrument(null)
      setProfile(null)
      setComparison(null)
      setObservationTime('')
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    const controller = new AbortController()
    setProfileLoading(true)
    setProfileError(null)
    setSelectedInstrument(null)
    setProfile(null)
    setComparison(null)
    setObservationTime('')

    const requestedId = selectedInstrumentId

    Promise.all([
      getInstrument(requestedId, currentDate, controller.signal),
      getInstrumentProfile(requestedId, currentDate, controller.signal),
    ])
      .then(([instrumentData, profileData]) => {
        if (controller.signal.aborted) return
        const depth = selectedDepthRef.current
        const mappedInstrument = mapInstrument(instrumentData, depth)
        const mappedProfile = mapInstrumentProfile(profileData)

        setSelectedInstrument(mappedInstrument)
        setProfile(mappedProfile)
        setComparison(getComparisonAtDepth(mappedProfile, depth))
        setObservationTime(formatObservationTime(instrumentData.last_updated))
        setApiError(null)
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return
        setSelectedInstrument(null)
        setProfile(null)
        setComparison(null)
        setObservationTime('')
        setProfileError('Unable to load observation')
      })
      .finally(() => {
        if (!controller.signal.aborted) setProfileLoading(false)
      })

    return () => controller.abort()
  }, [selectedInstrumentId, currentDate])

  // Recompute comparison locally when depth changes (profile already loaded)
  useEffect(() => {
    if (profile) {
      setComparison(getComparisonAtDepth(profile, selectedDepth))
    }
  }, [profile, selectedDepth])

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      setDateIndex((prev) => {
        if (prev >= MODEL_CONFIG.dates.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1500)
    return () => window.clearInterval(interval)
  }, [isPlaying])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handleSelectInstrument = useCallback((id: string) => {
    setSelectedInstrumentId(id)
    setObservationOpen(true)
  }, [])

  const markerInstruments = useMemo(
    () =>
      instruments.map((inst) => ({
        ...inst,
        currentDepth: selectedDepth,
      })),
    [instruments, selectedDepth],
  )

  return (
    <div className="app-root">
      {apiError && <div className="api-status-banner">{apiError}</div>}
      <MainLayout
        controlsOpen={controlsOpen}
        observationOpen={observationOpen}
        onToggleControls={() => setControlsOpen((v) => !v)}
        onToggleObservation={() => setObservationOpen((v) => !v)}
        header={<Header currentDate={currentDate} onFullscreen={toggleFullscreen} />}
        controls={
          <ControlPanel
            selectedVariable={selectedVariable}
            onVariableChange={setSelectedVariable}
            selectedDepth={selectedDepth}
            onDepthChange={setSelectedDepth}
            modelLayerEnabled={modelLayerEnabled}
            onModelLayerChange={setModelLayerEnabled}
            modelOpacity={modelOpacity}
            onModelOpacityChange={setModelOpacity}
            showArgo={showArgo}
            onShowArgoChange={setShowArgo}
            showGliders={showGliders}
            onShowGlidersChange={setShowGliders}
            showCurrents={showCurrents}
            onShowCurrentsChange={setShowCurrents}
            verticalExaggeration={verticalExaggeration}
            onVerticalExaggerationChange={setVerticalExaggeration}
            colorScaleMin={colorScaleMin}
            colorScaleMax={colorScaleMax}
            onColorScaleApply={(min, max) => {
              setColorScaleMin(min)
              setColorScaleMax(max)
            }}
          />
        }
        viewer={
          <OceanViewer
            selectedVariable={selectedVariable}
            selectedDepth={selectedDepth}
            currentDate={currentDate}
            modelOpacity={modelOpacity}
            modelLayerEnabled={modelLayerEnabled}
            showArgo={showArgo}
            showGliders={showGliders}
            showCurrents={showCurrents}
            verticalExaggeration={verticalExaggeration}
            selectedInstrumentId={selectedInstrumentId}
            instruments={markerInstruments}
            temperatureField={temperatureField}
            modelLoading={modelLoading}
            modelError={modelError}
            onSelectInstrument={handleSelectInstrument}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resetToken={resetToken}
            onResetView={() => setResetToken((t) => t + 1)}
            onFullscreen={toggleFullscreen}
          />
        }
        observation={
          <ObservationPanel
            selectedInstrumentId={selectedInstrumentId}
            selectedInstrument={selectedInstrument}
            profile={profile}
            comparison={comparison}
            observationTime={observationTime}
            profileLoading={profileLoading}
            profileError={profileError}
          />
        }
        timeline={
          <Timeline
            currentDate={currentDate}
            dateIndex={dateIndex}
            isPlaying={isPlaying}
            onDateIndexChange={setDateIndex}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onPrevious={() => setDateIndex((p) => Math.max(0, p - 1))}
            onNext={() =>
              setDateIndex((p) => Math.min(MODEL_CONFIG.dates.length - 1, p + 1))
            }
          />
        }
      />
    </div>
  )
}

export default App
