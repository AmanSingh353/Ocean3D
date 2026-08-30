import { useCallback, useMemo, useState } from 'react'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { ControlPanel } from './components/controls/ControlPanel'
import { DisasterControlPanel } from './components/disaster/DisasterControlPanel'
import { DisasterObservationPanel } from './components/disaster/DisasterObservationPanel'
import { OceanViewer } from './components/ocean-viewer/OceanViewer'
import type { ViewMode } from './components/ocean-viewer/VisualizationToolbar'
import { ObservationPanel } from './components/observation/ObservationPanel'
import { Timeline, PLAYBACK_SPEED_OPTIONS } from './components/timeline/Timeline'
import { OceanProvider } from './context/OceanProvider'
import { useOcean } from './hooks/useOcean'
import { useTimelinePlayback } from './hooks/useTimelinePlayback'
import { useHazardAnalysis } from './hooks/useHazardAnalysis'
import type { AppMode } from './types/appMode'
import type { HazardCategoryId } from './types/hazard'
import { DEFAULT_HAZARD_REGION } from './data/hazardRegions'
import type { ValidationRegionBounds } from './data/validationRegions'

function DataStatusBanner() {
  const { isMetadataLoading, error, retryOceanData } = useOcean()

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

  if (isMetadataLoading) {
    return (
      <div className="api-status-banner api-status-banner--loading">
        Loading ocean model metadata...
      </div>
    )
  }

  return null
}

