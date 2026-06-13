/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce7ff',
          500: '#4f6ef7',
          600: '#3b58e8',
          700: '#2d46cc',
          900: '#1a2880',
        },
      },
    },
  },
  plugins: [],
}
