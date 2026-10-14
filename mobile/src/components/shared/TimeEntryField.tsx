// A 12-hour, AM/PM reminder-time input — replaces raw 24-hour digit entry (e.g. typing "21:30")
// in onboarding and Reminders. Storage stays 24-hour "HH:MM" (guest-store.ts,
// formatTimeForDisplay's read-side counterpart) — this only changes how it's typed, matching how
// it's now displayed for anyone whose device is set to a 12-hour clock.

import { useState } from "react"
import { View, Text, TextInput, Pressable } from "react-native"
import { rubik } from "@/constants/fonts"
import { useTheme } from "@/lib/theme"
import { to12Hour, from12Hour, type Period } from "@/lib/time-format"

function formatTime12Input(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length === 0) return ""
  let hh = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  if (hh.length === 2) {
    let n = parseInt(hh, 10)
    if (n === 0 || n > 12) n = 12
    hh = String(n).padStart(2, "0")
  }
  if (mm.length === 2) return `${hh}:${String(Math.min(59, parseInt(mm, 10))).padStart(2, "0")}`
  return mm.length ? `${hh}:${mm}` : hh
}

export function TimeEntryField({
  value,
  onChange,
  fontSize = 22,
  color,
  bordered = false,
}: {
  value: string
  onChange: (hhmm: string) => void
  fontSize?: number
  color?: string
  bordered?: boolean
}) {
  const { T } = useTheme()
  const initial = to12Hour(value)
  const [text, setText] = useState(`${initial.hour}:${String(initial.minute).padStart(2, "0")}`)
  const [period, setPeriod] = useState<Period>(initial.period)

  // Resync when the parent's stored value changes from outside this field (e.g. reloaded on
  // screen focus) — but not on every render, or a keystroke's own onChange round-trip would
  // fight with what's mid-typing. Done during render (React's "storing information from previous
  // renders" pattern) rather than in an effect, which painted the stale time for a frame first.
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    const parsed = to12Hour(value)
    setSynced(value)
    setText(`${parsed.hour}:${String(parsed.minute).padStart(2, "0")}`)
    setPeriod(parsed.period)
  }

  function handleText(raw: string) {
    const masked = formatTime12Input(raw)
    setText(masked)
    const [h, m] = masked.split(":")
    // Only commit upward once a full "H:MM" has been typed — while it's partial, updating the
    // parent's stored time to a half-typed guess would be worse than just leaving it as-is.
    if (h && m && m.length === 2) {
      onChange(from12Hour(parseInt(h, 10), parseInt(m, 10), period))
    }
  }

  function handlePeriod(next: Period) {
    setPeriod(next)
    const [h, m] = text.split(":")
    if (h && m && m.length === 2) {
      onChange(from12Hour(parseInt(h, 10), parseInt(m, 10), next))
    }
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, rowGap: 6 }}>
      <TextInput
        value={text}
        onChangeText={handleText}
        placeholder="9:30"
        placeholderTextColor={T.ink3}
        keyboardType="number-pad"
        maxLength={5}
        style={{
          fontFamily: rubik.regular,
          fontSize,
          color: color ?? T.ink,
          minWidth: 64,
          padding: 0,
          ...(bordered
            ? { borderWidth: 1.5, borderColor: T.line, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }
            : {}),
        }}
      />
      <View style={{ flexDirection: "row", gap: 2, padding: 2, borderRadius: 12, backgroundColor: T.line }}>
        {(["AM", "PM"] as Period[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => handlePeriod(p)}
            accessibilityRole="radio"
            accessibilityState={{ selected: period === p }}
            style={{
              minHeight: 36,
              justifyContent: "center",
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: period === p ? T.bg : "transparent",
            }}
          >
            <Text style={{ fontFamily: period === p ? rubik.semibold : rubik.regular, fontSize: 14, color: T.ink }}>{p}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
