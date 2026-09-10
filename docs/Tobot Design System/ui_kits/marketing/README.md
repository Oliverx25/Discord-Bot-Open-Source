# UI kit — Marketing site

Single-page landing for tobot.gg. Dark mode only (the marketing face is always dark; light mode lives in the dashboard and docs).

## Sections, in order
1. **Nav** — sticky, 64px, wordmark + 4 links + "18 modules · 15 free" badge + Add to Discord.
2. **Hero** — asymmetric split. Left: display-l headline, subhero, two CTAs, mono reassurance line. Right: **"Your current stack"** ledger — six struck-through competitor bots with their per-server prices, resolving into one ember tobot row. This is the deliberately non-standard hero: no product screenshot, no illustration, the argument *is* the visual.
3. **Modules** — 18-cell hairline grid (1px gaps over `--border-subtle`), Lucide glyph per module, Pro badges on the three paid ones.
4. **Pricing** — the second unconventional section: a live **servers slider** comparing a typical stack's cost against $6 flat, next to a three-column ledger table instead of floating tier cards. Free is a full column with real values, never dashes-only.
5. **FAQ** — accordion, first item open.
6. **Final CTA + Footer.**

## Rules kept here
- One ember fill per viewport height: hero CTA, then the tobot row, then Go Pro.
- All prices, counts and reassurance lines are mono.
- No gradients, no glass, no mascot. The only texture is a 64px vertical hairline grid on the hero.

Files: `Shared.jsx` (Icon/Overline/Section + MODULES data), `Nav.jsx`, `Hero.jsx`, `Modules.jsx`, `Pricing.jsx`, `Faq.jsx` (also exports Footer).
