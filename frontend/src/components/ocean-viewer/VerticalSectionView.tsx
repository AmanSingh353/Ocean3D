import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AnalysisMode } from '../../types/analysis'
import type { Instrument, InstrumentProfile, OceanVariable } from '../../types/ocean'
import { getVariableMeta, formatVariableValue } from '../../data/variableMeta'
import { formatDisplayDate } from '../../utils/dateFormat'
import { depthToChartTopPercent } from '../../utils/depthInterpolation'
import { DemoDataBanner } from '../common/DemoDataBanner'
import {
  absoluteErrorToColor,
  differenceToColor,
} from '../../utils/analysisColor'
import { chlorophyllToColor } from '../../utils/chlorophyllColor'
import { currentToColor } from '../../utils/currentColor'
import { salinityToColor } from '../../utils/salinityColor'
import { temperatureToColor } from '../../utils/temperatureColor'
import {
  buildVerticalSectionGrid,
  resolveVerticalSectionDisplayMode,
  type TransectSpec,
  type VerticalSectionCell,
  type VerticalSectionDisplayMode,
} from '../../utils/verticalSectionData'
import { AnalysisColorbar } from './AnalysisColorbar'
import { ChlorophyllColorbar } from './ChlorophyllColorbar'
import { CurrentColorbar } from './CurrentColorbar'
import { SalinityColorbar } from './SalinityColorbar'
import { TemperatureColorbar } from './TemperatureColorbar'

interface VerticalSectionViewProps {
  variable: OceanVariable
  date: string
  transect: TransectSpec
  selectedDepth: number
  apiModelDepth: number
  analysisMode: AnalysisMode
  sectionDisplayMode: VerticalSectionDisplayMode
  instruments: Instrument[]
  profilesById: Map<string, InstrumentProfile>
  availableDepths: number[]
  profilesLoading?: boolean
}

interface HoverState {
  cell: VerticalSectionCell
  col: number
  row: number
  x: number
  y: number
}

function valueToRgb(
  variable: OceanVariable,
  value: number,
  min: number,
  max: number,
  displayMode: VerticalSectionDisplayMode,
): [number, number, number] {
  let color
  if (displayMode === 'difference') {
    color = differenceToColor(value, min, max)
  } else if (displayMode === 'absoluteError') {
    color = absoluteErrorToColor(value, min, max)
  } else {
    switch (variable) {
      case 'temperature':
        color = temperatureToColor(value, min, max)
        break
      case 'salinity':
        color = salinityToColor(value, min, max)
        break
      case 'chlorophyll':
        color = chlorophyllToColor(value, min, max)
        break
      case 'current':
        color = currentToColor(value, min, max)
        break
    }
  }
  return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)]
}

const MISSING_RGB: [number, number, number] = [10, 22, 32]

