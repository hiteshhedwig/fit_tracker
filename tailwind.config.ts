import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f4ee",
        moss: "#486047",
        clay: "#b85f42",
        steel: "#55798b",
        gold: "#d4a73f",
        bone: "#fffaf0"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(24, 24, 24, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
