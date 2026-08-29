import type { ValidationRegionBounds } from '../../data/validationRegions'
import { VALIDATION_REGION_PRESETS } from '../../data/validationRegions'

interface ValidationRegionControlProps {
  region: ValidationRegionBounds
  onRegionChange: (region: ValidationRegionBounds) => void
  regionPickActive: boolean
  onToggleRegionPick: () => void
  pickHint?: string | null
}

export function ValidationRegionControl({
  region,
  onRegionChange,
  regionPickActive,
  onToggleRegionPick,
  pickHint,
}: ValidationRegionControlProps) {
  return (
    <div className="validation-region-control">
      <label className="control-label" htmlFor="validation-region-select">
        VALIDATION REGION
      </label>
      <select
        id="validation-region-select"
        className="select-input"
        value={region.id}
        onChange={(e) => {
          const preset = VALIDATION_REGION_PRESETS.find((r) => r.id === e.target.value)
          if (preset) onRegionChange({ ...preset })
        }}
      >
        {VALIDATION_REGION_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
        {region.id === 'custom' ? (
          <option value="custom">{region.label}</option>
        ) : null}
      </select>
      <p className="control-hint">
        {region.latMin.toFixed(0)}°–{region.latMax.toFixed(0)}°N ·{' '}
        {region.lonMin.toFixed(0)}°–{region.lonMax.toFixed(0)}°E
      </p>
      <button
        type="button"
        className={`btn btn--ghost btn--compact ${regionPickActive ? 'btn--active' : ''}`}
        onClick={onToggleRegionPick}
      >
        {regionPickActive ? 'Cancel map selection' : 'Define on map'}
      </button>
      {regionPickActive ? (
        <p className="control-hint control-hint--accent">
          Click two corners on the ocean map to define a bounding box.
          {pickHint ? ` ${pickHint}` : ''}
        </p>
      ) : null}
    </div>
  )
}
