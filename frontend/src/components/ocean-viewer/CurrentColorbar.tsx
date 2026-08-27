import { useMemo } from 'react'
import {
  formatCurrentTick,
  getCurrentGradientCss,
  getCurrentLegendTicks,
  CURRENT_MAX_SPEED,
  CURRENT_MIN_SPEED,
} from '../../utils/currentColor'

interface CurrentColorbarProps {
  unit?: string
  visible?: boolean
}

export function CurrentColorbar({
  unit = 'm/s',
  visible = true,
}: CurrentColorbarProps) {
  const ticks = useMemo(
    () => getCurrentLegendTicks(CURRENT_MIN_SPEED, CURRENT_MAX_SPEED),
    [],
  )

  if (!visible) return null

  return (
    <div className="temp-colorbar">
      <span className="temp-colorbar__title">
        Current <span className="temp-colorbar__unit">{unit}</span>
      </span>
      <div className="temp-colorbar__body">
        <div className="temp-colorbar__labels">
          <span className="temp-colorbar__extreme">fast</span>
          {ticks.map((tick) => (
            <span key={tick} className="temp-colorbar__tick">
              {formatCurrentTick(tick)}
            </span>
          ))}
          <span className="temp-colorbar__extreme">slow</span>
        </div>
        <div
          className="temp-colorbar__gradient"
          style={{ background: getCurrentGradientCss('vertical') }}
          aria-hidden
        />
      </div>
    </div>
  )
}
