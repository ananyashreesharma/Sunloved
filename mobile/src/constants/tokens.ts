// Design tokens extracted from the web app's inline styles (frontend/components/ouma/**).
// There was no shared token file on the web side either — colors were hardcoded hex per
// component. This is the first time these values are centralized.

export const colors = {
  // Base palette (frontend/components/ouma/app/OumaRoutineClient.tsx LIGHT/DARK, reused everywhere)
  ink: "#17211A",
  mute: "#5A6259",
  accent: "#1E4D3A",
  bone: "#F3F5EF",
  card: "#FFFFFF",
  line: "rgba(23,33,26,.07)",

  // Night mode (Routine screen's PM tab flips the whole app-shell to this — see app-chrome-context)
  night: {
    bg: "#0E1411",
    ink: "#E7ECE7",
    mute: "#9FB0A4",
    accent: "#5C9977",
    card: "#202B23",
    line: "rgba(231,236,231,.09)",
    track: "#17201A",
  },

  // Verdict zones (OumaScanResultClient VERDICTS / STRIP_HEX)
  zone: {
    red: { fg: "#8A2E22", soft: "#F8E5E1" },
    yellow: { fg: "#7C5410", soft: "#F7EDD8" },
    green: { fg: "#1D5C3B", soft: "#DFF0E4" },
    none: "#AAB4AB",
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radii = {
  sm: 9,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  display: 22,
  displayLg: 28,
} as const
