// Mirrors frontend/app/layout.tsx's next/font/google setup (Archivo_Narrow / Instrument_Sans /
// JetBrains_Mono) so the mobile carousel/screens can match the web ouma design exactly.

import {
  useFonts as useArchivoNarrowFonts,
  ArchivoNarrow_500Medium,
  ArchivoNarrow_600SemiBold,
} from "@expo-google-fonts/archivo-narrow"
import {
  useFonts as useInstrumentSansFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_400Regular_Italic,
} from "@expo-google-fonts/instrument-sans"
import {
  useFonts as useJetBrainsMonoFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono"
import {
  useFonts as useRubikFonts,
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik"

/**
 * V3 design: one family, Rubik, which also covers Arabic. Light (300) for large display type
 * ("Tonight", verdict headlines), medium/semibold for names and actions.
 */
export const rubik = {
  light: "Rubik_300Light",
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  semibold: "Rubik_600SemiBold",
  bold: "Rubik_700Bold",
} as const

export const fonts = {
  displayMedium: "ArchivoNarrow_500Medium",
  display: "ArchivoNarrow_600SemiBold", // .ouma-display (font-weight: 600)
  body: "InstrumentSans_400Regular",
  bodyMedium: "InstrumentSans_500Medium",
  bodySemiBold: "InstrumentSans_600SemiBold",
  bodyItalic: "InstrumentSans_400Regular_Italic",
  mono: "JetBrainsMono_400Regular", // .ouma-mono
  monoMedium: "JetBrainsMono_500Medium",
  monoSemiBold: "JetBrainsMono_600SemiBold",
} as const

/** Loads every weight the ouma design uses. Returns true once all three families are ready. */
export function useOumaFonts() {
  const [displayLoaded] = useArchivoNarrowFonts({ ArchivoNarrow_500Medium, ArchivoNarrow_600SemiBold })
  const [bodyLoaded] = useInstrumentSansFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_400Regular_Italic,
  })
  const [monoLoaded] = useJetBrainsMonoFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  })
  const [rubikLoaded] = useRubikFonts({ Rubik_300Light, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold })
  return displayLoaded && bodyLoaded && monoLoaded && rubikLoaded
}
