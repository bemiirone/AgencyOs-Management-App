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
    themes: [
      "light",
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "base-100": "#2a323c",
          "base-200": "#222830",
        },
      },
    ],
  },
};
