import { Slider } from '../common/Slider'

interface VisualizationControlsProps {
  verticalExaggeration: number
  onVerticalExaggerationChange: (value: number) => void
}

export function VisualizationControls({
  verticalExaggeration,
  onVerticalExaggerationChange,
}: VisualizationControlsProps) {
  return (
    <div className="control-block">
      <label className="control-label">VERTICAL EXAGGERATION</label>
      <div className="depth-value">{verticalExaggeration.toFixed(1)}×</div>
      <Slider
        min={1}
        max={3}
        step={0.1}
        value={verticalExaggeration}
        onChange={onVerticalExaggerationChange}
        ticks={[1, 1.5, 2, 2.5, 3]}
        formatTick={(v) => `${v.toFixed(1)}×`}
        ariaLabel="Vertical exaggeration"
      />
    </div>
  )
}
