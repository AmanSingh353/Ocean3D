import type { Instrument, InstrumentProfile, ComparisonStats } from '../../types/ocean'
import { InstrumentDetails } from './InstrumentDetails'

interface ObservationPanelProps {
  selectedInstrument: Instrument | null
  profile: InstrumentProfile | null
  comparison: ComparisonStats | null
  observationTime: string
}

export function ObservationPanel({
  selectedInstrument,
  profile,
  comparison,
  observationTime,
}: ObservationPanelProps) {
  return (
    <div className="observation-panel">
      <h2 className="panel-title">OBSERVATION</h2>
      {!selectedInstrument || !profile || !comparison ? (
        <div className="observation-empty">
          <p className="observation-empty__title">Select an Argo Float or Glider</p>
          <p className="observation-empty__hint">Click a platform in the ocean view to inspect its profile.</p>
        </div>
      ) : (
        <InstrumentDetails
          instrument={selectedInstrument}
          profile={profile}
          comparison={comparison}
          observationTime={observationTime}
        />
      )}
    </div>
  )
}
