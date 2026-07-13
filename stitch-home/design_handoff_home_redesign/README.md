# Handoff: VicuñaYa — Home Screen Redesign

## Overview
Redesigned home screen for VicuñaYa, a delivery app for Vicuña Mackenna (Córdoba, Argentina). Covers header/search, promo banner, service categories, filter chips, and a featured/rotisería listing section, plus bottom nav and a floating cart button.

## About the Design Files
The file in this bundle (`VicuñaYa Home.dc.html`) is a **design reference built in HTML** — a prototype showing intended look, layout and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, native, etc.) using its established component patterns, styling approach, and libraries — or, if no environment exists yet, choose the most appropriate framework and implement it there.

## Fidelity
**High-fidelity.** Colors, typography, spacing and copy are final-ish. Recreate pixel-close using the codebase's existing design system/components where equivalents exist (buttons, cards, nav bar); use the values below where they don't.

## Screens / Views

### Home
**Purpose:** Landing screen after opening the app — search, promo, browse categories, discover rotiserías.

**Layout:** Single-column mobile screen, max content width ~402px (mobile-first, scales to any viewport). Structure top to bottom:
1. Fixed-style header (red)
2. Search field
3. Promo banner (bento card)
4. Categories (horizontal scroll)
5. Filter chips (horizontal scroll)
6. "Rotiserías destacadas" — one large featured card + 2-column grid of smaller cards
7. Floating cart button (FAB), bottom-right, above nav
8. Bottom navigation bar (4 items)

**Components:**

- **Header** — background `#D32F2F`, padding 16px/18px, flex row space-between.
  - Left: map-pin icon (white, 22px) + stacked text: "VicuñaYa" (800 weight, 15px, white) / "Vicuña Mackenna, Córdoba" (500, 11.5px, white 85% opacity)
  - Right: search icon button (white, 20px, circular tap target 38px)

- **Search field** — white background, 46px height, 14px border-radius, border `#EDE3E1`, subtle shadow, search icon inset left, placeholder "Buscar comidas, bebidas o tiendas..." (14px, `#241F1D`)

