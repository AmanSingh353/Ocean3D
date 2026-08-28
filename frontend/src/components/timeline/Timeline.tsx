import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { formatDisplayDate, formatShortDate } from '../../utils/dateFormat'
import { Slider } from '../common/Slider'

interface TimelineProps {
  dates: string[]
  currentDate: string
  dateIndex: number
  isPlaying: boolean
  onDateIndexChange: (index: number) => void
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
}

export function Timeline({
  dates,
  currentDate,
  dateIndex,
  isPlaying,
  onDateIndexChange,
  onTogglePlay,
  onPrevious,
  onNext,
}: TimelineProps) {
  const maxIndex = dates.length - 1

  return (
    <div className="timeline">
      <div className="timeline__controls">
        <button type="button" className="icon-btn timeline__btn" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" className="icon-btn timeline__btn" onClick={onPrevious} disabled={dateIndex === 0} aria-label="Previous timestep">
          <SkipBack size={16} />
        </button>
        <button type="button" className="icon-btn timeline__btn" onClick={onNext} disabled={dateIndex === maxIndex} aria-label="Next timestep">
          <SkipForward size={16} />
        </button>
      </div>
      <div className="timeline__slider-wrap">
        <Slider
          min={0}
          max={maxIndex}
          step={1}
          value={dateIndex}
          onChange={onDateIndexChange}
          ticks={dates.map((_, i) => i)}
          formatTick={(i) => formatShortDate(dates[i])}
          ariaLabel="Timeline"
        />
      </div>
      <div className="timeline__current">{formatDisplayDate(currentDate)}</div>
    </div>
  )
}
