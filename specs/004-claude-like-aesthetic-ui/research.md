# Research: Claude-Like Aesthetic UI Design System

This document outlines the visual research, color palettes, typography, and interaction patterns required to replicate the premium warm-minimalist design system of `claude.ai`.

---

## 🎨 Theme Variables & Design Tokens

To achieve the calm, scholarly, yet highly modern aesthetic of Claude, we map all styles to a sophisticated, warm-toned design token system. We will define these as CSS custom properties (`:root`) in the global `index.css`.

### 1. Warm Palette (Light Mode)
* **Canvas Background**: `#FAF8F5` (warm antique cream)
* **Card Surface**: `#FFFFFF` with a subtle `#E2E8F0` border
* **Primary Text**: `#191919` (soft warm black)
* **Secondary Text**: `#6B7280` (neutral gray)
* **User Message Bubble**: `#F1ECE4` (soft warm tan)
* **Assistant Text**: No message bubble, spacious typesetting with `#191919` text
* **Accent Focus (Amber)**: `#D97706` (warm amber/bronze)
* **Accent Hover**: `#B45309`

### 2. Warm Charcoal Palette (Dark Mode)
* **Canvas Background**: `#191919` (soft warm dark slate)
* **Card Surface**: `#222222` with a `rgba(255, 255, 255, 0.05)` border
* **Primary Text**: `#E2E8F0` (soft cool white)
* **Secondary Text**: `#9CA3AF` (soft warm gray)
* **User Message Bubble**: `#2A2A2A` (deep graphite)
* **Assistant Text**: No message bubble, spacious typesetting with `#E2E8F0` text
* **Accent Focus (Amber)**: `#F59E0B` (bright amber)
* **Accent Hover**: `#D97706`

---

## ✍️ Premium Typography

LEGIBILITY is the core of this design overhaul. We will introduce a sophisticated typography pairing:

1. **Serif (Headings & AI Responses)**: 
   * *Google Fonts*: **Lora** or **Merriweather**
   * *Fallback*: `Georgia, serif`
   * *Rationale*: Claude's signature look is its elegant serif headers and long-form AI outputs, which read like a premium digital book or editorial piece.
2. **Sans-Serif (Navigation, Inputs, Buttons)**:
   * *System Family*: `Inter, system-ui, -apple-system, sans-serif`
   * *Rationale*: Ensures user controls remain sharp, modern, and highly legible even at small sizes.

---

## 💫 Micro-Animations & Easing

Standard CSS transitions can feel rigid or artificial. We will replace standard linear transitions with premium, organic easing curves:

* **Transition Timing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-premium custom slide and fade ease-out curve).
* **Button Hover Glow**: A subtle scale-up (`scale(1.01)`) with a warm, soft background shift.
* **Input Focus Glow**: A progressive, smooth glowing ring transition (`box-shadow`) in under 150ms.
