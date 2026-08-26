import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ApiTemperatureField } from '../../types/api'
import type { Instrument, OceanVariable } from '../../types/ocean'
import { DEPTH_TICKS, formatDisplayDate } from '../../data/mockModel'
import { InstrumentMarker } from './InstrumentMarker'
import { VisualizationToolbar, type ViewMode } from './VisualizationToolbar'

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
  colorScaleMin: number
  colorScaleMax: number
  selectedInstrumentId: string | null
  instruments: Instrument[]
  temperatureField: ApiTemperatureField | null
  modelLoading: boolean
  modelError: string | null
  onSelectInstrument: (id: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  resetToken: number
  onResetView: () => void
  onFullscreen: () => void
}

function tempToColor(temp: number, min: number, max: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (temp - min) / (max - min)))
  const color = new THREE.Color()
  if (t < 0.2) color.setHSL(0.58, 0.9, 0.25 + t * 1.5)
  else if (t < 0.4) color.setHSL(0.48, 0.85, 0.35 + (t - 0.2) * 0.8)
  else if (t < 0.6) color.setHSL(0.33, 0.8, 0.4 + (t - 0.4) * 0.5)
  else if (t < 0.8) color.setHSL(0.12, 0.85, 0.45 + (t - 0.6) * 0.3)
  else color.setHSL(0.02, 0.9, 0.45 + (t - 0.8) * 0.2)
  return color
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

function sampleField(
  field: ApiTemperatureField,
  lat: number,
  lon: number,
): number {
  const { latitudes, longitudes } = field.grid
  const latClamped = Math.max(latitudes[0], Math.min(latitudes[latitudes.length - 1], lat))
  const lonClamped = Math.max(longitudes[0], Math.min(longitudes[longitudes.length - 1], lon))

  let latIdx = latitudes.findIndex((v) => v >= latClamped)
  if (latIdx <= 0) latIdx = 1
  let lonIdx = longitudes.findIndex((v) => v >= lonClamped)
  if (lonIdx <= 0) lonIdx = 1

  const lat0 = latitudes[latIdx - 1]
  const lat1 = latitudes[latIdx]
  const lon0 = longitudes[lonIdx - 1]
  const lon1 = longitudes[lonIdx]

  const latT = lat1 === lat0 ? 0 : (latClamped - lat0) / (lat1 - lat0)
  const lonT = lon1 === lon0 ? 0 : (lonClamped - lon0) / (lon1 - lon0)

  const v00 = field.values[latIdx - 1][lonIdx - 1]
  const v01 = field.values[latIdx - 1][lonIdx]
  const v10 = field.values[latIdx][lonIdx - 1]
  const v11 = field.values[latIdx][lonIdx]

  const top = v00 + lonT * (v01 - v00)
  const bottom = v10 + lonT * (v11 - v10)
  return top + latT * (bottom - top)
}

function sceneToLatLon(x: number, z: number): { lat: number; lon: number } {
  const lon = 65 + ((x + 14) / 28) * 20
  const lat = 20 - ((z + 9) / 18) * 15
  return { lat, lon }
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
  colorScaleMin,
  colorScaleMax,
  selectedInstrumentId,
  instruments,
  temperatureField,
  modelLoading,
  modelError,
  onSelectInstrument,
  viewMode,
  onViewModeChange,
  resetToken,
  onResetView,
  onFullscreen,
}: OceanViewerProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    oceanMesh: THREE.Mesh
    depthSlice: THREE.Mesh
    currents: THREE.Group
  } | null>(null)

  const variableLabel =
    selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)

  const updateOceanAppearance = useCallback(() => {
    const refs = sceneRef.current
    if (!refs) return

    const opacity = modelLayerEnabled ? modelOpacity / 100 : 0
    const mat = refs.oceanMesh.material as THREE.MeshPhongMaterial
    mat.opacity = opacity
    mat.visible = opacity > 0

    refs.depthSlice.visible = modelLayerEnabled && opacity > 0
    const sliceMat = refs.depthSlice.material as THREE.MeshBasicMaterial
    sliceMat.opacity = Math.min(1, opacity + 0.15)

    refs.oceanMesh.scale.y = verticalExaggeration * 0.5
    refs.depthSlice.position.y =
      -4 * verticalExaggeration * 0.5 +
      (selectedDepth / 1000) * 4 * verticalExaggeration * 0.5

    const depthTemp = temperatureField
      ? sampleField(
          temperatureField,
          (temperatureField.bounds.lat_min + temperatureField.bounds.lat_max) / 2,
          (temperatureField.bounds.lon_min + temperatureField.bounds.lon_max) / 2,
        )
      : colorScaleMax - (selectedDepth / 1000) * (colorScaleMax - colorScaleMin) * 0.6
    sliceMat.color = tempToColor(depthTemp, colorScaleMin, colorScaleMax)
    refs.currents.visible = showCurrents
  }, [
    modelLayerEnabled, modelOpacity, verticalExaggeration, selectedDepth,
    colorScaleMin, colorScaleMax, showCurrents, temperatureField,
  ])

  useEffect(() => {
    const refs = sceneRef.current
    if (!refs || !temperatureField) return

    const geometry = refs.oceanMesh.geometry as THREE.BoxGeometry
    const positions = geometry.attributes.position
    const colors = geometry.attributes.color as THREE.BufferAttribute

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const { lat, lon } = sceneToLatLon(x, z)
      const temp = sampleField(temperatureField, lat, lon)
      const c = tempToColor(temp, colorScaleMin, colorScaleMax)
      colors.setXYZ(i, c.r, c.g, c.b)
    }
    colors.needsUpdate = true
  }, [temperatureField, colorScaleMin, colorScaleMax])

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
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const temp = colorScaleMax - ((y + 4) / 8) * (colorScaleMax - colorScaleMin)
      const c = tempToColor(temp, colorScaleMin, colorScaleMax)
      colors.push(c.r, c.g, c.b)
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
    for (let x = -12; x <= 12; x += 4) {
      for (let z = -8; z <= 8; z += 4) {
        const dir = new THREE.Vector3(
          Math.sin(x * 0.3 + z * 0.2), 0, Math.cos(x * 0.2 - z * 0.3),
        ).normalize()
        currents.add(new THREE.ArrowHelper(dir, new THREE.Vector3(x, 0.3, z), 2.2, 0x19bcd6, 0.5, 0.35))
      }
    }
    scene.add(currents)

    sceneRef.current = { camera, renderer, controls, oceanMesh, depthSlice, currents }

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
  }, [colorScaleMin, colorScaleMax])

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
      {(modelLoading || modelError) && (
        <div className="ocean-viewer__overlay ocean-viewer__overlay--status">
          <div className="view-label view-label--status">
            {modelLoading ? 'Loading ocean field...' : modelError}
          </div>
        </div>
      )}
      <div className="ocean-viewer__overlay ocean-viewer__overlay--label">
        <div className="view-label">
          <span className="view-label__region">INDIAN OCEAN</span>
          <span className="view-label__detail">{variableLabel} · {selectedDepth} m</span>
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
      <div className="ocean-viewer__overlay ocean-viewer__overlay--toolbar">
        <VisualizationToolbar
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onReset={onResetView}
          onFullscreen={onFullscreen}
        />
      </div>
      <div className="ocean-viewer__markers">
        {visibleInstruments.map((inst) => (
          <InstrumentMarker
            key={inst.id}
            instrument={{ ...inst, currentDepth: selectedDepth }}
            selected={selectedInstrumentId === inst.id}
            visible
            onSelect={onSelectInstrument}
          />
        ))}
      </div>
    </div>
  )
}
