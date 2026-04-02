# Design System: The Architectural Calm

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Architect."**

In the crowded landscape of B2B SaaS, "clean" is often mistaken for "empty." We are moving beyond the generic template look by embracing an editorial, architectural approach. This system treats the interface not as a collection of boxes, but as a series of intentional, layered planes. We prioritize focus through **Tonal Depth** and **Asymmetric Balance**.

By utilizing high-contrast typography scales (the juxtaposition of the technical 'Inter' with the authoritative 'Manrope') and replacing rigid borders with background shifts, we create an environment that feels premium, professional, and distraction-free.

---

## 2. Colors & Surface Philosophy

### Color Tokens (M3)
| Token | Value | Use |
|---|---|---|
| `primary` | #004ac6 | Links, focus rings, accents |
| `primary-container` | #2563eb | Primary buttons bg |
| `on-primary` | #ffffff | Text on primary-container |
| `primary-fixed` | #dbe1ff | Active nav bg, subtle tints |
| `primary-fixed-dim` | #b4c5ff | Selection highlight |
| `on-surface` | #0d1c2e | Body text — **never use #000000** |
| `on-surface-variant` | #434655 | Secondary text, icons |
| `outline-variant` | #c3c6d7 | Ghost borders (20% opacity) |
| `surface-container-lowest` | #ffffff | Cards, modals, action areas |
| `surface-container-low` | #eff4ff | Main canvas, input backgrounds |
| `surface-container` | #e6eeff | Secondary content areas |
| `surface-container-high` | #dce9ff | Recessed elements inside cards |
| `surface-container-highest` | #d5e3fc | Secondary button bg |
| `background` | #f8f9ff | Page base |
| `error` | #ba1a1a | Error text/borders |
| `error-container` | #ffdad6 | Error field backgrounds |
| `tertiary` | #943700 | Critical alert accents |

