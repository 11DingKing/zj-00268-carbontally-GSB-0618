/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7ec",
          100: "#dcecd2",
          200: "#bdd9aa",
          300: "#97c07c",
          400: "#74a657",
          500: "#588a3c",
          600: "#456d2e",
          700: "#385627",
          800: "#2e4522",
          900: "#263a1e",
          950: "#11200b",
        },
        wood: {
          50: "#fbf7f1",
          100: "#f4ead8",
          200: "#e8d2ae",
          300: "#d9b37c",
          400: "#cb9556",
          500: "#bf7e41",
          600: "#b06837",
          700: "#92502f",
          800: "#76422d",
          900: "#613827",
          950: "#341b12",
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(34, 70, 34, 0.08)",
        card: "0 4px 20px -4px rgba(34, 70, 34, 0.12)",
      },
    },
  },
  plugins: [],
};
