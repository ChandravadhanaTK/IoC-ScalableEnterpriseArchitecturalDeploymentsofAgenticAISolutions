export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        orbitron: ['Instrument Serif', 'Georgia', 'serif'],
        rajdhani: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        gold: 'rgb(var(--gold-rgb) / <alpha-value>)',
        sand: 'rgb(var(--sand-rgb) / <alpha-value>)',
        ink: '#0E0F13',
        slate: { 200: '#DAD7D0', 300: '#C8C6C0', 400: '#A8A9B0', 500: '#8E9099', 600: '#7C7E88', 700: '#3A3B42' },
        emerald: { 200: '#C3DBC8', 300: '#9CC7A6', 400: '#7DB48B', 500: '#5E9A6E' },
      },
    },
  },
  plugins: [],
}
