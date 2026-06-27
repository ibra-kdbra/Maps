---
name: Interactive Maps
description: Enterprise-grade dispatch and spatial mapping dashboard
colors:
  primary: "#4285F4"
  secondary: "#ea4335"
  neutral-bg: "#f5f5f5"
  neutral-surface: "#ffffff"
  text-primary: "#202124"
  text-secondary: "#5f6368"
typography:
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: Interactive Maps

## 1. Overview

**Creative North Star: "The Operations Deck"**

The design system for the Interactive Maps platform prioritizes precision, clarity, and task efficiency. As an enterprise dispatch tool, it avoids decorative gimmicks like glassmorphism or floating, low-contrast UI cards. The workspace is split between a dominant map viewport and highly dense control sidebars that present telemetry, pricing, and routing data.

**Key Characteristics:**

- High contrast hierarchy for rapid scanning.
- Task-focused density (inline tables, compact forms).
- Restrained color application, reserving saturation for status, routes, and active user selections.

## 2. Colors

The color palette utilizes a highly restrained set of standard primary colors to prioritize functional clarity.

### Primary

- **Command Blue** (#4285F4 / oklch(0.62 0.17 256.8)): The principal action color, reserved for buttons, selections, and primary route visualizations.

### Secondary

- **Alert Red** (#ea4335 / oklch(0.57 0.22 27.4)): Used exclusively for destinations, errors, or critical service alerts.

### Neutral

- **Slate Ink** (#202124 / oklch(0.20 0.01 240)): Primary text color ensuring maximum readability.
- **Muted Steel** (#5f6368 / oklch(0.48 0.01 240)): Secondary label text, placeholder text, and system metadata.
- **Canvas Gray** (#f5f5f5 / oklch(0.96 0.005 240)): Global map background and main window layout backing.
- **Deck White** (#ffffff / oklch(1.0 0 0)): Controls panel backgrounds and container surfaces.

### Named Rules

**The Saturation Ceiling Rule.** Saturated colors (Command Blue, Alert Red) must never cover more than 10% of any control panel surface. They are tools for attention redirection.

## 3. Typography

**Body Font:** Roboto (with system-ui fallbacks)
**Label/Mono Font:** monospace

**Character:** Clean, highly readable, geometric sans-serif that disappears into the task structure.

### Hierarchy

- **Title** (500, 20px, 1.2): Section titles and top control panel headers.
- **Body** (400, 14px, 1.5): Standard form labels, metadata description, and list items. Max line length is kept under 70ch for paragraphs.
- **Label** (500, 12px, 1.2, uppercase): Minor tab headers, table headers, and category tag names.

## 4. Elevation

The system is flat-by-default to ensure absolute UI predictability and clean borders.

### Shadow Vocabulary

- **Control Overlay** (`box-shadow: 0 2px 6px rgba(0,0,0,0.3)`): Used only for floating controls situated directly over the MapLibre canvas (e.g., search bars or floating widgets).

### Named Rules

**The Flat Panel Rule.** Docked sidebars, panels, and inner layout containers must not use shadows. They utilize solid neutral borders (`#e8eaed`) for layout division.

## 5. Components

### Buttons

- **Shape:** Soft square (8px / `rounded.md`).
- **Primary:** Command Blue background, white text, 8px 16px padding.
- **Hover / Focus:** Deepens to `#3367D6` on hover with a smooth 150ms transition.

### Cards / Containers

- **Corner Style:** Soft rounded (12px / `rounded.lg`).
- **Background:** Solid Deck White.
- **Border:** Slate outline (`1px solid #dadce0`).

### Inputs / Fields

- **Style:** Underline-free TextField with thin light border, matching button radius.
- **Focus:** Highlighted with `#4285F4` border.

### Navigation

- **Style:** Compact tabs for switching tools (Search vs Coordinates) or layout states. Active states are shown with solid fill and white text; inactive with white background and `#5f6368` text.

## 6. Do's and Don'ts

### Do

- **Do** use high-contrast text ratios exceeding 4.5:1.
- **Do** use strict border lines (`#dadce0` or `#e8eaed`) for sidebar panel layout separation.
- **Do** limit animations to standard transitions under 250ms that directly signal a state change.

### Don't

- **Don't** use glassmorphism, transparent backdrop-blurs, or saturated color gradients.
- **Don't** use thick colored borders (greater than 1px) on cards or tabs to indicate accent styles.
- **Don't** animate image objects or card layouts on idle hover states.
