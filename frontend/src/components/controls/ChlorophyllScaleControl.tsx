import {
  formatChlorophyllTick,
  getChlorophyllGradientCss,
  getChlorophyllLegendTicks,
} from '../../utils/chlorophyllColor'

interface ChlorophyllScaleControlProps {
  minChl?: number
  maxChl?: number
}

export function ChlorophyllScaleControl({
  minChl = 0.01,
  maxChl = 1,
}: ChlorophyllScaleControlProps) {
  const ticks = getChlorophyllLegendTicks(minChl, maxChl)

  return (
    <div className="control-block">
      <label className="control-label">CHLOROPHYLL SCALE</label>
      <div className="color-scale">
        <div
          className="color-scale__gradient"
          style={{ background: getChlorophyllGradientCss('horizontal') }}
        />
        <div className="color-scale__labels color-scale__labels--ticks">
          {ticks.map((tick) => (
            <span key={tick}>{formatChlorophyllTick(tick)} mg/m³</span>
          ))}
        </div>
      </div>
      <p className="control-hint">
        Chlorophyll from API field ({formatChlorophyllTick(minChl)}–{formatChlorophyllTick(maxChl)} mg/m³).
      </p>
    </div>
  )
}
