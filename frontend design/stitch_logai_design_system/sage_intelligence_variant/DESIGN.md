---
name: Sage Intelligence Variant
colors:
  surface: '#fafaf5'
  surface-dim: '#dadad6'
  surface-bright: '#fafaf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ef'
  surface-container: '#eeeee9'
  surface-container-high: '#e8e8e4'
  surface-container-highest: '#e2e3de'
  on-surface: '#1a1c19'
  on-surface-variant: '#45483e'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ec'
  outline: '#75786d'
  outline-variant: '#c5c8ba'
  surface-tint: '#536439'
  primary: '#516237'
  on-primary: '#ffffff'
  primary-container: '#697b4d'
  on-primary-container: '#faffe9'
  inverse-primary: '#bace99'
  secondary: '#506354'
  on-secondary: '#ffffff'
  secondary-container: '#d0e5d2'
  on-secondary-container: '#546758'
  tertiary: '#516141'
  on-tertiary: '#ffffff'
  tertiary-container: '#697a58'
  on-tertiary-container: '#f9ffec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6eab4'
  primary-fixed-dim: '#bace99'
  on-primary-fixed: '#121f00'
  on-primary-fixed-variant: '#3c4c24'
  secondary-fixed: '#d3e8d5'
  secondary-fixed-dim: '#b7ccb9'
  on-secondary-fixed: '#0e1f13'
  on-secondary-fixed-variant: '#394b3d'
  tertiary-fixed: '#d7e9c0'
  tertiary-fixed-dim: '#bbcca6'
  on-tertiary-fixed: '#121f06'
  on-tertiary-fixed-variant: '#3c4b2e'
  background: '#fafaf5'
  on-background: '#1a1c19'
  surface-variant: '#e2e3de'
  sage-primary: '#718355'
  forest-text: '#1A2F23'
  cream-surface: '#F9F9F4'
  moss-container: '#E9EDC9'
  border-sage: '#CCD5AE'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 52px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0em
  title-card:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  kpi-stat:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 21px
    letterSpacing: '0'
  telemetry-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: '0'
  badge-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  container-max: 1600px
---

## Brand & Style

This design system introduces a secondary theme variant focused on "Sophisticated Resilience." While the original system evokes the high-tension environment of a dark command center, the Sage variant pivots toward a focused, daylight-compatible workspace. The brand personality remains authoritative and technical but shifts from "hyper-vigilant" to "deliberate and organic."

The aesthetic transition maintains the **Minimalism** and **Precision** of the original but swaps the "Cyber-Void" for a **Tactile-Paper** approach. It utilizes a soft, light-mode palette to reduce optical fatigue during extended analytical research. The primary emotional response is one of clarity, stability, and professional refinement, suitable for executive-level intelligence reporting and strategic threat analysis.

## Colors

The color palette is anchored by Muted Sage and Dark Forest Green, creating a high-contrast environment that adheres to the light-mode requirement while maintaining the technical "intelligence" feel.

### Color Logic
- **Primary (Sage Green):** Used for core actions, active selection states, and primary iconography. It represents growth and processed intelligence.
- **Secondary (Forest Green):** Reserved for high-contrast text, deep hierarchy, and critical interface anchors.
- **Tertiary (Moss/Lime):** Used for subtle container fills, hover states, and non-critical data highlighting.
- **Neutral (Cream/Off-White):** The foundation of the UI (#F9F9F4), providing a warm, paper-like surface that is softer on the eyes than pure white.

### Functional Mapping
- **Backgrounds:** Use the cream-surface for the main canvas.
- **Containers:** Use moss-container for cards to provide a distinct but soft elevation change.
- **Typography:** Headlines and body text utilize forest-text for maximum legibility.

## Typography

Typography remains consistent with the original system to preserve technical continuity, utilizing a dual-font strategy.

- **Inter:** The workhorse for the interface, providing clean and modern sans-serif legibility for all narrative and structural elements.
- **JetBrains Mono:** Retained for all technical data, hashes, and telemetry to ensure a "hardened" data-centric aesthetic.

In this light-mode variant, ensure text-rendering is optimized for dark-on-light contrast. Use **Dark Forest Green (#1A2F23)** for all Inter-based text to maintain a sophisticated color-matched hierarchy rather than using standard neutral grays.

## Layout & Spacing

The layout model adheres to the **Fixed Grid** logic of the original system, optimized for information-dense intelligence dashboards.

- **The 4px Scale:** All padding, margins, and component dimensions must be multiples of 4px.
- **Density:** Maintain the high information density of the original system. Use the off-white background to create "optical whitespace" rather than increasing literal spacing.
- **Asymmetric Balance:** Dashboards should prioritize a 12-column grid, allowing for wide-screen forensic views and multi-pane analytical flows.

## Elevation & Depth

In the Sage variant, depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than the glows used in the dark theme.

- **Surface Tiers:** The background is #F9F9F4. Components like cards use a slightly darker #E9EDC9 (Moss) or pure white to suggest physical stacking.
- **Outlines:** Use 1px "Sage Borders" (#CCD5AE) for all containers and inputs. This replaces the luminous effects with a crisp, architectural precision.
- **Shadows:** Avoid heavy drop shadows. Use a single, extremely soft ambient shadow (4% opacity Forest Green) for floating elements like modals to maintain the "flat-but-tactile" aesthetic.

## Shapes

The shape language is **Soft (0.25rem)**, mirroring the precision of the original system. 

- **Interactive Elements:** 4px radius for buttons and form fields.
- **Dashboard Cards:** 8px (rounded-lg) for main containers to provide a gentle structural container.
- **Status Indicators:** Full-rounded (pill) shapes for badges and tags.
- **Stroke:** Maintain a consistent 1px hairline stroke for all borders to reflect a "precision instrument" quality.

## Components

### Buttons
- **Primary:** Solid Sage Green (#718355) fill with white text. Hover states should slightly darken to a forest-tint.
- **Secondary:** Ghost style with a 1px Sage border and Forest Green text.
- **Tertiary:** Subtle Moss-tinted background with Sage Green text, no border.

### Inputs & Tables
- **Fields:** Use a pure white background for input areas to contrast against the cream page surface. Use a 1px Sage border that thickens to 2px on focus.
- **Data Tables:** Use Forest Green for header text (uppercase JetBrains Mono). Row separators use a faint Sage-tinted hairline. Highlighted rows should use an 8% opacity Sage fill.

### Cards & KPIs
- **KPI Tiles:** Feature large-scale Forest Green JetBrains Mono digits. 
- **Accent Strips:** Retain the 3px vertical accent strip on the left of cards, using the semantic severity colors from the original system (Crimson/Amber/Emerald) but slightly muted to match the Sage palette's saturation levels.

### Intelligence Assistant
- **Floating Panel:** Glassmorphism is replaced with a "Frosted Sage" effect—a semi-transparent white panel with a 20px blur and a subtle 1px Sage border.