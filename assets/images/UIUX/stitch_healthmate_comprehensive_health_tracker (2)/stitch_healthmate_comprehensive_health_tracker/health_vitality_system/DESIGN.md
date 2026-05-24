---
name: Health & Vitality System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3d4a3e'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6c7b6d'
  outline-variant: '#bbcbbb'
  surface-tint: '#006d37'
  primary: '#006d37'
  on-primary: '#ffffff'
  primary-container: '#2ecc71'
  on-primary-container: '#005027'
  inverse-primary: '#4ae183'
  secondary: '#006397'
  on-secondary: '#ffffff'
  secondary-container: '#5cb8fd'
  on-secondary-container: '#00476e'
  tertiary: '#944a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff9a4a'
  on-tertiary-container: '#6e3600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6bfe9c'
  primary-fixed-dim: '#4ae183'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#92ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  baseline: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-tablet: 24px
  margin-desktop: 32px
  container-gap: 12px
---

## Brand & Style
The design system is anchored in the **Corporate / Modern** aesthetic, specifically tailored for the Android ecosystem through a Material Design 3 (MD3) lens. It evokes a sense of clinical precision tempered by human-centric warmth. 

The visual narrative focuses on "Energizing Trust"—using high-clarity layouts and vibrant accents to motivate users toward their health goals. The interface prioritizes whitespace and structural rhythm to reduce cognitive load, ensuring that complex medical or fitness data feels manageable and actionable. The emotional response is one of calm reliability and proactive momentum.

## Colors
The palette utilizes a "Vibrant Clinical" approach. 

*   **Primary (Health Green):** Used for primary actions, progress indicators, and "success" states. It represents growth and vitality.
*   **Secondary (Medical Blue):** Reserved for informational accents, secondary buttons, and data categories related to tracking (e.g., sleep or hydration).
*   **Tertiary (Energy Orange):** A cautious accent used for motivational prompts or "pending" states to create visual variety.
*   **Neutral & Backgrounds:** We utilize a "Pure White" (#FFFFFF) for cards and surfaces, set against a "Soft Grey" (#F8F9FA) scaffold background. This creates the subtle contrast necessary for MD3's elevation model without relying on heavy shadows.

## Typography
The system utilizes **Inter** exclusively to leverage its systematic, utilitarian nature and exceptional legibility at small sizes—critical for health metrics.

*   **Headlines:** Feature tight letter-spacing and bold weights to provide a strong visual anchor for page titles.
*   **Numbers/Data:** When displaying metrics (e.g., step counts), use `headline-lg` with a medium weight to ensure the data is the hero of the screen.
*   **Hierarchy:** Use `label-lg` in all-caps for section headers over lists to maintain a structured, "dashboard" feel.

## Layout & Spacing
Following Material 3's 8dp grid system, this design system uses a **4px baseline** for micro-adjustments. 

*   **Grid:** A 12-column fluid grid for tablet/desktop and a 4-column fluid grid for mobile.
*   **Margins:** Standard mobile screens use a 16px side margin. Content cards should have a 12px internal gap to maintain a "compact-yet-breathable" feel.
*   **Vertical Rhythm:** Use consistent 24px or 32px spacing between major content sections to emphasize the clean, uncluttered brand personality.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** rather than heavy shadows, staying true to Material You.

1.  **Level 0 (Background):** Soft Grey (#F8F9FA).
2.  **Level 1 (Cards/Surfaces):** Pure White (#FFFFFF).
3.  **Level 2 (Interactive/Floating):** Pure White with a very subtle, highly diffused shadow (Blur: 8px, Y: 2px, Opacity: 4% Black).

For "Glassmorphism" touches, use a 20px backdrop blur on the Bottom Navigation Bar and Top App Bar to allow background content colors to peak through, enhancing the modern feel.

## Shapes
The shape language is **Rounded**, favoring approachability and safety.

*   **Primary Containers:** Use a 16px (rounded-lg) radius for standard dashboard cards.
*   **Outer Containers:** Larger layout containers or bottom sheets use 24px (rounded-xl) for a "soft-molded" appearance.
*   **Buttons:** Small buttons use 8px, while primary action buttons (FABs) use 16px to match the card language. Avoid full pill-shapes to maintain a professional, slightly more structured look.

## Components
Consistent styling across components ensures the app feels native to Android while maintaining brand identity.

*   **Cards:** High-contrast white surfaces with 16px corner radius. No borders; depth is defined by the background color change.
*   **Buttons:** 
    *   *Primary:* Solid #2ECC71 with white text. 
    *   *Secondary:* Outlined with #3498DB and 1.5px border width.
*   **Input Fields:** Filled style (MD3) with a very light grey background and a bottom stroke that thickens on focus.
*   **Progress Rings:** Use a 12px stroke width for circular progress indicators. The track should be a 10% opacity version of the primary color.
*   **Chips:** Highly rounded (16px) with a subtle grey fill for inactive states and primary green fill for active/selected states.
*   **Lists:** Dividers should be 1px thick, #EEEEEE, with 16px inset from the start to align with text icons.
*   **Data Visualization:** Line charts should use a "smooth" bezier curve rather than sharp angles, using the primary green with a subtle gradient fill underneath.