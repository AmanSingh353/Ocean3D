import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { ControlPanel } from './components/controls/ControlPanel'
import { OceanViewer } from './components/ocean-viewer/OceanViewer'
import type { ViewMode } from './components/ocean-viewer/VisualizationToolbar'
import { ObservationPanel } from './components/observation/ObservationPanel'
import { Timeline } from './components/timeline/Timeline'
import { MODEL_CONFIG } from './data/mockModel'
import { getInstrumentById } from './data/mockInstruments'
import {
  getComparisonAtDepth,
  getObservationTime,
  getProfile,
} from './data/mockProfiles'
import type { OceanVariable } from './types/ocean'

function App() {
  const [selectedVariable, setSelectedVariable] = useState<OceanVariable>('temperature')
  const [selectedDepth, setSelectedDepth] = useState(100)
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null)
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

  const currentDate = MODEL_CONFIG.dates[dateIndex]
  const selectedInstrument = selectedInstrumentId
    ? getInstrumentById(selectedInstrumentId) ?? null
    : null

  const profile = useMemo(() => {
    if (!selectedInstrumentId) return null
    return getProfile(selectedInstrumentId, currentDate, selectedVariable) ?? null
  }, [selectedInstrumentId, currentDate, selectedVariable])

  const comparison = useMemo(() => {
    if (!profile) return null
    return getComparisonAtDepth(profile, selectedDepth)
  }, [profile, selectedDepth])

  const observationTime = selectedInstrumentId
    ? getObservationTime(currentDate, selectedInstrumentId)
    : ''

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

  return (
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
          colorScaleMin={colorScaleMin}
          colorScaleMax={colorScaleMax}
          selectedInstrumentId={selectedInstrumentId}
          onSelectInstrument={(id) => {
            setSelectedInstrumentId(id)
            setObservationOpen(true)
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          resetToken={resetToken}
          onResetView={() => setResetToken((t) => t + 1)}
          onFullscreen={toggleFullscreen}
        />
      }
      observation={
        <ObservationPanel
          selectedInstrument={selectedInstrument}
          profile={profile}
          comparison={comparison}
          observationTime={observationTime}
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
          onNext={() => setDateIndex((p) => Math.min(MODEL_CONFIG.dates.length - 1, p + 1))}
        />
      }
    />
  )
}

export default App
