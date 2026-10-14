# @skinlens/shared

Code both SkinLens apps import, so a rule changes in one place instead of drifting apart.

| Module | What it holds |
|---|---|
| `types.ts` | Shapes of backend responses (ingredient analysis, products, routine, streak, scans) |
| `scoring.ts` | Ingredient zones, the safety score, verdicts and the 70%-coverage "no verdict" rule |
| `streak.ts` | Streak rules ("paused, not broken": one missed day keeps the streak) |
| `guest.ts` | Guest-mode routine/streak logic. Each app supplies only its storage (localStorage / AsyncStorage) |
| `profile.ts` | Skin types and concerns offered in onboarding |
| `format.ts` | Price formatting in the user's currency |
| `tokens.ts` | Design tokens (colours, spacing, radii, type sizes) |

Rules for this package: pure TypeScript only. No React, React Native, Next.js, DOM or Node imports, so it compiles in every app.

Wiring: there is no npm workspace (web is on React 18, mobile on React 19). Each app points the `@skinlens/shared` import at `packages/shared/src` instead:

- `frontend/`: `tsconfig.json` `paths` + `experimental.externalDir` in `next.config.js`
- `mobile/`: `tsconfig.json` `paths` + `watchFolders` / `extraNodeModules` in `metro.config.js`

Check it on its own with `npx tsc --noEmit -p packages/shared`.
