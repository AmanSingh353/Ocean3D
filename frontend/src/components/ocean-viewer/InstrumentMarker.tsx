import type { Instrument } from '../../types/ocean'
import { latLonToScenePercent } from '../../utils/geo'

interface InstrumentMarkerProps {
  instrument: Instrument
  selected: boolean
  visible: boolean
  onSelect: (id: string) => void
}

export function InstrumentMarker({
  instrument,
  selected,
  visible,
  onSelect,
}: InstrumentMarkerProps) {
  if (!visible) return null

  const pos = latLonToScenePercent(instrument.latitude, instrument.longitude)
  const colorClass = instrument.type === 'argo' ? 'marker--argo' : 'marker--glider'

  return (
    <button
      type="button"
      className={`instrument-marker ${colorClass} ${selected ? 'instrument-marker--selected' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onSelect(instrument.id)
      }}
      aria-label={`Select ${instrument.name}`}
      aria-pressed={selected}
    >
      <span className="instrument-marker__core" />
      <span className="instrument-marker__pulse" />
      <div className="instrument-marker__tooltip">
        <strong>{instrument.name}</strong>
        <span>{instrument.type === 'argo' ? 'Argo Float' : 'Glider'}</span>
        <span>{instrument.latitude.toFixed(1)}°N · {instrument.longitude.toFixed(1)}°E</span>
        <span>Depth: {instrument.currentDepth} m</span>
      </div>
    </button>
  )
}
