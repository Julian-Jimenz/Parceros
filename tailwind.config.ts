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
        carbon: "#101114",
        graphite: "#1D2026",
        epic: {
          orange: "#FF6B00",
          "orange-light": "#FF9333",
        },
        muted: "#A8ADB7",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "topo-pattern":
          "radial-gradient(circle at 20% 20%, rgba(255,107,0,0.08) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,147,51,0.06) 0%, transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