export function VerticalSectionView({
  variable,
  date,
  transect,
  selectedDepth,
  apiModelDepth,
  analysisMode,
  sectionDisplayMode,
  instruments,
  profilesById,
  availableDepths,
  profilesLoading = false,
}: VerticalSectionViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const meta = getVariableMeta(variable)

  const displayMode = resolveVerticalSectionDisplayMode(analysisMode, sectionDisplayMode)

  const grid = useMemo(
    () =>
      buildVerticalSectionGrid(transect, variable, date, {
        availableDepths,
        displayMode,
        instruments,
        profilesById,
      }),
    [transect, variable, date, availableDepths, displayMode, instruments, profilesById],
  )

  const rows = grid.depths.length
  const cols = grid.distancesKm.length
  const maxDist = grid.distancesKm[grid.distancesKm.length - 1] ?? 0

  const displayTitle = useMemo(() => {
    switch (displayMode) {
      case 'observation':
        return `${meta.label.toUpperCase()} OBSERVATION`
      case 'difference':
        return `${meta.label.toUpperCase()} DIFFERENCE`
      case 'absoluteError':
        return `${meta.label.toUpperCase()} ABSOLUTE ERROR`
      default:
        return meta.label.toUpperCase()
    }
  }, [displayMode, meta.label])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || cols === 0 || rows === 0) return

    const dpr = window.devicePixelRatio || 1
    const width = cols
    const height = rows
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const value = grid.displayValues[row]?.[col] ?? null
        const rgb =
          value != null
            ? valueToRgb(variable, value, grid.legendMin, grid.legendMax, displayMode)
            : MISSING_RGB
        const surfaceRow = rows - 1 - row
        const idx = (surfaceRow * width + col) * 4
        data[idx] = rgb[0]
        data[idx + 1] = rgb[1]
        data[idx + 2] = rgb[2]
        data[idx + 3] = value != null ? 255 : 180
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [grid, variable, displayMode, cols, rows])

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const host = chartRef.current
      if (!host || cols === 0 || rows === 0) return
      const rect = host.getBoundingClientRect()
      const relX = event.clientX - rect.left
      const relY = event.clientY - rect.top
      const col = Math.min(cols - 1, Math.max(0, Math.floor((relX / rect.width) * cols)))
      const rowFromTop = Math.min(rows - 1, Math.max(0, Math.floor((relY / rect.height) * rows)))
      const row = rows - 1 - rowFromTop
      const cell = grid.cells[row]?.[col]
      if (!cell) {
        setHover(null)
        return
      }
      setHover({ cell, col, row, x: relX, y: relY })
    },
    [cols, rows, grid.cells],
  )

  const handlePointerLeave = useCallback(() => setHover(null), [])

  const hoverValue = hover
    ? displayMode === 'observation'
      ? hover.cell.observation
      : displayMode === 'difference'
        ? hover.cell.difference
        : displayMode === 'absoluteError'
          ? hover.cell.absoluteError
          : hover.cell.model
    : null

  const depthLinePercent = depthToChartTopPercent(selectedDepth, grid.depths)

  return (
    <div className="vertical-section-view">
      <DemoDataBanner compact className="vertical-section-view__demo" />
      <div className="vertical-section-view__header">
        <div>
          <h3 className="vertical-section-view__title">VERTICAL OCEAN SECTION</h3>
          <p className="vertical-section-view__subtitle">
            {displayTitle} ({meta.unit}) · {formatDisplayDate(date)} · 00:00 UTC
          </p>
          <p className="vertical-section-view__axis-hint">
            Y: Depth ↓ · X: Distance along transect → · Color: {meta.label} ({meta.unit})
          </p>
          <p className="vertical-section-view__coords">
            Transect: {transect.start.lat.toFixed(2)}°N,{transect.start.lon.toFixed(2)}°E →{' '}
            {transect.end.lat.toFixed(2)}°N,{transect.end.lon.toFixed(2)}°E · Selected depth:{' '}
            {selectedDepth} m
          </p>
        </div>
        <div className="vertical-section-view__colorbar-wrap">
          {displayMode === 'difference' || displayMode === 'absoluteError' ? (
            <AnalysisColorbar
              mode={displayMode}
              variable={variable}
              min={grid.legendMin}
              max={grid.legendMax}
            />
          ) : variable === 'temperature' ? (
            <TemperatureColorbar range={{ min: grid.legendMin, max: grid.legendMax }} />
          ) : variable === 'salinity' ? (
            <SalinityColorbar range={{ min: grid.legendMin, max: grid.legendMax }} />
          ) : variable === 'current' ? (
            <CurrentColorbar minSpeed={grid.legendMin} maxSpeed={grid.legendMax} />
          ) : (
            <ChlorophyllColorbar range={{ min: grid.legendMin, max: grid.legendMax }} />
          )}
        </div>
      </div>

      {profilesLoading && displayMode !== 'model' ? (
        <p className="vertical-section-view__loading">Loading platform profiles...</p>
      ) : null}

      <div className="vertical-section-view__body">
        <div className="vertical-section-view__y-axis">
          {[...grid.depths].reverse().map((d) => (
            <span
              key={d}
              className={`vertical-section-view__depth-tick ${d === selectedDepth || d === apiModelDepth ? 'vertical-section-view__depth-tick--active' : ''}`}
            >
              {d} m
            </span>
          ))}
        </div>
        <div className="vertical-section-view__plot-wrap">
          <div
            ref={chartRef}
            className="vertical-section-view__plot"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <canvas ref={canvasRef} className="vertical-section-view__canvas" aria-hidden />
            <div
              className="vertical-section-view__depth-line"
              style={{ top: `${depthLinePercent}%` }}
              aria-hidden
            >
              <span className="vertical-section-view__depth-line-label">{selectedDepth} m</span>
            </div>
            {hover ? (
              <div
                className="vertical-section-view__tooltip"
                style={{ left: hover.x + 12, top: hover.y + 12 }}
              >
                <span className="vertical-section-view__tooltip-title">{meta.label}</span>
                <span className="vertical-section-view__tooltip-value">
                  {hoverValue != null
                    ? `${formatVariableValue(hoverValue, variable)} ${meta.unit}`
                    : 'No data'}
                </span>
                <span>Depth: {hover.cell.depth} m</span>
                {hover.cell.depth !== hover.cell.modelLevel ? (
                  <span>Model level: {hover.cell.modelLevel} m</span>
                ) : null}
                <span>
                  Lat: {hover.cell.lat.toFixed(2)}°N · Lon: {hover.cell.lon.toFixed(2)}°E
                </span>
                <span>Distance: {hover.cell.distanceKm.toFixed(1)} km</span>
                {hover.cell.instrumentId ? (
                  <span>Platform: {hover.cell.instrumentId}</span>
                ) : null}
                {displayMode === 'model' && hover.cell.observation != null ? (
                  <span>
                    Obs: {formatVariableValue(hover.cell.observation, variable)} {meta.unit}
                  </span>
                ) : null}
                <span>{formatDisplayDate(date)} · 00:00 UTC</span>
              </div>
            ) : null}
          </div>
          <div className="vertical-section-view__x-axis">
            <span>0 km</span>
            <span>{(maxDist / 2).toFixed(0)} km</span>
            <span>{maxDist.toFixed(0)} km</span>
          </div>
          <p className="vertical-section-view__axis-label">Distance along transect →</p>
        </div>
      </div>
    </div>
  )
}
