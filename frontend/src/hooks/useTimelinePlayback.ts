import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_INTERVAL_MS = 1200
const MIN_STEP_DELAY_MS = 400

interface UseTimelinePlaybackOptions {
  dateIndex: number
  dateCount: number
  isTimestepLoading: boolean
  hasTimestepError: boolean
  onAdvance: () => void
  intervalMs?: number
}

/**
 * Playback advances one timestep after data finishes loading (plus a short delay).
 * Pauses automatically at the final date or when a timestep error occurs.
 */
export function useTimelinePlayback({
  dateIndex,
  dateCount,
  isTimestepLoading,
  hasTimestepError,
  onAdvance,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseTimelinePlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const readyAtRef = useRef<number>(0)

  useEffect(() => {
    if (!isTimestepLoading) {
      readyAtRef.current = Date.now()
    }
  }, [isTimestepLoading])

  useEffect(() => {
    if (hasTimestepError && isPlaying) {
      setIsPlaying(false)
    }
  }, [hasTimestepError, isPlaying])

  useEffect(() => {
    if (!isPlaying) return
    if (dateIndex >= dateCount - 1) {
      setIsPlaying(false)
      return
    }
    if (isTimestepLoading || hasTimestepError) return

    const elapsed = Date.now() - readyAtRef.current
    const delay = Math.max(MIN_STEP_DELAY_MS, intervalMs - elapsed)

    const timer = window.setTimeout(() => {
      if (dateIndex >= dateCount - 1) {
        setIsPlaying(false)
        return
      }
      onAdvance()
    }, delay)

    return () => window.clearTimeout(timer)
  }, [
    isPlaying,
    isTimestepLoading,
    hasTimestepError,
    dateIndex,
    dateCount,
    onAdvance,
    intervalMs,
  ])

  const pause = useCallback(() => setIsPlaying(false), [])

  const togglePlay = useCallback(() => {
    if (dateIndex >= dateCount - 1) return
    setIsPlaying((playing) => !playing)
  }, [dateIndex, dateCount])

  return { isPlaying, pause, togglePlay, setIsPlaying }
}
