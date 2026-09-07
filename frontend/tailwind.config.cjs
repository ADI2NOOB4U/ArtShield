/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050607", 900: "#0a0c0e", 800: "#101316", 700: "#171b1f", 600: "#1f2429" },
        graphite: { 500: "#2a3036", 400: "#363d44", 300: "#4a5259" },
        silver: { 50: "#f5f6f7", 100: "#e7e9ec", 200: "#cfd3d8", 300: "#aab0b7", 400: "#838a92", 500: "#5f666e" },
        ice: { 200: "#d9f6ff", 300: "#b5ecff", 400: "#7fdcff", 500: "#4cc8f4", 600: "#2ba5d3" },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        techno: "0.22em",
      },
      boxShadow: {
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 40px 100px -40px rgba(0,0,0,0.9)",
        plane: "0 60px 120px -60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "hairline-x": "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        site: "84rem",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { translate: "0 0" },
          "50%": { translate: "0 -14px" },
        },
        drift: {
          "0%": { translate: "0 0", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { translate: "0 -140px", opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.9" },
        },
        dash: {
          to: { strokeDashoffset: "-400" },
        },
        "light-sweep": {
          "0%, 100%": { translate: "-30% -20%", opacity: "0.25" },
          "50%": { translate: "30% 20%", opacity: "0.5" },
        },
        scan: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "float-slow": "float-slow 14s ease-in-out infinite",
        "float-slower": "float-slow 22s ease-in-out infinite reverse",
        drift: "drift 26s linear infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        dash: "dash 12s linear infinite",
        "light-sweep": "light-sweep 18s ease-in-out infinite",
        scan: "scan 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
