---
name: VicuñaYa Digital Identity
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5c403c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#906f6b'
  outline-variant: '#e5beb8'
  surface-tint: '#bb1814'
  primary: '#b71411'
  on-primary: '#ffffff'
  primary-container: '#dc3228'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a9'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5b5c5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#737575'
  on-tertiary-container: '#fcfcfc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930005'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style
The design system is built to serve as a reliable, high-velocity bridge between local commerce and the citizens of Vicuña Mackenna. The brand personality is **energetic, professional, and efficient**, mirroring the logistical precision of leading global delivery platforms while maintaining a local, accessible heart.

The visual style is **Corporate Modern with a Mobile-First priority**. It emphasizes clarity through generous whitespace, high-quality photography, and a structured hierarchy that reduces cognitive load during quick transactions. The emotional response should be one of "effortless utility"—the user feels that the service is fast, the vendors are premium, and the interface is invisible.

## Colors
The palette is dominated by a high-energy **Solid Warm Red (#E63A2E)**, utilized strategically for headers, primary actions, and critical status indicators to drive conversion and brand recognition. 

- **Primary:** #E63A2E (Action, Brand, Headers)
- **Surface/Background:** #FFFFFF (Primary content areas)
- **Soft Background:** #F8F9FA (Section grouping and page backgrounds)
- **Typography High:** #1A1A1A (Headlines and primary text)
- **Typography Med:** #666666 (Body text and descriptions)
- **Success:** #27AE60 (Confirmed appointments/orders)

## Typography
This design system utilizes **Plus Jakarta Sans** across all touchpoints to provide a clean, geometric, and modern feel. 

Headlines use tighter letter-spacing and heavier weights (600-700) to create a sense of urgency and importance. Body copy is optimized for legibility with a 1.5x line-height ratio. On mobile devices, headline sizes should scale down by approximately 10-15% to ensure maximum screen real estate for product imagery. All labels and metadata should maintain a minimum size of 12px for accessibility.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for narrow viewports. On mobile, the standard margin is 16px. As the screen scales to tablet or desktop, content is contained within a maximum width of 1200px.

A 4px baseline grid ensures a consistent vertical rhythm. Spacing between related items (e.g., product image and title) should be `sm` (8px), while spacing between distinct sections (e.g., "Featured Shops" and "Recent Orders") should be `xl` (32px). Components should use consistent internal padding of `md` (16px) to maintain a professional, airy feel.

## Elevation & Depth
Hierarchy is established through **Ambient Shadows** and tonal layering. 

- **Level 0 (Base):** Used for the main app background (#F8F9FA).
- **Level 1 (Cards):** Pure white (#FFFFFF) surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)).
- **Level 2 (Floating/Nav):** Used for bottom navigation bars and floating action buttons (0px 8px 30px rgba(0, 0, 0, 0.1)).

Do not use heavy borders; depth should be felt through subtle contrast between the white card and the light grey background.

## Shapes
The shape language is primarily **Rounded**, conveying friendliness and modern tech-literacy.

- **Standard Cards:** 0.5rem (8px) radius.
- **Action Buttons:** 0.5rem (8px) radius or fully pill-shaped for secondary filters.
- **Category Avatars:** Perfect circles (100% radius) are used for high-level category navigation (e.g., "Pharmacy", "Restaurants") to create a distinctive, recognizable pattern similar to global delivery leaders.
- **Input Fields:** 0.5rem (8px) radius with a 1px soft border.

## Components

### Buttons
- **Primary:** Solid #E63A2E background, white text, bold weight. High-height (48px-56px) for easy thumb tapping.
- **Secondary:** White background, #E63A2E 1px border and text.
- **Tertiary:** Ghost style, grey text for less important actions.

### Cards
Cards are the primary organizational unit. They must feature a 1:1 or 4:3 ratio image with an 8px top-corner radius. Titles should be `headline-md`, and secondary info (distance, rating) should use `body-md` in the neutral color.

### Icons
Use simple, linear vector icons (2px stroke width). Avoid filled icons unless indicating an active state (e.g., a filled heart for a favorited restaurant). Never use emojis in the UI; rely on high-quality real-world photography to provide visual richness.

### Inputs & Search
Search bars should be prominent on the home screen, using a light grey fill (#F4F4F4) with a magnifying glass icon. Active states should use a 1px solid #E63A2E border.

### Chips/Filters
Small, pill-shaped elements used for sorting (e.g., "Under 30 min", "Free Delivery"). Active chips use the primary brand color; inactive chips use a light grey background with dark text.