import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from '../../types/api'
import type { Instrument, OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import { formatDisplayDate } from '../../utils/dateFormat'
import {
  applyCurrentFieldToGroup,
  getCurrentMagnitudeRange,
} from '../../utils/currentField'
import {
  applyTemperatureFieldToGeometry,
  getTemperatureRange,
} from '../../utils/temperatureField'
import {
  applySalinityFieldToGeometry,
  getSalinityRange,
} from '../../utils/salinityField'
import {
  applyChlorophyllFieldToGeometry,
  getChlorophyllRange,
} from '../../utils/chlorophyllField'
import { InstrumentMarker } from './InstrumentMarker'
import { AnalysisColorbar } from './AnalysisColorbar'
import { ChlorophyllColorbar } from './ChlorophyllColorbar'
import { CurrentColorbar } from './CurrentColorbar'
import { SalinityColorbar } from './SalinityColorbar'
import { TemperatureColorbar } from './TemperatureColorbar'
import { VisualizationToolbar, type ViewMode } from './VisualizationToolbar'
import type { AnalysisMode, SpatialAnalysisSnapshot } from '../../types/analysis'
import { applySpatialAnalysisToGeometry, applyNeutralOceanGeometry } from '../../utils/spatialAnalysisField'
import { usesSpatialMeshOverlay } from '../../utils/spatialValidation'
import { defaultModelGrid } from '../../data/defaults'
import { INDIAN_OCEAN_COASTLINE, INDIAN_OCEAN_LAND } from '../../data/indianOceanMap'
import {
  createCoastlineGeometryFromGeoJSON,
  createGraticuleGeometry,
  createLandGeometriesFromGeoJSON,
} from '../../utils/geoJsonMap'
import { createOceanBaseGeometry } from '../../utils/oceanGeometry'
import {
  createModelGridGeometry,
  getModelGridMeta,
  gridsEqual,
} from '../../utils/modelGridGeometry'
import { createGeoDebugGuideGeometry } from '../../utils/geoDebugGuide'
import { GeoDebugLabel } from './GeoDebugLabel'
import {
  INDIAN_OCEAN_VIEW_BOUNDS,
  GEO_MARKER_Y,
  latLonToSceneXZ,
  latLonToSceneXYZ,
  projectSceneToScreen,
} from '../../utils/geoProjection'

interface OceanViewerProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  apiModelDepth: number
  depthTicks: number[]
  regionLabel: string
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
  timestepError?: string | null
  onSelectInstrument: (id: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  resetToken: number
  onResetView: () => void
  onFullscreen: () => void
  analysisMode: AnalysisMode
  spatialAnalysis: SpatialAnalysisSnapshot | null
  spatialProfilesLoading: boolean
  validationLayerEnabled?: boolean
}

interface MarkerScreenPosition {
  x: number
  y: number
  visible: boolean
}

/** ARGO-014 verification coordinates (backend source of truth). */
const ARGO_014_LAT = 15.8
const ARGO_014_LON = 76.1

export function OceanViewer({
  selectedVariable,
  selectedDepth,
  apiModelDepth,
  depthTicks,
  regionLabel,
  currentDate,
  modelOpacity,
  modelLayerEnabled,
  showArgo,
  showGliders,
  showCurrents,
  verticalExaggeration: _verticalExaggeration,
  selectedInstrumentId,
  instruments,
  temperatureField,
  currentField,
  salinityField,
  chlorophyllField,
  modelLoading,
  modelError,
  timestepError = null,
  onSelectInstrument,
  viewMode,
  onViewModeChange,
  resetToken,
  onResetView,
  onFullscreen,
  analysisMode,
  spatialAnalysis,
  spatialProfilesLoading,
  validationLayerEnabled = false,
}: OceanViewerProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const instrumentsRef = useRef(instruments)
  instrumentsRef.current = instruments
  const [markerScreenPos, setMarkerScreenPos] = useState<Record<string, MarkerScreenPosition>>({})
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
    geoGroup: THREE.Group
    oceanMesh: THREE.Mesh
    geoDebugGuide: THREE.LineSegments
    currents: THREE.Group
  } | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const isTemperatureMode = selectedVariable === 'temperature'
  const isCurrentMode = selectedVariable === 'current'
  const isSalinityMode = selectedVariable === 'salinity'
  const isChlorophyllMode = selectedVariable === 'chlorophyll'
  const isScalarFieldMode = isTemperatureMode || isSalinityMode || isChlorophyllMode
  void _verticalExaggeration
  void isScalarFieldMode
  const isRegionalValidation = analysisMode === 'regionalValidation'
  const useSpatialMesh = usesSpatialMeshOverlay(analysisMode, validationLayerEnabled)
  const meshOverlayMode = isRegionalValidation ? 'absoluteError' : analysisMode
  const isAnalysisActive = analysisMode !== 'model' && !isRegionalValidation
  const showAnalysisColorbar =
    (isAnalysisActive || isRegionalValidation) &&
    spatialAnalysis != null &&
    !spatialProfilesLoading
  const showScalarColorbar = analysisMode === 'model' || (isRegionalValidation && !validationLayerEnabled)

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
      case 'regionalValidation':
        return 'Regional Validation'
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
  const meshOverlayReady =
    useSpatialMesh && spatialAnalysis != null && !spatialProfilesLoading
  const regionalAnalysisReady =
    isRegionalValidation && spatialAnalysis != null && !spatialProfilesLoading
  const showObservationEmpty =
    analysisMode === 'observation' &&
    meshOverlayReady &&
    !spatialAnalysis.hasData
  const showAbsoluteErrorEmpty =
    analysisMode === 'absoluteError' &&
    meshOverlayReady &&
    !spatialAnalysis.hasData
  const showRegionalEmpty =
    isRegionalValidation && regionalAnalysisReady && !spatialAnalysis.hasData

  const variableMeta = getVariableMeta(selectedVariable)
  const variableLabel = variableMeta.label

  const meshLegend = useMemo(() => {
    if (!spatialAnalysis) return { min: null as number | null, max: null as number | null }
    if (isRegionalValidation && validationLayerEnabled) {
      const maxAe = spatialAnalysis.region.maxAbsoluteError
      return {
        min: 0,
        max: maxAe != null && maxAe > 0 ? maxAe : 0.001,
      }
    }
    return { min: spatialAnalysis.legendMin, max: spatialAnalysis.legendMax }
  }, [spatialAnalysis, isRegionalValidation, validationLayerEnabled])

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

    refs.oceanMesh.scale.set(1, 1, 1)
    refs.oceanMesh.position.set(0, 0, 0)

    refs.currents.visible = showCurrents
    refs.currents.scale.set(1, 1, 1)
  }, [
    modelLayerEnabled, modelOpacity, showCurrents,
    isCurrentMode,
  ])

  const activeModelGrid = useMemo(() => {
    if (isTemperatureMode && temperatureField) return temperatureField.grid
    if (isSalinityMode && salinityField) return salinityField.grid
    if (isChlorophyllMode && chlorophyllField) return chlorophyllField.grid
    if (isCurrentMode && currentField) return currentField.grid
    return defaultModelGrid()
  }, [
    isTemperatureMode,
    isSalinityMode,
    isChlorophyllMode,
    isCurrentMode,
    temperatureField,
    salinityField,
    chlorophyllField,
    currentField,
  ])

  // Keep model mesh aligned to API lat/lon grid nodes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs) return
    const meta = getModelGridMeta(refs.oceanMesh.geometry)
    if (meta && gridsEqual(meta.grid, activeModelGrid)) return
    refs.oceanMesh.geometry.dispose()
    refs.oceanMesh.geometry = createModelGridGeometry(activeModelGrid)
  }, [activeModelGrid])

  // Update vertex colors when the API temperature field changes — not in the render loop
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !temperatureField || !temperatureRange || !isTemperatureMode) return
    if (meshOverlayReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: temperatureField.bounds,
        variable: 'temperature',
        mode: meshOverlayMode,
        points: spatialAnalysis!.points,
        legendMin: meshLegend.min,
        legendMax: meshLegend.max,
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
  }, [temperatureField, temperatureRange, isTemperatureMode, meshOverlayReady, spatialAnalysis, meshOverlayMode, meshLegend, activeModelGrid])

  // Update vertex colors when the API salinity field changes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !salinityField || !salinityRange || !isSalinityMode) return
    if (meshOverlayReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: salinityField.bounds,
        variable: 'salinity',
        mode: meshOverlayMode,
        points: spatialAnalysis!.points,
        legendMin: meshLegend.min,
        legendMax: meshLegend.max,
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
  }, [salinityField, salinityRange, isSalinityMode, meshOverlayReady, spatialAnalysis, meshOverlayMode, meshLegend, activeModelGrid])

  // Update vertex colors when the API chlorophyll field changes
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !chlorophyllField || !chlorophyllRange || !isChlorophyllMode) return
    if (meshOverlayReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: chlorophyllField.bounds,
        variable: 'chlorophyll',
        mode: meshOverlayMode,
        points: spatialAnalysis!.points,
        legendMin: meshLegend.min,
        legendMax: meshLegend.max,
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
  }, [chlorophyllField, chlorophyllRange, isChlorophyllMode, meshOverlayReady, spatialAnalysis, meshOverlayMode, meshLegend, activeModelGrid])

  // Current variable: apply spatial analysis overlay at platform locations
  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !currentField || !isCurrentMode) return
    if (meshOverlayReady) {
      applySpatialAnalysisToGeometry({
        geometry: refs.oceanMesh.geometry,
        bounds: currentField.bounds,
        variable: 'current',
        mode: meshOverlayMode,
        points: spatialAnalysis!.points,
        legendMin: meshLegend.min,
        legendMax: meshLegend.max,
        temperatureField: null,
        salinityField: null,
        chlorophyllField: null,
      })
      return
    }
    applyNeutralOceanGeometry(refs.oceanMesh.geometry)
  }, [currentField, isCurrentMode, meshOverlayReady, spatialAnalysis, meshOverlayMode, meshLegend, activeModelGrid])

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

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 250)
    const viewCenter = latLonToSceneXZ(10, 72.5, INDIAN_OCEAN_VIEW_BOUNDS)
    camera.position.set(viewCenter.x + 4, 28, viewCenter.z + 26)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x06121f, 1)
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI / 2.05
    controls.minDistance = 12
    controls.maxDistance = 80
    controls.target.set(viewCenter.x, -1, viewCenter.z)

    scene.add(new THREE.AmbientLight(0x1a4a5c, 0.65))
    const dirLight = new THREE.DirectionalLight(0x48d5c3, 0.85)
    dirLight.position.set(10, 24, 8)
    scene.add(dirLight)

    const geoGroup = new THREE.Group()
    geoGroup.name = 'geographic'
    scene.add(geoGroup)

    const baseOceanMesh = new THREE.Mesh(
      createOceanBaseGeometry(),
      new THREE.MeshPhongMaterial({
        color: 0x051018,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      }),
    )
    geoGroup.add(baseOceanMesh)

    const graticule = new THREE.LineSegments(
      createGraticuleGeometry(INDIAN_OCEAN_VIEW_BOUNDS, 10),
      new THREE.LineBasicMaterial({
        color: 0x1a3a48,
        transparent: true,
        opacity: 0.35,
      }),
    )
    geoGroup.add(graticule)

    const landMaterial = new THREE.MeshPhongMaterial({
      color: 0x0c1a22,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    })
    for (const landGeom of createLandGeometriesFromGeoJSON(INDIAN_OCEAN_LAND)) {
      geoGroup.add(new THREE.Mesh(landGeom, landMaterial))
    }

    const coastlineGeometry = createCoastlineGeometryFromGeoJSON(INDIAN_OCEAN_COASTLINE)
    const coastlines = new THREE.LineSegments(
      coastlineGeometry,
      new THREE.LineBasicMaterial({
        color: 0x45c8dc,
        transparent: true,
        opacity: 0.85,
      }),
    )
    geoGroup.add(coastlines)

    const oceanGeometry = createModelGridGeometry(defaultModelGrid())
    const oceanMesh = new THREE.Mesh(
      oceanGeometry,
      new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        shininess: 28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    geoGroup.add(oceanMesh)

    const geoDebugGuide = new THREE.LineSegments(
      createGeoDebugGuideGeometry(ARGO_014_LAT, ARGO_014_LON),
      new THREE.LineBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.9,
      }),
    )
    geoDebugGuide.visible = false
    geoGroup.add(geoDebugGuide)

    const currents = new THREE.Group()
    geoGroup.add(currents)

    sceneRef.current = { camera, renderer, controls, geoGroup, oceanMesh, geoDebugGuide, currents }

    const pendingField = temperatureFieldRef.current
    if (pendingField) {
      applyTemperatureFieldToGeometry(oceanMesh.geometry, pendingField, getTemperatureRange(pendingField))
    }
    const pendingSalinity = salinityFieldRef.current
    if (pendingSalinity) {
      applySalinityFieldToGeometry(oceanMesh.geometry, pendingSalinity, getSalinityRange(pendingSalinity))
    }
    const pendingChlorophyll = chlorophyllFieldRef.current
    if (pendingChlorophyll) {
      applyChlorophyllFieldToGeometry(oceanMesh.geometry, pendingChlorophyll, getChlorophyllRange(pendingChlorophyll))
    }
    const pendingCurrent = currentFieldRef.current
    if (pendingCurrent) {
      applyCurrentFieldToGroup(currents, pendingCurrent)
    }

    let markerFrame = 0
    const animate = () => {
      if (!mounted) return
      controls.update()
      renderer.render(scene, camera)

      markerFrame += 1
      if (markerFrame % 1 === 0) {
        setCanvasSize({ width: host.clientWidth, height: host.clientHeight })
        const next: Record<string, MarkerScreenPosition> = {}
        for (const inst of instrumentsRef.current) {
          const { x, y, z } = latLonToSceneXYZ(
            inst.latitude,
            inst.longitude,
            GEO_MARKER_Y,
            INDIAN_OCEAN_VIEW_BOUNDS,
          )
          next[inst.id] = projectSceneToScreen(
            x,
            y,
            z,
            camera,
            host.clientWidth,
            host.clientHeight,
          )
        }
        setMarkerScreenPos(next)
      }

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

  const showGeoDebug = selectedInstrumentId?.toUpperCase() === 'ARGO-014'

  useEffect(() => {
    const refs = sceneRef.current
    if (!refs) return
    refs.geoDebugGuide.visible = showGeoDebug
  }, [showGeoDebug])

  const argo014ScenePos = useMemo(
    () => latLonToSceneXYZ(ARGO_014_LAT, ARGO_014_LON, GEO_MARKER_Y, INDIAN_OCEAN_VIEW_BOUNDS),
    [],
  )

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
    const viewCenter = latLonToSceneXZ(10, 72.5, INDIAN_OCEAN_VIEW_BOUNDS)
    refs.camera.position.set(viewCenter.x + 4, 28, viewCenter.z + 26)
    refs.controls.target.set(viewCenter.x, -1, viewCenter.z)
    refs.controls.update()
  }, [resetToken])

  const visibleInstruments = instruments.filter((inst) =>
    inst.type === 'argo' ? showArgo : showGliders,
  )

  const hasActiveField =
    (isTemperatureMode && temperatureField != null) ||
    (isCurrentMode && currentField != null) ||
    (isSalinityMode && salinityField != null) ||
    (isChlorophyllMode && chlorophyllField != null)

  const showInitialLoading = modelLoading && !hasActiveField
  const showUpdatingIndicator = modelLoading && hasActiveField
  const displayError = modelError ?? timestepError
  const showBlockingError = displayError && !hasActiveField
  const showTimestepWarning = displayError && hasActiveField && !modelLoading

  return (
    <div className="ocean-viewer">
      <div className="ocean-viewer__canvas-host" ref={canvasHostRef} />
      {showInitialLoading || ((isAnalysisActive || isRegionalValidation) && spatialProfilesLoading && !hasActiveField) ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--status">
          <div className="view-label view-label--status">Loading ocean model...</div>
        </div>
      ) : null}
      {showUpdatingIndicator ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--updating">
          <div className="view-label view-label--status">
            <span className="ocean-viewer__pulse" aria-hidden />
            Updating timestep...
          </div>
        </div>
      ) : null}
      {showBlockingError ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--status">
          <div className="view-label view-label--status">{displayError}</div>
        </div>
      ) : null}
      {showTimestepWarning ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--timestep-warn">
          <div className="view-label view-label--status">{displayError}</div>
        </div>
      ) : null}
      {showObservationEmpty && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--analysis-empty">
          <div className="view-label view-label--status">
            No observation data available at this depth
          </div>
        </div>
      )}
      {showAbsoluteErrorEmpty ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--analysis-empty">
          <div className="view-label view-label--status">
            No absolute error data available at this depth
          </div>
        </div>
      ) : null}
      {showRegionalEmpty ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--analysis-empty">
          <div className="view-label view-label--status">
            No matched observations available for this timestep/depth
          </div>
        </div>
      ) : null}
      <div className="ocean-viewer__overlay ocean-viewer__overlay--label">
        <div className="view-label">
          <span className="view-label__region">{regionLabel}</span>
          <span className="view-label__detail">{variableLabel} · {selectedDepth} m</span>
          {selectedVariable === 'temperature' && selectedDepth !== apiModelDepth ? (
            <span className="view-label__detail view-label__detail--hint">
              Model slice: {apiModelDepth} m
            </span>
          ) : null}
          {analysisModeLabel ? (
            <span className="view-label__detail view-label__detail--analysis">{analysisModeLabel}</span>
          ) : null}
          <span className="view-label__detail">{formatDisplayDate(currentDate)} · 00:00 UTC</span>
        </div>
      </div>
      <div className="ocean-viewer__overlay ocean-viewer__overlay--depth">
        <div className="depth-scale">
          <span className="depth-scale__title">DEPTH</span>
          {depthTicks.map((d) => (
            <span key={d} className={`depth-scale__tick ${d === selectedDepth || d === apiModelDepth ? 'depth-scale__tick--active' : ''}`}>{d} m</span>
          ))}
        </div>
      </div>
      {showAnalysisColorbar ? (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <AnalysisColorbar
            mode={isRegionalValidation ? 'regionalValidation' : analysisMode}
            variable={selectedVariable}
            min={spatialAnalysis?.legendMin ?? null}
            max={spatialAnalysis?.legendMax ?? null}
          />
        </div>
      ) : null}
      {showScalarColorbar && isTemperatureMode && temperatureRange && modelLayerEnabled && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <TemperatureColorbar
            range={temperatureRange}
            unit={temperatureField?.unit ?? '°C'}
          />
        </div>
      )}
      {showScalarColorbar && isCurrentMode && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <CurrentColorbar
            unit="m/s"
            minSpeed={currentMagnitudeRange?.min}
            maxSpeed={currentMagnitudeRange?.max}
          />
        </div>
      )}
      {showScalarColorbar && isSalinityMode && salinityRange && modelLayerEnabled && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--colorbar">
          <SalinityColorbar
            range={salinityRange}
            unit={salinityField?.unit ?? 'PSU'}
          />
        </div>
      )}
      {showScalarColorbar && isChlorophyllMode && chlorophyllRange && modelLayerEnabled && (
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
        {showGeoDebug ? (
          <GeoDebugLabel
            lat={ARGO_014_LAT}
            lon={ARGO_014_LON}
            sceneX={argo014ScenePos.x}
            sceneY={argo014ScenePos.y}
            sceneZ={argo014ScenePos.z}
            camera={sceneRef.current?.camera ?? null}
            hostWidth={canvasSize.width}
            hostHeight={canvasSize.height}
          />
        ) : null}
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
              showRegionalValidation={isRegionalValidation}
              showAbsoluteErrorInTooltip={analysisMode === 'absoluteError'}
              spatialPoint={spatialPoint}
              absoluteError={spatialPoint?.absoluteError ?? null}
              maxAbsoluteError={maxRegionAbsoluteError}
              differenceLegendMin={spatialAnalysis?.legendMin ?? null}
              differenceLegendMax={spatialAnalysis?.legendMax ?? null}
              variable={selectedVariable}
              analysisMode={analysisMode}
              screenPosition={markerScreenPos[inst.id]}
            />
          )
        })}
      </div>
    </div>
  )
}
