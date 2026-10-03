/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2fbf5',
          100: '#e1f7e9',
          200: '#c3eed3',
          300: '#95dfb3',
          400: '#5fc78c',
          500: '#38aa6b',
          600: '#298953',
          700: '#236d44',
          800: '#1f5738',
          900: '#1b4730',
          950: '#0a2719',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e2e7e2',
          200: '#c6cfc6',
          300: '#a3b2a3',
          400: '#7f9380',
          500: '#647765',
          600: '#4e5e4f',
          700: '#3f4c40',
          800: '#343e35',
          900: '#2c342d',
        },
        earth: {
          50: '#faf7f2',
          100: '#f3ede1',
          200: '#e6dac4',
          300: '#d5c2a1',
          400: '#c2a57c',
          500: '#b18c5e',
          600: '#9d744e',
          700: '#7f5a3e',
          800: '#684a37',
          900: '#563e30',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(16, 75, 43, 0.08)',
        'soft-lg': '0 10px 30px -4px rgba(16, 75, 43, 0.12)',
        'glow': '0 0 25px rgba(56, 170, 107, 0.25)',
      }
    },
  },
  plugins: [],
}
