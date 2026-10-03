/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0a0e1a",
          800: "#0f1629",
          700: "#141d36",
          600: "#1a2545",
          500: "#1e2d52",
        },
        electric: {
          500: "#3b82f6",
          400: "#60a5fa",
          300: "#93c5fd",
        },
        accent: {
          purple: "#8b5cf6",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-navy": "linear-gradient(135deg, #0a0e1a 0%, #141d36 50%, #0a0e1a 100%)",
      },
    },
  },
  plugins: [],
};
