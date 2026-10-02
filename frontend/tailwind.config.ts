import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /** SkinLens semantic palette */
        sl: {
          bone: "#F3F5EF",
          "bone-deep": "#E4EBE2",
          night: "#0E1411",
          ink: "#17211A",
          "ink-soft": "#2A342C",
          "ink-mute": "#5A6259",
          line: "#DDE3DA",
          card: "#FFFFFF",
          accent: "#1E4D3A",
          "accent-hover": "#16382B",
          green: "#1D5C3B",
          "green-soft": "#DFF0E4",
          amber: "#7C5410",
          "amber-soft": "#F7EDD8",
          red: "#8A2E22",
          "red-soft": "#F8E5E1",
        },

        /** Legacy sun.* aliases (for components not yet migrated) */
        sun: {
          html: "hsl(var(--sun-html))",
          ink: "hsl(var(--sun-ink))",
          "ink-muted": "hsl(var(--sun-ink-muted))",
          blueberry: "hsl(var(--sun-blueberry))",
          apricot: "hsl(var(--sun-apricot))",
          citrus: "hsl(var(--sun-citrus))",
          "apple-core": "hsl(var(--sun-apple-core))",
          "blueberry-wash": "hsl(var(--sun-blueberry-wash))",
          "apricot-wash": "hsl(var(--sun-apricot-wash))",
          "citrus-wash": "hsl(var(--sun-citrus-wash))",
          "apple-wash": "hsl(var(--sun-apple-wash))",
          clay: "hsl(var(--sun-clay))",
          sage: "hsl(var(--sun-sage))",
          slate: "hsl(var(--sun-slate))",
          mauve: "hsl(var(--sun-mauve))",
          wheat: "hsl(var(--sun-wheat))",
          olive: "hsl(var(--sun-olive))",
        },
      },
      fontFamily: {
        display: ["var(--font-ouma-display)", "Instrument Serif", "Georgia", "serif"],
        body: ["var(--font-ouma-body)", "Inter Tight", "system-ui", "sans-serif"],
        mono: ["var(--font-ouma-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
