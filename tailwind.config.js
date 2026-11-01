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
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        surface: "#121212",
        card: {
          DEFAULT: "#1a1a1a",
          foreground: "var(--card-foreground)",
          border: "#2a2a2a",
          hover: "#222222",
        },
        primary: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
          hover: "#e5e5e5",
        },
        secondary: {
          DEFAULT: "#1a1a1a",
          foreground: "var(--secondary-foreground)",
        },
        accent: "#6b7280",
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
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
