---
name: Mission Control Forensic Engine
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c2029'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#cac4d4'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#948e9d'
  outline-variant: '#494552'
  surface-tint: '#cebdff'
  primary: '#cebdff'
  on-primary: '#381385'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#674bb5'
  secondary: '#7cd0ff'
  on-secondary: '#00344a'
  secondary-container: '#0078a2'
  on-secondary-container: '#eaf6ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00b37c'
  on-tertiary-container: '#003d28'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7cd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 52px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0em
  kpi-stat:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  kpi-stat-mobile:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-card:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: 0em
  body-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 21px
    letterSpacing: 0em
  telemetry-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
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
  2xl: 48px
  3xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1600px
---

## Brand & Style

This design system embodies the high-assurance atmosphere of an active cyber defense operations center. It balances uncompromising mathematical precision with an alive, responsive telemetry sensation. The target audience spans Tier-3 forensic investigators, SOC lead engineers, and incident response commanders navigating high-stress, data-dense threat vectors.

### Aesthetic Persona
- **Mission Control HUD:** Dense, structural readouts, coordinate systems, reticle markers, and synchronized stream nodes that eliminate cognitive friction.
- **Forensic Trust & Rigor:** Every token and border weight signals cryptographically tamper-evident workflows, OCSF schema alignment, and zero ambiguity.
- **Dual Dynamic:** The system prioritizes dark low-strain tactical monitoring (`Cybervoid`), while offering an eye-comfort archival research mode (`Sage Intelligence`).
- **Tactile Technicality:** Visual depth is achieved not through soft decorative diffusion, but through fine-pitch hairline borders, high-contrast glow states, and monospaced telemetry tickers.

## Colors

The system uses a strict semantic color hierarchy across its primary dark operations mode (`Cybervoid`) and alternate daylight inspection mode (`Sage`).

### Cybervoid (Default Dark Mode)
- **Neutral Base Canvas (`#0f131c`)**: Absolute void canvas creating non-distracting depth.
- **Surface Elevation (`#111827`)**: Primary structural panels, navigation rails, and terminal housings.
- **Card / Surface Container (`#1c1f29`)**: Forensic modular panels, KPI stat boxes, and timeline segments.
- **Surface Variant / Hover (`#1f293d`)**: Row hover targets and reactive coordinate fields.
- **Structural Outlines (`#282f3f`)**: Precise, low-bleed 1px wireframes separating data tiles.
- **Primary Electric Violet (`#a78bfa`)**: Active pipelines, primary triggers, and ML inference operations.
- **Secondary Forensic Cyan (`#7bd0ff`)**: Network flow graphs, OCSF protocol structures, and socket telemetry.
- **Tertiary Operational Emerald (`#4edea3`)**: Merkle cryptographic validation, normal baselines, and active heartbeats.

### Sage Intelligence (Alternate Light Mode)
- **Base Canvas (`#fafaf5`)**: Archival parchment white engineered for long-form incident post-mortems.
- **Card Surface (`#f5f7f0`)**: Low-contrast architectural panels.
- **Primary Olive (`#718355`)**: Focused triggers and active status indicators.
- **Secondary Teal (`#5c7a6e`)**: Data flow categories and protocol badges.
- **Tertiary Seafoam (`#3b6957`)**: Cryptographic proofs and baseline affirmations.

### Semantic Severity Accents
Severity accents must strictly correspond to threat conditions and never be used purely for decoration:
- **Critical / High (`#ef4444`)**: Breaches, shell payloads, and active compromises. Background: `rgba(239, 68, 68, 0.15)`. Border: `rgba(239, 68, 68, 0.40)`.
- **Medium / Suspicious (`#f59e0b`)**: Velocity anomalies, SSH bursts, and unusual egress. Background: `rgba(245, 158, 11, 0.15)`. Border: `rgba(245, 158, 11, 0.40)`.
- **Low / Normal (`#10b981`)**: Whitelisted actions, verified Merkle leaf roots, and routine digests. Background: `rgba(16, 185, 129, 0.15)`. Border: `rgba(16, 185, 129, 0.40)`.

## Typography

The typographic hierarchy implements three distinct typefaces calibrated for distinct operational duties:

1. **Space Grotesk (Display & Section Headings):** Imparts geometric forward-leaning weight to operational chapters, screen headers, and modal banners.
2. **JetBrains Mono (Telemetry & Machine Data):** The functional foundation for telemetry tickers, SHA-256 hashes, terminal readouts, OCSF object fields, and MITRE ATT&CK codes. Tabular lining figures (`tnum`) must be enforced on all metric displays to avoid character shift during live streaming refreshes.
3. **Inter (Body Text & System Chrome):** Delivers clean readability for investigative narratives, modal guidance, and complex case documentation.

## Layout & Spacing

### Grid Model
- **Container Structure:** 12-column fluid grid scaling to a strict `1600px` maximum boundary (`container-max`), optimized for multi-monitor command workstations.
- **Column Gutter:** Fixed `20px` gutters across panels to maintain structural density.
- **Asymmetric Split:** 5-column left rail (scroll narrative, parameter controls) paired with a 7-column right panel (fixed topological radar, live telemetry pipeline).

