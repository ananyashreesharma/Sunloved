// Local (on-device) daily reminders for the morning/night routine — not a server push, so it needs
// no backend job, Firebase/APNs credentials, or the user's own push-service account. Scheduling
// stays entirely on-device via expo-notifications' local scheduler, driven by guest-store's
// morningTime/nightTime/reminderTone/muted fields (src/lib/guest-store.ts).
//
// Deliberately scoped to `channel: "push"` only (the only option the Profile UI actually exposes —
// "whatsapp" exists in GuestData's type but has no picker, see ProfileScreen.tsx's static "Push
// notifications" label) — a WhatsApp reminder would need a persistent backend cron job, not
// something a local scheduler can do.

import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { NightAnchor } from "@skinlens/shared"
import type { GuestData } from "@/lib/guest-store"
import i18n from "@/lib/i18n"

const MORNING_ID = "skinlens-reminder-morning"
const NIGHT_ID = "skinlens-reminder-night"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Calm, specific copy (no emoji, no pressure). "coach" is the Gentle tone, "plain" Just the facts.
// The night reminder names the habit it follows ("After you brush your teeth, …") when the person
// picked one: an existing habit is a stronger cue than a clock time.
export function reminderText(
  tone: GuestData["reminderTone"],
  when: "morning" | "night",
  count: number,
  anchor?: NightAnchor | null,
): string {
  const k = when === "morning" ? "Morning" : "Night"
  const facts = tone === "plain" && count > 0
  if (when === "night" && anchor) {
    const cue = i18n.t(`reminders.cue.${anchor}`)
    return facts ? i18n.t("reminders.factsNightAfter", { cue, count }) : i18n.t("reminders.gentleNightAfter", { cue })
  }
  return facts ? i18n.t(`reminders.facts${k}`, { count }) : i18n.t(`reminders.gentle${k}`)
}

function copyFor(data: Pick<GuestData, "reminderTone" | "steps" | "nightAnchor">, when: "morning" | "night"): { title: string; body: string } {
  const n = data.steps.filter((s) => s.when === when || s.when === "both").length
  return { title: "SkinLens", body: reminderText(data.reminderTone, when, n, data.nightAnchor) }
}

// `interactive` controls whether a missing permission may trigger iOS/Android's native system
// prompt (requestPermissionsAsync) or only check the existing state (getPermissionsAsync). Only
// ProfileScreen's patch() — a moment where the user just deliberately touched a reminder setting —
// passes interactive:true. Onboarding-completion and app-startup call this non-interactively, so a
// brand-new guest never gets a cold "Allow Notifications?" system prompt with zero context seconds
// after finishing the wizard; iOS only lets you ask once; if that permission was denied — the app
// would have no way to ask again in-app, only silently do nothing forever.
async function ensurePermission(interactive: boolean): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync()
  if (existing.granted) return true
  if (!interactive) return false
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

function parseHM(hhmm: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export type ReminderStatus = "active" | "off" | "muted" | "permission-denied"

/** Read-only check for Profile to show an honest status instead of always implying reminders are
 * live — without this, a user who dismissed the system permission prompt sees the same "on" UI as
 * someone whose reminders are actually firing. Never prompts. */
export async function getReminderStatus(
  data: Pick<GuestData, "reminderTone" | "muted" | "channel">,
): Promise<ReminderStatus> {
  if (data.muted) return "muted"
  if (data.reminderTone === "off" || data.channel !== "push") return "off"
  const { granted } = await Notifications.getPermissionsAsync()
  return granted ? "active" : "permission-denied"
}

/** Reconciles scheduled local notifications with the guest's current reminder settings. Safe to
 * call any time settings change, and once at app startup — always cancels+rebuilds both slots
 * rather than diffing, since there are only ever the two (morning/night). */
export async function syncReminders(
  data: Pick<GuestData, "morningTime" | "nightTime" | "reminderTone" | "muted" | "channel" | "remindMorning" | "remindNight" | "steps" | "nightAnchor">,
  options?: { interactive?: boolean },
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_ID).catch(() => {})
  await Notifications.cancelScheduledNotificationAsync(NIGHT_ID).catch(() => {})

  if (data.muted || data.reminderTone === "off" || data.channel !== "push") return
  if (!data.remindMorning && !data.remindNight) return

  const granted = await ensurePermission(options?.interactive ?? false)
  if (!granted) return

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Routine reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const morning = parseHM(data.morningTime)
  const night = parseHM(data.nightTime)

  if (morning && data.remindMorning) {
    await Notifications.scheduleNotificationAsync({
      identifier: MORNING_ID,
      content: { ...copyFor(data, "morning"), sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: morning.hour, minute: morning.minute },
    })
  }
  if (night && data.remindNight) {
    await Notifications.scheduleNotificationAsync({
      identifier: NIGHT_ID,
      content: { ...copyFor(data, "night"), sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: night.hour, minute: night.minute },
    })
  }
}
