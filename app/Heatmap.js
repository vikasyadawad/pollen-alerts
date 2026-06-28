'use client';
import { ActivityCalendar } from 'react-activity-calendar';

export default function Heatmap({ symptoms }) {
  // Generate a full year of empty dates ending today
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);

  const data = [];
  for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const match = symptoms.find(s => s.date === dateStr);
    
    // Map symptom score (1, 2, 3) to level (0-4)
    // Level 0 = no data (empty)
    // Level 1 = no symptoms / great (not really logged, but if we had 0)
    // Level 2 = feeling good (1)
    // Level 3 = slightly bothersome (2)
    // Level 4 = terrible (3)
    let level = 0;
    if (match) {
      if (match.score === 1) level = 2; // Greenish/Yellowish depending on theme
      if (match.score === 2) level = 3; // Orangeish
      if (match.score === 3) level = 4; // Reddish
    }

    data.push({
      date: dateStr,
      count: match ? match.score : 0,
      level: level,
    });
  }

  // Custom colors for the heatmap blocks
  const theme = {
    light: ['#ebedf0', '#9be9a8', '#f1c40f', '#e67e22', '#e74c3c'],
    dark: ['#161b22', '#0e4429', '#f1c40f', '#e67e22', '#e74c3c'],
  };

  const labels = {
    months: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    totalCount: '{{count}} allergy logs in the last year',
    legend: {
      less: 'Good',
      more: 'Terrible',
    },
  };

  return (
    <div className="card" style={{ padding: '2rem', marginTop: '2rem', overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-color)', textAlign: 'center' }}>Yearly Symptom Heatmap</h3>
      <div style={{ maxWidth: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
        <ActivityCalendar 
          data={data} 
          theme={theme} 
          labels={labels}
          colorScheme="dark"
          blockSize={14}
          blockRadius={4}
          blockMargin={4}
          fontSize={14}
        />
      </div>
    </div>
  );
}
