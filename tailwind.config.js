/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BEXA AI visual identity: black bg, white text, dark gray cards, thin gray borders
        surface: "#121212",
        card: "#1a1a1a",
        "card-border": "#2a2a2a",
        "card-hover": "#222222",
        primary: "#ffffff",
        "primary-hover": "#e5e5e5",
        accent: "#6b7280",
        "text-primary": "#ffffff",
        "text-secondary": "#a1a1a1",
        "text-muted": "#717171",
      },
      fontFamily: {
        mono: ["Monaco", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
}
