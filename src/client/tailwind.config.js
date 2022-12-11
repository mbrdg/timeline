/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      display: ["Nunito", "sans-serif"],
    },
    extend: {
      colors: {
        superdark: "#18191a",
        dark: "#242526",
        lightdark: "#3a3b3c",
        light: "#e4e6eb",
        accent: "#b0b3b8",
      },
    },
  },
  plugins: [],
};
