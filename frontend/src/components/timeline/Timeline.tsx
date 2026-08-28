import { Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { formatDisplayDate, formatShortDate } from '../../utils/dateFormat'
import { Slider } from '../common/Slider'

interface TimelineProps {
  dates: string[]
  currentDate: string
  dateIndex: number
  isPlaying: boolean
  isLoading?: boolean
  timestepError?: string | null
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
  isLoading = false,
  timestepError = null,
  onDateIndexChange,
  onTogglePlay,
  onPrevious,
  onNext,
}: TimelineProps) {
  const maxIndex = Math.max(0, dates.length - 1)
  const atEnd = dateIndex >= maxIndex

  return (
    <div className={`timeline ${isPlaying ? 'timeline--playing' : ''}`}>
      <div className="timeline__controls">
        <button
          type="button"
          className={`icon-btn timeline__btn ${isPlaying ? 'timeline__btn--active' : ''}`}
          onClick={onTogglePlay}
          disabled={dates.length === 0 || (atEnd && !isPlaying)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          className="icon-btn timeline__btn"
          onClick={onPrevious}
          disabled={dateIndex === 0 || dates.length === 0}
          aria-label="Previous timestep"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          className="icon-btn timeline__btn"
          onClick={onNext}
          disabled={dateIndex >= maxIndex || dates.length === 0}
          aria-label="Next timestep"
        >
          <SkipForward size={16} />
        </button>
      </div>
      <div className="timeline__slider-wrap">
        <Slider
          min={0}
          max={maxIndex}
          step={1}
          value={Math.min(dateIndex, maxIndex)}
          onChange={onDateIndexChange}
          ticks={dates.map((_, i) => i)}
          formatTick={(i) => formatShortDate(dates[i] ?? '')}
          ariaLabel="Timeline"
        />
      </div>
      <div className="timeline__current">
        {isLoading ? (
          <span className="timeline__loading">
            <Loader2 size={12} className="timeline__spinner" aria-hidden />
            Loading...
          </span>
        ) : null}
        <span className="timeline__date">{formatDisplayDate(currentDate)}</span>
        {timestepError && !isLoading ? (
          <span className="timeline__error" title={timestepError}>
            Unavailable
          </span>
        ) : null}
      </div>
    </div>
  )
}
