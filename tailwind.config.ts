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
        field: {
          950: "#030712",
          900: "#07111f",
          800: "#0b1b2f",
          700: "#102743"
        },
        line: "#1b3049",
        accent: "#22f08a",
        electric: "#2f7dff",
        cyan: "#22d3ee"
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 240, 138, 0.16)",
        blueglow: "0 0 44px rgba(47, 125, 255, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
