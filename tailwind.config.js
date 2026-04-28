/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
