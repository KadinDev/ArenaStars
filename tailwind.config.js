/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#06090F",
        card: "#111827",
        cardSecondary: "#1A2233",
        primary: "#6BEA44",
        purple: "#6D4AFF",
        text: "#FFFFFF",
        textSecondary: "#A1A1AA",
        muted: "#6B7280"
      }
    }
  },
  plugins: []
};
