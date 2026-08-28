import type { AnalysisMode, SpatialValidationPoint } from '../../types/analysis'
import type { Instrument, OceanVariable } from '../../types/ocean'
import { latLonToScenePercent } from '../../utils/geo'
import { differenceToCss } from '../../utils/analysisColor'
import { formatVariableValue, getVariableMeta } from '../../data/variableMeta'

interface InstrumentMarkerProps {
  instrument: Instrument
  selected: boolean
  visible: boolean
  onSelect: (id: string) => void
  absoluteError?: number | null
  maxAbsoluteError?: number | null
  spatialPoint?: SpatialValidationPoint | null
  differenceLegendMin?: number | null
  differenceLegendMax?: number | null
  showErrorIndicator?: boolean
  showRegionalValidation?: boolean
  showAbsoluteErrorInTooltip?: boolean
  variable?: OceanVariable
  analysisMode?: AnalysisMode
  screenPosition?: { x: number; y: number; visible: boolean }
}

export function InstrumentMarker({
  instrument,
  selected,
  visible,
  onSelect,
  absoluteError,
  maxAbsoluteError,
  spatialPoint,
  differenceLegendMin,
  differenceLegendMax,
  showErrorIndicator = false,
  showRegionalValidation = false,
  showAbsoluteErrorInTooltip = false,
  variable = 'temperature',
  screenPosition,
}: InstrumentMarkerProps) {
  if (!visible) return null

  const pos = screenPosition
    ? { x: screenPosition.x, y: screenPosition.y, visible: screenPosition.visible }
    : { ...latLonToScenePercent(instrument.latitude, instrument.longitude), visible: true }

  if (!pos.visible) return null

  const colorClass = instrument.type === 'argo' ? 'marker--argo' : 'marker--glider'
  const hasMatchedError =
    absoluteError != null && Number.isFinite(absoluteError)
  const hasDifference =
    spatialPoint?.difference != null && Number.isFinite(spatialPoint.difference)
  const hasValidationData = spatialPoint?.hasData === true

  const showRegionalMarker = showRegionalValidation && hasValidationData
  const showLegacyErrorRing =
    showErrorIndicator &&
    hasMatchedError &&
    maxAbsoluteError != null &&
    maxAbsoluteError > 0 &&
    !showRegionalMarker

  const errorScale =
    showLegacyErrorRing && maxAbsoluteError
      ? 1 + Math.min(1, absoluteError! / maxAbsoluteError) * 0.65
      : showRegionalMarker && maxAbsoluteError && hasMatchedError
        ? 1 + Math.min(1, absoluteError! / maxAbsoluteError) * 0.5
        : 1

  const validationColor =
    showRegionalMarker &&
    hasDifference &&
    differenceLegendMin != null &&
    differenceLegendMax != null
      ? differenceToCss(spatialPoint!.difference!, differenceLegendMin, differenceLegendMax)
      : undefined

  const variableMeta = getVariableMeta(variable)
  const showFullTooltip = showRegionalValidation && hasValidationData

  return (
    <button
      type="button"
      className={`instrument-marker ${colorClass} ${selected ? 'instrument-marker--selected' : ''} ${showLegacyErrorRing || showRegionalMarker ? 'instrument-marker--error' : ''} ${showRegionalMarker ? 'instrument-marker--validation' : ''}`}
      style={{
        left: screenPosition ? `${pos.x}px` : `${pos.x}%`,
        top: screenPosition ? `${pos.y}px` : `${pos.y}%`,
        ['--error-scale' as string]: errorScale,
        ...(validationColor ? { ['--validation-color' as string]: validationColor } : {}),
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onSelect(instrument.id)
      }}
      aria-label={`Select ${instrument.name}`}
      aria-pressed={selected}
    >
      {(showLegacyErrorRing || showRegionalMarker) && hasMatchedError ? (
        <span
          className="instrument-marker__error-ring"
          style={{
            opacity: showRegionalMarker
              ? 0.45 + (absoluteError! / (maxAbsoluteError || 1)) * 0.4
              : 0.35 + (absoluteError! / (maxAbsoluteError || 1)) * 0.55,
          }}
        />
      ) : null}
      <span className="instrument-marker__core" />
      <span className="instrument-marker__pulse" />
      <div className="instrument-marker__tooltip">
        <strong>{instrument.name}</strong>
        <span>{instrument.type === 'argo' ? 'Argo Float' : 'Glider'}</span>
        <span>{variableMeta.label} · {instrument.currentDepth} m</span>
        <span>{instrument.latitude.toFixed(1)}°N · {instrument.longitude.toFixed(1)}°E</span>
        {showFullTooltip ? (
          <>
            <span>Model: {formatVariableValue(spatialPoint!.model!, variable)}</span>
            <span>Observation: {formatVariableValue(spatialPoint!.observation!, variable)}</span>
            <span>
              Difference:{' '}
              {spatialPoint!.difference! >= 0 ? '+' : ''}
              {formatVariableValue(spatialPoint!.difference!, variable)}
            </span>
            <span>
              Absolute Error: {formatVariableValue(spatialPoint!.absoluteError!, variable)}
            </span>
          </>
        ) : null}
        {!showFullTooltip && hasMatchedError && (showAbsoluteErrorInTooltip || (selected && showErrorIndicator)) ? (
          <span>|Model − Obs|: {formatVariableValue(absoluteError!, variable)}</span>
        ) : null}
        {!showFullTooltip && !hasMatchedError && showAbsoluteErrorInTooltip ? (
          <span>|Model − Obs|: N/A</span>
        ) : null}
        {!hasValidationData && showRegionalValidation ? (
          <span>No matched data at this depth</span>
        ) : null}
      </div>
    </button>
  )
}
