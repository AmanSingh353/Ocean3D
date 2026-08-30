/** Top-level application workspace mode. */
export type AppMode = 'oceanAnalysis' | 'disasterManagement'

export const APP_MODE_LABELS: Record<AppMode, string> = {
  oceanAnalysis: 'Ocean Analysis',
  disasterManagement: 'Disaster Management',
}