### Responsive Adaptation
- **Desktop (≥ 1280px):** Full 12-column operational canvas with pinned side panels, concurrent telemetry feeds, and 4-column metric rows.
- **Tablet (768px – 1279px):** Adapts to 8 columns with 16px gutters. Telemetry panels wrap underneath timeline narratives; KPI stat rows collapse to 2 columns.
- **Mobile (< 768px):** Single-column stack with 16px margins. Telemetry windows become scrollable horizontal viewports, and chapter rails convert to sticky top segmented pills.

## Elevation & Depth

Visual depth is achieved through layered structural panels and precise glowing boundaries rather than broad drop shadows.

- **Layer 0 (Base Abstraction):** `#0f131c` canvas underlaid with a subtle 24px dot-matrix grid (`radial-gradient(var(--outline) 1px, transparent 1px)`).
- **Layer 1 (Structural Rail & Decks):** `#111827` base surfaces with a 1px uniform perimeter stroke (`#282f3f`).
- **Layer 2 (Forensic Cards & Modules):** `#1c1f29` raised tiles. In active or threat states, this layer takes on an accent glow (`rgba(167, 139, 250, 0.40)` or severity-specific glow).
- **Layer 3 (Modals & HUD Overlays):** `#181b25` backdrop-filtered panes with `backdrop-blur(12px)` and high-contrast 1px boundary frames.
- **Glow Accents:** Focused interactive nodes emit an internal radiant aura (`box-shadow: 0 0 16px rgba(167, 139, 250, 0.25)`), simulating a high-precision digital instrument.

## Shapes

The design system maintains a soft, restrained geometry (`roundedness: 1`). Corners are kept compact (4px default, 8px on prominent cards) to convey industrial engineering, high packing efficiency, and structural solidity. Rounded pill shapes are reserved exclusively for contextual status chips and micro badges.

## Components

### Buttons
- **Primary Action (`.btn-primary`):** Filled with primary violet (`#a78bfa`) with near-black text (`#0f131c`) in Cybervoid; moss-olive (`#718355`) in Sage. Edge radius: 4px. Hover triggers a `0 0 12px rgba(167, 139, 250, 0.4)` aura.
- **Ghost / Secondary (`.btn-secondary`):** Transparent base with 1px border (`#282f3f`). Text in muted slate (`#94a3b8`), brightening to off-white (`#f8fafc`) on hover.
- **Copilot / Analysis CTA:** Multi-stop primary gradient border with ambient glow, lifting 1px on hover.

### Chips & Micro-Badges
- Micro-caps typography in `JetBrains Mono` (10px, weight 700, tracking 0.05em).
- Contained in 2px vertical, 6px horizontal padding with pill boundary (`rounded-full`).
- Dynamic status states:
  - **High:** Crimson background (`rgba(239, 68, 68, 0.15)`), text `#ef4444`.
  - **Verified:** Emerald background (`rgba(16, 185, 129, 0.15)`), text `#10b981`.
  - **Telemetry:** Violet background (`rgba(167, 139, 250, 0.15)`), text `#a78bfa`.

### Form Inputs & Sliders
- **Input Fields:** `#111827` fill, 1px `#282f3f` border, monospaced placeholder in `#64748b`. Focus state triggers an immediate `#a78bfa` stroke with a 3px outer glow ring.
- **ROI Sliders:** 8px track height in `#1f293d` with filled active track segment. The thumb is a 24px solid circular node featuring a 2px high-contrast rim and an energetic glow ring.

### Cards & Container Panels
- Base fill `#1c1f29` encased in a crisp 1px `#282f3f` outline.
- Diagnostic KPI cards include a 3px accent stroke along the left border indicating health or severity.

### HUD Chapter Rail
- Viewport-anchored vertical tracking bar.
- Uses indexed identifiers (`01 // PIPELINE`, `02 // TOPOLOGY`). Active sections display glowing primary dots and highlighted labels; inactive stages rest at 50% opacity slate text.

### Animated Streaming Log Nodes
- Connected multi-stage pipeline (`Raw Arrival` → `Dynamic Normalization` → `Merkle Integrity Hashing`).
- Active nodes scale to `1.02x` with an emerald/violet border glow and pulse indicator.
- Connector paths run dynamic dashed stroke animations (`animate-flow-dash`).

### Threat Radar Topology
- Concentric coordinate circles set on an aspect-ratio 1:1 viewport.
- 360-degree radar sweep beam rotating on a 6s linear infinite loop.
- Polar-positioned target blips with ping rings that freeze on hover to display an anchored telemetry tooltip (IP, Protocol, Anomaly Score).

### Cryptographic Hash-Chain Cards
- Structured forensic cards validating Merkle leaf root integrity.
- Monospaced SHA-256 string truncated with mid-ellipsis (`a4ea94...3d9dc8c7`).
- Source-to-destination connection hops visualized via directional monospace glyphs (`->`).