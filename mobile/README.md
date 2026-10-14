# SkinLens (mobile)

A skincare routine tracker and ingredient checker — Expo Router / React Native app. Build a morning/evening routine, get one reminder per routine, and type or paste any ingredient list to get a plain-language verdict on it.

Talks to the same `backend/` NestJS API as the web app, but is otherwise independent: no shared code with `frontend/`.

---

## How it's put together

- **Guest-first.** The whole app works with no account — routine, skin profile, reminders, and saved scans all live on-device (`src/lib/guest-store.ts`, backed by `AsyncStorage`). Signing in (email + one-time code, see `src/components/auth/LoginScreen.tsx` and `backend/src/modules/auth`) is optional and only needed to sync across devices.
- **Auth.** Mobile can't hold the web app's server-to-server internal API key, so it authenticates with a JWT bearer token instead — issued after email OTP verification, refreshed via a revocable, rotating refresh token (see `backend/src/modules/auth/token.util.ts`). `src/lib/api-client.ts` attaches and refreshes it automatically.
- **Scan.** Ingredient checking is real, not mocked — pasted/typed text goes to the backend's `/ingredients/analyze` endpoint and comes back with a verdict. There's no camera/OCR yet (the capture screen says so rather than pretending); typing the list is the working path today.
- **i18n.** English, Spanish, and Arabic (`src/lib/locales/`, `src/lib/i18n.ts`), with real RTL layout mirroring for Arabic — not just translated strings.
- **Routing.** File-based via `expo-router`. Root-level `src/app/*.tsx` screens (add-step, products, scan-confirm, scan-result, history) are pushed outside the tab navigator so they get native iOS swipe-back; `src/app/(app)/` holds the three tab screens (Routine, Scan, Me).

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for an iOS Simulator / Android emulator (needs a native dev client — see `npx expo run:ios` / `run:android` the first time).

Point it at a local backend by setting `EXPO_PUBLIC_API_BASE` (see `.env.example`) — defaults to `http://localhost:3001/api`.

## Project structure

```
src/
  app/            expo-router screens (file-based routing)
  components/      screen implementations, grouped by feature
  lib/            guest-store, api-client, i18n, auth-tokens, ...
  constants/      design tokens, fonts
```

## Other setup steps

- Type-check: `npx tsc --noEmit`
- Lint: `npx expo lint`
