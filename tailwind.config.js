/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fenua-purple': '#9333ea', // Le violet de votre site
        'fenua-orange': '#f97316', // L'orange de votre site
      },
    },
  },
  plugins: [],
}
