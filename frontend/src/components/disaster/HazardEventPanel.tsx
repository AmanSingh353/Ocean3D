import type { HazardAssessment } from '../../types/hazard'
import { formatHazardTrend } from '../../hazards/engine/event'
import { formatDisplayDate } from '../../utils/dateFormat'
import { RiskBadge } from './RiskLegend'

interface HazardEventPanelProps {
  assessment: HazardAssessment
  availableTimestepCount?: number
}

export function HazardEventPanel({
  assessment,
  availableTimestepCount = 1,
}: HazardEventPanelProps) {
  if (assessment.status !== 'success' || !assessment.event) {
    return (
      <div className="hazard-panel hazard-panel--event">
        <h3 className="hazard-panel__title">Hazard Event</h3>
        <p className="hazard-panel__empty">{assessment.statusMessage}</p>
      </div>
    )
  }

  const event = assessment.event

  return (
    <div className="hazard-panel hazard-panel--event">
      <h3 className="hazard-panel__title">Hazard Event</h3>
      <dl className="hazard-event-grid">
        <div className="hazard-event-grid__row">
          <dt>Event ID</dt>
          <dd className="hazard-event-grid__mono">{event.eventId}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Status</dt>
          <dd>
            <RiskBadge level={event.status} />
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Hazard type</dt>
          <dd>{event.hazardName}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Region</dt>
          <dd>{event.region.label}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Depth</dt>
          <dd>{event.depth} m</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Peak value</dt>
          <dd>
            {event.peakValue != null ? `${event.peakValue} ${event.primaryUnit}` : '—'}
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Centre value</dt>
          <dd>
            {event.centreValue != null ? `${event.centreValue} ${event.primaryUnit}` : '—'}
          </dd>
        </div>
        {event.peakLocation ? (
          <div className="hazard-event-grid__row">
            <dt>Peak location</dt>
            <dd>
              {event.peakLocation.lat.toFixed(2)}°N · {event.peakLocation.lon.toFixed(2)}°E
            </dd>
          </div>
        ) : null}
        {event.currentDirectionDeg != null ? (
          <div className="hazard-event-grid__row">
            <dt>Peak current direction</dt>
            <dd>{event.currentDirectionDeg}°</dd>
          </div>
        ) : null}
        <div className="hazard-event-grid__row">
          <dt>Reference</dt>
          <dd>
            {event.referenceValue != null
              ? `${event.referenceValue} ${event.primaryUnit} (demo ref.)`
              : '—'}
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Anomaly</dt>
          <dd>
            {event.anomaly != null
              ? `${event.anomaly >= 0 ? '+' : ''}${event.anomaly} ${event.primaryUnit}`
              : '—'}
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Mean (region)</dt>
          <dd>
            {event.meanValue != null ? `${event.meanValue} ${event.primaryUnit}` : '—'}
          </dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Trend</dt>
          <dd>{formatHazardTrend(event.trend, availableTimestepCount)}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Start time</dt>
          <dd>{formatDisplayDate(event.startTime)}</dd>
        </div>
        <div className="hazard-event-grid__row">
          <dt>Latest update</dt>
          <dd>{formatDisplayDate(event.latestUpdate)}</dd>
        </div>
      </dl>
    </div>
  )
}