- **Promo banner** — 190px tall, 20px border-radius, background photo (repartidor/motorcycle delivery image) with a left-to-right gradient overlay: `rgba(211,47,47,0.88)` at 12% to `rgba(183,28,28,0.28)` at 60% (base colors #D32F2F → #B71C1C, alpha tuned so the photo shows through). Content bottom-aligned: headline "¿Tenés un negocio?" (800, 22px, white), subtext "Llegá a miles de vecinos con VicuñaYa." (500, 13px, white 90%), white pill button "¡Sumate a VicuñaYa!" (text color `#D32F2F`, 700 weight, 13px, 10px/18px padding, full radius).

- **Categories** — section header "Categorías" (800, 16.5px) + "Ver todas" link (`#D32F2F`, 700, 12.5px). Horizontal scroll row of icon tiles, 60×60px, 18px radius: Todo, Empanadas, Pizza, Bebidas, Lomitos, Pastelerías.
  - Todo (active state): filled `#D32F2F` background, white icon, colored shadow
  - Others: white background, `#D32F2F` icon, 1px border `#E9D5D8`
  - Label under each icon, 11.5px, 700/600 weight
  - **Icons are Material Symbols Outlined** (not custom SVG/lucide for this section) — weight 400, grade 0, optical size 24, color `#D32F2F`. Exact icon names: Todo → `restaurant`, Empanadas → `bakery_dining`, Pizza → `local_pizza`, Bebidas → `local_bar`, Lomitos → `lunch_dining`, Pastelerías → `cake`.

- **Filter chips** — horizontal scroll, pill buttons: "Relevancia" (with tune + chevron icons, white bg), "Todos" (active, `#D32F2F` bg, white text), "Rotisería", "Empanadas" (white bg, `#5B5450` text). All 8-9px vertical padding, full radius.

- **Featured rotisería card** — white card, 20px radius, 1px border `#E9D5D8`, subtle shadow.
  - Photo header 170px tall (real food photo), "Abierto" pill badge top-left (`#2E7D32` bg, white text, small dot + uppercase label), circular logo avatar (60px, dark bg, white text, 4px white border) overlapping bottom-left of photo.
  - Body: name (800, 16px), rating row (star icon + "4.9 (100+) · 30-45 min · $500 envío", 12.5px, `#8A8580`), heart/favorite icon button (outlined circle, 38px) on the right.

- **Grid of 2 smaller store cards** — 2-column grid, 12px gap. Each: white bg, 18px radius, 1px border `#E9D5D8`, square photo (14px radius), name (700, 13.5px), rating+time line (11.5px, `#8A8580`).

- **FAB cart button** — 52px circle, `#D32F2F` bg, white 2px border, shadow, cart icon (white) + small dark badge with item count (top-right, 18px circle).

- **Bottom nav** — white bg, top border `#E9D5D8`, 4 items evenly spaced: Inicio (active, `#D32F2F` icon+label), Pedidos, Mis Turnos, Perfil (all inactive `#B7B0A8`). Icons 22px, labels 10.5px/600-700 weight.

## Interactions & Behavior
- Search field: standard text input, triggers search/filter of listings on submit/typing.
- Category tiles: tap to filter store listings by category; one active state at a time (currently "Delivery").
- Filter chips: tap to toggle active filter; "Todos" active by default.
- Featured/grid cards: tap navigates to store detail page.
- Favorite (heart) icon: toggles saved/favorite state for that store.
- FAB cart: navigates to cart/checkout, badge reflects item count.
- Bottom nav: standard tab navigation between Inicio / Pedidos / Notificaciones / Perfil.
- Horizontal scroll sections (banner carousel, categories, chips) use native scroll with hidden scrollbars; no snap-required behavior beyond smooth scroll.

## State Management
- Selected delivery address (shown in header — currently static, should be user-selectable/editable elsewhere)
- Active category filter
- Active list filter (chip)
- Cart item count (badge)
- Store favorite/saved toggle per store
- Store data: name, photo, rating, review count, delivery time range, delivery fee, open/closed status

## Design Tokens

**Colors — "Crimson Vitality" system**
- Primary red: `#D32F2F`
- Banner gradient end (dark red): `#B71C1C`
- Success/open green: `#2E7D32`
- Text dark: `#241F1D`
- Text secondary: `#8A8580` / `#5B5450`
- Text muted (inactive nav): `#B7B0A8`
- Borders (surface-dim): `#E9D5D8` — 1px solid, used on cards, category tiles, bottom nav top border
- Background/surface: `#FFF8F8`
- Page/canvas background (outside app frame, prototype only): oklch(0.94 0.004 60)
- White: `#FFFFFF`

**Typography**
- Font family: Plus Jakarta Sans (weights 400/500/600/700/800), Google Fonts
- Header title: 15px/800
- Section headers: 16.5px/800
- Body/labels: 11.5–14px, 500–700
- Banner headline: 22px/800

**Spacing/Radius**
- Screen padding: 18px horizontal
- Card radius: 18–20px
- Chip/button radius: full (99px)
- Icon tile radius: 18px
- Section vertical rhythm: ~16–22px between sections

**Shadows**
- Cards: `0 4px 14px rgba(0,0,0,0.06)`
- FAB: `0 6px 16px rgba(255,59,92,0.4)`

## Assets
- Icons: mostly hand-coded inline SVGs in a lucide (outline, 2px stroke) style — no emoji used. Recreate general UI icons with `lucide-react` (or equivalent): map-pin, search, shopping-bag, calendar-check, package, car, tune/sliders, chevron-down, star, clock, heart, shopping-cart, home, receipt, user.
- **Category icons are the exception** — use **Material Symbols Outlined** (weight 400, grade 0, optical size 24), color `#D32F2F`: `restaurant`, `bakery_dining`, `local_pizza`, `local_bar`, `lunch_dining`, `cake`.
- Photos: temporary stock placeholders (Unsplash) for the promo banner (delivery motorcycle) and store cards (rotisería/roast food, empanadas, parrilla). Replace with real photography/CDN assets before production.

## Files
- `VicuñaYa Home.dc.html` — full design reference for this screen.
