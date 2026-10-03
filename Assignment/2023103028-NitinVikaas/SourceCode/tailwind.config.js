export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Space Grotesk', 'system-ui', 'sans-serif'],
        orbitron: ['Space Grotesk', 'system-ui', 'sans-serif'],
        rajdhani: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        gold: 'rgb(var(--gold-rgb) / <alpha-value>)',
        sand: 'rgb(var(--sand-rgb) / <alpha-value>)',
        ink: '#0E0F13',
        slate: { 200: '#D4E5E8', 300: '#B9CDD2', 400: '#8EA3AA', 500: '#6E858C', 600: '#506168', 700: '#24343A' },
        emerald: { 200: '#B8F4D9', 300: '#73E7B4', 400: '#35E0A1', 500: '#1EAF7B' },
      },
    },
  },
  plugins: [],
}
