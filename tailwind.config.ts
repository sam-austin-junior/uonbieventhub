import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb",
          100: "#d6e4f4",
          200: "#aac8e8",
          300: "#7dabdc",
          400: "#5190d1",
          500: "#2f74bf",
          600: "#1e5a9a",
          700: "#174776",
          800: "#103354",
          900: "#0a2138",
          DEFAULT: "#174776",
        },
        accent: {
          DEFAULT: "#f5b301",
          dark: "#c98e00",
        },
        ink: {
          50: "#f7f9fc",
          100: "#eef2f7",
          200: "#d8dfe9",
          300: "#b1bccd",
          400: "#7a8aa3",
          500: "#4f607c",
          600: "#374863",
          700: "#243450",
          800: "#15223a",
          900: "#0b1426",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        pop: "0 10px 30px -10px rgb(15 23 42 / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
