interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  ticks?: number[]
  formatTick?: (value: number) => string
  ariaLabel?: string
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  ticks,
  formatTick = (v) => String(v),
  ariaLabel,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="slider">
      <div className="slider__track-wrap">
        <div className="slider__fill" style={{ width: `${percent}%` }} />
        <input
          type="range"
          className="slider__input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
        />
      </div>
      {ticks && (
        <div className="slider__ticks">
          {ticks.map((tick) => (
            <span key={tick} className="slider__tick">
              {formatTick(tick)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
