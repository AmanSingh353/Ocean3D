import { VARIABLE_OPTIONS } from '../../data/variableMeta'
import type { OceanVariable } from '../../types/ocean'

interface VariableSelectorProps {
  value: OceanVariable
  onChange: (value: OceanVariable) => void
}

export function VariableSelector({ value, onChange }: VariableSelectorProps) {
  const selected = VARIABLE_OPTIONS.find((v) => v.value === value)

  return (
    <div className="control-block">
      <label className="control-label" htmlFor="variable-select">VARIABLE</label>
      <select
        id="variable-select"
        className="select-input"
        value={value}
        onChange={(e) => onChange(e.target.value as OceanVariable)}
      >
        {VARIABLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="control-value-display">
        <span>{selected?.label}</span>
        <span className="control-unit">{selected?.unit}</span>
      </div>
    </div>
  )
}
