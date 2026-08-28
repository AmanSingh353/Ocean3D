import { useMemo } from 'react'
import {
  formatSalinityTick,
  getSalinityGradientCss,
  getSalinityLegendTicks,
  type SalinityRange,
} from '../../utils/salinityColor'

interface SalinityColorbarProps {
  range: SalinityRange
  unit?: string
  visible?: boolean
}

export function SalinityColorbar({
  range,
  unit = 'PSU',
  visible = true,
}: SalinityColorbarProps) {
  const ticks = useMemo(
    () => getSalinityLegendTicks(range.min, range.max),
    [range.min, range.max],
  )

  if (!visible) return null

  return (
    <div className="temp-colorbar">
      <span className="temp-colorbar__title">
        Salinity <span className="temp-colorbar__unit">{unit}</span>
      </span>
      <div className="temp-colorbar__body">
        <div className="temp-colorbar__labels">
          <span className="temp-colorbar__extreme">high</span>
          {ticks.map((tick) => (
            <span key={tick} className="temp-colorbar__tick">
              {formatSalinityTick(tick)}
            </span>
          ))}
          <span className="temp-colorbar__extreme">low</span>
        </div>
        <div
          className="temp-colorbar__gradient"
          style={{ background: getSalinityGradientCss('vertical') }}
          aria-hidden
        />
      </div>
    </div>
  )
}
