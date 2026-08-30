import { DEMO_HAZARD_THRESHOLD_DISCLAIMER } from '../../data/hazardThresholds'
import type { HazardAssessment } from '../../types/hazard'
import { formatDisplayDate } from '../../utils/dateFormat'
import { RiskBadge } from './RiskLegend'

interface HazardStatusPanelProps {
  assessment: HazardAssessment | null
  loading?: boolean
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

  if (!assessment) {
    return (
      <div className="hazard-panel hazard-panel--status">
        <h3 className="hazard-panel__title">Hazard Status</h3>
        <p className="hazard-panel__empty">No ocean field data available for hazard analysis.</p>
      </div>
    )
  }

  return (
    <div className="hazard-panel hazard-panel--status">
      <h3 className="hazard-panel__title">Hazard Status</h3>
      <p className="hazard-disclaimer" role="note">
        {DEMO_HAZARD_THRESHOLD_DISCLAIMER}
      </p>
      <dl className="hazard-status-grid">
        <div className="hazard-status-grid__row">
          <dt>Current event</dt>
          <dd>{assessment.eventLabel}</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Affected region</dt>
          <dd>{assessment.affectedRegion.label}</dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Risk level</dt>
          <dd>
            <RiskBadge level={assessment.eventStatus} />
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Data confidence</dt>
          <dd>
            {assessment.dataConfidence === 'NOT_AVAILABLE'
              ? 'Not available'
              : assessment.dataConfidence}
          </dd>
        </div>
        <div className="hazard-status-grid__row">
          <dt>Last updated</dt>
          <dd>{formatDisplayDate(assessment.lastUpdated)}</dd>
        </div>
      </dl>
    </div>
  )
}
