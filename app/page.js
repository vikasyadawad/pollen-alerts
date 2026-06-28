import { fetchPollenData } from '@/lib/open-meteo';
import { getSymptoms } from '@/lib/db';
import PollenChart from './PollenChart';
import PollenParticles from './PollenParticles';
import SymptomWidget from './SymptomWidget';
import Heatmap from './Heatmap';

export const revalidate = 3600; // Revalidate every hour

const getStatus = (value) => {
  if (value < 2) return { label: 'Low', className: 'status-low' };
  if (value < 10) return { label: 'Medium', className: 'status-medium' };
  return { label: 'High', className: 'status-high' };
};

const getAqiStatus = (aqi) => {
  if (aqi <= 50) return { label: 'Good', color: '#10b981' };
  if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b' };
  if (aqi <= 150) return { label: 'Unhealthy (Sens.)', color: '#f97316' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8b5cf6' };
  return { label: 'Hazardous', color: '#9f1239' };
};

const getWindStatus = (speed) => {
  if (speed <= 11) return { label: 'Light', color: '#10b981' };
  if (speed <= 28) return { label: 'Moderate', color: '#f59e0b' };
  if (speed <= 38) return { label: 'Fresh', color: '#f97316' };
  return { label: 'Strong', color: '#ef4444' };
};

export default async function Home() {
  const data = await fetchPollenData();

  if (!data || !data.current) {
    return (
      <main>
        <div className="header">
          <h1 className="title">Pollen Alerts</h1>
          <p className="subtitle">Failed to load pollen data.</p>
        </div>
      </main>
    );
  }

  const pollenTypes = [
    { name: 'Alder', value: data.current.alder_pollen },
    { name: 'Birch', value: data.current.birch_pollen },
    { name: 'Grass', value: data.current.grass_pollen },
    { name: 'Mugwort', value: data.current.mugwort_pollen },
    { name: 'Olive', value: data.current.olive_pollen },
    { name: 'Ragweed', value: data.current.ragweed_pollen },
  ].sort((a, b) => (b.value || 0) - (a.value || 0));

  const maxCurrentLevel = Math.max(...pollenTypes.map(p => p.value));

  const allSymptoms = getSymptoms();
  const alreadyLogged = allSymptoms.some(s => s.date === data.current.date);

  return (
    <>
      <PollenParticles severity={maxCurrentLevel} />
      <main>
        <div className="header">
          <h1 className="title">Berlin Pollen Levels</h1>
          <p className="subtitle">Real-time alerts & forecast for 10315 Berlin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {(() => {
            const aqiStatus = getAqiStatus(data.current.aqi);
            const windStatus = getWindStatus(data.current.wind_speed);
            return (
              <>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--axis-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Air Quality (AQI)</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0', lineHeight: 1 }}>{data.current.aqi}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: aqiStatus.color }}></div>
                    {aqiStatus.label}
                  </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--axis-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wind Speed</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0', lineHeight: 1 }}>
                    {data.current.wind_speed}<span style={{fontSize: '1.25rem', fontWeight: 500, color: 'var(--axis-color)', marginLeft: '0.25rem'}}>km/h</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: windStatus.color }}></div>
                    {windStatus.label}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

      <h2 className="section-title">Today's Peak Levels</h2>
      <div className="pollen-grid">
        {pollenTypes.map((type) => {
          const status = getStatus(type.value);
          return (
            <div className="pollen-card" key={type.name}>
              <div className="card-header">
                <h3 className="card-title">{type.name}</h3>
                <span className={`status-badge ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="pollen-value">{type.value ?? 0}</div>
              <div className="pollen-unit">grains/m³</div>
            </div>
          );
        })}
      </div>

      <SymptomWidget todayDate={data.current.date} alreadyLogged={alreadyLogged} />

      <PollenChart data={[data.current, ...data.forecast]} symptoms={allSymptoms} />

      <Heatmap symptoms={allSymptoms} />

      <h2 className="section-title">3-Day Forecast</h2>
      <div className="forecast-grid">
        {data.forecast.map((day, index) => {
          // Find the worst pollen levels for the day
          const allLevels = [
            { name: 'Alder', value: day.alder_pollen },
            { name: 'Birch', value: day.birch_pollen },
            { name: 'Grass', value: day.grass_pollen },
            { name: 'Mugwort', value: day.mugwort_pollen },
            { name: 'Olive', value: day.olive_pollen },
            { name: 'Ragweed', value: day.ragweed_pollen }
          ];
          
          allLevels.sort((a, b) => b.value - a.value);
          const topPollens = allLevels.slice(0, 2).filter(p => p.value > 0);
          
          const maxLevel = allLevels[0].value;
          const status = getStatus(maxLevel);

          // Get human readable date (e.g. "Tomorrow" or "Monday")
          const dateObj = new Date(day.date);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);
          const displayDate = index === 0 ? 'Tomorrow' : dayName;

          return (
            <div className="forecast-card" key={day.date}>
              <div className="forecast-date">
                <span className="forecast-day-name">{displayDate}</span>
                <span className="forecast-day-date">{day.date}</span>
              </div>
              
              <div className="forecast-details">
                {topPollens.length > 0 ? (
                  topPollens.map(p => (
                    <div key={p.name} className="forecast-detail-row">
                      <span>{p.name}</span>
                      <span className="font-mono">{p.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="forecast-detail-row">
                    <span>All Clear</span>
                    <span className="font-mono">0</span>
                  </div>
                )}
              </div>

              <div className="forecast-status">
                <span className="forecast-label">Peak Intensity:</span>
                <span className={`status-badge ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
    </>
  );
}
