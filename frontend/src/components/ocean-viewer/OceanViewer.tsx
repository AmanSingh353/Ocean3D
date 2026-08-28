import { useEffect, useRef, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from '../../types/api'
import type { Instrument, OceanVariable } from '../../types/ocean'
import { DEPTH_TICKS, VARIABLE_OPTIONS, formatDisplayDate } from '../../data/mockModel'
import {
  applyCurrentFieldToGroup,
  getCurrentMagnitudeRange,
} from '../../utils/currentField'
import {
  applyTemperatureFieldToGeometry,
  getTemperatureRange,
  sampleTemperatureField,
} from '../../utils/temperatureField'
import { normalizedToColor, temperatureToColor } from '../../utils/temperatureColor'
import {
  applySalinityFieldToGeometry,
  getSalinityRange,
  sampleSalinityField,
} from '../../utils/salinityField'
import { salinityToColor } from '../../utils/salinityColor'
import {
  applyChlorophyllFieldToGeometry,
  getChlorophyllRange,
  sampleChlorophyllField,
} from '../../utils/chlorophyllField'
import { chlorophyllToColor } from '../../utils/chlorophyllColor'
import { InstrumentMarker } from './InstrumentMarker'
import { AnalysisColorbar } from './AnalysisColorbar'
import { ChlorophyllColorbar } from './ChlorophyllColorbar'
import { CurrentColorbar } from './CurrentColorbar'
import { SalinityColorbar } from './SalinityColorbar'
import { TemperatureColorbar } from './TemperatureColorbar'
import { VisualizationToolbar, type ViewMode } from './VisualizationToolbar'
import type { AnalysisMode, SpatialAnalysisSnapshot } from '../../types/analysis'
import { applySpatialAnalysisToGeometry, applyNeutralOceanGeometry } from '../../utils/spatialAnalysisField'

interface OceanViewerProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  currentDate: string
  modelOpacity: number
  modelLayerEnabled: boolean
  showArgo: boolean
  showGliders: boolean
  showCurrents: boolean
  verticalExaggeration: number
  selectedInstrumentId: string | null
  instruments: Instrument[]
  temperatureField: ApiTemperatureField | null
  currentField: ApiCurrentField | null
  salinityField: ApiSalinityField | null
  chlorophyllField: ApiChlorophyllField | null
  modelLoading: boolean
  modelError: string | null
  onSelectInstrument: (id: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  resetToken: number
  onResetView: () => void
  onFullscreen: () => void
  analysisMode: AnalysisMode
  spatialAnalysis: SpatialAnalysisSnapshot | null
  spatialProfilesLoading: boolean
}

function createIndiaOutline(): THREE.Vector2[] {
  return [
    new THREE.Vector2(-4, 6), new THREE.Vector2(-2, 8), new THREE.Vector2(0, 9),
    new THREE.Vector2(2, 8.5), new THREE.Vector2(4, 7), new THREE.Vector2(5, 4),
    new THREE.Vector2(4.5, 1), new THREE.Vector2(3, -1), new THREE.Vector2(1, -2),
    new THREE.Vector2(-1, -1.5), new THREE.Vector2(-3, 0), new THREE.Vector2(-4.5, 2),
    new THREE.Vector2(-5, 4),
  ]
}

export function OceanViewer({
  selectedVariable,
  selectedDepth,
  currentDate,
  modelOpacity,
  modelLayerEnabled,
  showArgo,
  showGliders,
  showCurrents,
  verticalExaggeration,
  selectedInstrumentId,
  instruments,
  temperatureField,
  currentField,
  salinityField,
  chlorophyllField,
  modelLoading,
  modelError,
  onSelectInstrument,
  viewMode,
  onViewModeChange,
  resetToken,
  onResetView,
  onFullscreen,
  analysisMode,
  spatialAnalysis,
  spatialProfilesLoading,
}: OceanViewerProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const temperatureFieldRef = useRef<ApiTemperatureField | null>(temperatureField)
  temperatureFieldRef.current = temperatureField
  const currentFieldRef = useRef<ApiCurrentField | null>(currentField)
  currentFieldRef.current = currentField
  const salinityFieldRef = useRef<ApiSalinityField | null>(salinityField)
  salinityFieldRef.current = salinityField
  const chlorophyllFieldRef = useRef<ApiChlorophyllField | null>(chlorophyllField)
  chlorophyllFieldRef.current = chlorophyllField

  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    oceanMesh: THREE.Mesh
    depthSlice: THREE.Mesh
    currents: THREE.Group
  } | null>(null)

  const isTemperatureMode = selectedVariable === 'temperature'
  const isCurrentMode = selectedVariable === 'current'
  const isSalinityMode = selectedVariable === 'salinity'
  const isChlorophyllMode = selectedVariable === 'chlorophyll'
  const isScalarFieldMode = isTemperatureMode || isSalinityMode || isChlorophyllMode
  const isAnalysisActive = analysisMode !== 'model'

  const analysisModeLabel = useMemo(() => {
    switch (analysisMode) {
      case 'model':
        return null
      case 'observation':
        return 'Observation'
      case 'difference':
        return 'Difference'
      case 'absoluteError':
        return 'Absolute Error'
    }
  }, [analysisMode])

  const spatialPointById = useMemo(() => {
    const map = new Map<string, NonNullable<SpatialAnalysisSnapshot>['points'][number]>()
    for (const point of spatialAnalysis?.points ?? []) {
      map.set(point.instrumentId, point)
    }
    return map
  }, [spatialAnalysis])

  const maxRegionAbsoluteError = spatialAnalysis?.region.maxAbsoluteError ?? null
  const analysisReady =
    isAnalysisActive && spatialAnalysis != null && !spatialProfilesLoading
  const showObservationEmpty =
    analysisMode === 'observation' &&
    analysisReady &&
    !spatialAnalysis.hasData

  const variableMeta = VARIABLE_OPTIONS.find((v) => v.value === selectedVariable)
  const variableLabel = variableMeta?.label ?? 'Temperature'

  const temperatureRange = useMemo(
    () => (temperatureField ? getTemperatureRange(temperatureField) : null),
    [temperatureField],
  )

  const currentMagnitudeRange = useMemo(
    () => (currentField ? getCurrentMagnitudeRange(currentField) : null),
    [currentField],
  )

  const salinityRange = useMemo(
    () => (salinityField ? getSalinityRange(salinityField) : null),
    [salinityField],
  )

  const chlorophyllRange = useMemo(
    () => (chlorophyllField ? getChlorophyllRange(chlorophyllField) : null),
    [chlorophyllField],
  )

  const updateOceanAppearance = useCallback(() => {
    const refs = sceneRef.current
    if (!refs) return

    const baseOpacity = modelLayerEnabled ? modelOpacity / 100 : 0
    const effectiveOpacity = isCurrentMode ? baseOpacity * 0.2 : baseOpacity

    const mat = refs.oceanMesh.material as THREE.MeshPhongMaterial
    mat.opacity = effectiveOpacity
    mat.visible = effectiveOpacity > 0

    refs.depthSlice.visible = modelLayerEnabled && baseOpacity > 0 && isScalarFieldMode
    const sliceMat = refs.depthSlice.material as THREE.MeshBasicMaterial
    sliceMat.opacity = isScalarFieldMode ? Math.min(1, baseOpacity + 0.15) : 0

    refs.oceanMesh.scale.y = verticalExaggeration * 0.5
    refs.depthSlice.position.y =
      -4 * verticalExaggeration * 0.5 +
      (selectedDepth / 1000) * 4 * verticalExaggeration * 0.5

    if (temperatureField && temperatureRange && isTemperatureMode) {
      const centerLat =
        (temperatureField.bounds.lat_min + temperatureField.bounds.lat_max) / 2
      const centerLon =
        (temperatureField.bounds.lon_min + temperatureField.bounds.lon_max) / 2
      const depthTemp = sampleTemperatureField(temperatureField, centerLat, centerLon)
      sliceMat.color = temperatureToColor(
        depthTemp,
        temperatureRange.min,
        temperatureRange.max,
      )
    }

    if (salinityField && salinityRange && isSalinityMode) {
      const centerLat =
        (salinityField.bounds.lat_min + salinityField.bounds.lat_max) / 2
      const centerLon =
        (salinityField.bounds.lon_min + salinityField.bounds.lon_max) / 2
      const depthSalinity = sampleSalinityField(salinityField, centerLat, centerLon)
      sliceMat.color = salinityToColor(
        depthSalinity,
        salinityRange.min,
        salinityRange.max,
      )
    }

    if (chlorophyllField && chlorophyllRange && isChlorophyllMode) {
      const centerLat =
        (chlorophyllField.bounds.lat_min + chlorophyllField.bounds.lat_max) / 2
      const centerLon =
        (chlorophyllField.bounds.lon_min + chlorophyllField.bounds.lon_max) / 2
      const depthChl = sampleChlorophyllField(chlorophyllField, centerLat, centerLon)
      sliceMat.color = chlorophyllToColor(
        depthChl,
        chlorophyllRange.min,
        chlorophyllRange.max,
      )
    }

    refs.currents.visible = showCurrents
    refs.currents.scale.setScalar(isCurrentMode && showCurrents ? 1.2 : 1)
  }, [
    modelLayerEnabled, modelOpacity, verticalExaggeration, selectedDepth,
    showCurrents, temperatureField, temperatureRange,
    salinityField, salinityRange,
    chlorophyllField, chlorophyllRange, isScalarFieldMode,
    isTemperatureMode, isSalinityMode, isChlorophyllMode, isCurrentMode,
  ])

  // Update vertex colors when the API temperature field changes — not in the render loop
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !temperatureField || !temperatureRange || !isTemperatureMode) return
    if (analysisReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: temperatureField.bounds,
        variable: 'temperature',
        mode: analysisMode,
        points: spatialAnalysis.points,
        legendMin: spatialAnalysis.legendMin,
        legendMax: spatialAnalysis.legendMax,
        temperatureField,
        salinityField: null,
        chlorophyllField: null,
      })
      return
    }
    applyTemperatureFieldToGeometry(
      refs.oceanMesh.geometry,
      temperatureField,
      temperatureRange,
    )
  }, [temperatureField, temperatureRange, isTemperatureMode, analysisReady, spatialAnalysis, analysisMode])

  // Update vertex colors when the API salinity field changes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !salinityField || !salinityRange || !isSalinityMode) return
    if (analysisReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: salinityField.bounds,
        variable: 'salinity',
        mode: analysisMode,
        points: spatialAnalysis.points,
        legendMin: spatialAnalysis.legendMin,
        legendMax: spatialAnalysis.legendMax,
        temperatureField: null,
        salinityField,
        chlorophyllField: null,
      })
      return
    }
    applySalinityFieldToGeometry(
      refs.oceanMesh.geometry,
      salinityField,
      salinityRange,
    )
  }, [salinityField, salinityRange, isSalinityMode, analysisReady, spatialAnalysis, analysisMode])

  // Update vertex colors when the API chlorophyll field changes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !chlorophyllField || !chlorophyllRange || !isChlorophyllMode) return
    if (analysisReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: chlorophyllField.bounds,
        variable: 'chlorophyll',
        mode: analysisMode,
        points: spatialAnalysis.points,
        legendMin: spatialAnalysis.legendMin,
        legendMax: spatialAnalysis.legendMax,
        temperatureField: null,
        salinityField: null,
        chlorophyllField,
      })
      return
    }
    applyChlorophyllFieldToGeometry(
      refs.oceanMesh.geometry,
      chlorophyllField,
      chlorophyllRange,
    )
  }, [chlorophyllField, chlorophyllRange, isChlorophyllMode, analysisReady, spatialAnalysis, analysisMode])

  // Current variable: apply spatial analysis overlay at platform locations
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !currentField || !isCurrentMode) return
    if (analysisReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: currentField.bounds,
        variable: 'current',
        mode: analysisMode,
        points: spatialAnalysis.points,
        legendMin: spatialAnalysis.legendMin,
        legendMax: spatialAnalysis.legendMax,
        temperatureField: null,
        salinityField: null,
        chlorophyllField: null,
      })
      return
    }
    applyNeutralOceanGeometry(refs.oceanMesh.geometry)
  }, [currentField, isCurrentMode, analysisReady, spatialAnalysis, analysisMode])

  // Update current vector arrows when API current field changes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !currentField) return
    applyCurrentFieldToGroup(refs.currents, currentField)
  }, [currentField])

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host) return

    let mounted = true
    let animationId = 0

    const width = Math.max(host.clientWidth, 1)
    const height = Math.max(host.clientHeight, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x06121f, 0.018)

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 200)
    camera.position.set(14, 16, 22)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x06121f, 1)
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI / 2.1
    controls.minDistance = 8
    controls.maxDistance = 45
    controls.target.set(0, -1, 0)

    scene.add(new THREE.AmbientLight(0x1a4a5c, 0.6))
    const dirLight = new THREE.DirectionalLight(0x48d5c3, 0.8)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    const oceanGeometry = new THREE.BoxGeometry(28, 8, 18, 14, 6, 10)
    const positions = oceanGeometry.attributes.position
    const colors: number[] = []
    const placeholder = normalizedToColor(0.5)
    for (let i = 0; i < positions.count; i++) {
      colors.push(placeholder.r, placeholder.g, placeholder.b)
    }
    oceanGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const oceanMesh = new THREE.Mesh(
      oceanGeometry,
      new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        shininess: 30,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    oceanMesh.position.y = -4
    scene.add(oceanMesh)

    const gridHelper = new THREE.GridHelper(30, 20, 0x17384a, 0x0f2a3a)
    gridHelper.position.y = 0.05
    scene.add(gridHelper)

    const indiaShape = new THREE.Shape(createIndiaOutline())
    const indiaMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(indiaShape),
      new THREE.MeshBasicMaterial({ color: 0x19bcd6, transparent: true, opacity: 0.35 }),
    )
    indiaMesh.rotation.x = -Math.PI / 2
    indiaMesh.position.y = 0.12
    scene.add(indiaMesh)

    const depthSlice = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 16),
      new THREE.MeshBasicMaterial({
        color: 0x19bcd6,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    )
    depthSlice.rotation.x = -Math.PI / 2
    scene.add(depthSlice)

    const currents = new THREE.Group()
    scene.add(currents)

    sceneRef.current = { camera, renderer, controls, oceanMesh, depthSlice, currents }

    const pendingField = temperatureFieldRef.current
    if (pendingField) {
      const pendingRange = getTemperatureRange(pendingField)
      applyTemperatureFieldToGeometry(oceanMesh.geometry, pendingField, pendingRange)
    }

    const pendingSalinity = salinityFieldRef.current
    if (pendingSalinity) {
      const pendingSalinityRange = getSalinityRange(pendingSalinity)
      applySalinityFieldToGeometry(oceanMesh.geometry, pendingSalinity, pendingSalinityRange)
    }

    const pendingChlorophyll = chlorophyllFieldRef.current
    if (pendingChlorophyll) {
      const pendingChlorophyllRange = getChlorophyllRange(pendingChlorophyll)
      applyChlorophyllFieldToGeometry(oceanMesh.geometry, pendingChlorophyll, pendingChlorophyllRange)
    }

    const pendingCurrent = currentFieldRef.current
    if (pendingCurrent) {
      applyCurrentFieldToGroup(currents, pendingCurrent)
    }

    const animate = () => {
      if (!mounted) return
      controls.update()
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      if (!mounted || !host) return
      const w = Math.max(host.clientWidth, 1)
      const h = Math.max(host.clientHeight, 1)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      mounted = false
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
      sceneRef.current = null
    }
  }, [])

  useEffect(() => { updateOceanAppearance() }, [updateOceanAppearance])

  useEffect(() => {
    const refs = sceneRef.current
    if (!refs) return
    refs.controls.enableRotate = viewMode === 'rotate'
    refs.controls.enablePan = viewMode === 'pan'
    refs.controls.enableZoom = viewMode === 'zoom'
  }, [viewMode])

  useEffect(() => {
    const refs = sceneRef.current
    if (!refs) return
    refs.camera.position.set(14, 16, 22)
    refs.controls.target.set(0, -1, 0)
    refs.controls.update()
  }, [resetToken])

  const visibleInstruments = instruments.filter((inst) =>
    inst.type === 'argo' ? showArgo : showGliders,
  )

  return (
    <div className="ocean-viewer">
      <div className="ocean-viewer__canvas-host" ref={canvasHostRef} />
      {(modelLoading || modelError || (isAnalysisActive && spatialProfilesLoading)) && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--status">
          <div className="view-label view-label--status">
            {modelLoading || spatialProfilesLoading ? 'LOADING DATA...' : modelError}
          </div>
        </div>
      )}
      {showObservationEmpty && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--analysis-empty">
          <div className="view-label view-label--status">
            No observation data available at this depth
          </div>
        </div>
      )}
      <div className="ocean-viewer__overlay ocean-viewer__overlay--label">
        <div className="view-label">
          <span className="view-label__region">INDIAN OCEAN</span>
          <span className="view-label__detail">{variableLabel} · {selectedDepth} m</span>
          {analysisModeLabel ? (
            <span className="view-label__detail view-label__detail--analysis">{analysisModeLabel}</span>
          ) : null}
          <span className="view-label__detail">{formatDisplayDate(currentDate)} · 00:00 UTC</span>
        </div>
      </div>
      <div className="ocean-viewer__overlay ocean-viewer__overlay--depth">
        <div className="depth-scale">
          <span className="depth-scale__title">DEPTH</span>
          {DEPTH_TICKS.map((d) => (
            <span key={d} className={`depth-scale__tick ${d === selectedDepth ? 'depth-scale__tick--active' : ''}`}>{d} m</span>
          ))}
        </div>
      </div>
      {isAnalysisActive ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <AnalysisColorbar
            mode={analysisMode}
            variable={selectedVariable}
            min={spatialAnalysis?.legendMin ?? null}
            max={spatialAnalysis?.legendMax ?? null}
          />
        </div>
      ) : null}
      {!isAnalysisActive && isTemperatureMode && temperatureRange && modelLayerEnabled && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <TemperatureColorbar
            range={temperatureRange}
            unit={temperatureField?.unit ?? '°C'}
          />
        </div>
      )}
      {!isAnalysisActive && isCurrentMode && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <CurrentColorbar
            unit="m/s"
            minSpeed={currentMagnitudeRange?.min}
            maxSpeed={currentMagnitudeRange?.max}
          />
        </div>
      )}
      {!isAnalysisActive && isSalinityMode && salinityRange && modelLayerEnabled && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <SalinityColorbar
            range={salinityRange}
            unit={salinityField?.unit ?? 'PSU'}
          />
        </div>
      )}
      {!isAnalysisActive && isChlorophyllMode && chlorophyllRange && modelLayerEnabled && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <ChlorophyllColorbar
            range={chlorophyllRange}
            unit={chlorophyllField?.unit ?? 'mg/m³'}
          />
        </div>
      )}
      <div className="ocean-viewer__overlay ocean-viewer__overlay--toolbar">
        <VisualizationToolbar
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onReset={onResetView}
          onFullscreen={onFullscreen}
        />
      </div>
      <div className="ocean-viewer__markers">
        {visibleInstruments.map((inst) => {
          const spatialPoint = spatialPointById.get(inst.id)
          return (
            <InstrumentMarker
              key={inst.id}
              instrument={{ ...inst, currentDepth: selectedDepth }}
              selected={selectedInstrumentId === inst.id}
              visible
              onSelect={onSelectInstrument}
              showErrorIndicator={analysisMode === 'difference' || analysisMode === 'absoluteError'}
              absoluteError={spatialPoint?.absoluteError ?? null}
              maxAbsoluteError={maxRegionAbsoluteError}
              variable={selectedVariable}
            />
          )
        })}
      </div>
    </div>
  )
}
