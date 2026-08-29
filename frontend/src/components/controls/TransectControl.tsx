import type { TransectSpec } from '../../utils/verticalSectionData'
import { DEFAULT_TRANSECT } from '../../utils/verticalSectionData'

interface TransectControlProps {
  transect: TransectSpec
  transectPickActive: boolean
  pickHint?: string | null
  onTogglePick: () => void
  onReset: () => void
  onBackToMap?: () => void
}

export function TransectControl({
  transect,
  transectPickActive,
  pickHint,
  onTogglePick,
  onReset,
  onBackToMap,
}: TransectControlProps) {
  return (
    <div className="transect-control">
      <label className="control-label">TRANSECT</label>
      <p className="control-hint">
        {transect.start.lat.toFixed(1)}°N,{transect.start.lon.toFixed(1)}°E →{' '}
        {transect.end.lat.toFixed(1)}°N,{transect.end.lon.toFixed(1)}°E
      </p>
      <div className="transect-control__actions">
        <button
          type="button"
          className={`btn btn--ghost btn--compact ${transectPickActive ? 'btn--active' : ''}`}
          onClick={onTogglePick}
        >
          {transectPickActive ? 'Cancel' : 'Start Transect'}
        </button>
        <button type="button" className="btn btn--ghost btn--compact" onClick={onReset}>
          Reset Transect
        </button>
        {onBackToMap ? (
          <button type="button" className="btn btn--ghost btn--compact" onClick={onBackToMap}>
            Back to Map
          </button>
        ) : null}
      </div>
      {transectPickActive ? (
        <p className="control-hint control-hint--accent">
          Click two points on the map to define the transect.{pickHint ? ` ${pickHint}` : ''}
        </p>
      ) : null}
      <p className="control-hint">Default: western Arabian Sea → central basin</p>
    </div>
  )
}

export { DEFAULT_TRANSECT }
