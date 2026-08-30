import type { HazardAssessment, HazardIndicatorResult } from '../../types/hazard'
import { formatDisplayDate } from '../../utils/dateFormat'
import { RiskBadge } from './RiskLegend'

interface HazardEventPanelProps {
  assessment: HazardAssessment | null
}

function formatValue(ind: HazardIndicatorResult): string {
  if (ind.currentValue == null) return '—'
  return `${ind.currentValue} ${ind.unit}`
}

function formatReference(ind: HazardIndicatorResult): string {
  if (ind.referenceValue == null) return '—'
  return `${ind.referenceValue} ${ind.unit} (demo ref.)`
}

function formatAnomaly(ind: HazardIndicatorResult): string {
  if (ind.anomaly == null) return '—'
  const sign = ind.anomaly >= 0 ? '+' : ''
  const pct =
    ind.anomalyPercent != null ? ` (${sign}${ind.anomalyPercent}%)` : ''
  return `${sign}${ind.anomaly} ${ind.unit}${pct}`
}

export function HazardEventPanel({ assessment }: HazardEventPanelProps) {
  if (!assessment) {
    return (
      <div className="hazard-panel hazard-panel--event">
        <h3 className="hazard-panel__title">Hazard Event</h3>
        <p className="hazard-panel__empty">Awaiting ocean field data.</p>
      </div>
    )
  }

  const primary = assessment.primaryIndicator

  return (
    <div className="hazard-panel hazard-panel--event">
      <h3 className="hazard-panel__title">Hazard Event</h3>
      <dl className="hazard-event-grid">
        <div className="hazard-event-grid__row">
          <dt>Status</dt>
          <dd>
            <RiskBadge level={assessment.eventStatus} />
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Region</dt>
          <dd>{assessment.affectedRegion.label}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Primary indicator</dt>
          <dd>{primary.label}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Current value</dt>
          <dd>{formatValue(primary)}</dd>
        </div>
        {primary.variable === 'current' && primary.currentDirectionDeg != null ? (
          <div className="hazard-event-grid__row">
            <dt>Current direction</dt>
            <dd>{primary.currentDirectionDeg}°</dd>
          </div>
        ) : null}
        <div className="hazard-event-grid__row">
          <dt>Reference</dt>
          <dd>{formatReference(primary)}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Anomaly</dt>
          <dd>{formatAnomaly(primary)}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Confidence</dt>
          <dd>
            {assessment.dataConfidence === 'NOT_AVAILABLE'
              ? 'Not available'
              : assessment.dataConfidence}
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Last updated</dt>
          <dd>{formatDisplayDate(assessment.lastUpdated)}</dd>
        </div>
      </dl>
      <p className="hazard-panel__note">{assessment.confidenceNote}</p>
      <p className="hazard-panel__note hazard-panel__note--muted">
        Requires operational forecast confirmation for any real-world decision.
      </p>
    </div>
  )
}
