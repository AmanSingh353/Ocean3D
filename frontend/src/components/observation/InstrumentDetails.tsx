import type { Instrument, InstrumentProfile, ComparisonStats } from '../../types/ocean'
import { ProfileChart } from './ProfileChart'
import { ComparisonStatsPanel } from './ComparisonStats'

interface InstrumentDetailsProps {
  instrument: Instrument
  profile: InstrumentProfile
  comparison: ComparisonStats
  observationTime: string
}

export function InstrumentDetails({
  instrument,
  profile,
  comparison,
  observationTime,
}: InstrumentDetailsProps) {
  const typeLabel = instrument.type === 'argo' ? 'ARGO' : 'GLIDER'
  const latDir = instrument.latitude >= 0 ? 'N' : 'S'
  const lonDir = instrument.longitude >= 0 ? 'E' : 'W'

  return (
    <div className="instrument-details">
      <section className="detail-section">
        <h4 className="subsection-title">PLATFORM</h4>
        <div className="platform-badge">{typeLabel}</div>
        <div className="platform-name">{instrument.instrumentLabel}</div>
        <div className="detail-row">
          <span className="detail-label">Platform type:</span>
          <span className="detail-value">{instrument.platformType}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value detail-value--active">{instrument.status}</span>
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">LOCATION</h4>
        <div className="detail-coords">
          {Math.abs(instrument.latitude).toFixed(1)}° {latDir}<br />
          {Math.abs(instrument.longitude).toFixed(1)}° {lonDir}
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">DEPTH</h4>
        <div className="detail-row">
          <span className="detail-label">Current depth:</span>
          <span className="detail-value">{instrument.currentDepth} m</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Maximum depth:</span>
          <span className="detail-value">{instrument.maxDepth} m</span>
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">TIME</h4>
        <div className="detail-coords">
          {observationTime.split('\n').map((line) => <span key={line}>{line}<br /></span>)}
        </div>
      </section>
      <section className="detail-section"><ProfileChart data={profile.points} maxDepth={instrument.maxDepth} /></section>
      <ComparisonStatsPanel stats={comparison} />
      <section className="detail-section">
        <h4 className="subsection-title">PLATFORM DETAILS</h4>
        <div className="detail-row"><span className="detail-label">Instrument:</span><span className="detail-value">{instrument.instrumentLabel}</span></div>
        <div className="detail-row"><span className="detail-label">Type:</span><span className="detail-value">{instrument.platformType}</span></div>
        <div className="detail-row"><span className="detail-label">Data quality:</span><span className="detail-value detail-value--good">{instrument.dataQuality}</span></div>
      </section>
      <section className="detail-section detail-actions">
        <button type="button" className="btn btn--ghost btn--block">View Full Profile</button>
        <button type="button" className="btn btn--ghost btn--block">Compare</button>
        <button type="button" className="btn btn--primary btn--block">Export</button>
      </section>
    </div>
  )
}
