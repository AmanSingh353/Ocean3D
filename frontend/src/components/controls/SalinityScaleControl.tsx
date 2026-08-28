import {
  formatSalinityTick,
  getSalinityGradientCss,
  getSalinityLegendTicks,
  SALINITY_MAX_PSU,
  SALINITY_MIN_PSU,
} from '../../utils/salinityColor'

interface SalinityScaleControlProps {
  minPsu?: number
  maxPsu?: number
}

export function SalinityScaleControl({
  minPsu = SALINITY_MIN_PSU,
  maxPsu = SALINITY_MAX_PSU,
}: SalinityScaleControlProps) {
  const ticks = getSalinityLegendTicks(minPsu, maxPsu)

  return (
    <div className="control-block">
      <label className="control-label">SALINITY SCALE</label>
      <div className="color-scale">
        <div
          className="color-scale__gradient"
          style={{ background: getSalinityGradientCss('horizontal') }}
        />
        <div className="color-scale__labels color-scale__labels--ticks">
          {ticks.map((tick) => (
            <span key={tick}>{formatSalinityTick(tick)} PSU</span>
          ))}
        </div>
      </div>
      <p className="control-hint">
        Salinity from API field ({formatSalinityTick(minPsu)}–{formatSalinityTick(maxPsu)} PSU).
      </p>
    </div>
  )
}
