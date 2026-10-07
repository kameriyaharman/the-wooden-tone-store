import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        walnut: { DEFAULT: "#3A2411", 900: "#2A190B", 800: "#3A2411", 700: "#4E321A" },
        teak: { DEFAULT: "#C4841D", dark: "#A86E14", light: "#D99A2E" },
        cream: "#FAF6EF",
        ink: "#1D1712",
        tint: "#FBF1DF",
        sale: "#E23744",
        stock: "#1E8A4F",
        line: "#ECE4D8",
        muted: "#6E655B",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      maxWidth: { site: "1200px" },
      boxShadow: { card: "0 1px 2px rgba(58,36,17,.04), 0 8px 24px -12px rgba(58,36,17,.12)", btn: "0 6px 16px -6px rgba(196,132,29,.55)" },
      keyframes: { marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } } },
      animation: { marquee: "marquee 40s linear infinite" },
    },
  },
  plugins: [],
} satisfies Config;
