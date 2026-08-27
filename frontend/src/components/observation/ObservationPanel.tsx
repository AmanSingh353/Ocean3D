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
}

export function ObservationPanel({
  selectedInstrumentId,
  selectedInstrument,
  profile,
  comparison,
  observationTime,
  profileLoading,
  profileError,
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
          <p className="observation-empty__title">Unable to load observation</p>
        </div>
      )}
      {showEmpty ? (
        <div className="observation-empty">
          <p className="observation-empty__title">Select an Argo Float or Glider</p>
          <p className="observation-empty__hint">Click a platform in the ocean view to inspect its profile.</p>
        </div>
      ) : null}
      {showDetails ? (
        <InstrumentDetails
          instrument={selectedInstrument}
          profile={profile}
          comparison={comparison}
          observationTime={observationTime}
        />
      ) : null}
    </div>
  )
}
