/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090a0f',
          surface: '#12141c',
          card: '#181b26',
          border: '#262a3a',
          muted: '#8e96ad',
        },
        brand: {
          primary: '#00f2fe',
          secondary: '#4facfe',
          purple: '#9D00FF',
          purpleGlow: 'rgba(157, 0, 255, 0.4)',
          accent: '#ff0055',
          orange: '#ff6b00',
          emerald: '#10b981',
          gold: '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 242, 254, 0.2)',
        'glow-purple': '0 0 25px rgba(157, 0, 255, 0.35)',
        'glow-accent': '0 0 25px rgba(255, 0, 85, 0.25)',
      }
    },
  },
  plugins: [],
}
