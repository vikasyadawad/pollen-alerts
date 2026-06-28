import { fetchPollenData } from '@/lib/open-meteo';
import PollenChart from './PollenChart';

export const revalidate = 3600; // Revalidate every hour

const getStatus = (value) => {
  if (value < 2) return { label: 'Low', className: 'status-low' };
  if (value < 10) return { label: 'Medium', className: 'status-medium' };
  return { label: 'High', className: 'status-high' };
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
    { name: 'alder', value: data.current.alder_pollen },
    { name: 'birch', value: data.current.birch_pollen },
    { name: 'grass', value: data.current.grass_pollen },
    { name: 'mugwort', value: data.current.mugwort_pollen },
    { name: 'olive', value: data.current.olive_pollen },
    { name: 'ragweed', value: data.current.ragweed_pollen },
  ];

  return (
    <main>
      <div className="header">
        <h1 className="title">Berlin Pollen Levels</h1>
        <p className="subtitle">Real-time alerts & forecast for 10315 Berlin</p>
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

      <PollenChart data={[data.current, ...data.forecast]} />

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
  );
}
