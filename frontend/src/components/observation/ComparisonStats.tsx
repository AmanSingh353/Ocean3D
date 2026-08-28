import type { ComparisonStats } from '../../types/ocean'
import { formatVariableValue } from '../../data/variableMeta'

interface ComparisonStatsProps {
  stats: ComparisonStats
}

export function ComparisonStatsPanel({ stats }: ComparisonStatsProps) {
  const diffSign = stats.difference >= 0 ? '+' : ''

  return (
    <div className="comparison-stats">
      <h4 className="subsection-title">COMPARISON</h4>
      <p className="comparison-depth">
        At {stats.comparedDepth} m (interpolated from profile levels)
      </p>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">MODEL</span>
          <span className="stat-value">{formatVariableValue(stats.model, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">OBSERVATION</span>
          <span className="stat-value">{formatVariableValue(stats.observation, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">DIFFERENCE</span>
          <span className="stat-value stat-value--accent">
            {diffSign}{formatVariableValue(stats.difference, stats.variable)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatVariableValue(stats.rmse, stats.variable)}</span>
        </div>
      </div>
    </div>
  )
}
