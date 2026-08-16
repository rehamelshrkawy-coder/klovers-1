# Klovers design system

There is exactly one source of truth for colour, radius, elevation and type,
and it is code:

| Concern | File | Notes |
|---|---|---|
| Colour, radius, shadow, font tokens | `src/index.css` | CSS custom properties, light + `.dark` |
| Token → utility mapping | `tailwind.config.ts` | Reads the variables above; adds nothing of its own |

Nothing else defines design values. The previous version of this document
described an Instagram canvas renderer that does not exist in this repository,
never mentioned either file above, and published four contrast ratios that were
wrong by up to 99%. Two accompanying "single source of truth" token modules
(`src/constants/palette.ts`, `src/lib/designSystem.ts`) had zero importers, and
one of them shipped a `getContrastRatio()` that returned `4.5` for every input —
a validator that reported "exactly passing AA" for white on white. All three
were deleted rather than corrected.

## Colour

`--primary` is pure spectral yellow, `#FFFF00`.

- **As a background it is excellent.** Black on `--primary` is **19.6:1**. Keep
  every `bg-primary` surface exactly as it is.
- **As a foreground it is unusable.** `#FFFF00` on white is **1.07:1** — three
  percent above the theoretical floor of 1.0.

So brand text and brand icons use a different token:

```
--primary-text          light: hsl(45 100% 29%)  #946F00
                        dark:  hsl(51 100% 65%)
--primary-text-inverse  the opposite value, applied automatically inside
                        bg-foreground / bg-secondary / bg-black sections,
                        whose surfaces invert with the theme
```

`#946F00` is the brand hue darkened until it clears 4.5:1 against **both** white
(4.63:1) and black (4.53:1), so it is safe on every surface in the light theme.

**Rule: use `text-primary-text` / `fill-primary-text` for text and icons, and
`bg-primary` for surfaces. Never `text-primary`.**

`--ring` follows `--primary-text`, so keyboard focus is visible everywhere. It
was previously `#FFFF00`, which meant no perceivable focus indicator on any
focusable element on the site — a blanket WCAG 2.4.7 failure.

### Other tokens worth knowing

- `--card` is `0 0% 97.5%` in light mode, not white. Sections alternate
  `bg-card` / `bg-background`; when both resolved to `#FFFFFF` the banding
  scheme did nothing.
- `--border` (`0 0% 70%`) is decorative; `--input` (`0 0% 56%`) clears the 3:1
  that WCAG 1.4.11 asks of form-control boundaries.
- `--whatsapp` keeps the recognisable brand green and pairs it with a black
  foreground: white on `#25D366` is 1.98:1, black is 10.6:1.

## Radius and elevation

Both ramps are monotonic and derived entirely from `--radius`, so changing that
one value re-skins the site:

```
rounded-sm  … calc(var(--radius) - 8px)      8px
rounded     … calc(var(--radius) - 6px)     10px
rounded-md  … calc(var(--radius) - 4px)     12px
rounded-lg  … calc(var(--radius) - 2px)     14px
rounded-xl  … var(--radius)                 16px
rounded-2xl … calc(var(--radius) + 4px)     20px
rounded-3xl … calc(var(--radius) + 8px)     24px
```

Previously `rounded-md` (14px) was *larger* than `rounded-xl` (12px), `rounded-sm`
equalled `rounded-xl`, and 71% of radius utilities bypassed the token entirely.

`--shadow-2xs` → `--shadow-2xl` now increases in blur, spread and opacity at
every step. `--shadow-2xl` used to be a 3px blur — visually smaller than
`--shadow-sm` — so the components asking for drama got a hairline.

## Typography

System font stack for Latin: zero render-blocking font requests, no FOIT, no
swap-induced layout shift. That is the right call for a 3G Egyptian audience and
it stays.

Arabic is the one exception. `Noto Sans Arabic` is self-hosted at
`public/fonts/noto-sans-arabic-subset.woff2`, declared with `font-display: swap`
and a `unicode-range` limited to Arabic blocks — so a Latin-only visitor never
requests a byte of it. It is listed **first** in the stack precisely because the
`unicode-range` gate makes Latin fall straight through to the system fonts.

Two RTL rules live in the base layer:

- `letter-spacing: normal` under `[dir='rtl']`. Arabic is cursive; tracking
  forces gaps between letters that are required to connect.
- extra leading for Arabic block text, which needs more than Latin at the same
  size.

## Direction

Use logical properties: `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`,
`text-start`/`text-end`, `border-s`/`border-e`. Physical `ml-`/`mr-`/`left-`/
`right-` are correct only for genuinely symmetric decoration (a full-bleed
gradient anchored `left-0 right-0`, an element centred with `left-1/2`).

Directional lucide icons are mirrored under RTL by a single rule in
`src/index.css` keyed on lucide's own `lucide-<name>` class. Adding a new arrow
requires no per-call-site branching.

## Motion

A global `prefers-reduced-motion: reduce` block disables animation site-wide.
Anything that auto-plays indefinitely — currently the two testimonial marquees —
must additionally ship a visible pause control (WCAG 2.2.2 Level A).

## The one rule

Nothing merges until something calls it. Every serious defect this system has
had took the same shape: the right thing was built, and then never wired up.
