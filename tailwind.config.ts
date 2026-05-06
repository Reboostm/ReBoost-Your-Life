import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080810",
        surface: "#10101e",
        "surface-2": "#1a1a2e",
        "surface-3": "#22223a",
        primary: "#00e676",
        "primary-dark": "#00b359",
        secondary: "#ff6b35",
        accent: "#7c3aed",
        border: "#252540",
        muted: "#6b6b8a",
        "text-primary": "#f0f0ff",
        "text-secondary": "#a0a0c0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "pulse-green": "pulseGreen 2s infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 230, 118, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0, 230, 118, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
