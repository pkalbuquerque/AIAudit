import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          700: "#22455A",
          800: "#1A3A4A",
          900: "#0D1F2D",
        },
        paper: "#F4F6F8",
        line: "#E2E8F0",
        text: "#1C1C1E",
        sub: "#6B7280",
        mint: "#00C896",
        rust: "#E5533C",
        amber: "#F0A500",
        sky: "#2C7BE5",
        rowhi: "#F0F7FF",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-dm-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
