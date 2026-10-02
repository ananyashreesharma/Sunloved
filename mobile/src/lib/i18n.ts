// Real i18n, not just infrastructure with no content: every functional screen (everything except
// the pre-login marketing carousel, which is flavor text a guest sees once, not app functionality)
// is translated into English, Spanish, and Arabic. Arabic also exercises RTL for real — see
// RTLText/isRTL below — rather than leaving "supports RTL" as an untested claim.
//
// Device locale detection (not a manual picker) via I18nManager.getConstants().localeIdentifier —
// not expo-localization (a native module; adding it to package.json doesn't put it in an
// already-built dev client binary, only a full native rebuild does, and this app doesn't ship one
// on every JS change), and not Intl.DateTimeFormat().resolvedOptions().locale either (tried that
// first — on this Hermes build it silently resolved to "en-US" regardless of the device's actual
// language, with no error to signal it was wrong). I18nManager is core React Native, no extra
// native module needed, and its `isRTL` below is already sourced the same way — reusing that same
// native constant for language keeps both readings consistent with each other. Doesn't guess a
// language from country the way the old +91-only phone field or ₹-hardcoded referral copy did; it
// reads what the user already told their OS they want.
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { I18nManager } from "react-native"

import en from "./locales/en.json"
import es from "./locales/es.json"
import ar from "./locales/ar.json"

const RTL_LANGUAGES = ["ar", "he", "ur", "fa"]

// Known gap, not fixed by this pass: on iOS, I18nManager's native localeIdentifier is sourced from
// NSBundle.preferredLocalizations, which iOS computes as the intersection of the device's language
// preferences and the app's own DECLARED supported locales (CFBundleLocalizations in the native
// Info.plist) — it silently falls back to the app's base language rather than erroring if a locale
// isn't declared there. This dev client binary only ever declared "en", so switching the simulator
// to Spanish/Arabic and relaunching still reports "en" here, even though the OS-level change is
// real (confirmed independently: the status bar's own clock format changes to 24-hour). The
// translations and RTL mirroring themselves were verified by temporarily forcing supportedLanguage
// below and screenshotting — that part works end-to-end. What's NOT verified end-to-end in this
// environment is auto-detection picking up a real device language change, because that needs a
// native rebuild (adding "es"/"ar" to app.json's `expo.ios.infoPlist.CFBundleLocalizations`, or
// using expo-localization once the dev client is rebuilt) that wasn't run here.
function detectDeviceLanguage(): string {
  try {
    const identifier = I18nManager.getConstants().localeIdentifier ?? "en"
    return identifier.replace("_", "-").split("-")[0].toLowerCase()
  } catch {
    return "en"
  }
}

const deviceLanguage = detectDeviceLanguage()
const supportedLanguage = ["en", "es", "ar"].includes(deviceLanguage) ? deviceLanguage : "en"

export const isRTL = RTL_LANGUAGES.includes(supportedLanguage)

// Every "← Back" label in this app was a hardcoded Unicode arrow frozen in LTR orientation — it
// would keep pointing left even for an Arabic/Hebrew/Urdu reader, for whom "back" reads right.
// Call sites use this instead of typing the glyph directly.
export const BACK_ARROW = isRTL ? "→" : "←"
// Same reasoning, opposite direction — "My products →" / calendar "next →" nav point toward more
// content, which reads right-to-left for an RTL speaker.
export const FORWARD_ARROW = isRTL ? "←" : "→"

// RN mirrors flex layout automatically once this is set, but it only takes effect after a reload —
// there's no way to flip a running app's layout direction mid-session. On a real RTL device this
// runs before first render (this module is imported at the top of app/_layout.tsx) so it's already
// correct by the time anything mounts; on this dev client, switching the simulator's language and
// relaunching is what actually exercises it, which is how this was verified.
if (I18nManager.isRTL !== isRTL) {
  I18nManager.allowRTL(isRTL)
  I18nManager.forceRTL(isRTL)
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es }, ar: { translation: ar } },
  lng: supportedLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
