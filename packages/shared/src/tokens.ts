// Design tokens for every SkinLens app. Today's values (the designer may replace them — see the
// designer brief): web Tailwind (frontend/tailwind.config.ts) and mobile (mobile/src/constants/tokens.ts)
// both read from here, so a colour changes in one place.

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

/** Font families by role. Each app maps these to its own loaded font names. */
export const fontFamilies = {
  display: "Archivo Narrow",
  body: "Instrument Sans",
  mono: "JetBrains Mono",
} as const

// ─── V3 "annotated label" design (approved 2026-10-03) ────────────────────────────────────────
// Paper and ink by day, warm dark by night. Zone colours only ever mark ingredient states (and the
// routine conflict); routine progress has its own neutral "done" highlighter. `hi*` are
// highlighter fills drawn behind text, `t*` the matching text colours.

export type Palette = {
  bg: string
  surface: string
  ink: string
  ink2: string
  ink3: string
  line: string
  btn: string
  btnInk: string
  /** Highlighter behind completed routine steps. */
  done: string
  hiFine: string
  hiCaution: string
  hiNfy: string
  hiAvoid: string
  tFine: string
  tCaution: string
  tNfy: string
  tAvoid: string
  scrim: string
  /** Shadow disc that slides off the moon as steps get done. */
  moonShadow: string
  navActive: string
}

export const palettes: { day: Palette; night: Palette } = {
  day: {
    bg: "#F2ECE1",
    surface: "#FAF6EE",
    ink: "#1A1A17",
    ink2: "#615D55",
    ink3: "#8E887C",
    line: "rgba(26,26,23,.14)",
    btn: "#1A1A17",
    btnInk: "#F2ECE1",
    done: "rgba(120,160,205,.34)",
    hiFine: "rgba(110,180,130,.42)",
    hiCaution: "rgba(242,190,70,.55)",
    hiNfy: "rgba(176,136,226,.42)",
    hiAvoid: "rgba(232,130,100,.42)",
    tFine: "#2E6B45",
    tCaution: "#7A5200",
    tNfy: "#5F3D85",
    tAvoid: "#9A3A24",
    scrim: "rgba(26,26,23,.38)",
    moonShadow: "#E2DACB",
    navActive: "rgba(26,26,23,.09)",
  },
  night: {
    bg: "#151410",
    surface: "#201E19",
    ink: "#EFE8DA",
    ink2: "#A8A194",
    ink3: "#7A7468",
    line: "rgba(239,232,218,.13)",
    btn: "#EFE8DA",
    btnInk: "#151410",
    done: "rgba(255,236,200,.22)",
    hiFine: "rgba(120,190,140,.32)",
    hiCaution: "rgba(241,198,110,.34)",
    hiNfy: "rgba(190,160,240,.34)",
    hiAvoid: "rgba(240,150,120,.34)",
    tFine: "#9BD3AE",
    tCaution: "#F0C674",
    tNfy: "#D2B6F2",
    tAvoid: "#F2A58E",
    scrim: "rgba(0,0,0,.55)",
    moonShadow: "#24211B",
    navActive: "rgba(239,232,218,.12)",
  },
}

/** Moon and sun artwork colours (same in both themes). */
export const celestial = {
  moonLight: ["#FFF8EC", "#F6E2C2", "#D8BD98"],
  sunLight: ["#FFFFFF", "#FFF6E4", "#F7E7C6"],
  dawnSky: ["#CFE0EE", "#E9E6E0", "#F2ECE1"],
  star: "#FFE9C8",
} as const

/**
 * Motion spec. Only transform/opacity (and colour on the theme switch) animate. With reduce motion
 * on, every moment becomes a 160 ms fade or an instant change.
 */
export const motion = {
  /** cubic-bezier control points */
  easing: {
    settle: [0.2, 0.8, 0.2, 1] as const,
    standard: [0.4, 0, 0.2, 1] as const,
  },
  ms: {
    reducedFade: 160,
    tickHighlight: 420,
    tickNumeral: 260,
    moon: 760,
    doneTitle: 700,
    moonGlow: 1400,
    twinkle: 2600,
    themeSwitch: 600,
    setupSort: 340,
    verdictHeadline: 460,
    verdictKeyword: 500,
    verdictReasoning: 380,
    labelWordMax: 120,
    labelTotalMax: 1600,
  },
} as const
