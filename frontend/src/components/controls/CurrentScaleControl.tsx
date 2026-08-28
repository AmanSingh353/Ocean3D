import {
  formatCurrentTick,
  getCurrentGradientCss,
  getCurrentLegendTicks,
  CURRENT_MAX_SPEED,
  CURRENT_MIN_SPEED,
} from '../../utils/currentColor'

interface CurrentScaleControlProps {
  minSpeed?: number
  maxSpeed?: number
}

export function CurrentScaleControl({
  minSpeed = CURRENT_MIN_SPEED,
  maxSpeed = CURRENT_MAX_SPEED,
}: CurrentScaleControlProps) {
  const ticks = getCurrentLegendTicks(minSpeed, maxSpeed)

  return (
    <div className="control-block">
      <label className="control-label">CURRENT SCALE</label>
      <div className="color-scale">
        <div
          className="color-scale__gradient"
          style={{ background: getCurrentGradientCss('horizontal') }}
        />
        <div className="color-scale__labels color-scale__labels--ticks">
          {ticks.map((tick) => (
            <span key={tick}>{formatCurrentTick(tick)} m/s</span>
          ))}
        </div>
      </div>
      <p className="control-hint">
        Current speed from API field ({formatCurrentTick(minSpeed)}–{formatCurrentTick(maxSpeed)} m/s).
      </p>
    </div>
  )
}
