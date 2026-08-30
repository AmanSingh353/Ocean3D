import { DEMO_HAZARD_THRESHOLD_DISCLAIMER } from '../../data/hazardThresholds'
import type { HazardAssessment } from '../../types/hazard'
import { formatDisplayDate } from '../../utils/dateFormat'
import { RiskBadge } from './RiskLegend'

interface HazardStatusPanelProps {
  assessment: HazardAssessment
  loading?: boolean
}

function riskPercent(count: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((count / total) * 100).toFixed(1)}%`
}

export function HazardStatusPanel({ assessment, loading = false }: HazardStatusPanelProps) {
  if (loading) {
    return (
      <div className="hazard-panel hazard-panel--status">
        <h3 className="hazard-panel__title">Hazard Status</h3>
        <p className="hazard-panel__loading">Computing hazard indicators...</p>
      </div>
    )
  }

  if (assessment.status !== 'success' || !assessment.event) {
    return (
      <div className="hazard-panel hazard-panel--status">
        <h3 className="hazard-panel__title">Hazard Status</h3>
        <p className="hazard-disclaimer" role="note">
          {DEMO_HAZARD_THRESHOLD_DISCLAIMER}
        </p>
        <p className="hazard-panel__empty">{assessment.statusMessage}</p>
      </div>
    )
  }

  const event = assessment.event
  const dist = assessment.riskDistribution

  return (
    <div className="hazard-panel hazard-panel--status">
      <h3 className="hazard-panel__title">Hazard Status</h3>
      <p className="hazard-disclaimer" role="note">
        {DEMO_HAZARD_THRESHOLD_DISCLAIMER}
      </p>
      <dl className="hazard-status-grid">
        <div className="hazard-status-grid__row">
          <dt>Status</dt>
          <dd>
            <RiskBadge level={event.status} />
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Current event</dt>
          <dd>{event.eventLabel}</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Region</dt>
          <dd>{event.region.label}</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Primary indicator</dt>
          <dd>{event.primaryIndicator}</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Depth</dt>
          <dd>{event.depth} m</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Peak value</dt>
          <dd>
            {event.peakValue != null ? `${event.peakValue} ${event.primaryUnit}` : '—'}
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Affected area</dt>
          <dd>{event.affectedCells} cells</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>High-risk cells</dt>
          <dd>
            {event.highRiskCells} ({riskPercent(event.highRiskCells, dist.validCells)})
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Critical cells</dt>
          <dd>
            {event.criticalCells} ({riskPercent(event.criticalCells, dist.validCells)})
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Confidence</dt>
          <dd>
            {event.confidence === 'NOT_ASSESSED' ? 'Not available' : event.confidence}
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Last updated</dt>
          <dd>{formatDisplayDate(event.latestUpdate)}</dd>
        </div>
      </dl>
    </div>
  )
}
