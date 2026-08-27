import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ProfilePoint } from '../../types/ocean'

interface ProfileChartProps {
  data: ProfilePoint[]
  maxDepth?: number
}

export function ProfileChart({ data, maxDepth }: ProfileChartProps) {
  const depthMax = maxDepth ?? Math.max(...data.map((p) => p.depth), 1000)

  return (
    <div className="profile-chart">
      <h4 className="subsection-title">Temperature Profile</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart layout="vertical" data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="#17384A" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: '#7896A5', fontSize: 10 }}
            label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -2, fill: '#7896A5', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="depth"
            reversed
            domain={[0, depthMax]}
            tick={{ fill: '#7896A5', fontSize: 10 }}
            label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: '#7896A5', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: '#091B29', border: '1px solid #17384A', borderRadius: 4, fontSize: 11 }}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as ProfilePoint | undefined
              return point ? `Depth: ${point.depth} m` : ''
            }}
            formatter={(value, name) => [value != null ? `${value} °C` : '—', String(name ?? '')]}
            labelStyle={{ color: '#E8F5F8' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: '#7896A5' }} />
          <Line type="monotone" dataKey="model" name="Model" stroke="#19BCD6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="observation" name="Observation" stroke="#48D5C3" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
