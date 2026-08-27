/** Map geographic coordinates to overlay marker position within the ocean viewer. */
export function latLonToScenePercent(
  lat: number,
  lon: number,
): { x: number; y: number } {
  const x = ((lon - 65) / 20) * 100
  const y = ((20 - lat) / 15) * 100
  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(12, Math.min(88, y)),
  }
}
