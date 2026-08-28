/** Minimal GeoJSON types for Natural Earth coastline/land features. */
export type Position = [number, number]

export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: Position[][]
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon'
  coordinates: Position[][][]
}

export interface GeoJsonLineString {
  type: 'LineString'
  coordinates: Position[]
}

export interface GeoJsonMultiLineString {
  type: 'MultiLineString'
  coordinates: Position[][]
}

export type GeoJsonGeometry =
  | GeoJsonPolygon
  | GeoJsonMultiPolygon
  | GeoJsonLineString
  | GeoJsonMultiLineString

export interface GeoJsonFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: GeoJsonGeometry
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  name?: string
  features: GeoJsonFeature[]
}
