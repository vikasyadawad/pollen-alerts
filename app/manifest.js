export default function manifest() {
  return {
    name: 'Pollen Alerts',
    short_name: 'Pollen',
    description: 'Berlin Pollen Dashboard and Alerts',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
