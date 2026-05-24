---
name: Obsidian Vitality
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcbbb'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869486'
  outline-variant: '#3d4a3e'
  surface-tint: '#4ae183'
  primary: '#54e98a'
  on-primary: '#003919'
  primary-container: '#2ecc71'
  on-primary-container: '#005027'
  inverse-primary: '#006d37'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffc63f'
  on-tertiary: '#402d00'
  tertiary-container: '#e3aa00'
  on-tertiary-container: '#5a4100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bfe9c'
  primary-fixed-dim: '#4ae183'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is built for high-performance health tracking and medical precision in low-light environments. The brand personality is authoritative yet energizing, blending the clinical reliability of a health platform with the futuristic aesthetic of high-tech wearables.

The visual style employs a **High-Tech Modern** approach with subtle **Glassmorphism**. It prioritizes legibility and data density without overwhelming the user. By utilizing deep obsidian backgrounds and vibrant primary accents, the interface evokes a sense of "premium bio-hacking"—making health data feel like a powerful, actionable insight rather than a chore.

## Colors
The palette is rooted in a deep, nocturnal foundation to minimize eye strain and maximize the "glow" of vital metrics.

*   **Primary (#2ecc71):** A vibrant "Vitality Green" used for success states, active progress, and primary actions. It must maintain a high contrast ratio against the obsidian background.
*   **Secondary (#38bdf8):** A "Tech Blue" used for secondary data streams, informational charts, and interactive highlights.
*   **Neutral/Background (#0f172a):** A deep obsidian that serves as the canvas, providing a sense of infinite depth.
*   **Surface Tiers:** `surface-lowest` (#1e293b) is used for cards and containers to lift them subtly from the background, while `surface-low` (#334155) is reserved for hovering states or secondary UI elements like inset inputs.
*   **Status Indicators:** Use Tertiary (#fbbf24) for warnings and a high-saturated Coral (#f87171) for critical alerts to ensure visibility against the dark navy base.

## Typography
Inter is used across all levels to ensure maximum readability and a systematic, utilitarian feel. 

Headlines utilize tighter letter spacing and heavier weights to create a strong visual hierarchy. Body text is set with generous line heights to prevent "letter-glow" effects common in dark mode. For data visualization and technical labels, the `label-md` role uses uppercase styling and increased tracking to differentiate "system info" from "user content."

## Layout & Spacing
The layout follows a **Fluid Grid** model with a standard 12-column structure for desktop and a 4-column structure for mobile. 

Spacing is based on an 8px rhythmic scale. Components should prioritize generous internal padding (16px–24px) to create a premium, uncrowded feel. On mobile, margins are reduced to 16px to maximize the screen real estate for charts, while desktop margins expand to 32px or more to center the content and provide "breathing room" in the deep obsidian space.

## Elevation & Depth
Depth in the design system is achieved through **Tonal Layering** and **Subtle Glows** rather than traditional heavy shadows.

1.  **Background:** The base level is #0f172a.
2.  **Surface:** Floating cards use #1e293b. 
3.  **Borders:** Use low-opacity white (e.g., `rgba(255, 255, 255, 0.08)`) for borders to define edges without creating harsh visual breaks.
4.  **Luminosity:** Elements with high priority (like active progress rings) should have a soft, primary-colored outer glow (`box-shadow: 0 0 15px rgba(46, 204, 113, 0.3)`) to simulate a luminous display panel.
5.  **Backdrop Blur:** Use a `blur(12px)` effect on navigation bars and modals to maintain context while ensuring legibility over dense data charts.

## Shapes
The shape language is defined as **Rounded**. This strikes a balance between the precision of clinical software and the approachability of a lifestyle app. 

*   **Standard Components:** 0.5rem (8px) radius for buttons and input fields.
*   **Containers/Cards:** 1rem (16px) radius for health cards and data modules.
*   **Progress Rings:** Use perfectly circular strokes with rounded caps to reinforce a "smooth" and continuous feeling of health and vitality.

## Components

*   **Buttons:** Primary buttons use a solid #2ecc71 fill with dark #0f172a text for maximum contrast. Secondary buttons should use a ghost style with #2ecc71 borders.
*   **Progress Rings & Charts:** These are the centerpiece. Use heavy stroke weights for rings. Incorporate a "track" color (e.g., #1e293b) behind the active green stroke to show completion. Add a subtle glow to the active tip of the progress bar.
*   **Cards:** Cards should have a subtle 1px border of `rgba(255,255,255,0.1)` to separate them from the navy background. Avoid heavy drop shadows; use color-value shifts to show hierarchy.
*   **Input Fields:** Surfaces should be darker than the card they sit on (#0f172a) with a subtle bottom-border or full-outline focus state in Primary Green.
*   **Chips:** Use high-transparency fills of the primary or secondary colors (e.g., `rgba(46, 204, 113, 0.15)`) with solid colored text for a "glass" tag effect.
*   **Status Indicators:** Use small, pulsing dots for "Live" data tracking to give the UI a "breathing" and active feel.