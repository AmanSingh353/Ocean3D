import type { Instrument, InstrumentProfile, ComparisonStats } from '../../types/ocean'
import { InstrumentDetails } from './InstrumentDetails'

interface ObservationPanelProps {
  selectedInstrument: Instrument | null
  profile: InstrumentProfile | null
  comparison: ComparisonStats | null
  observationTime: string
  profileLoading: boolean
  profileError: string | null
}

export function ObservationPanel({
  selectedInstrument,
  profile,
  comparison,
  observationTime,
  profileLoading,
  profileError,
}: ObservationPanelProps) {
  return (
    <div className="observation-panel">
      <h2 className="panel-title">OBSERVATION</h2>
      {profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Loading profile...</p>
        </div>
      )}
      {profileError && !profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">{profileError}</p>
        </div>
      )}
      {!profileLoading && !profileError && (!selectedInstrument || !profile || !comparison) ? (
        <div className="observation-empty">
          <p className="observation-empty__title">Select an Argo Float or Glider</p>
          <p className="observation-empty__hint">Click a platform in the ocean view to inspect its profile.</p>
        </div>
      ) : null}
      {!profileLoading && !profileError && selectedInstrument && profile && comparison ? (
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
