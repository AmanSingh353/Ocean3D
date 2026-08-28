import type { Instrument, InstrumentProfile, ComparisonStats } from '../../types/ocean'
import { InstrumentDetails } from './InstrumentDetails'

interface ObservationPanelProps {
  selectedInstrumentId: string | null
  selectedInstrument: Instrument | null
  profile: InstrumentProfile | null
  comparison: ComparisonStats | null
  observationTime: string
  profileLoading: boolean
  profileError: string | null
  onClearSelection?: () => void
}

export function ObservationPanel({
  selectedInstrumentId,
  selectedInstrument,
  profile,
  comparison,
  observationTime,
  profileLoading,
  profileError,
  onClearSelection,
}: ObservationPanelProps) {
  const showEmpty =
    !selectedInstrumentId && !profileLoading && !profileError
  const showDetails =
    !profileLoading &&
    !profileError &&
    selectedInstrument !== null &&
    profile !== null &&
    comparison !== null

  return (
    <div className="observation-panel">
      <h2 className="panel-title">OBSERVATION</h2>
      {profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Loading observation...</p>
        </div>
      )}
      {profileError && !profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Observation data unavailable</p>
          {selectedInstrumentId ? (
            <p className="observation-empty__hint">
              Could not load profile for {selectedInstrumentId}.
            </p>
          ) : null}
          {onClearSelection ? (
            <button type="button" className="btn btn--ghost" onClick={onClearSelection}>
              Clear selection
            </button>
          ) : null}
        </div>
      )}
      {showEmpty ? (
        <div className="observation-empty">
          <p className="observation-empty__title">Select an Argo Float or Glider</p>
          <p className="observation-empty__hint">
            Click a platform in the ocean view to inspect its profile.
          </p>
        </div>
      ) : null}
      {showDetails ? (
        <InstrumentDetails
          instrument={selectedInstrument}
          profile={profile}
          comparison={comparison}
          observationTime={observationTime}
          onClearSelection={onClearSelection}
        />
      ) : null}
    </div>
  )
}
