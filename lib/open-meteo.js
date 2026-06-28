export async function fetchPollenData() {
  // Berlin coordinates
  const lat = 52.505;
  const lon = 13.515;

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=Europe%2FBerlin&forecast_days=4`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch pollen data');
    }
    const data = await response.json();
    
    const dailyData = [];
    const hourly = data.hourly;
    
    // Aggregate 96 hours into 4 daily maximums
    for (let day = 0; day < 4; day++) {
      const startIdx = day * 24;
      const endIdx = startIdx + 24;
      
      const getDailyMax = (array) => {
        if (!array) return 0;
        const slice = array.slice(startIdx, endIdx).filter(v => v !== null);
        return slice.length > 0 ? Math.max(...slice) : 0;
      };

      dailyData.push({
        date: hourly.time[startIdx].split('T')[0],
        alder_pollen: getDailyMax(hourly.alder_pollen),
        birch_pollen: getDailyMax(hourly.birch_pollen),
        grass_pollen: getDailyMax(hourly.grass_pollen),
        mugwort_pollen: getDailyMax(hourly.mugwort_pollen),
        olive_pollen: getDailyMax(hourly.olive_pollen),
        ragweed_pollen: getDailyMax(hourly.ragweed_pollen),
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
