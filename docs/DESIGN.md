# Design

Apple dark mode as the base: pure black canvas, white type, grouped surfaces in system grays. The product looks calm and expensive, which matters when you are asking a farmer to trust you with their harvest.

Tokens live in `src/app/globals.css`. Components in `src/components/ui`.

Screen comps for every role (route map with build status, farmer, buyer and carrier flows at 390 px) live on the design canvas [Mis Carguitas UI](https://claude.ai/artifact/G1REX78NGgcb7r1B6rZjfL). It is private to its owner until shared from its Share menu.

## Principles

1. **Black and white first.** `#000` background, `#fff` primary text and primary buttons. Color is information, not decoration.
2. **One primary action per screen.** White filled button. Everything else is secondary (gray) or plain (blue text).
3. **Big and plain.** 17 px body, 44 px minimum touch targets, short Spanish sentences in tú.
4. **Lists over cards.** Most screens are iOS-style inset grouped lists. Cards are for the landing and for empty states.
5. **Show the money and the kilos.** Price per kg and available kg are always visible on a carguita row.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Canvas |
| `--surface-1` | `#1c1c1e` | Grouped list cells, cards |
| `--surface-2` | `#2c2c2e` | Inputs, secondary buttons, hover |
| `--surface-3` | `#3a3a3c` | Pressed, selected segment |
| `--separator` | `rgba(84,84,88,.65)` | Hairlines |
| `--label` | `#ffffff` | Primary text |
| `--label-2` | `rgba(235,235,245,.6)` | Secondary text (about 6.3:1 on black, passes AA) |
| `--label-3` | `rgba(235,235,245,.3)` | Placeholders, disabled, decorative only. Fails AA, never for real content. |
| `--accent` / `--on-accent` | `#fff` / `#000` | Primary button |
| `--green` | `#30d158` | Verified, delivered, published |
| `--orange` | `#ff9f0a` | Pending, needs you |
| `--red` | `#ff453a` | Errors, destructive |
| `--blue` | `#0a84ff` | Links, in transit, focus ring |

Status colors are used as 15 % tinted pills with full-color text (`StatusPill`), never as big fills.

## Type

System font stack (SF Pro on Apple, Roboto on Android). No web fonts: faster on 3G and one less CSP source.

| Style | Size / line | Weight | Where |
|---|---|---|---|
| Large title | 34 / 41 | 700 | Top of every tab screen (`PageHeader`) |
| Title | 22 / 28 | 600 | Card titles |
| Body | 17 / 22 | 400 | Rows, inputs, buttons |
| Subhead | 15 / 20 | 400 | Row subtitles |
| Footnote | 13 / 18 | 400 | Section headers (uppercase), hints, errors |
| Caption | 11 / 13 | 500 | Tab bar labels, segment hints |

## Components

| Component | File | Notes |
|---|---|---|
| `Button`, `LinkButton` | `ui/button.tsx` | `primary` white, `secondary` gray, `plain` blue text, `destructive` gray with red text. 48 px tall. |
| `Group`, `Row` | `ui/group.tsx` | Inset grouped list. Row: icon tile, title, subtitle, trailing value, chevron when it links. |
| `PageHeader` | `ui/page-header.tsx` | Large title, optional subtitle and action. |
| `Field` | `ui/field.tsx` | Label above, 48 px input on `surface-2`, hint (`label-2`) or error below. `aria-invalid` drives the red ring. |
| `SelectField` | `ui/field.tsx` | Native `<select>` with the Field look: light and accessible on low-end Android. |
| `FileField` | `ui/field.tsx` | Native file input with the Field look; `onFile` says a file is already on record. |
| `MunicipalityPicker` | `ui/municipality-picker.tsx` | Native `<input list>` + `<datalist>` filled from `/api/municipalities` as you type (S1-06). The browser draws the suggestions; the DANE code goes in a hidden input. |
| `StatusPill` | `ui/status-pill.tsx` | Tinted pill for lifecycle states. |
| `EmptyState` | `ui/empty-state.tsx` | Icon, title, one sentence, one action. |
| `SpecPlaceholder` | `ui/empty-state.tsx` | Dashed box with the issue ID for screens not built yet. Remove as issues close. |
| `TabBar`, `SidebarLinks` | `shell/nav-links.tsx` | Blurred black tab bar with safe-area padding on mobile; sidebar on desktop. |

Still to design (with their issue): bottom sheet for order and bid forms (S3-01, S4-02), segmented filters (S2-03), stepper for kg (S2-02), code entry with 6 boxes (S5-02), map preview without exact pin (S4-02).

## Copy

- Spanish from Colombia, tú, short. "Publica tu cosecha", not "Proceda a publicar su producto".
- Name things the way users do: carguita, pedido, flete, finca, vereda, bodega, camión sencillo, tractomula.
- Money: `$ 2.500/kg`, `$ 750.000` (`formatCop`). Weight: `1.200 kg` (`formatKg`). Dates: `30 oct`.
- Errors say what to do: "Revisa el correo y la contraseña", not "Error 400".

## Accessibility

- WCAG 2.2 AA. Only `--label` and `--label-2` for content.
- Visible focus ring (`--blue`, 2 px) on every interactive element.
- Every icon is `aria-hidden` and next to text, or has a label.
- Respect `prefers-reduced-motion`.
- Test with TalkBack on a real low-end Android before each release (S8-01).
