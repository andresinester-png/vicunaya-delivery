# Handoff: VicuñaYa — Pantalla de Turnos

## About the Design File
`VicuñaYa Turnos.dc.html` is a **design reference built in HTML** — a prototype showing intended look, layout and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, native, etc.) using its established component patterns, styling approach, and libraries — or, if no environment exists yet, choose the most appropriate framework and implement it there.

## Fidelity
**High-fidelity.** Colors, typography, spacing and copy are final-ish. Recreate pixel-close using the codebase's existing design system/components where equivalents exist; use the values below where they don't.

## Purpose
Home screen for the "Turnos" (appointments/services) section of VicuñaYa — browse and search local service businesses (peluquería, estética, veterinaria, lavadero) and book an appointment. Mirrors the visual system of the app's Delivery home screen for consistency.

## Layout (top → bottom)
1. **Header** — background `#D32F2F`, padding ~16px/18px. Row: map-pin icon + "VicuñaYa" (800, 15px, white) / "Vicuña Mackenna, Córdoba" (500, 11.5px, white 85%) on the left; bell/notification icon with small amber (`#FFC107`) unread dot on the right. Below that, screen title "Turnos" (800, 22px, white).
2. **Search field** — white, 46px height, 14px radius, border `#E9D5D8`, search icon inset left, placeholder "Peluquerías, talleres, turnos...".
3. **Promo bento banner** — 190px tall, 20px radius, background photo (barbershop/salon interior) with left-to-right red gradient overlay (`rgba(211,47,47,0.88)` at 12% → `rgba(183,28,28,0.28)` at 60%). Content bottom-aligned: headline "Reservá tu turno en segundos" (800, 22px, white), subtext "Peluquerías, talleres y más, sin esperar en el local." (500, 13px, white 90%), white pill button "Buscar turno" (text `#D32F2F`, 700, 13px).
4. **Categories** — header "Categorías" (800, 16.5px) + "Ver todas" link (`#D32F2F`, 700, 12.5px). Horizontal-scroll row of circular icon tiles, 64×64px:
   - **Todos** (active): filled `#D32F2F` circle, white 2×2 grid icon, colored shadow.
   - **Peluquería**: white circle, border `#E9D5D8`, scissors icon.
   - **Estética**: white circle, eye icon (represents a beauty/aesthetics service).
   - **Veterinaria**: white circle, dog paw-print icon (pad + 4 toes).
   - **Lavadero**: white circle, car icon.
   - All icons: 2px outline, color `#D32F2F`, lucide-style. Label below each, 11.5px, 700 (active) / 600 (inactive), color `#241F1D` / `#5B5450`.
5. **Filter chips** — horizontal scroll, pill buttons: "Peluquería" (active, `#D32F2F` bg, white text), "Estética", "Veterinaria", "Lavadero" (white bg, border `#E9D5D8`, text `#5B5450`).
6. **Business list** — vertical stack of cards, white bg, border `#E9D5D8`, 16px radius, 10px padding. Each row: 64×64px photo (12px radius) + text block (name 700/14.5px `#241F1D`; description 12px `#8A8580`; category tag pill, `#FBEAEA` bg / `#D32F2F` text, 10.5px/700) + chevron-right icon (`#B7B0A8`) on the far right. Sample businesses: "Estética Bella" (Estética), "Lavadero Morán" (Lavadero), "Taller Fierro" (shown here even though its category chip isn't in the current filter set — kept as an example listing).
7. **Floating bottom-nav island** — inset ~20px from both edges, floating above content (not a full-width bar). Background `rgba(24,18,18,0.55)` with `backdrop-filter: blur(20px) saturate(180%)` (frosted dark glass), border `1px solid rgba(255,255,255,0.10)`, radius 28px, shadow `0 12px 32px rgba(0,0,0,0.28)`. 4 tabs, evenly spaced: Inicio, Pedidos, **Mis Turnos** (active — light pill bg `rgba(255,255,255,0.14)`, icon/label in `#FF6B6B`), Perfil (icon/label `rgba(255,255,255,0.6)`).

## Interactions & Behavior
- Search field: filters/searches business listings as-you-type or on submit.
- Category tiles / filter chips: tap to filter the business list by category; single active state at a time.
- Business card: tap navigates to that business's detail/booking page.
- Bottom nav: standard tab navigation; "Mis Turnos" is the active tab on this screen.

## State Management
- Active category filter
- Active filter chip
- Business list data: name, photo, description, category tag
- Notification unread state (dot badge in header)

## Design Tokens

**Colors**
- Primary red: `#D32F2F`
- Text dark: `#241F1D`
- Text secondary: `#8A8580` / `#5B5450`
- Text muted (inactive nav): `#B7B0A8`
- Borders: `#E9D5D8`
- Background/surface: `#FFF8F8`
- Light red tag fill: `#FBEAEA`
- Amber accent: `#FFC107`
- White: `#FFFFFF`

**Typography**
- Font family: Plus Jakarta Sans (weights 400/500/600/700/800), Google Fonts
- Screen title: 22px/800
- Section headers: 16.5px/800
- Body/labels: 11–14px, 500–700

**Spacing/Radius**
- Screen padding: 18px horizontal
- Card radius: 16–20px
- Chip/button radius: full (99px)
- Category icon tile: 64px circle
- Bottom-nav island radius: 28px

**Shadows**
- Cards: `0 4px 14px rgba(0,0,0,0.06)`
- Bottom-nav island: `0 12px 32px rgba(0,0,0,0.28)`

## Assets
- Icons: hand-coded inline SVGs in lucide style (2px outline stroke) — recreate with `lucide-react` (or equivalent): map-pin, bell, search, chevron-right. Category icons (scissors, eye, paw-print, car) are custom line-drawn glyphs in the same 2px `#D32F2F` outline style — treat as bespoke icons matching the lucide visual language, not a named icon-set.
- Photos: temporary stock placeholders (Unsplash) for the banner and category/business photos — replace with real photography before production.
- No emoji used anywhere.

## Files
- `VicuñaYa Turnos.dc.html` — full design reference for this screen.
