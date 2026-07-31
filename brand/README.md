# myManager — Brand Assets

Source masters and the web assets generated from them.

## Colors
| Token | Hex | Use |
|-------|-----|-----|
| Brand purple | `#664BEF` | Icon fill, primary, `theme_color` |
| Ink | `#0F1222` | Wordmark "Manager" text on light |
| Surface | `#FFFFFF` | Light background |

## Masters (source of truth)
| File | Notes |
|------|-------|
| `icon-source.png` | 1254² solid icon on white — primary source for all app icons |
| `icon-glow-source.png` | 1024² glow variant on transparent (dark-context / marketing) |
| `wordmark-source.png` | Horizontal `myManager` lockup on white |
| `icon-fullbleed-1024.png` | Generated: purple full-bleed + white "m", no corners (OS icon master) |
| `icon-rounded.png` | Generated: rounded square with transparent corners (web mark master) |

## Generated web assets (`apps/web/`)
| Path | From | Purpose |
|------|------|---------|
| `app/icon.png` (512) | full-bleed | Next.js `<link rel=icon>` |
| `app/apple-icon.png` (180) | full-bleed | Apple touch icon |
| `app/favicon.ico` (16/32/48/64) | rounded | Legacy favicon |
| `public/icon-192.png`, `public/icon-512.png` | full-bleed | PWA manifest (`any maskable`) |
| `public/apple-icon.png` (180) | full-bleed | Fallback apple icon |
| `public/images/icon.png` (256) | rounded | Transparent mark for in-app headers (navbar) |
| `public/images/logo-full.png` | wordmark | Transparent wordmark — **light backgrounds only** |
| `public/images/logo-full@44.png` | wordmark | 44px-tall nav variant |

`logo.svg` / `logo-white.svg` remain the theme-adaptive text wordmarks used on the
dark auth panel.

## Regenerating
Icons are derived programmatically (glyph isolated from the solid source via corner
flood-fill so full-bleed variants have no white corners). To rebuild after a master
changes, re-run the generation script against `icon-source.png` / `wordmark-source.png`.
