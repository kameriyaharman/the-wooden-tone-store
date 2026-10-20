import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        walnut: { DEFAULT: "#3A2411", 900: "#2A190B", 800: "#3A2411", 700: "#4E321A" },
        // antique gold — the heritage accent used across the storefront
        teak: { DEFAULT: "#A8803E", dark: "#86622A", light: "#C9A35F" },
        ivory: "#FBF7F0",
        cream: "#F4EDE2",
        ink: "#22180F",
        tint: "#F6EBD6",
        sale: "#B4332B",
        stock: "#1E8A4F",
        line: "#E6DCCB",
        muted: "#65594D",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif Devanagari"', "Georgia", '"Times New Roman"', "serif"],
        sans: ["Jost", '"Noto Sans Devanagari"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "Arial", "sans-serif"],
      },
      maxWidth: { site: "1280px" },
      boxShadow: { card: "0 1px 2px rgba(42,31,23,.04), 0 10px 28px -14px rgba(42,31,23,.18)", btn: "0 6px 16px -8px rgba(168,128,62,.6)" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "ann-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { marquee: "marquee 40s linear infinite", "marquee-slow": "marquee 70s linear infinite", "ann-in": "ann-in .5s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
