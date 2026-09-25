/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          background: "#EDEDED",
          surface: "#F8F9FA",
          "surface-light": "#FFFFFF",

          text: "#111111",
          muted: "#6B6B6B",

          border: "#E2E2E2",
          "border-dark": "#111111",

          accent: "#111111",
        },
      },

      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.05)",
        card: "0 2px 12px rgba(0, 0, 0, 0.04)",
      },
    },
  },

  plugins: [],
};