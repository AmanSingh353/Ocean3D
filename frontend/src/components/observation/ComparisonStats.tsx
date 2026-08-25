import type { ComparisonStats } from '../../types/ocean'

interface ComparisonStatsProps {
  stats: ComparisonStats
}

export function ComparisonStatsPanel({ stats }: ComparisonStatsProps) {
  const diffSign = stats.difference >= 0 ? '+' : ''
  return (
    <div className="comparison-stats">
      <h4 className="subsection-title">COMPARISON</h4>
      <div className="stat-grid">
        <div className="stat-item"><span className="stat-label">MODEL</span><span className="stat-value">{stats.model} °C</span></div>
        <div className="stat-item"><span className="stat-label">OBSERVATION</span><span className="stat-value">{stats.observation} °C</span></div>
        <div className="stat-item"><span className="stat-label">DIFFERENCE</span><span className="stat-value stat-value--accent">{diffSign}{stats.difference} °C</span></div>
        <div className="stat-item"><span className="stat-label">RMSE</span><span className="stat-value">{stats.rmse} °C</span></div>
      </div>
    </div>
  )
}
