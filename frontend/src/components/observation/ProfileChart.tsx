import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ProfileSeries } from '../../types/ocean'
import { DEMO_DATA_SHORT } from '../../data/validationData'
import { formatVariableTick, formatVariableValue } from '../../data/variableMeta'
import { DemoDataBanner } from '../common/DemoDataBanner'

interface ProfileChartProps {
  series: ProfileSeries
  maxDepth?: number
  selectedDepth?: number
}

interface ProfilePointRow {
  depth: number
  model: number | null
  observation: number | null
  difference: number | null
}

function buildChartData(series: ProfileSeries): ProfilePointRow[] {
  return series.points.map((p) => ({
    depth: p.depth,
    model: p.model,
    observation: p.observation,
    difference:
      p.model != null && p.observation != null ? p.model - p.observation : null,
  }))
}

function ProfileTooltip({
  active,
  payload,
  variable,
  unit,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ProfilePointRow }>
  variable: ProfileSeries['variable']
  unit: string
}) {
  if (!active || !payload?.[0]?.payload) return null
  const point = payload[0].payload
  const diffSign = point.difference != null && point.difference >= 0 ? '+' : ''

  return (
    <div className="profile-tooltip">
      <div className="profile-tooltip__depth">Depth: {point.depth} m</div>
      <div className="profile-tooltip__row">
        <span className="profile-tooltip__label profile-tooltip__label--model">Model</span>
        <span>
          {point.model != null ? formatVariableValue(point.model, variable) : '—'}
        </span>
      </div>
      <div className="profile-tooltip__row">
        <span className="profile-tooltip__label profile-tooltip__label--obs">Observation</span>
        <span>
          {point.observation != null ? formatVariableValue(point.observation, variable) : '—'}
        </span>
      </div>
      <div className="profile-tooltip__row profile-tooltip__row--diff">
        <span className="profile-tooltip__label">Difference</span>
        <span>
          {point.difference != null
            ? `${diffSign}${formatVariableValue(point.difference, variable)}`
            : '—'}
        </span>
      </div>
      <div className="profile-tooltip__unit-hint">{unit}</div>
    </div>
  )
}

export function ProfileChart({ series, maxDepth, selectedDepth }: ProfileChartProps) {
  const depthMax = maxDepth ?? Math.max(...series.points.map((p) => p.depth), 1000)
  const data = buildChartData(series)
  const profileDepths = series.points.map((p) => p.depth)
  const selectedOnLevel =
    selectedDepth != null && profileDepths.some((d) => d === selectedDepth)

  return (
    <div className="profile-chart">
      <div className="profile-chart__header">
        <h4 className="subsection-title">VERTICAL PROFILE</h4>
        <div className="profile-chart__legend">
          <span className="profile-chart__legend-item profile-chart__legend-item--model">
            Model (solid)
          </span>
          <span className="profile-chart__legend-item profile-chart__legend-item--obs">
            Observation (dashed)
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        >
          <CartesianGrid stroke="#17384A" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: '#7896A5', fontSize: 10 }}
            tickFormatter={(v) => formatVariableTick(Number(v), series.variable)}
            label={{
              value: `${series.label} (${series.unit})`,
              position: 'insideBottom',
              offset: -2,
              fill: '#7896A5',
              fontSize: 10,
            }}
          />
          <YAxis
            type="number"
            dataKey="depth"
            reversed
            domain={[0, depthMax]}
            ticks={[0, 50, 100, 200, 500, 1000].filter((d) => d <= depthMax)}
            tick={{ fill: '#7896A5', fontSize: 10 }}
            label={{
              value: 'Depth (m) ↓',
              angle: -90,
              position: 'insideLeft',
              fill: '#7896A5',
              fontSize: 10,
            }}
          />
          {selectedDepth != null && selectedDepth <= depthMax ? (
            <ReferenceLine
              y={selectedDepth}
              stroke="#48d5c3"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              label={{
                value: `Selected ${selectedDepth} m`,
                position: 'insideTopRight',
                fill: '#48d5c3',
                fontSize: 10,
              }}
            />
          ) : null}
          <Tooltip
            content={({ active, payload }) => (
              <ProfileTooltip
                active={active}
                payload={payload}
                variable={series.variable}
                unit={series.unit}
              />
            )}
            cursor={{ stroke: '#19bcd6', strokeOpacity: 0.35 }}
          />
          <Line
            type="monotone"
            dataKey="model"
            name="Model"
            stroke="#19BCD6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#19BCD6', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="observation"
            name="Observation"
            stroke="#48D5C3"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: '#48D5C3', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {selectedDepth != null && !selectedOnLevel ? (
        <p className="control-hint profile-chart__hint profile-chart__hint--interp">
          Selected depth {selectedDepth} m falls between profile levels — validation uses
          linear interpolation.
        </p>
      ) : null}
      <DemoDataBanner compact className="profile-chart__demo-note" />
      <p className="control-hint profile-chart__hint">{DEMO_DATA_SHORT}</p>
    </div>
  )
}
