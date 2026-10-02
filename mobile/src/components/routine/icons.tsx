// Exact ports of the inline SVGs in frontend/components/ouma/app/OumaRoutineClient.tsx and
// frontend/components/ouma/OumaAppShell.tsx — same viewBoxes/paths, rendered with react-native-svg.

import Svg, { Path, Circle } from "react-native-svg"

export function StreakLeafIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * (14 / 12)} viewBox="0 0 12 14">
      <Path d="M6 1C7.5 3.2 10 4.8 10 8a4 4 0 11-8 0c0-1.6.7-2.7 1.6-3.9C4.4 3 5.4 2 6 1z" fill={color} />
    </Svg>
  )
}

export function WarnTriangleIcon({ size = 13, color }: { size?: number; color: string }) {
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

export function CameraIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h3l2-2.5h6L17 8h3v10H4z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={12} cy={12.5} r={3} stroke={color} strokeWidth={1.7} />
    </Svg>
  )
}

export function CheckIcon({ size = 12, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// Bottom-nav glyphs (OumaAppShell's SIDE_ICONS/SCAN_ICON).
export function RoutineNavIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 5h9M4 10h12M4 15h9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

export function MeNavIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={7} r={3.2} stroke={color} strokeWidth={1.5} />
      <Path d="M4 16.5c1.2-2.8 3.4-4 6-4s4.8 1.2 6 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

export function ScanNavIcon({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h3l2-2.5h6L17 8h3v10H4z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={12} cy={12.5} r={3} stroke={color} strokeWidth={1.7} />
    </Svg>
  )
}
