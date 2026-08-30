import type { RiskLevel } from '../../types/hazard'

const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

export function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  return (
    <span className={`risk-badge risk-badge--${level.toLowerCase()} ${className}`.trim()}>
      {RISK_LABELS[level]}
    </span>
  )
}

interface RiskLegendProps {
  compact?: boolean
}

export function RiskLegend({ compact = false }: RiskLegendProps) {
  const levels: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
  return (
    <div className={`risk-legend ${compact ? 'risk-legend--compact' : ''}`}>
      <span className="risk-legend__title">Risk overlay</span>
      <div className="risk-legend__items">
        {levels.map((level) => (
          <span key={level} className="risk-legend__item">
            <span className={`risk-legend__swatch risk-legend__swatch--${level.toLowerCase()}`} />
            {RISK_LABELS[level]}
          </span>
        ))}
      </div>
    </div>
  )
}
