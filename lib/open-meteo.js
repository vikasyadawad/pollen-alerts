export async function fetchPollenData() {
  // Berlin coordinates
  const lat = 52.505;
  const lon = 13.515;

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen,european_aqi,pm10,pm2_5&timezone=Europe%2FBerlin&forecast_days=4`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m&timezone=Europe%2FBerlin&forecast_days=4`;

  try {
    const [aqiRes, weatherRes] = await Promise.all([
      fetch(url),
      fetch(weatherUrl)
    ]);
    
    if (!aqiRes.ok || !weatherRes.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await aqiRes.json();
    const weatherData = await weatherRes.json();
    
    const dailyData = [];
    const hourly = data.hourly;
    const hourlyWeather = weatherData.hourly;
    
    // Aggregate 96 hours into 4 daily maximums
    for (let day = 0; day < 4; day++) {
      const startIdx = day * 24;
      const endIdx = startIdx + 24;
      
      const getDailyMax = (array) => {
        if (!array) return 0;
        const slice = array.slice(startIdx, endIdx).filter(v => v !== null);
        return slice.length > 0 ? Math.max(...slice) : 0;
      };
      
      const getDailyAvg = (array) => {
        if (!array) return 0;
        const slice = array.slice(startIdx, endIdx).filter(v => v !== null);
        return slice.length > 0 ? Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) : 0;
      };

      dailyData.push({
        date: hourly.time[startIdx].split('T')[0],
        alder_pollen: getDailyMax(hourly.alder_pollen),
        birch_pollen: getDailyMax(hourly.birch_pollen),
        grass_pollen: getDailyMax(hourly.grass_pollen),
        mugwort_pollen: getDailyMax(hourly.mugwort_pollen),
        olive_pollen: getDailyMax(hourly.olive_pollen),
        ragweed_pollen: getDailyMax(hourly.ragweed_pollen),
        aqi: getDailyMax(hourly.european_aqi),
        pm25: getDailyAvg(hourly.pm2_5),
        wind_speed: getDailyMax(hourlyWeather.wind_speed_10m),
      });
    }

    return {
      current: dailyData[0],
      forecast: dailyData.slice(1)
    };
  } catch (error) {
    console.error('Error fetching pollen data:', error);
    return null;
  }
}
