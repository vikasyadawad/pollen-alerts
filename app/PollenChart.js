"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PollenChart({ data }) {
  // Format dates for X-axis
  const chartData = data.map((day, index) => {
    const dateObj = new Date(day.date);
    return {
      ...day,
      displayDate: index === 0 ? 'Today' : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj)
    };
  });

  return (
    <div style={{ width: '100%', height: 400, marginTop: '2rem', marginBottom: '4rem', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.5rem', animation: 'fadeInUp 0.8s ease-out forwards' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Pollen Trend (Grains/m³)</h3>
      <div style={{ width: '100%', height: 'calc(100% - 3rem)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="displayDate" stroke="var(--axis-color)" tick={{fill: 'var(--axis-color)'}} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--axis-color)" tick={{fill: 'var(--axis-color)'}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '0.5rem', color: 'var(--text-color)' }}
              itemStyle={{ color: 'var(--text-color)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '1rem' }} />
            <Line type="monotone" dataKey="alder_pollen" name="Alder" stroke="#34d399" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="birch_pollen" name="Birch" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="grass_pollen" name="Grass" stroke="#f472b6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="mugwort_pollen" name="Mugwort" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="olive_pollen" name="Olive" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="ragweed_pollen" name="Ragweed" stroke="#f87171" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
