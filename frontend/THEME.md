# Sunloved UI theme

This app uses a **single token file** plus **Tailwind** so new screens stay visually consistent.

**Brand palette (hex):**

| Name | Hex | CSS token |
|------|-----|-----------|
| Blueberry | `#6B7A8F` | `--sun-blueberry` → `hsl(var(--sun-blueberry))` / `text-sun-blueberry` |
| Apricot | `#F7882F` | `--sun-apricot` |
| Citrus | `#F7C331` | `--sun-citrus` |
| Apple Core | `#DCC7AA` | `--sun-apple-core` |

**UI mapping:** `primary` / `ring` use **Blueberry**; `accent` uses **Apricot**; warm neutrals (**muted**, **border**, **secondary**) lean **Apple Core**. **Citrus** shows in story nav highlights and progress accents. Legacy names `--sun-sage` / `--sun-clay` / `--sun-wheat` alias Blueberry / Apricot / Citrus for scroll-story CSS.

## Source of truth

| Layer | File | Role |
|--------|------|------|
| **CSS variables** | `styles/sunloved-tokens.css` | Colors, mesh filter, motion easing, shadcn-aligned neutrals |
| **Global usage** | `globals.css` | Imports tokens, sets `html` / `body`, `.mesh-page`, pastel stack utilities |
| **Home scroll story** | `styles/scroll-story.css` | Maps local `--ss-*` aliases to `--sun-*` tokens |
| **Tailwind semantic colors** | `tailwind.config.ts` | `sun.*` utilities (e.g. `text-sun-ink`, `bg-sun-sage`) |

## How to style new UI

1. **Prefer existing Tailwind tokens**
   - Layout / forms: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
   - Brand-forward accents: `bg-sun-sage`, `text-sun-ink`, `bg-sun-mesh`, etc.

2. **Need a new color?**  
   Add an HSL triplet to `:root` in `sunloved-tokens.css` (comment what it is for), then expose it under `theme.extend.colors.sun` in `tailwind.config.ts` if you need utility classes.

3. **Avoid** scattering `#[0-9a-f]{3,8}` or raw `hsl(...)` in components unless it is a one-off prototype; promote winners into tokens.

## Token cheat sheet (`--sun-*`)

| Token | Typical use |
|--------|-------------|
| `--sun-html` | Page backdrop behind mesh |
| `--sun-mesh-frost` | Frosted page shell (with alpha in `.mesh-page`) |
| `--sun-mesh-filter` | Hue/sat correction on `mesh-gradient-bg.png` |
| `--sun-masthead-square-a/b/c` | Hero floating squares (pastel green / yellow / mint) |
| `--sun-ink` / `--sun-ink-muted` | Body text hierarchy |
| `--sun-sage`, `--sun-clay`, `--sun-wheat`, … | Earthy accents, CTAs, charts |
| `--sun-glass-header` | Sticky / glass bars |
| `--sun-ease-story` | Scroll-story style motion |

Use in plain CSS as `hsl(var(--sun-sage))` or `hsl(var(--sun-white) / 0.2)`.

## shadcn variables

`--primary`, `--background`, `--card`, etc. live in the same `:root` block so **Button**, **Input**, and other shadcn components automatically follow the Sunloved neutrals.
