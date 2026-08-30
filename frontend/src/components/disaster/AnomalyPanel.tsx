import type { HazardIndicatorResult } from '../../types/hazard'
import { RiskBadge } from './RiskLegend'

interface AnomalyPanelProps {
  indicators: HazardIndicatorResult[]
}

export function AnomalyPanel({ indicators }: AnomalyPanelProps) {
  if (indicators.length === 0) return null

  return (
    <div className="hazard-panel hazard-panel--anomaly">
      <h3 className="hazard-panel__title">Ocean Anomaly</h3>
      <p className="hazard-panel__subtitle">Demo reference — not operational climatology</p>
      <ul className="anomaly-list">
        {indicators.map((ind) => (
          <li key={ind.id} className="anomaly-list__item">
            <div className="anomaly-list__header">
              <span className="anomaly-list__label">{ind.label}</span>
              <RiskBadge level={ind.riskLevel} />
            </div>
            <dl className="anomaly-list__metrics">
              <div>
                <dt>Current</dt>
                <dd>{ind.currentValue != null ? `${ind.currentValue} ${ind.unit}` : '—'}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{ind.referenceValue != null ? `${ind.referenceValue} ${ind.unit}` : '—'}</dd>
              </div>
              <div>
                <dt>Anomaly</dt>
                <dd>
                  {ind.anomaly != null
                    ? `${ind.anomaly >= 0 ? '+' : ''}${ind.anomaly} ${ind.unit}${
                        ind.anomalyPercent != null
                          ? ` (${ind.anomaly >= 0 ? '+' : ''}${ind.anomalyPercent}%)`
                          : ''
                      }`
                    : '—'}
                </dd>
              </div>
              {ind.variable === 'current' && ind.currentSpeed != null ? (
                <div>
                  <dt>Speed / direction</dt>
                  <dd>
                    {ind.currentSpeed} m/s
                    {ind.currentDirectionDeg != null ? ` · ${ind.currentDirectionDeg}°` : ''}
                  </dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
