/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./web-ui/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: ["light", "dark"],
  },
};
