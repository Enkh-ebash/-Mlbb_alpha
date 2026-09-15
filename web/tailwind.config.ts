import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#12121F",
        surface: "#1B1B2E",
        "surface-variant": "#232340",
        primary: "#7C5CFC",
        teal: "#2DD4BF",
        coral: "#FF6B6B",
        gold: "#E8B14A",
        "text-primary": "#F5F5FA",
        "text-secondary": "#A0A0C0",
      },
      fontFamily: {
        display: ["var(--font-unbounded)"],
        body: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};

export default config;
