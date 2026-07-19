# Kyvra — Technical Documentation

> Formerly named **VicuñaYa**. Rebrand completed July 2026.  
> Last updated: 2026-07-18

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Supabase — Database & Backend](#4-supabase--database--backend)
5. [Authentication](#5-authentication)
6. [Business Logic](#6-business-logic)
7. [APIs and Integrations](#7-apis-and-integrations)
8. [Current UI](#8-current-ui)
9. [Pending Work](#9-pending-work)
10. [Recommendations](#10-recommendations)

---

## 1. Project Overview

### Purpose

Kyvra is a **local super-app** for the town of **Vicuña Mackenna, Córdoba, Argentina**. It consolidates four services in a single Progressive Web App:

| Service | What it does |
|---|---|
| **Delivery** | Food ordering from local restaurants with real-time order tracking |
| **Turnos** | Appointment booking at local businesses (barbershops, salons, clinics, etc.) |
| **Encomiendas** | Package shipping/retrieval between Vicuña Mackenna and Río Cuarto |
| **Remises** | Ride-hailing with live driver location on a Mapbox map |

The platform is a geographic monopoly: it is designed exclusively for Vicuña Mackenna and surrounding area (18 km radius). Geo-restriction enforcement exists in the code but is currently disabled (`GEO_RESTRICTION_ENABLED = false`).

### Main Features

**For customers:**
- Google OAuth or email/password login
- Real-time order status with push notifications
- Appointment booking and calendar reminder
- In-app chat with parcel company
- Saved addresses with Google Places autocomplete
- Push notification opt-in for order updates

**For business operators:**
- Restaurant order management dashboard with audio alerts
- Menu item management (categories, extras, pricing)
- Appointment calendar with daily agenda view
- Professional/staff management with working hours
- Parcel dispatch panel with route optimization
- Financial earnings reports

**For platform admin:**
- Cross-restaurant order analytics
- Restaurant and business management
- Promotional banner management
- Raffle/sorteo feature

### User Roles

| Role | Access | Entry point |
|---|---|---|
| **Customer** | Full app (Hub, delivery, turnos, encomiendas, remises) | `/welcome` |
| **Restaurant owner** | Restaurant panel (`/restaurant/panel/*`) | `/restaurant/login` |
| **Turnos business owner** | Turnos panel (`/turnos/panel/*`) | `/turnos/panel/login` |
| **Encomiendas operator** | Encomiendas panel (`/encomiendas/panel/*`) | `/encomiendas/panel/login` |
| **Admin** | Admin panel (`/admin/*`) | `/admin/login` |
| *(Driver)* | Driver dashboard — **not yet active** | `/driver/login` (unwired) |

---

## 2. Folder Structure

```
packages/delivery/
├── api/                        # Vercel Serverless Functions
│   ├── notify-client.js        # Sends push notification on order status change
│   ├── appointment-reminders.js# Vercel cron job: daily appointment reminders
│   ├── places.js               # Proxy for Google Places Autocomplete API
│   └── geocode.js              # Proxy for Google Maps Geocoding API
│
├── public/                     # Static assets served as-is
│   ├── sw.js                   # Service Worker (PWA caching + push handler)
│   ├── manifest.json           # PWA manifest (name: Kyvra, theme: standalone)
│   ├── icon.svg                # App icon (SVG)
│   ├── icon-192.png            # PWA icon 192×192
│   ├── favicon-32.png          # Browser favicon
│   ├── _redirects              # Netlify-style SPA fallback
│   └── sounds/
│       └── ding.wav            # Audio alert for restaurant panel (new order)
│
├── src/
│   ├── main.jsx                # App entry point; mounts <App /> to #root
│   ├── App.jsx                 # Router, lazy routes, provider tree, guards
│   ├── screen.png              # Background hero image (Welcome + SplashScreen)
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx     # Session, profile, profileComplete, loading
│   │   └── GeoContext.jsx      # Geographic restriction state
│   │
│   ├── contexts/               # Panel-specific contexts (note: different folder)
│   │   ├── RestaurantContext.js
│   │   └── TurnosNegocioContext.js
│   │
│   ├── store/                  # Zustand stores (persisted to localStorage)
│   │   ├── cartStore.js        # Shopping cart (items, restaurant, method)
│   │   └── profileStore.js     # Legacy profile cache (name, phone, address)
│   │
│   ├── lib/                    # Shared utilities and service clients
│   │   ├── supabase.js         # Supabase client, MAP_CENTER, FARE constants
│   │   ├── pushNotifications.js# SW registration, VAPID subscription, upsert
│   │   ├── restaurantUtils.js  # isRestaurantOpen() with dual-shift support
│   │   ├── sounds.js           # playNotificationBell() audio utility
│   │   ├── placesScript.js     # Google Places API script loader
│   │   └── profileStore.js     # (duplicate/legacy — see store/profileStore.js)
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNotifications.js # Fetch + realtime subscribe to notifications table
│   │   └── usePendingOrdersAlert.js # Audio + tab title alert for restaurant panel
│   │
│   ├── pages/                  # Route-level components (all lazy-loaded)
│   │   ├── Welcome.jsx         # Auth: login, signup, forgot password
│   │   ├── Hub.jsx             # Main hub: service selector (4 cards + carousel)
│   │   ├── Home.jsx            # Delivery: restaurant listing + filters
│   │   ├── Restaurant.jsx      # Restaurant detail + menu
│   │   ├── Cart.jsx            # Cart review + delivery/pickup toggle
│   │   ├── Checkout.jsx        # Order placement + address + payment
│   │   ├── OrderTracking.jsx   # Live order status with realtime updates
│   │   ├── Orders.jsx          # Order history (orders + trips)
│   │   ├── Turnos.jsx          # Appointment businesses listing
│   │   ├── TurnoNegocio.jsx    # Appointment booking for a specific business
│   │   ├── MisTurnos.jsx       # Customer's appointments with cancel + calendar
│   │   ├── Encomiendas.jsx     # Package delivery: form + chat + tracking
│   │   ├── Remises.jsx         # Ride-hailing: Mapbox map + driver markers
│   │   ├── Profile.jsx         # User profile editor + push opt-in
│   │   ├── Addresses.jsx       # Saved addresses CRUD
│   │   ├── CompleteProfile.jsx # New-user profile completion form
│   │   ├── GoogleCallback.jsx  # OAuth redirect handler
│   │   ├── ResetPassword.jsx   # Password reset form
│   │   ├── Anunciate.jsx       # Business lead capture form
│   │   ├── Legal.jsx           # Terms & conditions (static)
│   │   ├── BannerDetail.jsx    # Dynamic promotional banner detail
│   │   ├── Sorteo.jsx          # Raffle page
│   │   │
│   │   ├── admin/              # Admin panel pages
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminRestaurants.jsx
│   │   │   ├── AdminTurnosNegocios.jsx
│   │   │   ├── MenuManagement.jsx
│   │   │   ├── Earnings.jsx
│   │   │   └── Banners.jsx
│   │   │
│   │   ├── restaurant/         # Restaurant operator panel pages
│   │   │   ├── RestaurantLogin.jsx
│   │   │   ├── Dashboard.jsx   # Live order board with audio alerts
│   │   │   ├── Menu.jsx        # Menu item management
│   │   │   ├── Profile.jsx     # Restaurant info editor
│   │   │   └── Earnings.jsx
│   │   │
│   │   ├── turnos-panel/       # Appointment business panel pages
│   │   │   ├── TurnosPanelLogin.jsx
│   │   │   ├── Agenda.jsx      # Daily appointment calendar
│   │   │   ├── Servicios.jsx
│   │   │   ├── Profesionales.jsx
│   │   │   ├── Horarios.jsx
│   │   │   └── MiNegocio.jsx
│   │   │
│   │   ├── encomiendas-panel/  # Parcel dispatch panel pages
│   │   │   ├── EncomiendaPanelLogin.jsx
│   │   │   ├── EncomiendaPanel.jsx  # Dispatch board + route optimizer + chat
│   │   │   └── EncomiendaConfig.jsx # Business hours + conditions config
│   │   │
│   │   └── driver/             # INACTIVE — driver module
│   │       ├── DriverLogin.jsx
│   │       └── DriverDashboard.jsx
│   │
│   └── components/             # Shared reusable components
│       ├── AdminGuard.jsx
│       ├── AdminLayout.jsx
│       ├── BottomNav.jsx
│       ├── CartPanel.jsx
│       ├── CategoryGrid.jsx
│       ├── CustomerGate.jsx
│       ├── DriverGuard.jsx     # INACTIVE
│       ├── EncomiendaPanelGuard.jsx
│       ├── GeoGate.jsx
│       ├── HeroCarousel.jsx
│       ├── MainLayout.jsx
│       ├── MenuItem.jsx
│       ├── Navbar.jsx          # Legacy top navbar (not used in main layout)
│       ├── NotificationsPanel.jsx
│       ├── OwnerAccessModal.jsx
│       ├── PaymentMethod.jsx
│       ├── PaymentSelector.jsx
│       ├── PlacesInput.jsx
│       ├── ProductModal.jsx
│       ├── RestaurantCard.jsx
│       ├── RestaurantGuard.jsx
│       ├── RestaurantLayout.jsx
│       ├── SplashScreen.jsx
│       ├── TurnosPanelGuard.jsx
│       ├── TurnosPanelLayout.jsx
│       └── UpdateBanner.jsx
│
├── index.html                  # HTML shell; title: "Kyvra"; no-cache meta headers
├── vite.config.js              # Vite 5; port 3000; version.json plugin
├── vercel.json                 # Build config, cron, SPA rewrite, cache headers
├── package.json                # v0.1.1; React 18 + Vite 5 + Supabase + Zustand
└── tailwind.config.js          # Tailwind (used in admin/restaurant panels)
```

---

## 3. Frontend Architecture

> **Note:** The app is built with **React 18 + Vite**, not Flutter. The section heading is preserved from the documentation request, but all content below reflects the actual React architecture.

### Technology Stack

| Concern | Library / Version |
|---|---|
| UI framework | React 18.3.1 |
| Build tool | Vite 5.4.0 |
| Router | React Router DOM 6.26.0 |
| Animations | Framer Motion 11.3 |
| Icons | Lucide React 0.427 |
| State (global) | Zustand 4.5 with `persist` middleware |
| Styling | Inline styles (primary) + Tailwind CSS 3.4 (panels) |
| Maps | Mapbox GL 3.24 (Remises), Leaflet 1.9.4 (legacy) |
| Carousel | Swiper 11.1 |
| Toasts | React Hot Toast 2.4.1 |
| Backend client | @supabase/supabase-js 2.45 |

### Navigation

All routes are defined in `src/App.jsx` using React Router v6. Every page component is **lazy-loaded** with `React.lazy()` and wrapped in a `<Suspense>` boundary, minimizing the initial bundle.

**Provider tree (outermost → innermost):**
```
<BrowserRouter>
  <AuthProvider>         ← session + profile
    <GeoProvider>        ← geographic restriction state
      <Suspense>
        <Routes />       ← all route definitions
      </Suspense>
    </GeoProvider>
  </AuthProvider>
</BrowserRouter>
```

**Route guards (HOC-style wrappers):**

| Guard | What it checks | On failure |
|---|---|---|
| `CustomerGate` | Valid session + `profileComplete` | → `/welcome` or `/complete-profile` |
| `GeoGate` | `geoState === 'inZone'` | → `/` (Hub) |
| `AdminGuard` | Session (email/password, checked via admin table logic) | → `/admin/login` |
| `RestaurantGuard` | Session + `restaurants.owner_id` match | → `/restaurant/login` |
| `TurnosPanelGuard` | Session + `appointment_businesses.owner_id` match | → `/turnos/panel/login` |
| `EncomiendaPanelGuard` | Session + `empresas_encomiendas.auth_user_id` match | → `/encomiendas/panel/login` |
| `DriverGuard` | Session (driver role) — **currently inactive** | → `/driver/login` |

### State Management

The app uses **two layers** of state:

**Layer 1 — React Context (server state + auth):**

| Context | State provided |
|---|---|
| `AuthContext` | `session`, `profile` (all profile fields), `profileComplete` (bool), `loading`, `refreshProfile()` |
| `GeoContext` | `geoState`: `'loading' \| 'inZone' \| 'outZone' \| 'denied'` |
| `RestaurantContext` | Single `restaurant` row (for restaurant panel) |
| `TurnosNegocioContext` | Single `negocio` row (for turnos panel) |

**Layer 2 — Zustand (client-only persistent state):**

| Store | Persisted key | State |
|---|---|---|
| `cartStore` | `vicunaya-delivery-cart` | Cart items, restaurant identity, fulfillment method |
| `profileStore` | `vicunaya-profile` | Legacy name/phone/address cache |

All Supabase data queries are done **inline** inside components (no dedicated data-fetching layer). Realtime subscriptions are also set up inside `useEffect` hooks directly in the consuming component.

### Services

There is no dedicated services layer. The Supabase client is exported from `src/lib/supabase.js` and called directly from components and hooks. The only abstracted services are:

- `src/lib/pushNotifications.js` — encapsulates SW registration and VAPID subscription logic
- `src/lib/restaurantUtils.js` — `isRestaurantOpen()` helper with dual-shift support
- `src/lib/sounds.js` — audio playback abstraction
- `api/` — four Vercel serverless functions acting as a thin server-side layer for sensitive operations

### Reusable Components

**Layout components:**
- `MainLayout` — top header (auto-hides on scroll) + `BottomNav` + `NotificationsPanel` + `CartPanel`. Used for all customer-facing pages.
- `AdminLayout` — sidebar + content for admin panel.
- `RestaurantLayout` — sidebar + content for restaurant panel.
- `TurnosPanelLayout` — sidebar + content for turnos panel.

**UI primitives:**
- `BottomNav` — floating pill-shaped bottom navigation bar. 5 tabs: Inicio, Pedidos, Turnos, Mis Turnos, Perfil. Uses Framer Motion `layoutId="island-pill"` for animated active indicator.
- `HeroCarousel` — Swiper-based image carousel used in Hub and Home.
- `ProductModal` — bottom-sheet modal for item quantity and extras selection.
- `PlacesInput` — address autocomplete using Google Places API via serverless proxy.
- `UpdateBanner` — polls `/version.json` every 5 minutes; shows reload prompt if the deployed version differs from the running version.
- `SplashScreen` — 5-second intro animation on first session load. Uses sessionStorage to show only once.

**Guards** are documented in the Navigation section above.

---

## 4. Supabase — Database & Backend

### Connection

```
URL:  https://hvmdumuedqfoifgayleh.supabase.co
Anon key: VITE_SUPABASE_ANON_KEY (exposed to frontend — safe)
Service role key: SUPABASE_SERVICE_ROLE_KEY (server-only, Vercel env)
```

No `supabaseAdmin` client exists in the frontend. The service role key is used only in `api/notify-client.js` and `api/appointment-reminders.js`.

### Database Tables

No migration files are present in the project repository. The schema below is inferred entirely from frontend queries. All tables use the Supabase default `uuid` primary keys and `timestamptz` timestamps unless noted.

---

#### `profiles`

Extends `auth.users`. Created automatically on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users.id` |
| `nombre` | text | |
| `apellido` | text | |
| `dni` | text | |
| `telefono` | text | |

`profileComplete` is computed in frontend: all four fields must be non-empty.

---

#### `restaurants`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `category` | text[] | Array of category tags |
| `description` | text | |
| `tags` | text[] | Display tags (e.g., "Nuevo", "Popular") |
| `image_url` | text | |
| `cover_position` | text | CSS `object-position` override |
| `is_active` | bool | Controls visibility in listing |
| `owner_id` | uuid | FK → `auth.users.id` |
| `rating` | numeric | |
| `delivery_time` | int | Minutes |
| `delivery_price` | numeric | ARS |
| `opening_time` | time | Primary shift open |
| `closing_time` | time | Primary shift close |
| `opening_time_2` | time | Secondary shift (optional) |
| `closing_time_2` | time | Secondary shift (optional) |
| `is_open_override` | bool | Manual "open now" override for primary shift |
| `is_open_override_2` | bool | Manual override for secondary shift |
| `pickup_address` | text | Address displayed for pickup orders |

---

#### `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` (customer) |
| `restaurant_id` | uuid | FK → `restaurants.id` |
| `total` | numeric | ARS |
| `order_status` | text | `pending` / `accepted` / `preparing` / `ready` / `delivered` / `rejected` |
| `delivery_method` | text | `delivery` / `pickup` |
| `customer_phone` | text | Denormalized from profile at order time |
| `client_push_subscription` | jsonb | Web Push subscription object for this order |
| `created_at` | timestamptz | |

The `client_push_subscription` is stored per-order (not per-user) so the notification is sent to the device that placed the order.

---

#### `addresses`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `label` | text | `Casa` / `Trabajo` / `Otro` |
| `address` | text | Free-text address string |
| `notes` | text | Delivery instructions |
| `is_default` | bool | Defaults to this address in checkout |

---

#### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `leida` | bool | Read flag |
| `created_at` | timestamptz | |

Notifications body/title columns not confirmed from code (notification panel reads all columns via `select('*')`).

---

#### `push_subscriptions`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK/unique | FK → `auth.users.id` |
| `subscription` | jsonb | Web Push subscription object |

Used for appointment reminders (one subscription per user). Separate from the per-order subscription in `orders.client_push_subscription`.

---

#### `leads`

| Column | Type | Notes |
|---|---|---|
| `nombre` | text | |
| `apellido` | text | |
| `telefono` | text | |
| `negocio` | text | Type of business interested in joining |

Inserted from `/anunciate` page. No `id` or `created_at` confirmed.

---

#### `encomiendas`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `empresa_id` | uuid | FK → `empresas_encomiendas.id`. Hardcoded in frontend: `5c5ce5e7-25b8-4e53-be85-05af7a85a224` |
| `user_id` | uuid | FK → `auth.users.id` (customer who requested) |
| `cliente_nombre` | text | |
| `cliente_telefono` | text | |
| `telefono_destinatario` | text | Recipient phone |
| `tipo` | text | `enviar` (send from VM to RC) / `traer` (bring from RC to VM) |
| `descripcion` | text | Package contents description |
| `peso` | text | Weight |
| `dimensiones` | text | Dimensions |
| `direccion_origen` | text | Pickup address |
| `direccion_destino` | text | Delivery address |
| `fecha_envio` | date | Scheduled dispatch date |
| `franja_horaria` | text | Time window |
| `estado` | text | `pendiente` / `presupuestado` / `confirmado` / `en_camino` / `entregado` / `cancelado` |
| `codigo` | text | Tracking code |
| `foto_url` | text | Package photo from `encomiendas-fotos` storage bucket |
| `created_at` | timestamptz | |

---

#### `presupuestos_encomienda`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `encomienda_id` | uuid | FK → `encomiendas.id` |
| `monto` | numeric | Quote amount (ARS) |
| `mensaje` | text | Quote message from operator |
| `estado` | text | `pendiente` / `aceptado` / `rechazado` |

---

#### `mensajes_encomienda`

In-app chat messages between customer and encomienda operator.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `encomienda_id` | uuid | FK → `encomiendas.id` |
| `remitente` | text | `cliente` / `empresa` |
| `mensaje` | text | |
| `leido` | bool | Read flag |
| `created_at` | timestamptz | |

---

#### `empresas_encomiendas`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | text | Business name |
| `auth_user_id` | uuid | FK → `auth.users.id` (operator login) |
| `activo` | bool | |

---

#### `config_encomiendas`

| Column | Type | Notes |
|---|---|---|
| `empresa_id` | uuid PK/FK | FK → `empresas_encomiendas.id` |
| `dias_trabajo` | text[] | Working day names |
| `horario_recepcion_desde` | time | Pickup window start |
| `horario_recepcion_hasta` | time | Pickup window end |
| `horario_entrega_desde` | time | Delivery window start |
| `horario_entrega_hasta` | time | Delivery window end |
| `direccion_deposito` | text | Warehouse address |
| `condiciones_deposito` | text | Drop-off terms shown to customer |
| `condiciones_retiro` | text | Pickup terms shown to customer |

---

#### `appointment_businesses`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `owner_id` | uuid | FK → `auth.users.id` |
| `is_active` | bool | |
| `category` | text | One of: `peluqueria`, `barberia`, `estetica`, `unas`, `spa`, `taller`, `medico`, `veterinaria`, `gimnasio`, `lavadero`, `otro` |

---

#### `appointment_professionals`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid | FK → `appointment_businesses.id` |
| `name` | text | |
| `avatar_url` | text | |
| `is_active` | bool | |

---

#### `appointments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid | FK → `appointment_businesses.id` |
| `customer_user_id` | uuid | FK → `auth.users.id` |
| `date` | date | Appointment date |
| `start_time` | time | |
| `status` | text | `pending` / `confirmed` / `cancelled` / `completed` |
| `reminder_sent` | bool | True after cron sends push notification |

---

#### `drivers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `is_active` | bool | |
| *(geolocation)* | — | Specific column names not confirmed |

Used by `Remises.jsx` to display driver markers on Mapbox map.

---

#### `trips`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `status` | text | `searching` / `accepted` / `in_progress` / `completed` / `cancelled` |
| `customer_phone` | text | |

Shown in `Orders.jsx` alongside food orders. Full schema not confirmed.

---

### Storage Buckets

| Bucket | Purpose |
|---|---|
| `encomiendas-fotos` | Package photos uploaded by customers during encomienda request |
| `IMAGES` | General-purpose public image hosting (restaurant images, banners, etc.) |

### Edge Functions (Supabase)

Only one Edge Function is invoked from the frontend, and it is deployed directly to Supabase (not in this repository):

| Function | Invoked from | Purpose |
|---|---|---|
| `send-email` | `Welcome.jsx` (signup) | Sends email confirmation via **Resend** when Supabase SMTP is not configured |

### Realtime Channels

| Channel name pattern | Used in | Purpose |
|---|---|---|
| `chat-empresa-{encomiendaId}` | `EncomiendaPanel.jsx` | Operator receives new messages |
| `chat-cliente-{encomiendaId}` | `Encomiendas.jsx` | Customer receives new messages |
| `unread-badge-empresa` | `EncomiendaPanel.jsx` | Unread badge counter for operator |
| `unread-badge-cliente` | `Encomiendas.jsx` | Unread badge counter for customer |
| `encomiendas-estado` | `EncomiendaPanel.jsx` | Status change alerts |
| `notif-{userId}` | `useNotifications` hook | Customer notification bell |
| Orders table Realtime | `OrderTracking.jsx` | Live order status updates |

### Row Level Security

RLS is enabled (confirmed from past audit commits). Key policies known:

- `encomiendas.user_id` is enforced for customer-side UPDATE operations (allows customers to update only their own parcels, e.g., accepting/rejecting quotes).
- `profiles` is readable and writable by the owning user.
- `addresses` is scoped to the owning user.
- `orders` insert is allowed for authenticated users; updates are restricted (status changes go through restaurant panel or admin).

Full RLS policy definitions are not in this repository. Policies are managed directly in the Supabase dashboard.

### Indexes

No explicit index definitions found in the repository. Supabase creates indexes on:
- All primary keys (automatic)
- All foreign keys (recommended)

Columns frequently used in WHERE clauses that likely need indexes:
- `orders.user_id`, `orders.restaurant_id`, `orders.order_status`
- `encomiendas.empresa_id`, `encomiendas.estado`
- `appointments.business_id`, `appointments.date`, `appointments.customer_user_id`
- `mensajes_encomienda.encomienda_id`
- `notifications.user_id`

---

## 5. Authentication

### Login Flow

**Google OAuth:**
1. User taps "Continuar con Google" on `Welcome.jsx`
2. `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: origin/auth/callback })`
3. Browser redirects to Google, returns to `/auth/callback`
4. `GoogleCallback.jsx` calls `supabase.auth.getSession()`
5. If no profile fields → redirect to `/complete-profile`; else → redirect to `/`

**Email/Password:**
1. User fills email + password on `Welcome.jsx` (signup or login mode)
2. **Signup**: calls `supabase.auth.signUp()`. If no session returned (email not confirmed), invokes `send-email` Edge Function (Resend) to send confirmation link. If email already confirmed, switches to login mode.
3. **Login**: calls `supabase.auth.signInWithPassword()`
4. On success, `AuthContext.onAuthStateChange` fires, fetches `profiles` row, updates state
5. Router re-evaluates guard conditions → routes to `/complete-profile` or `/`

**Password Reset:**
1. User requests reset from "¿Olvidaste tu contraseña?" link in `Welcome.jsx`
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://vicunaya-delivery.vercel.app/reset-password' })`
3. User clicks link in email → lands on `/reset-password`
4. `ResetPassword.jsx` calls `supabase.auth.updateUser({ password: newPassword })`

**Panel logins (restaurant, admin, turnos, encomiendas):**
All panel logins use Supabase email/password auth (`signInWithPassword`), but access is further gated by the route guard checking an ownership record in the relevant table.

### User Roles and Permissions

There is no database-level role column. Roles are implemented by:
- **Customer**: any authenticated user with a complete profile
- **Restaurant owner**: authenticated user whose `id` matches `restaurants.owner_id`
- **Turnos owner**: authenticated user whose `id` matches `appointment_businesses.owner_id`
- **Encomiendas operator**: authenticated user whose `id` matches `empresas_encomiendas.auth_user_id`
- **Admin**: implemented in the `AdminGuard` (exact mechanism — table lookup or hardcoded email — not fully confirmed from code)

---

## 6. Business Logic

### Order Flow (Delivery)

```
Customer                     Restaurant Panel              Supabase
   |                               |                           |
   |── Browse /delivery ──────────────────────────────────────>|
   |<── restaurants (is_active=true) ──────────────────────────|
   |                               |                           |
   |── Select items ──► Cart ──────────────────────────────────|
   |── Checkout: address + payment method                       |
   |── INSERT orders (status: pending) ─────────────────────>|
   |── subscribeClientForOrder() ─────────────────────────────>|  (stores push subscription on order row)
   |<── Redirect to /pedido/:id ───────────────────────────────|
   |                               |                           |
   |                               |<── Realtime INSERT event ─|
   |                               |── Audio alert (ding.wav)  |
   |                               |── Accept/Reject order     |
   |                               |── UPDATE order_status ──>|
   |                               |── POST /api/notify-client |──► Push notification to customer
   |                               |                           |
   |<── OrderTracking realtime update ─────────────────────────|
```

**Order statuses and display labels:**

| DB value | Customer display | Restaurant display |
|---|---|---|
| `pending` | "En espera" | New order alert |
| `accepted` | "Aceptado" | Accepted |
| `preparing` | "En preparación" | Preparing |
| `ready` | "¡Listo!" (delivery) / "Pasá a buscarlo" (pickup) | Ready |
| `delivered` | "Entregado" | Delivered |
| `rejected` | "Rechazado" | Rejected |

**Time-limited modifications:**
- Customers have a **5-minute window** to change their delivery address after placing an order.
- Customers have a **3-minute window** to add items to their order after placing it.

### Delivery Flow (Fare Calculation)

Constants defined in `src/lib/supabase.js`:
- Base fare: **ARS 800**
- Per-km rate: **ARS 350**
- Map center (for distance calculation): **`[-33.9086, -64.3791]`** (Vicuña Mackenna)

Fare is calculated from the restaurant's location to the customer's address using Haversine distance (same formula as geo-restriction check).

### Appointment Booking Flow (Turnos)

```
Customer                          Turnos Panel              Supabase
   |                               |                           |
   |── Browse /turnos ─────────────────────────────────────>|
   |<── appointment_businesses (is_active=true) ───────────────|
   |── Select business → /turnos/:id                           |
   |── View availability grid (by professional + date)         |
   |── Select slot + confirm ──── INSERT appointments ──────>|
   |<── Confirmation screen ───────────────────────────────────|
   |                               |                           |
   |                               |── View in Agenda.jsx      |
   |                               |── Confirm / Cancel / Complete
   |── /mis-turnos: list own appointments                      |
   |── "Agregar a Google Calendar" button                      |
   |                               |                           |
   [Vercel cron at 11:00 UTC daily]                            |
   |<── Push notification "Tenés un turno hoy a las HH:MM"    |
```

Customers can cancel their own future appointments from `/mis-turnos`.

The Turnos panel operator can also create appointments directly from the `Agenda.jsx` panel without requiring the customer to have an account ("assign without customer registration").

### Parcel Delivery Flow (Encomiendas)

```
Customer                       Encomiendas Panel              Supabase
   |                               |                           |
   |── /encomiendas: fill form ────────────────────────────>|
   |   (tipo: enviar/traer, package details, date, photo)      |
   |── INSERT encomiendas (estado: pendiente) ──────────────>|
   |                               |                           |
   |                               |<── Realtime alert ────────|
   |                               |── View in dispatch panel  |
   |                               |── INSERT presupuesto ──>|  (quote: monto + mensaje)
   |                               |── UPDATE estado: presupuestado
   |                               |                           |
   |<── Chat message / estado change ──────────────────────────|
   |── Accept / reject quote                                    |
   |── UPDATE presupuesto.estado ──────────────────────────>|
   |── UPDATE encomienda.estado: confirmado ────────────────>|
   |                               |                           |
   |                               |── Day-of dispatch view    |
   |                               |── Google route optimization (Directions API)
   |                               |── UPDATE estado: en_camino / entregado
   |                               |                           |
   |<── Status updates via realtime ───────────────────────────|
```

**Encomienda statuses:**

| Status | Meaning |
|---|---|
| `pendiente` | Submitted, awaiting quote |
| `presupuestado` | Operator sent a price quote |
| `confirmado` | Customer accepted the quote |
| `en_camino` | Package in transit |
| `entregado` | Delivered |
| `cancelado` | Cancelled |

The dispatch panel includes route optimization: on the day of delivery, the operator can get a Google Maps Directions URL with optimized waypoint ordering for all the day's confirmed encomiendas.

Each encomienda has a unique `codigo` (tracking code) for identification.

### Payments

The app currently supports **three payment methods** at checkout:

| Method | Implementation |
|---|---|
| Efectivo (cash) | Selected in UI, no integration needed |
| Transferencia (bank transfer) | Selected in UI, no integration needed |
| Tarjeta (card) | UI option exists but MercadoPago is **not yet integrated** (`VITE_MP_PUBLIC_KEY` is empty) |

MercadoPago integration is prepared but not implemented. No payments are processed programmatically today.

---

## 7. APIs and Integrations

### Supabase

| Feature | Usage |
|---|---|
| Auth | Email/password, Google OAuth |
| Database | All tables (Postgres) |
| Realtime | Order tracking, encomienda chat, notifications |
| Storage | `encomiendas-fotos`, `IMAGES` |
| Edge Functions | `send-email` (deployed to Supabase, not in repo) |
| RLS | Enabled on all customer-facing tables |

### Google APIs

| API | Used where | Proxy |
|---|---|---|
| Places Autocomplete (v1) | `PlacesInput.jsx` (address fields) | `api/places.js` |
| Maps Geocoding | Address→coordinates | `api/geocode.js` |
| Maps Directions | Encomienda route optimization | `EncomiendaPanel.jsx` (direct call) |
| Maps JS API | Driver map in `Remises.jsx` | `src/lib/placesScript.js` |

The Places and Geocoding APIs are proxied through Vercel serverless functions to avoid exposing the API key in frontend code. The Directions API call in `EncomiendaPanel.jsx` appears to use the key directly — this is a security concern (see section 9).

All Google APIs are restricted by the environment variable `VITE_GOOGLE_PLACES_API_KEY`.

Location bias for Places Autocomplete: circle centered at `[-34.1588, -64.3764]` with 8 km radius (Vicuña Mackenna). Input is automatically suffixed with ", Vicuña Mackenna".

### Mapbox GL

Used exclusively in `Remises.jsx` for the ride-hailing map:
- Dark theme map
- 3D buildings (pitch = 45°, bearing = -10°)
- Driver location markers loaded from `drivers` table
- Token: `VITE_MAPBOX_TOKEN`

### Web Push Notifications

| Component | Details |
|---|---|
| Protocol | Web Push (VAPID) |
| Keys | `VITE_VAPID_PUBLIC_KEY` (frontend), `VAPID_PRIVATE_KEY` (server) |
| Library | `web-push` 3.6.7 (server-side, in `api/` functions) |
| Service Worker | `public/sw.js` handles `push` event, shows notification, handles `notificationclick` |
| Subscription storage | `push_subscriptions` table (per-user, for appointment reminders) + `orders.client_push_subscription` (per-order, for delivery updates) |

**Notification triggers:**
1. **Order status changes** — `api/notify-client.js` called from restaurant panel Dashboard when operator changes status (accepted, preparing, ready, delivered)
2. **Appointment reminders** — `api/appointment-reminders.js` Vercel cron job runs daily at 11:00 UTC, sends "Tenés un turno hoy" push to all customers with appointments that day

Both functions clean up expired/invalid push subscriptions (HTTP 410/404 from push service → delete from DB).

### Resend (Email)

Used via the `send-email` Supabase Edge Function to send **account confirmation emails**. This was necessary because Supabase SMTP is not configured on this project. The Edge Function is not in this repository.

### Vercel

- Hosting and CI/CD (`vercel --prod`)
- Serverless Functions (`api/` folder, Node.js runtime)
- Cron Jobs (`/api/appointment-reminders` at `0 11 * * *` UTC)
- Cache headers: static assets cached 1 year immutable; HTML never cached

---

## 8. Current UI

### Design System

**Colors:**

| Token | Value | Usage |
|---|---|---|
| Primary teal | `#0D9488` | Buttons, active states, progress bars |
| Light teal | `#5EEAD4` | Gradients |
| Navy | `#0F172A` | Dark backgrounds |
| Light background | `#F8FAFC` | Panel backgrounds |
| Encomiendas accent | `#e31b23` | Encomiendas panel header only |

**Typography:**
- Primary font: **Plus Jakarta Sans** (weights 400–900) — loaded from Google Fonts
- Accent font: **Playfair Display** italic 700 — used only in SplashScreen credit text
- Letter spacing: `-0.04em` on large display headings (logo text)

**Styling approach:**
- Inline styles are the dominant pattern in customer-facing pages (Welcome, Hub, Home, Checkout, OrderTracking, Encomiendas)
- Tailwind CSS is used in older/operator-facing components (admin panel, restaurant panel, turnos panel)
- No CSS-in-JS library or CSS modules

**Motion / Animation:**
- Framer Motion for all page transitions, modals, bottom sheets
- Spring physics for bottom-sheet entrance (`y: '100%'` → `y: 0`)
- `staggerChildren` for list entrance animations
- `layoutId="island-pill"` for BottomNav active tab indicator
- 3D `rotateY` spin on SplashScreen logo

**UI Patterns:**
- Bottom sheets for modals and detail views
- Glassmorphism cards (`backdrop-filter: blur()` + `rgba` backgrounds)
- Skeleton loading placeholders (`.skeleton` CSS class)
- Floating Action Button (cart access from restaurant pages)
- Island-style pill bottom navigation

### Screens Inventory

**Onboarding / Auth:**
- `Welcome` — Login + signup + forgot password (4 internal modes)
- `CompleteProfile` — Required fields after first login
- `GoogleCallback` — OAuth redirect handler (no UI)
- `ResetPassword` — New password form

**Customer Hub:**
- `Hub` — Service selector with animated cards and banner carousel
- `SplashScreen` — First-launch animation overlay (5 seconds)

**Delivery module:**
- `Home` — Restaurant listing with category filters and sort
- `Restaurant` — Restaurant detail, menu by category, `ProductModal` for item selection
- `Cart` — Cart review, delivery/pickup toggle, totals
- `Checkout` — Address, payment method, order notes, place order
- `OrderTracking` — 4-step progress tracker, live updates, address/items edit window
- `Orders` — Order history (food + remises) with status chips

**Turnos module:**
- `Turnos` — Business listing with category filter and search
- `TurnoNegocio` — Professional selection + date/time slot picker
- `MisTurnos` — Upcoming and past appointments, cancel action, Google Calendar link

**Encomiendas module:**
- `Encomiendas` — Request form (bottom sheet), own-request tracker, in-app chat

**Remises module:**
- `Remises` — Mapbox map with live driver markers, trip request UI

**Profile / Account:**
- `Profile` — Edit personal data, push notification toggle, legal links
- `Addresses` — Saved addresses with label presets

**Content pages:**
- `Anunciate` — Business acquisition landing with lead form
- `BannerDetail` — Promotional banner detail
- `Sorteo` — Raffle page
- `Legal` — Terms and conditions

**Restaurant panel (5 screens):**
- Login → Dashboard (live order board) → Menu management → Profile editor → Earnings

**Admin panel (6 screens):**
- Login → Dashboard (stats) → Restaurants CRUD → Turnos businesses → Menu management → Earnings → Banners

**Turnos business panel (6 screens):**
- Login → Agenda (daily calendar) → Servicios → Profesionales → Horarios → Mi Negocio

**Encomiendas panel (2 screens):**
- Login → Dispatch panel (pending/day view + chat + route optimization) → Configuration

### Navigation Map

```
/welcome
  └─► /complete-profile  (if profileComplete = false)
  └─► /                  (Hub, if profileComplete = true)

/ (Hub)
  ├─► /delivery          (Home → /restaurant/:id → /carrito → /checkout → /pedido/:id)
  ├─► /turnos            (Turnos → /turnos/:id → booking)
  ├─► /encomiendas       (Encomiendas)
  └─► /remises           (Remises)

BottomNav (always visible on customer routes):
  Inicio → /
  Pedidos → /pedidos
  Turnos → /turnos
  Mis Turnos → /mis-turnos
  Perfil → /perfil → /direcciones

Admin: /admin/login → /admin/* (isolated sidebar layout)
Restaurant: /restaurant/login → /restaurant/panel/* (isolated sidebar layout)
Turnos panel: /turnos/panel/login → /turnos/panel/* (isolated sidebar layout)
Encomiendas panel: /encomiendas/panel/login → /encomiendas/panel/* (isolated sidebar layout)
```

---

## 9. Pending Work

### Features Not Finished

**Driver / Remises module:**
- `DriverLogin.jsx` and `DriverDashboard.jsx` exist but are not wired into routing.
- `RequestTrip.jsx`, `TripTracking.jsx`, and `RateDriver.jsx` exist in `src/pages/` but are not in any route.
- The Remises page shows driver markers but has no functional trip request flow.

**MercadoPago integration:**
- `VITE_MP_PUBLIC_KEY` is empty in all known environments.
- Card payment is selectable at checkout but no payment processing occurs — orders go through regardless of payment method.
- No webhook handler for payment confirmation exists.

**Menu items on orders:**
- The `orders` table schema (as inferred) does not include an `items` column with the cart contents. Whether items are stored (jsonb) or in a separate `order_items` table is not confirmed in the code. Restaurant dashboard likely needs this data to prepare orders.

**Notifications body/title:**
- The `notifications` table is read with `select('*')` but only `id`, `user_id`, `leida`, and `created_at` are confirmed. How notification text (title, body, link) is stored is not confirmed.

**Rating system:**
- `restaurants.rating` column exists but no rating submission UI was found.

**Sorteo:**
- `Sorteo.jsx` exists as a page but its full functionality is unknown from code analysis.

**Banners:**
- `BannerDetail.jsx` and `Banners.jsx` admin page exist, but the DB schema for banners and how they connect to the Hub carousel is not confirmed.

### Known Issues

**Service Worker cache name not rebranded:**
- `public/sw.js` still uses cache name `vicunaya-shell-v1`. Should be `kyvra-shell-v1` for consistency and to avoid stale cache issues if users had the old PWA installed.

**Google Directions API key exposed in frontend:**
- `EncomiendaPanel.jsx` appears to call the Google Directions API directly (not through a serverless proxy), potentially exposing `VITE_GOOGLE_PLACES_API_KEY` to the browser. This should be moved to an `api/route-optimize.js` serverless function.

**Duplicate `profileStore` files:**
- `src/lib/profileStore.js` and `src/store/profileStore.js` appear to be duplicates. The `lib/` version is likely legacy and should be removed.

**`Navbar.jsx` is unused:**
- The `Navbar.jsx` component still contains "VicuñaYa" branding and is not mounted in the current routing tree. It should either be fully rebranded or deleted.

**`Remises.jsx.bak`:**
- A `.bak` backup file exists in `src/pages/`. Backup files should not be committed.

**`profileStore` holds stale data:**
- `src/store/profileStore.js` is persisted to localStorage with the key `vicunaya-profile` (old brand name) but this is low-priority.

**Rotiserias.jsx:**
- `src/pages/Rotiserias.jsx` exists but is not routed. Likely an unused legacy module.

**GEO_RESTRICTION_ENABLED = false:**
- Geographic restriction is disabled. Any user from any location can use the app. This was likely disabled for testing but should be re-enabled before full launch (or removed if intentionally open).

### Technical Debt

- **No data-fetching abstraction**: All Supabase queries are inline in component `useEffect` hooks. There are no React Query, SWR, or custom fetch hooks to handle caching, loading states, or deduplication consistently.
- **No TypeScript**: The codebase is entirely JavaScript. No type safety on Supabase query results, component props, or store state.
- **Inline styles at scale**: The migration from Tailwind (panels) to inline styles (customer pages) is inconsistent. No design token system enforces consistency between the two approaches.
- **No error boundaries**: There are no React error boundaries to prevent a single component crash from taking down the entire app.
- **No test coverage**: No unit, integration, or end-to-end test files were found in the project.
- **Large bundle**: `Remises` chunk is 1.8 MB uncompressed (Mapbox GL is very large). This needs code splitting or lazy initialization.
- **Schema not version-controlled**: Database schema lives only in the Supabase dashboard. No migration files in the repo means schema changes are not tracked in git and cannot be reproduced in a new environment.

---

## 10. Recommendations

### Immediate Priorities

**1. Version-control the database schema.**
Set up `supabase/migrations/` folder and use the Supabase CLI (`supabase db diff`) to generate migration files from the current schema. This is the most important operational risk — if the Supabase project is lost or needs to be reproduced, there is no way to recreate the schema from this repository.

**2. Move Google Directions API call to a serverless function.**
`EncomiendaPanel.jsx` should call a new `api/route-optimize.js` function instead of the Google Directions API directly. This prevents the API key from being extractable from the browser bundle.

**3. Implement MercadoPago.**
The app promises card payments but doesn't process them. Create a `api/create-preference.js` function using the MercadoPago SDK and add a webhook handler at `api/mp-webhook.js` to update order status on payment confirmation. Store `MERCADOPAGO_ACCESS_TOKEN` server-side only.

**4. Wire up the Remises module or remove it.**
The ride-hailing feature is highly visible (one of the four main Hub cards) but has no functional backend flow. Either implement the trip request → driver accept → tracking flow using Supabase Realtime presence, or temporarily hide the card from the Hub until it is ready.

### Performance Optimizations

**Bundle size:**
- `Remises.jsx` includes Mapbox GL (1.8 MB). Use `React.lazy()` (already done) combined with explicit Vite `manualChunks` to ensure Mapbox is in its own chunk and never downloaded by users who don't visit `/remises`.
- Consider replacing the full Leaflet library (if still referenced) with a lighter alternative or removing unused imports.

**Images:**
- `screen.png` is 1.26 MB uncompressed. Convert to WebP with Sharp (already in devDependencies) and serve via `<picture>` with format negotiation.

**Data fetching:**
- Add React Query or SWR for Supabase queries. This gives automatic caching, deduplication of concurrent requests, background refresh, and consistent loading/error states without manual `useEffect` boilerplate.

**Realtime:**
- Review and unsubscribe all Supabase Realtime channels in component cleanup (`useEffect` return function). Leaked subscriptions accumulate across navigation and increase connection overhead.

### Scalability Suggestions

**TypeScript migration:**
Migrating to TypeScript would catch type errors on Supabase query results, component props, and Zustand state. Start with `src/lib/` utilities and `src/store/`, then expand outward. The Supabase CLI can generate TypeScript types directly from the live schema (`supabase gen types typescript`).

**Data-fetching layer:**
Abstract all Supabase queries into a `src/services/` folder (one file per domain: `ordersService.ts`, `restaurantsService.ts`, etc.). This decouples UI from DB query logic and makes testing dramatically easier.

**Testing:**
- Unit tests for `restaurantUtils.js` (the dual-shift `isRestaurantOpen` function has many edge cases).
- Integration tests for the checkout → order insert → push notification flow using Vitest + MSW.
- Playwright end-to-end tests for the Happy Path: login → browse → add to cart → checkout → track order.

**Authentication:**
Consider adding a `roles` column to `profiles` (values: `customer`, `restaurant_owner`, `admin`) instead of inferring role from table ownership. This would simplify guard logic and enable more granular RLS policies.

**Service Worker:**
- Rename cache from `vicunaya-shell-v1` to `kyvra-shell-v1`.
- Add an `activate` handler to delete old caches on SW update.
- Consider using Workbox for a more maintainable caching strategy (precache manifest, runtime caching with TTL, background sync).

**Encomiendas scaling:**
The `EMPRESA_ID` is hardcoded in `Encomiendas.jsx`. If multiple encomienda companies are ever onboarded, this should be resolved dynamically (e.g., from config or the user's geographic area). The current design supports one company only.

**Notifications:**
The `notifications` table schema is unclear. Define explicit columns (`title`, `body`, `url`, `type`) and add an index on `(user_id, leida)` to make the unread badge query efficient as notification volume grows.
