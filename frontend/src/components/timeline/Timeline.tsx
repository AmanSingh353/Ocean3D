import { Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { formatDisplayDate, formatShortDate } from '../../utils/dateFormat'
import { Slider } from '../common/Slider'

import type { TimelineHazardSummary } from '../../types/hazard'
import { RiskBadge } from '../disaster/RiskLegend'

export const PLAYBACK_SPEED_OPTIONS = [
  { label: '0.5×', multiplier: 2 },
  { label: '1×', multiplier: 1 },
  { label: '2×', multiplier: 0.5 },
  { label: '5×', multiplier: 0.2 },
] as const

interface TimelineProps {
  dates: string[]
  currentDate: string
  dateIndex: number
  isPlaying: boolean
  isLoading?: boolean
  timestepError?: string | null
  playbackSpeedIndex?: number
  onPlaybackSpeedChange?: (index: number) => void
  onDateIndexChange: (index: number) => void
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  /** Optional label override (e.g. "Event Timeline" in disaster mode). */
  timelineLabel?: string
  /** Hazard evolution summary for current timestep (disaster mode). */
  hazardSummary?: TimelineHazardSummary | null
}

export function Timeline({
  dates,
  currentDate,
  dateIndex,
  isPlaying,
  isLoading = false,
  timestepError = null,
  playbackSpeedIndex = 1,
  onPlaybackSpeedChange,
  onDateIndexChange,
  onTogglePlay,
  onPrevious,
  onNext,
  timelineLabel,
  hazardSummary = null,
}: TimelineProps) {
  const maxIndex = Math.max(0, dates.length - 1)
  const atEnd = dateIndex >= maxIndex
  const speedLabel = PLAYBACK_SPEED_OPTIONS[playbackSpeedIndex]?.label ?? '1×'

  return (
    <div className={`timeline ${isPlaying ? 'timeline--playing' : ''}`}>
      {timelineLabel ? (
        <span className="timeline__mode-label">{timelineLabel}</span>
      ) : null}
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
        {onPlaybackSpeedChange ? (
          <select
            className="timeline__speed-select"
            value={playbackSpeedIndex}
            onChange={(e) => onPlaybackSpeedChange(Number(e.target.value))}
            aria-label="Playback speed"
          >
            {PLAYBACK_SPEED_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="timeline__speed-label">{speedLabel}</span>
        )}
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
        {hazardSummary ? (
          <span className="timeline__hazard-summary">
            <RiskBadge level={hazardSummary.eventStatus} />
            {hazardSummary.peakValue != null ? (
              <span className="timeline__hazard-detail">
                peak {hazardSummary.peakValue}
              </span>
            ) : null}
            {hazardSummary.anomaly != null ? (
              <span className="timeline__hazard-detail">
                Δ{hazardSummary.anomaly >= 0 ? '+' : ''}
                {hazardSummary.anomaly}
              </span>
            ) : null}
            <span className="timeline__hazard-detail">{hazardSummary.affectedCells} cells</span>
            <span className="timeline__hazard-detail">
              {hazardSummary.confidence === 'NOT_ASSESSED'
                ? 'conf. n/a'
                : hazardSummary.confidence}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  )
}