### The "No-Line" Rule
**Do not use 1px solid borders to section content.**
Structure must be defined through background color shifts. `surface-container-lowest` (white) on `surface-container-low` (#eff4ff) creates natural depth without visible lines.

### Surface Hierarchy (layers of paper)
1. **Base**: `background` (#f8f9ff)
2. **Secondary content**: `surface-container` (#e6eeff)
3. **Primary action area / cards**: `surface-container-lowest` (#ffffff)
4. **Recessed inside card**: `surface-container-high` (#dce9ff) — change bg, never draw a box

### Glass / Floating elements
- `surface-container-lowest` at 80% opacity + `backdrop-blur: 20px`
- Used for topbar and floating menus

### Gradients
- Only for Hero CTAs: linear-gradient from `primary` to `primary-container`
- Do not use on regular UI elements

---

## 3. Typography: The Editorial Edge

### Fonts
- **Headlines / Display**: Manrope (weights 600–800)
- **Body / Labels**: Inter (weights 400–600)
- Load via Google Fonts in root layout

### Scale
| Token | Size | Font | Use |
|---|---|---|---|
| `display-lg` | 32px | Manrope | Hero / welcome screens |
| `headline-md` | 24px | Manrope | Page h1 titles |
| `headline-sm` | 20px | Manrope | Section / widget titles |
| `body-md` | 14px | Inter | Primary body, field values |
| `body-sm` | 13px | Inter | Secondary descriptions |
| `label-lg` | 13px | Inter | Form labels, table cells |
| `label-sm` | 12px | Inter | Metadata, timestamps |
| `micro` | 11px | Inter | Badges, pill counts only |

### Rules
- Never use two font sizes only 1px apart — create visible tension
- `on-surface-variant` for secondary/supporting text
- `h1/h2/h3` automatically use Manrope via globals.css
- Use `.font-headline` class for Manrope on non-heading elements

---

## 4. Elevation & Depth

### Tonal elevation (preferred)
A `surface-container-lowest` card on `surface-container-low` = perceived elevation without shadows.

### Shadows (use sparingly)
| Name | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(13,28,46,0.06)` | Subtle lift |
| `shadow-md` | `0 4px 12px rgba(13,28,46,0.08)` | Cards, containers |
| `shadow-ambient` | `0 20px 40px rgba(13,28,46,0.06)` | Modals, dropdowns |

Shadow color is always a tint of `on-surface` (#0d1c2e) — **never pure black**.

### Ghost Border
If a stroke is required for accessibility: `outline-variant` at 20% opacity — must be felt, not seen.

---

## 5. Components

### Buttons
| Variant | Background | Text | Contrast |
|---|---|---|---|
| Primary | `primary-container` #2563eb | white | 5.4:1 ✓ |
| Secondary | `surface-container-highest` #d5e3fc | `on-surface` #0d1c2e | 10.1:1 ✓ |
| Ghost | transparent → `primary-fixed` on hover | `primary` / `on-surface` | 4.5:1+ ✓ |
| Destructive | `error` #ba1a1a | white | 8.5:1 ✓ |

- Radius: 8px (`rounded-md`)
- Focus: 2px ring in `primary` with 2px offset

### Cards / Widgets
- Background: `surface-container-lowest`
- Radius: 12px (`rounded-xl`)
- Shadow: `shadow-md`
- Internal padding: 32px (2rem) minimum
- **No border** — elevation via shadow + bg contrast

### Inputs & Selects
- Default: `surface-container-low` bg, no border
- Focus: same bg + 2px `primary` border + ring at 20% opacity
- Error: `error` border + `error-container` bg at 10%
- Placeholder: `on-surface-variant`

### Tables
- **No horizontal dividers** between rows
- Header: `surface-container-low` bg, `on-surface-variant` text, uppercase + tracking-wide
- Row separation: `surface-container-low` bg on hover
- `<th>` always includes `scope="col"` for screen readers

### Navigation (Sidebar)
- Background: `surface-container-lowest`
- Separator: single pixel via `box-shadow`, not `border`
- Active item: `primary-fixed` bg + `on-surface` text (contrast 11.2:1 ✓)
- Inactive: `on-surface-variant` text, hover `surface-container-low` bg

### Badges / Chips
- `border-radius: 9999px` (full) — **only** for badges and chips, never for cards/buttons
- No border — use background color shifts

### Topbar
- Glass effect: `surface-container-lowest`/80 + `backdrop-blur-[20px]`
- Bottom separator: `box-shadow: 0 1px 0 0 outline-variant`

---

## 6. Accessibility — WCAG AA (Required)

All UI must meet WCAG 2.1 AA as a minimum. These rules are non-negotiable.

### Color Contrast
- **Normal text** (< 18px): minimum 4.5:1 ratio
- **Large text** (≥ 18px bold or ≥ 24px): minimum 3:1 ratio
- **UI components & focus indicators**: minimum 3:1 ratio
- Never use `on-surface-variant` (#434655) on `surface-container-high` (#dce9ff) for body text — ratio is 4.1:1, too close to threshold. Use `on-surface` (#0d1c2e) instead.

### Focus Management
- All interactive elements must have a visible focus indicator
- Focus ring: 2px solid `primary`, 2px offset — never remove without replacement
- Focus order must follow logical DOM order
- Modals and dialogs must trap focus and restore on close

### Semantic HTML
- One `<h1>` per page — page title, not branding
- Heading hierarchy: h1 → h2 → h3, never skip levels
- Navigation in `<nav>` with `aria-label`
- Page content in `<main>`
- Forms use `<fieldset>` + `<legend>` for grouped fields
- Tables use `<th scope="col">` for all column headers

### Interactive Elements
- Minimum touch target: 44×44px on mobile
- Custom interactive elements (non-button/link) must have `role`, `aria-checked`/`aria-selected`, and keyboard support (Enter/Space)
- Disabled elements: use `disabled` attribute + `aria-disabled="true"`, never just opacity

### Forms
- Every input must have a visible `<label>` with matching `for`/`id`
- Errors: use `role="alert"` + `aria-live="assertive"` for immediate announcement
- Invalid inputs: `aria-invalid="true"` + `aria-describedby` pointing to error message
- Loading states: `aria-busy="true"` on the form or button

### Images & Icons
- Decorative icons: `aria-hidden="true"`
- Decorative background elements (blobs, gradients): `aria-hidden="true"` on container
- Meaningful images: descriptive `alt` text (e.g., "S-Invest logo", not just "S-Invest")

### ARIA
- Don't add ARIA roles to native semantic elements (`<button>`, `<input>`, etc.)
- Custom radio groups: `role="radiogroup"` on container, `role="radio"` + `aria-checked` on items
- Status messages: `role="status"` + `aria-live="polite"` for non-urgent updates
- Alert messages: `role="alert"` + `aria-live="assertive"` for errors

### Screen Reader
- Visually hidden but readable text: use `.sr-only` class
- Skip-to-content link: first focusable element on every page
- Language declared: `lang="es"` on `<html>` element

---

## 7. Do's and Don'ts

### Do
- Use white space as a structural element — increase spacing before adding lines
- Use `primary-fixed-dim` for Success/Info state backgrounds
- Align text-heavy widgets to an asymmetric grid
- Test color contrast with real tokens before shipping
- Add `aria-hidden="true"` to all decorative elements

### Don't
- **Never** use `#000000` for text — always use `on-surface` (#0d1c2e)
- **Never** use `border-radius: 9999px` on cards, buttons, or containers
- **Never** use 100% opaque shadows — always tint with `rgba(13,28,46,...)`
- **Never** remove focus indicators — replace them if you must override
- **Never** use color alone to convey information (always pair with text or icon)
- **Never** use `on-surface-variant` on `surface-container-high` for body text (fails 4.5:1)
