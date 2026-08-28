import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { ControlPanel } from './components/controls/ControlPanel'
import { OceanViewer } from './components/ocean-viewer/OceanViewer'
import type { ViewMode } from './components/ocean-viewer/VisualizationToolbar'
import { ObservationPanel } from './components/observation/ObservationPanel'
import { Timeline } from './components/timeline/Timeline'
import { OceanProvider } from './context/OceanProvider'
import { useOcean } from './hooks/useOcean'

function DataStatusBanner() {
  const { isLoading, error, retryOceanData } = useOcean()

  if (error) {
    return (
      <div className="api-status-banner api-status-banner--error">
        <span>{error}</span>
        <button type="button" className="api-status-banner__retry" onClick={retryOceanData}>
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="api-status-banner api-status-banner--loading">
        LOADING DATA...
      </div>
    )
  }

  return null
}

function Dashboard() {
  const ocean = useOcean()

  const [modelLayerEnabled, setModelLayerEnabled] = useState(true)
  const [modelOpacity, setModelOpacity] = useState(100)
  const [showArgo, setShowArgo] = useState(true)
  const [showGliders, setShowGliders] = useState(true)
  const [showCurrents, setShowCurrents] = useState(true)
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('rotate')
  const [resetToken, setResetToken] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [observationOpen, setObservationOpen] = useState(false)

  useEffect(() => {
    if (!isPlaying) return
    const interval = window.setInterval(() => {
      const nextIndex = ocean.dateIndex + 1
      if (nextIndex >= ocean.availableDates.length) {
        setIsPlaying(false)
        return
      }
      ocean.setDateIndex(nextIndex)
    }, 1500)
    return () => window.clearInterval(interval)
  }, [isPlaying, ocean.dateIndex, ocean.availableDates.length, ocean.setDateIndex])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handleSelectInstrument = useCallback(
    (id: string) => {
      if (ocean.selectedInstrumentId === id) {
        setObservationOpen(true)
        return
      }
      ocean.selectInstrument(id)
      setObservationOpen(true)
    },
    [ocean],
  )

  const handleClearInstrument = useCallback(() => {
    ocean.clearInstrumentSelection()
  }, [ocean])

  const markerInstruments = useMemo(
    () =>
      ocean.instruments.map((inst) => ({
        ...inst,
        currentDepth: ocean.selectedDepth,
      })),
    [ocean.instruments, ocean.selectedDepth],
  )

  return (
    <div className="app-root">
      <DataStatusBanner />
      <MainLayout
        controlsOpen={controlsOpen}
        observationOpen={observationOpen}
        onToggleControls={() => setControlsOpen((v) => !v)}
        onToggleObservation={() => setObservationOpen((v) => !v)}
        header={
          <Header
            currentDate={ocean.selectedDate}
            regionLabel={ocean.regionLabel}
            isLoading={ocean.isLoading}
            hasError={Boolean(ocean.error)}
            onFullscreen={toggleFullscreen}
          />
        }
        controls={
          <ControlPanel
            selectedVariable={ocean.selectedVariable}
            onVariableChange={ocean.setSelectedVariable}
            selectedDepth={ocean.selectedDepth}
            onDepthChange={ocean.setSelectedDepth}
            apiModelDepth={ocean.apiModelDepth}
            availableDepths={ocean.availableDepths}
            depthTicks={ocean.depthTicks}
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
            colorScaleMin={ocean.colorScaleMin}
            colorScaleMax={ocean.colorScaleMax}
            onColorScaleApply={ocean.setColorScale}
            currentScaleMin={ocean.currentScaleMin}
            currentScaleMax={ocean.currentScaleMax}
            salinityScaleMin={ocean.salinityScaleMin}
            salinityScaleMax={ocean.salinityScaleMax}
            chlorophyllScaleMin={ocean.chlorophyllScaleMin}
            chlorophyllScaleMax={ocean.chlorophyllScaleMax}
            analysisMode={ocean.analysisMode}
            onAnalysisModeChange={ocean.setAnalysisMode}
          />
        }
        viewer={
          <OceanViewer
            selectedVariable={ocean.selectedVariable}
            selectedDepth={ocean.selectedDepth}
            apiModelDepth={ocean.apiModelDepth}
            depthTicks={ocean.depthTicks}
            regionLabel={ocean.regionLabel}
            currentDate={ocean.selectedDate}
            modelOpacity={modelOpacity}
            modelLayerEnabled={modelLayerEnabled}
            showArgo={showArgo}
            showGliders={showGliders}
            showCurrents={showCurrents}
            verticalExaggeration={verticalExaggeration}
            selectedInstrumentId={ocean.selectedInstrumentId}
            instruments={markerInstruments}
            temperatureField={ocean.oceanData}
            currentField={ocean.currentData}
            salinityField={ocean.salinityData}
            chlorophyllField={ocean.chlorophyllData}
            modelLoading={ocean.isModelLoading}
            modelError={ocean.modelError}
            onSelectInstrument={handleSelectInstrument}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resetToken={resetToken}
            onResetView={() => setResetToken((t) => t + 1)}
            onFullscreen={toggleFullscreen}
            analysisMode={ocean.analysisMode}
            spatialAnalysis={ocean.spatialAnalysis}
            spatialProfilesLoading={ocean.isSpatialProfilesLoading}
          />
        }
        observation={
          <ObservationPanel
            selectedInstrumentId={ocean.selectedInstrumentId}
            selectedInstrument={ocean.selectedInstrument}
            selectedVariable={ocean.selectedVariable}
            profile={ocean.instrumentProfile}
            comparison={ocean.comparison}
            observationTime={ocean.observationTime}
            apiModelDepth={ocean.apiModelDepth}
            selectedDate={ocean.selectedDate}
            profileLoading={ocean.isProfileLoading}
            profileError={ocean.profileError}
            onClearSelection={handleClearInstrument}
            analysisMode={ocean.analysisMode}
            regionValidation={ocean.regionValidation}
            spatialProfilesLoading={ocean.isSpatialProfilesLoading}
            spatialProfilesError={ocean.spatialProfilesError}
            selectedDepth={ocean.selectedDepth}
          />
        }
        timeline={
          <Timeline
            dates={ocean.availableDates}
            currentDate={ocean.selectedDate}
            dateIndex={ocean.dateIndex}
            isPlaying={isPlaying}
            onDateIndexChange={ocean.setDateIndex}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onPrevious={() => ocean.setDateIndex(Math.max(0, ocean.dateIndex - 1))}
            onNext={() =>
              ocean.setDateIndex(
                Math.min(ocean.availableDates.length - 1, ocean.dateIndex + 1),
              )
            }
          />
        }
      />
    </div>
  )
}

function App() {
  return (
    <OceanProvider>
      <Dashboard />
    </OceanProvider>
  )
}

export default App
