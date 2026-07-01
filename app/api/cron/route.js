import { NextResponse } from 'next/server';
import { fetchPollenData } from '@/lib/open-meteo';
import { getSymptoms } from '@/lib/db';
import { generatePollenAlertMessage, buildFallbackMessage } from '@/lib/cerebras';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('pollen-alerts');
const pollenGauge = meter.createGauge('pollen_level_grains', {
  description: 'Current pollen level in grains/m³',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sendAlert = searchParams.get('sendAlert') === 'true';

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

  // Report metrics to Grafana via OpenTelemetry
  currentLevels.forEach(p => {
    pollenGauge.record(p.value, { pollen_type: p.name.toLowerCase() });
  });

  // 4. Check if we should send a Telegram Alert
  if (!sendAlert) {
    console.log('Metrics recorded. Skipping Telegram alert (sendAlert is not true).');
    return NextResponse.json({ success: true, message: 'Metrics updated. Alert skipped.' });
  }

  // 5. "Smart" Alerting (Less Spam)
  // Check if any level is Medium or High
  const maxCurrentLevel = Math.max(...currentLevels.map(p => p.value));
  if (maxCurrentLevel < 2) {
    // Everything is low, don't send an alert to avoid spam.
    console.log('Pollen levels are low. Skipping Telegram alert to avoid spam.');
    return NextResponse.json({ success: true, message: 'Skipped alert due to low pollen levels.' });
  }

  // Generate message via AI (Cerebras gpt-oss-120b) with rich recommendations.
  // Falls back to the original static format on any error.
  let message;
  try {
    const recentSymptoms = getSymptoms();
    const aiText = await generatePollenAlertMessage(data, recentSymptoms);
    const appUrl = 'https://pollen.humboldt-peacock.ts.net';
    message = aiText.trim() + `\n\n📊 [View Full Charts & Forecast](${appUrl})`;
  } catch (err) {
    console.error('AI message generation failed, using fallback:', err.message);
    message = buildFallbackMessage(data);
  }

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
