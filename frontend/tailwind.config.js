/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: colors.slate,
        emerald: colors.emerald,
        teal: colors.teal,
        cyan: colors.cyan,
        indigo: colors.indigo,
        violet: colors.violet,
        purple: colors.purple,
        rose: colors.rose,
        amber: colors.amber,
        blue: colors.blue,
        gray: colors.gray,
        zinc: colors.zinc,
        neutral: colors.neutral,
        white: colors.white,
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        glassHover: '0 12px 40px 0 rgba(0, 0, 0, 0.12)',
        glassDark: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        glassDarkHover: '0 14px 45px 0 rgba(0, 0, 0, 0.6)',
        glowEmerald: '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        glowTeal: '0 0 25px -5px rgba(20, 184, 166, 0.35)',
        glowRose: '0 0 25px -5px rgba(244, 63, 94, 0.35)',
        glowIndigo: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
      }
    },
  },
  plugins: [],
}
