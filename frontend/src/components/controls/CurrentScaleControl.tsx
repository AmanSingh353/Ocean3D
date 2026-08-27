import {
  formatCurrentTick,
  getCurrentGradientCss,
  getCurrentLegendTicks,
  CURRENT_MAX_SPEED,
  CURRENT_MIN_SPEED,
} from '../../utils/currentColor'

export function CurrentScaleControl() {
  const ticks = getCurrentLegendTicks(CURRENT_MIN_SPEED, CURRENT_MAX_SPEED)

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
        Synthetic current vectors (MVP). Speed range {CURRENT_MIN_SPEED}–{CURRENT_MAX_SPEED} m/s.
      </p>
    </div>
  )
}
