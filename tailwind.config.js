/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mlb-blue': '#002D72',
        'mlb-red': '#D50A0A',
      }
    },
  },
  plugins: [],
}