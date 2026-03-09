/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'upsc-blue': {
          DEFAULT: '#1e3a8a',
          light: '#3b82f6',
          dark: '#172554'
        },
        'upsc-gray': '#f1f5f9',
      }
    },
  },
  plugins: [],
}
