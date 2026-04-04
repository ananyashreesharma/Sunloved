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
        /** Sunloved semantic palette — prefer these over raw hex for new UI */
        sun: {
          html: "hsl(var(--sun-html))",
          mesh: "hsl(var(--sun-mesh-page-shell) / 0.68)",
          ink: "hsl(var(--sun-ink))",
          "ink-muted": "hsl(var(--sun-ink-muted))",
          /** Brand palette #6B7A8F #F7882F #F7C331 #DCC7AA */
          blueberry: "hsl(var(--sun-blueberry))",
          apricot: "hsl(var(--sun-apricot))",
          citrus: "hsl(var(--sun-citrus))",
          "apple-core": "hsl(var(--sun-apple-core))",
          "blueberry-wash": "hsl(var(--sun-blueberry-wash))",
          "apricot-wash": "hsl(var(--sun-apricot-wash))",
          "citrus-wash": "hsl(var(--sun-citrus-wash))",
          "apple-wash": "hsl(var(--sun-apple-wash))",
          /** Aliases used by scroll-story */
          clay: "hsl(var(--sun-clay))",
          sage: "hsl(var(--sun-sage))",
          slate: "hsl(var(--sun-slate))",
          mauve: "hsl(var(--sun-mauve))",
          wheat: "hsl(var(--sun-wheat))",
          olive: "hsl(var(--sun-olive))",
        },
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


