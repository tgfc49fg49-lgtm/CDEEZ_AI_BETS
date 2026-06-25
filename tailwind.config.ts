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
          950: "#f7fbff",
          900: "#ffffff",
          800: "#f3f7fc",
          700: "#e8f0fa"
        },
        line: "#d9e4f2",
        accent: "#dc001b",
        electric: "#0b63f6",
        cyan: "#0b63f6"
      },
      boxShadow: {
        glow: "0 18px 40px rgba(11, 99, 246, 0.12)",
        blueglow: "0 18px 44px rgba(11, 99, 246, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
