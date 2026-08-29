import { useMemo } from 'react'
import type { SpatialValidationPoint } from '../../types/analysis'
import type { ValidationRegionBounds } from '../../data/validationRegions'
import { DEFAULT_REGION } from '../../data/defaults'

interface RegionalObservationMapProps {
  points: SpatialValidationPoint[]
  region: ValidationRegionBounds
}

export function RegionalObservationMap({ points, region }: RegionalObservationMapProps) {
  const valid = points.filter((p) => p.hasData)

  const projected = useMemo(() => {
    const latSpan = region.latMax - region.latMin || 1
    const lonSpan = region.lonMax - region.lonMin || 1
    return valid.map((p) => ({
      id: p.instrumentId,
      x: ((p.longitude - region.lonMin) / lonSpan) * 100,
      y: ((region.latMax - p.latitude) / latSpan) * 100,
    }))
  }, [valid, region])

  return (
    <div className="regional-obs-map">
      <h4 className="subsection-title subsection-title--compact">OBSERVATION LOCATIONS</h4>
      <svg viewBox="0 0 100 100" className="regional-obs-map__svg" aria-hidden>
        <rect
          x={0}
          y={0}
          width={100}
          height={100}
          fill="rgba(9, 27, 41, 0.6)"
          stroke="rgba(25, 188, 214, 0.35)"
          strokeWidth={0.5}
        />
        {projected.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={2.2}
            fill="#48d5c3"
            stroke="#19bcd6"
            strokeWidth={0.6}
          />
        ))}
      </svg>
      <p className="control-hint">
        {valid.length} platform{valid.length === 1 ? '' : 's'} in {region.label}
        {' · '}
        domain {DEFAULT_REGION.lat_min}–{DEFAULT_REGION.lat_max}°N
      </p>
    </div>
  )
}
