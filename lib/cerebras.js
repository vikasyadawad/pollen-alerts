const CEREBRAS_BASE = 'https://api.cerebras.ai/v1';
const MODEL = 'gpt-oss-120b';

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

/**
 * Calls Cerebras gpt-oss-120b to generate a rich, structured pollen alert message.
 * Returns the raw message body (no dashboard link — caller appends it).
 */
export async function generatePollenAlertMessage(pollenData, recentSymptoms = []) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing CEREBRAS_API_KEY');
  }

  const system = `You are an expert allergist providing daily pollen alerts for residents in Berlin 10315.

Return ONLY a ready-to-send Telegram message using Telegram Markdown (parse_mode=Markdown).
Rules:
- Keep total length under ~1000 characters (the caller will append the dashboard link).
- Friendly, concise, actionable tone.
- Use emojis sparingly but effectively.
- Structure with bold headers.
- Include: today's peak levels summary (with status), key/worst offenders, tomorrow outlook, 1-2 personalized tips or insights based on the numbers and any symptom history provided.
- Never invent data. Use the exact numbers provided.
- Do NOT include any dashboard link or URL — the caller appends it.`;

  const context = {
    location: 'Berlin',
    today: pollenData.current,
    forecast: pollenData.forecast,
    recentSymptoms: recentSymptoms.slice(0, 14), // last ~2 weeks
  };

  const userMsg = `Here is the latest pollen and environmental data:\n\n${JSON.stringify(context, null, 2)}\n\nGenerate the daily alert message now.`;

  const res = await fetch(`${CEREBRAS_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.35,
      max_completion_tokens: 650,
      reasoning_effort: 'high',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Cerebras error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  let text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('No content returned from Cerebras');
  }

  // Strip accidental code fences
  text = text.replace(/^```(markdown)?\s*/i, '').replace(/```$/, '').trim();
  return text;
}

/**
 * Exact fallback that reproduces the original static message format.
 * Includes the dashboard link (unlike the AI path).
 */
export function buildFallbackMessage(data) {
  const currentLevels = [
    { name: 'Alder', value: data.current.alder_pollen },
    { name: 'Birch', value: data.current.birch_pollen },
    { name: 'Grass', value: data.current.grass_pollen },
    { name: 'Mugwort', value: data.current.mugwort_pollen },
    { name: 'Olive', value: data.current.olive_pollen },
    { name: 'Ragweed', value: data.current.ragweed_pollen },
  ];

  const maxCurrentLevel = Math.max(...currentLevels.map((p) => p.value));

  let message = '🌿 *Daily Pollen Update (Berlin 10315)* 🌿\n\n';

  // Sort to show highest first
  currentLevels.sort((a, b) => b.value - a.value);

  message += "*Today's Peak Levels:*\n";
  currentLevels.forEach((p) => {
    const status = getStatus(p.value);
    message += `${status.emoji} ${p.name}: ${p.value} (${status.label})\n`;
  });

  // Tomorrow forecast
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

  if (maxCurrentLevel >= 10) {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    message += `\n💡 *Tip of the Day:*\n_${randomTip}_\n`;
  }

  const appUrl = 'https://pollen.humboldt-peacock.ts.net';
  message += `\n📊 [View Full Charts & Forecast](${appUrl})`;

  return message;
}

// Also export helpers in case they are useful elsewhere
export { TIPS, getStatus };
