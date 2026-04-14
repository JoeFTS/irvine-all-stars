# Design System Redesign — "Premium Baseball Playful"

**Date:** 2026-04-04
**Status:** Approved
**Scope:** Design system tokens, typography, decorative elements, motion — applied to existing page structures. No layout rearchitecting.

---

## Design Direction

"Clearly Playful" — a premium kids' sports brand with genuine baseball character. Think Headspace meets baseball camp. Warm, tactile, bouncy, fun — but everything is thoughtfully crafted. NOT childish.

Baseball-gear aesthetic: stitch red, leather glove tan, bat wood tones, grass green, chalk white, dirt brown complement the patriotic navy/red/gold base.

---

## 1. Typography

### Display/Hero Headings
- **Font:** Dela Gothic One (400)
- **Usage:** Page hero titles, big stats numbers, "wow" moments
- **Style:** Always uppercase
- **Size:** 5xl–7xl with clamp

### Structural UI
- **Font:** Oswald (500, 600, 700)
- **Usage:** Navbar links, footer, sidebar labels, section subheadings, breadcrumbs
- **Style:** Uppercase with wide tracking (unchanged from current)

### Body/UI Text
- **Font:** Rubik (400, 500, 600, 700)
- **Usage:** Paragraphs, form labels, buttons, badges, card text, table content
- **Replaces:** Barlow everywhere

### Scale Contrast
Hero headings go big, section headings mid (2xl–4xl in Oswald), body stays grounded. The tension between chunky Dela Gothic and clean Rubik creates the playful-but-premium feel.

---

## 2. Color Palette

### Core Colors (replacing current CSS custom properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--flag-blue` | `#0F1B2D` | Deep navy — primary dark, nav, footer, dark sections |
| `--flag-blue-mid` | `#1A2D4A` | Lighter navy for hover states |
| `--flag-red` | `#C8364B` | Classic red — buttons, CTAs |
| `--stitch-red` | `#E23D3D` | Baseball stitch accents, decorative elements |
| `--star-gold` | `#E2B74F` | Warmer gold — highlights, active states |
| `--star-gold-bright` | `#F5C542` | Bright gold for emphasis |
| `--leather` | `#C4956A` | Glove tan — card tints, warm accents |
| `--bat-wood` | `#8B6F47` | Brown — tertiary accent, borders |
| `--grass` | `#4A7C59` | Muted green — success states, "active/go" |
| `--dirt` | `#A68B6B` | Infield dirt — subtle backgrounds, input borders |
| `--chalk` | `#FAF9F6` | Primary page background |
| `--cream` | `#F3EDE4` | Old baseball feel — section backgrounds |

### Tinted Card Backgrounds (new)

| Token | Value | Usage |
|-------|-------|-------|
| `--tint-green` | `#EFF5F0` | Grass green at ~5% — card variant |
| `--tint-leather` | `#F5EDE5` | Leather at ~5% — card variant |
| `--tint-cream` | `#F3EDE4` | Cream — card variant |

---

## 3. Decorative Elements & Texture

### Baseball Stitches (CSS-drawn)
- Curved stitch lines (red dashed borders on cream)
- Hero section: large circular stitch behind headings
- Section dividers: horizontal stitch lines between content blocks
- Card variant: stitch-style dashed border option
- Button variant: dashed stitch border for secondary/ghost buttons

### Grain Texture
- Subtle CSS noise overlay on hero and dark sections
- Applied via pseudo-element (never affects interactivity)
- Very light opacity (3–5%) — felt, not seen

### Diamond & Home Plate Shapes
- Home plate clip-path for special badges ("Open", "New")
- Rotated square (diamond) shapes as floating hero accents
- Small diamond bullet points as list alternative

### Card Treatments
- Cards cycle through 3 background tints: chalk, grass tint, leather tint
- Colored top border (inset box-shadow) matching tint family
- Subtle inner shadow for tactile "physical card" feel
- Hover: scale(1.02) + slight rotation (1–2deg) + colored shadow

### Stars
- Keep existing star usage in new gold (#E2B74F)
- Star sprinkles as decorative flair in heroes and section headers

---

## 4. Motion & Interactions

### Public Pages — Hover States
- **Buttons:** bouncy scale(1.04), spring cubic-bezier `(0.34, 1.56, 0.64, 1)`, colored shadow shift
- **Cards:** scale(1.02) + rotate(1deg) + shadow color change, 0.25s ease-out
- **Star icons:** rotate(15deg), 0.3s
- **Links:** underline slides in from left

### Portal Pages — Hover States
- **Standard:** translateY(-2px) + shadow increase, 0.2s ease-out
- No rotation, no bouncy springs — clean and functional

### Scroll Reveals (Public Pages)
- Staggered fade-up on card grids (0.08s stagger)
- Section headings fade-in on viewport entry
- Stats numbers count up when visible
- Keep existing RevealOnScroll/StaggerReveal, update easing curves

### Transitions
- Default duration: 0.25s
- Easing: ease-out for most, spring cubic-bezier for playful elements
- Respect `prefers-reduced-motion`

---

## 5. Spacing & Border Radius

### Spacing
- Section padding: py-16 to py-20 (unchanged)
- Card padding: p-6 / p-8 (bumped up)
- Card gap: gap-8 (up from gap-6)

### Border Radius
- Cards: `rounded-2xl`
- Buttons: `rounded-full` (pill shape)
- Inputs: `rounded-xl`
- Badges: `rounded-full` (pill)

---

## 6. Form Styling (All Pages)

- **Labels:** Rubik 500, text-sm, above input with gap-1.5
- **Inputs:** rounded-xl, border in `--dirt`, focus ring in `--star-gold`
- **Error text:** `--stitch-red` below input
- **Primary buttons:** `--flag-red` bg, rounded-full, Rubik 600
- **Secondary buttons:** chalk bg, `--bat-wood` border, rounded-full
- **Stitch-border variant:** dashed border in `--stitch-red` (public pages only)

### Badge Colors
- **Selected:** grass green tint + grass text
- **Pending:** gold tint + bat-wood text
- **Registered:** blue tint + navy text
- **Special callouts:** home plate clip-path (public pages only)

---

## 7. Scope Rules

| Area | Typography | Colors | Decorative Elements | Bouncy Motion |
|------|-----------|--------|-------------------|---------------|
| Public pages | Full new stack | Full new palette | All baseball accents | Yes |
| Admin portal | New fonts + palette | Full new palette | No | No (subtle only) |
| Coach portal | New fonts + palette | Full new palette | No | No (subtle only) |
| Parent portal | New fonts + palette | Full new palette | No | No (subtle only) |

---

## Implementation Order

1. **Globals:** Update `globals.css` — new CSS custom properties, font imports, Tailwind theme tokens
2. **Layout:** Update `layout.tsx` — add Dela Gothic One + Rubik Google Font imports
3. **Shared components:** Update navbar, footer, motion.tsx with new tokens
4. **Public pages:** Apply decorative elements, card tints, stitch accents page by page
5. **Portal pages:** Swap Barlow → Rubik, update color references
6. **Verify:** Build check, responsive spot-check, visual QA
