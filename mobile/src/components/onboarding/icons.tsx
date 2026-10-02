// Exact ports of the inline SVGs in frontend/components/marketing/ValuePropCarousel.tsx —
// same viewBoxes, paths and stroke widths, rendered with react-native-svg.

import Svg, { Path } from "react-native-svg"

export function TickIcon({ size = 13, color = "#0E1411" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path
        d="M2 6.5l2.5 2.5L10 3.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function WarningIcon({ size = 14, color = "#7C5410" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path
        d="M6 1.2 11 10.8H1zM6 4.8v2.4M6 9.2v.01"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// "Build tonight's routine"
export function ListIcon({ size = 17, color = "#1D5C3B" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6h10M4 12h14M4 18h10" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// "Read any label"
export function ScanIcon({ size = 17, color = "#1D5C3B" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 8h3l2-2.5h6L17 8h3v10H4zM12 15.5a3 3 0 100-6 3 3 0 000 6"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// "Say what we don't know"
export function QuestionIcon({ size = 17, color = "#1D5C3B" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3a9 9 0 100 18 9 9 0 000-18M9.5 9.5a2.6 2.6 0 114.1 2.2c-1 .75-1.6 1.2-1.6 2.4M12 17.5v.01"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
