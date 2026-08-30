---
name: Cyber-Void Intelligence
colors:
  surface: '#111827'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
  surface-hover: '#1f293d'
  border-muted: '#1f293d'
  border-glow: rgba(167, 139, 250, 0.4)
  text-primary: '#f8fafc'
  text-muted: '#94a3b8'
  text-dim: '#75859c'
  severity-high: '#ef4444'
  severity-medium: '#f59e0b'
  severity-low: '#10b981'
  accent-violet-light: '#a78bfa'
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

This design system is engineered for mission-critical Security Operations Centers (SOC) and high-assurance AI threat intelligence. The brand personality is authoritative, technical, and hyper-vigilant, evoking a sense of "calm control" amidst complex data streams. 

The aesthetic is a hybrid of **Minimalism** and **Glassmorphism**, set against a **Deep Cyber Void**. It prioritizes extreme information density and optical clarity to reduce cognitive load during long operational shifts. Key characteristics include high-contrast interactive focal points, luminous "AI attribution" glows, and a strict adherence to semantic color signaling. The UI feels like a hardened, futuristic command center—precise, data-driven, and impenetrable.

## Colors

The palette is anchored by "Deep Cyber Void" (#090d16), providing a low-strain canvas for high-density monitoring. 

### Color Logic
- **Primary (Electric Violet):** Reserved for core AI reasoning, primary actions, and active telemetry highlights.
- **Secondary (Forensic Cyan):** Used for deep-packet inspection, network forensics, and technical metadata.
- **Tertiary (Operational Emerald):** Indicates healthy system states, verified cryptographic hashes, and successful ingestion.
- **Neutral (Slate Tiers):** Surfaces and borders use tiered slates to create hierarchy without introducing distracting hues.

### Semantic Signaling
Severity colors (Crimson, Amber, Emerald) are strictly functional. Do not use these for decorative purposes. Crimson is exclusively reserved for active security violations or destructive system actions.

## Typography

This system utilizes a dual-font strategy to differentiate between interface guidance and raw data.

- **Inter (Sans-Serif):** Applied to all headings, descriptive body text, and UI controls. It provides a modern, clean, and legible foundation.
- **JetBrains Mono (Monospace):** Required for all technical telemetry, including IP addresses, SHA-256 hashes, JSON payloads, and timestamps. 

### Rules
1. **Numeric Alignment:** All counters and metrics must use tabular figures (monospaced) to prevent layout shifts during real-time data polling.
2. **Badge Caps:** Micro-labels for MITRE tags or vendor pills use uppercase Monospace for a "technical tag" aesthetic.
3. **Line Height:** Body text maintains a 1.5x ratio to ensure readability in data-heavy forensic logs.

## Layout & Spacing

The system uses a **Fixed Grid** model within a maximum container width of 1600px, optimized for wide SOC monitoring screens. 

### Layout Model
- **Grid:** A 12-column system is used for complex dashboards.
- **Asymmetric Split:** Common layouts use a 2.2fr to 1fr split (e.g., primary event table paired with secondary analytics widgets).
- **Metric Grids:** KPI rows follow a 4-column structure on desktop, collapsing to 2 on tablets and 1 on mobile.

### Responsiveness
- **Desktop (1440px+):** Full multi-pane forensic views.
- **Tablet (768px - 1024px):** Navigation tabs transition to a scrollable horizontal bar; KPI tiles stack.
- **Mobile (<640px):** Single column focus; 40px safe area margins for touch targets.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Subtle Glows** rather than heavy shadows.

- **Surface Tiering:** The base "Void" (#090d16) is the bottom layer. Interactive cards and panels sit on the "Surface Slate" (#111827).
- **Hairline Borders:** Depth is defined by 1px borders (#1f293d). On focus or active AI states, these borders transition to a "Violet Glow" (#a78bfa) with a subtle outer spread.
- **Gradients:** Panel backgrounds use a subtle 145-degree micro-gradient from #111827 to #0f172a to suggest a physical, slightly concave surface.
- **Backdrop Blur:** Modals and floating AI assistants use a 16px backdrop blur to maintain context while isolating the foreground task.

## Shapes

The shape language is **Soft but Precise**. While the base roundedness is 4px (Soft) for buttons and inputs, larger containers like cards and panels scale up to 8px or 10px to maintain visual balance. 

- **Interactive Elements:** 4px to 6px radius for buttons and form inputs.
- **Containers:** 8px to 12px for dashboard cards.
- **Pills:** Full-rounded (9999px) for status badges and air-gap toggles.
- **Hairline Consistency:** All strokes are kept at 1px to maintain the "precision instrument" aesthetic.

## Components

### Buttons
- **Primary:** Electric Violet fill with a 1px violet-glow border. Hover state increases brightness and adds a subtle 8px blur shadow.
- **Secondary:** Ghost style with #1f293d border and #94a3b8 text.
- **Danger:** Crimson tint background (12% opacity) with a solid crimson border.

### Data Tables
- **Header:** Sticky pitch-black background with uppercase JetBrains Mono labels.
- **Rows:** 1px border-bottom dividers. Severity-high rows feature a subtle 8% crimson background tint and a 4px solid crimson left-border accent.

### Inputs & Search
- **Search:** Large NLP-driven input field with a violet focus ring and a faint dot-grid background texture.
- **Monospace Inputs:** Any field requiring technical data entry (IP, Hashes) must use JetBrains Mono.

### Cards & KPIs
- **KPI Tiles:** Feature a large-format JetBrains Mono integer. Include a "Feature Accent" (a 3px solid color strip on the left) to indicate the system domain (e.g., Forensic, AI, Command).

### AI Copilot Assistant
- **Floating Panel:** A persistent 360px wide drawer with a blurred glassmorphism background, anchored to the bottom-right. Features a live "heartbeat" status dot (emerald for active).