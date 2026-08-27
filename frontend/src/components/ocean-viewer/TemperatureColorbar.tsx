import { useMemo } from 'react'
import {
  formatTemperatureTick,
  getTemperatureGradientCss,
  getTemperatureLegendTicks,
  type TemperatureRange,
} from '../../utils/temperatureColor'

interface TemperatureColorbarProps {
  range: TemperatureRange
  unit?: string
  visible?: boolean
}

export function TemperatureColorbar({
  range,
  unit = '°C',
  visible = true,
}: TemperatureColorbarProps) {
  const ticks = useMemo(
    () => getTemperatureLegendTicks(range.min, range.max),
    [range.min, range.max],
  )

  if (!visible) return null

  return (
    <div className="temp-colorbar">
      <span className="temp-colorbar__title">
        Temperature <span className="temp-colorbar__unit">{unit}</span>
      </span>
      <div className="temp-colorbar__body">
        <div className="temp-colorbar__labels">
          <span className="temp-colorbar__extreme">warm</span>
          {ticks.map((tick) => (
            <span key={tick} className="temp-colorbar__tick">
              {formatTemperatureTick(tick)}
            </span>
          ))}
          <span className="temp-colorbar__extreme">cold</span>
        </div>
        <div
          className="temp-colorbar__gradient"
          style={{ background: getTemperatureGradientCss('vertical') }}
          aria-hidden
        />
      </div>
    </div>
  )
}
