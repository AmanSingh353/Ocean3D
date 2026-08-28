import type { Instrument, OceanVariable } from '../../types/ocean'
import { latLonToScenePercent } from '../../utils/geo'
import { formatVariableValue } from '../../data/variableMeta'

interface InstrumentMarkerProps {
  instrument: Instrument
  selected: boolean
  visible: boolean
  onSelect: (id: string) => void
  absoluteError?: number | null
  maxAbsoluteError?: number | null
  showErrorIndicator?: boolean
  variable?: OceanVariable
}

export function InstrumentMarker({
  instrument,
  selected,
  visible,
  onSelect,
  absoluteError,
  maxAbsoluteError,
  showErrorIndicator = false,
  variable = 'temperature',
}: InstrumentMarkerProps) {
  if (!visible) return null

  const pos = latLonToScenePercent(instrument.latitude, instrument.longitude)
  const colorClass = instrument.type === 'argo' ? 'marker--argo' : 'marker--glider'
  const hasError =
    showErrorIndicator &&
    absoluteError != null &&
    Number.isFinite(absoluteError) &&
    maxAbsoluteError != null &&
    maxAbsoluteError > 0
  const errorScale =
    hasError && maxAbsoluteError
      ? 1 + Math.min(1, absoluteError / maxAbsoluteError) * 0.65
      : 1

  return (
    <button
      type="button"
      className={`instrument-marker ${colorClass} ${selected ? 'instrument-marker--selected' : ''} ${hasError ? 'instrument-marker--error' : ''}`}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        ['--error-scale' as string]: errorScale,
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
      {hasError ? (
        <span
          className="instrument-marker__error-ring"
          style={{
            opacity: 0.35 + (absoluteError! / maxAbsoluteError!) * 0.55,
          }}
        />
      ) : null}
      <span className="instrument-marker__core" />
      <span className="instrument-marker__pulse" />
      <div className="instrument-marker__tooltip">
        <strong>{instrument.name}</strong>
        <span>{instrument.type === 'argo' ? 'Argo Float' : 'Glider'}</span>
        <span>{instrument.latitude.toFixed(1)}°N · {instrument.longitude.toFixed(1)}°E</span>
        <span>Depth: {instrument.currentDepth} m</span>
        {hasError ? (
          <span>
            |Model − Obs|: {formatVariableValue(absoluteError!, variable)}
          </span>
        ) : null}
      </div>
    </button>
  )
}
