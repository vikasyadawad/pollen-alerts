import { NextResponse } from 'next/server';
import { fetchPollenData } from '@/lib/open-meteo';

const TIPS = [
  "Keep windows closed during peak pollen hours (usually mid-morning and early evening).",
  "Consider taking your antihistamines before you head outside.",
  "Wear sunglasses outdoors to protect your eyes from pollen.",
  "Shower before bed to wash pollen out of your hair.",
  "Dry your laundry inside today, not on the line.",
];

const getStatus = (value) => {
  if (value < 2) return { label: 'Low', emoji: '🟢' };
  if (value < 10) return { label: 'Medium', emoji: '🟡' };
  return { label: 'High', emoji: '🔴' };
};

export async function GET(request) {
  // Authorization check could be added here for Vercel Cron
  // e.g., if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

  const data = await fetchPollenData();

  if (!data || !data.current || !data.forecast) {
    return NextResponse.json({ error: 'Failed to retrieve pollen data' }, { status: 500 });
  }

  const currentLevels = [
    { name: 'Alder', value: data.current.alder_pollen },
    { name: 'Birch', value: data.current.birch_pollen },
    { name: 'Grass', value: data.current.grass_pollen },
    { name: 'Mugwort', value: data.current.mugwort_pollen },
    { name: 'Olive', value: data.current.olive_pollen },
    { name: 'Ragweed', value: data.current.ragweed_pollen },
  ];

  // 4. "Smart" Alerting (Less Spam)
  // Check if any level is Medium or High
  const maxCurrentLevel = Math.max(...currentLevels.map(p => p.value));
  if (maxCurrentLevel < 2) {
    // Everything is low, don't send an alert to avoid spam.
    console.log('Pollen levels are low. Skipping Telegram alert to avoid spam.');
    return NextResponse.json({ success: true, message: 'Skipped alert due to low pollen levels.' });
  }

  let message = '🌿 *Daily Pollen Update (Berlin 10315)* 🌿\n\n';

  // Sort to show highest first
  currentLevels.sort((a, b) => b.value - a.value);

  // 2. Add Visual Status Indicators
  message += '*Today\'s Peak Levels:*\n';
  currentLevels.forEach(p => {
    const status = getStatus(p.value);
    message += `${status.emoji} ${p.name}: ${p.value} (${status.label})\n`;
  });

  // 1. Include a "Tomorrow" Forecast
  const tomorrow = data.forecast[0];
  const tomorrowLevels = [
    { name: 'Alder', value: tomorrow.alder_pollen },
    { name: 'Birch', value: tomorrow.birch_pollen },
    { name: 'Grass', value: tomorrow.grass_pollen },
    { name: 'Mugwort', value: tomorrow.mugwort_pollen },
    { name: 'Olive', value: tomorrow.olive_pollen },
    { name: 'Ragweed', value: tomorrow.ragweed_pollen },
  ];
  tomorrowLevels.sort((a, b) => b.value - a.value);
  const tomorrowWorst = tomorrowLevels[0];
  const tomorrowStatus = getStatus(tomorrowWorst.value);
  
  message += '\n🔮 *Tomorrow\'s Forecast:*\n';
  message += `The highest offender will be ${tomorrowWorst.name} at ${tomorrowWorst.value} grains/m³ ${tomorrowStatus.emoji}\n`;

  // 5. Actionable Tips
  if (maxCurrentLevel >= 10) {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    message += `\n💡 *Tip of the Day:*\n_${randomTip}_\n`;
  }

  // 3. Link to Your Dashboard
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  message += `\n📊 [View Full Charts & Forecast](${appUrl})`;

  // Send to Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing Telegram credentials in environment.');
    return NextResponse.json({ error: 'Missing Telegram configuration' }, { status: 500 });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Telegram API error: ${res.status} ${res.statusText}`);
    }

    return NextResponse.json({ success: true, message: 'Alert sent successfully' });
  } catch (error) {
    console.error('Error sending Telegram alert:', error);
    return NextResponse.json({ error: 'Failed to send Telegram alert' }, { status: 500 });
  }
}
