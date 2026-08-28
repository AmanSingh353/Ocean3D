import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ProfileSeries } from '../../types/ocean'
import { formatChlorophyllTick } from '../../utils/chlorophyllColor'
import { formatSalinityTick } from '../../utils/salinityColor'
import { formatTemperatureTick } from '../../utils/temperatureColor'

interface ProfileChartProps {
  series: ProfileSeries
  maxDepth?: number
}

function formatValue(value: number, unit: string): string {
  if (unit === '°C') return `${formatTemperatureTick(value)} °C`
  if (unit === 'PSU') return `${formatSalinityTick(value)} PSU`
  return `${formatChlorophyllTick(value)} mg/m³`
}

function formatTick(value: number, unit: string): string {
  if (unit === 'mg/m³') return formatChlorophyllTick(value)
  if (unit === 'PSU') return formatSalinityTick(value)
  return formatTemperatureTick(value)
}

export function ProfileChart({ series, maxDepth }: ProfileChartProps) {
  const depthMax = maxDepth ?? Math.max(...series.points.map((p) => p.depth), 1000)

  return (
    <div className="profile-chart">
      <h4 className="subsection-title">{series.label} Profile</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          layout="vertical"
          data={series.points}
          margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
        >
          <CartesianGrid stroke="#17384A" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: '#7896A5', fontSize: 10 }}
            tickFormatter={(v) => formatTick(Number(v), series.unit)}
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
            tick={{ fill: '#7896A5', fontSize: 10 }}
            label={{
              value: 'Depth (m)',
              angle: -90,
              position: 'insideLeft',
              fill: '#7896A5',
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: '#091B29',
              border: '1px solid #17384A',
              borderRadius: 4,
              fontSize: 11,
            }}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as { depth?: number } | undefined
              return point?.depth != null ? `Depth: ${point.depth} m` : ''
            }}
            formatter={(value, name) => [
              value != null ? formatValue(Number(value), series.unit) : '—',
              String(name ?? ''),
            ]}
            labelStyle={{ color: '#E8F5F8' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: '#7896A5' }} />
          <Line
            type="monotone"
            dataKey="model"
            name="Model"
            stroke="#19BCD6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="observation"
            name="Observation"
            stroke="#48D5C3"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
