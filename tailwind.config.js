/** @type {import('tailwindcss').Config} */
module.exports = {
  experimental: {
    optimizeUniversalDefaults: true
  },
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./**/*.html"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
