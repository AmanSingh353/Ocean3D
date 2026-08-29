import type { AnalysisMode } from '../../types/analysis'

const ANALYSIS_OPTIONS: { value: AnalysisMode; label: string; hint: string; wide?: boolean }[] = [
  { value: 'model', label: 'Model', hint: 'Ocean model field' },
  {
    value: 'observation',
    label: 'Observation',
    hint: 'Platform observations at selected depth',
  },
  {
    value: 'difference',
    label: 'Difference',
    hint: 'Model − observation where matched',
  },
  {
    value: 'absoluteError',
    label: 'Absolute Error',
    hint: '|Model − observation| where matched',
  },
  {
    value: 'regionalValidation',
    label: 'Regional Validation',
    hint: 'Regional model vs observation validation',
    wide: true,
  },
  {
    value: 'verticalSection',
    label: 'Vertical Section',
    hint: 'Cross-section along a map transect',
    wide: true,
  },
]

interface AnalysisModeControlProps {
  value: AnalysisMode
  onChange: (mode: AnalysisMode) => void
}

export function AnalysisModeControl({ value, onChange }: AnalysisModeControlProps) {
  return (
    <div className="analysis-mode-control">
      <h3 className="control-section-title">ANALYSIS MODE</h3>
      <div className="analysis-mode-grid">
        {ANALYSIS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`analysis-mode-btn ${option.wide ? 'analysis-mode-btn--wide' : ''} ${value === option.value ? 'analysis-mode-btn--active' : ''}`}
            onClick={() => onChange(option.value)}
            title={option.hint}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
