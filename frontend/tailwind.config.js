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
        rose: colors.rose,
        amber: colors.amber,
        blue: colors.blue,
        gray: colors.gray,
        zinc: colors.zinc,
        neutral: colors.neutral,
        white: colors.white,
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        glassDark: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