function Dashboard() {
  const ocean = useOcean()

  const [appMode, setAppMode] = useState<AppMode>('oceanAnalysis')
  const [hazardCategory, setHazardCategory] = useState<HazardCategoryId>('strongCurrent')
  const [hazardRegion, setHazardRegion] = useState<ValidationRegionBounds>({
    ...DEFAULT_HAZARD_REGION,
  })
  const [hazardOverlayEnabled, setHazardOverlayEnabled] = useState(true)

  const isDisasterMode = appMode === 'disasterManagement'

  const hazardAssessment = useHazardAnalysis({
    enabled: isDisasterMode,
    category: hazardCategory,
    selectedVariable: ocean.selectedVariable,
    selectedDepth: ocean.selectedDepth,
    selectedDate: ocean.selectedDate,
    region: hazardRegion,
    temperatureField: ocean.oceanData,
    currentField: ocean.currentData,
    salinityField: ocean.salinityData,
    chlorophyllField: ocean.chlorophyllData,
    instruments: ocean.instruments,
    comparison: ocean.comparison,
    regionValidation: ocean.regionValidation,
  })

  const [modelLayerEnabled, setModelLayerEnabled] = useState(true)
  const [modelOpacity, setModelOpacity] = useState(100)
  const [showArgo, setShowArgo] = useState(true)
  const [showGliders, setShowGliders] = useState(true)
  const [showCurrents, setShowCurrents] = useState(true)
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.5)
  const [viewMode, setViewMode] = useState<ViewMode>('rotate')
  const [resetToken, setResetToken] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [observationOpen, setObservationOpen] = useState(false)
  const [playbackSpeedIndex, setPlaybackSpeedIndex] = useState(1)

  const playbackIntervalMs = useMemo(
    () => 1200 * (PLAYBACK_SPEED_OPTIONS[playbackSpeedIndex]?.multiplier ?? 1),
    [playbackSpeedIndex],
  )

  const handleMapPick = useCallback(
    (lat: number, lon: number) => {
      if (ocean.regionPickActive) ocean.handleRegionMapPick(lat, lon)
      else if (ocean.transectPickActive) ocean.handleTransectMapPick(lat, lon)
    },
    [ocean],
  )

  const handleAdvanceTimestep = useCallback(() => {
    ocean.setDateIndex(Math.min(ocean.availableDates.length - 1, ocean.dateIndex + 1))
  }, [ocean])

  const playback = useTimelinePlayback({
    dateIndex: ocean.dateIndex,
    dateCount: ocean.availableDates.length,
    isTimestepLoading: ocean.isTimestepLoading,
    hasTimestepError: Boolean(ocean.timestepError),
    onAdvance: handleAdvanceTimestep,
    intervalMs: playbackIntervalMs,
  })

  const handleDateIndexChange = useCallback(
    (index: number) => {
      playback.pause()
      ocean.setDateIndex(index)
    },
    [ocean, playback],
  )

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
            regionLabel={isDisasterMode ? hazardRegion.label : ocean.regionLabel}
            isLoading={ocean.isMetadataLoading || ocean.isTimestepLoading}
            hasError={Boolean(ocean.error)}
            onFullscreen={toggleFullscreen}
            appMode={appMode}
            onAppModeChange={setAppMode}
          />
        }
        controls={
          isDisasterMode ? (
            <DisasterControlPanel
              selectedVariable={ocean.selectedVariable}
              onVariableChange={ocean.setSelectedVariable}
              selectedDepth={ocean.selectedDepth}
              onDepthChange={ocean.setSelectedDepth}
              apiModelDepth={ocean.apiModelDepth}
              availableDepths={ocean.availableDepths}
              depthTicks={ocean.depthTicks}
              hazardCategory={hazardCategory}
              onHazardCategoryChange={setHazardCategory}
              hazardRegion={hazardRegion}
              onHazardRegionChange={setHazardRegion}
              hazardOverlayEnabled={hazardOverlayEnabled}
              onHazardOverlayChange={setHazardOverlayEnabled}
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
            />
          ) : (
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
              validationRegion={ocean.validationRegion}
              onValidationRegionChange={ocean.setValidationRegion}
              regionPickActive={ocean.regionPickActive}
              onToggleRegionPick={ocean.toggleRegionPick}
              regionPickHint={ocean.regionPickHint}
              validationLayerEnabled={ocean.validationLayerEnabled}
              onValidationLayerChange={ocean.setValidationLayerEnabled}
              selectedDate={ocean.selectedDate}
              transect={ocean.transect}
              transectPickActive={ocean.transectPickActive}
              transectPickHint={ocean.transectPickHint}
              onToggleTransectPick={ocean.toggleTransectPick}
              onResetTransect={ocean.resetTransect}
              onBackToMap={() => ocean.setAnalysisMode('model')}
            />
          )
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
            timestepError={ocean.timestepError}
            onSelectInstrument={handleSelectInstrument}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resetToken={resetToken}
            onResetView={() => setResetToken((t) => t + 1)}
            onFullscreen={toggleFullscreen}
            analysisMode={ocean.analysisMode}
            spatialAnalysis={ocean.spatialAnalysis}
            spatialProfilesLoading={ocean.isSpatialProfilesLoading}
            validationLayerEnabled={ocean.validationLayerEnabled}
            validationRegion={ocean.validationRegion}
            regionPickActive={ocean.regionPickActive}
            transectPickActive={ocean.transectPickActive}
            transect={ocean.transect}
            onMapPick={handleMapPick}
            maxModelDepth={Math.max(...ocean.availableDepths, 1000)}
            verticalSectionSourceMode={ocean.verticalSectionSourceMode}
            profilesById={ocean.profilesById}
            availableDepths={ocean.availableDepths}
            spatialProfilesLoadingForSection={ocean.isSpatialProfilesLoading}
            appMode={appMode}
            hazardOverlayEnabled={isDisasterMode && hazardOverlayEnabled}
            hazardGridSnapshot={hazardAssessment?.gridSnapshot ?? null}
            hazardRegion={isDisasterMode ? hazardRegion : undefined}
          />
        }
        observation={
          isDisasterMode ? (
            <DisasterObservationPanel
              assessment={hazardAssessment}
              assessmentLoading={ocean.isModelLoading && !hazardAssessment}
              selectedInstrumentId={ocean.selectedInstrumentId}
              selectedInstrument={ocean.selectedInstrument}
              selectedVariable={ocean.selectedVariable}
              comparison={ocean.comparison}
              regionValidation={ocean.regionValidation}
              observationTime={ocean.observationTime}
              apiModelDepth={ocean.apiModelDepth}
              selectedDate={ocean.selectedDate}
              selectedDepth={ocean.selectedDepth}
              profileLoading={ocean.isProfileLoading}
              profileError={ocean.profileError}
              onClearSelection={handleClearInstrument}
              profile={ocean.instrumentProfile}
            />
          ) : (
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
              spatialAnalysis={ocean.spatialAnalysis}
              transect={ocean.transect}
              validationRegion={ocean.validationRegion}
              verticalSectionSourceMode={ocean.verticalSectionSourceMode}
            />
          )
        }
        timeline={
          <Timeline
            dates={ocean.availableDates}
            currentDate={ocean.selectedDate}
            dateIndex={ocean.dateIndex}
            isPlaying={playback.isPlaying}
            isLoading={ocean.isTimestepLoading}
            timestepError={ocean.timestepError}
            playbackSpeedIndex={playbackSpeedIndex}
            onPlaybackSpeedChange={setPlaybackSpeedIndex}
            onDateIndexChange={handleDateIndexChange}
            onTogglePlay={playback.togglePlay}
            timelineLabel={isDisasterMode ? 'Event Timeline' : undefined}
            onPrevious={() => {
              playback.pause()
              ocean.setDateIndex(Math.max(0, ocean.dateIndex - 1))
            }}
            onNext={() => {
              playback.pause()
              ocean.setDateIndex(
                Math.min(ocean.availableDates.length - 1, ocean.dateIndex + 1),
              )
            }}
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
