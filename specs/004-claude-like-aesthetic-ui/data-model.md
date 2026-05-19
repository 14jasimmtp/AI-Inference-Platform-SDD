# Style & Theme Configuration Contract: Claude Redesign

This document specifies the custom styling property contracts, typography classes, and theme switcher integration states required to support the warm-minimalist aesthetic overhaul.

---

## 🎨 Global CSS Styling Contract (`index.css`)

We will declare the following design variables globally under `:root` and `.dark` selectors inside `frontend/src/index.css`:

### 1. Light Mode Tokens (`:root`)
```css
:root {
  --color-bg-canvas: #FAF8F5;
  --color-bg-card: #FFFFFF;
  --color-border-subtle: rgba(0, 0, 0, 0.06);
  --color-text-primary: #191919;
  --color-text-secondary: #6B7280;
  
  --color-bubble-user: #F1ECE4;
  --color-bubble-user-text: #191919;
  
  --color-accent-amber: #D97706;
  --color-accent-amber-glow: rgba(217, 119, 6, 0.15);
  
  --font-serif: 'Lora', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  
  --transition-smooth: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  --border-radius-card: 16px;
}
```

### 2. Dark Mode Tokens (`.dark`)
```css
.dark {
  --color-bg-canvas: #191919;
  --color-bg-card: #222222;
  --color-border-subtle: rgba(255, 255, 255, 0.05);
  --color-text-primary: #E2E8F0;
  --color-text-secondary: #9CA3AF;
  
  --color-bubble-user: #2A2A2A;
  --color-bubble-user-text: #E2E8F0;
  
  --color-accent-amber: #F59E0B;
  --color-accent-amber-glow: rgba(245, 158, 11, 0.2);
}
```

---

## 🎭 Typography Styling Rules

We define the following atomic CSS styling classes to be applied directly in our TSX templates:

* **`.claude-serif-title`**: Applied to primary header tags, main card titles, and AI chat bubbles.
  - `font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em;`
* **`.claude-sans-control`**: Applied to inputs, buttons, navigation links, and settings parameters.
  - `font-family: var(--font-sans); font-size: 14px; font-weight: 500;`
* **`.claude-focus-ring`**: Applied to active form input focuses.
  - `border-color: var(--color-accent-amber); box-shadow: 0 0 0 4px var(--color-accent-amber-glow);`

---

## ⚙️ Visual Theme State System

We will implement a simple visual theme store or inherit the dark mode toggle seamlessly inside the existing React context. Toggling the dark mode will add/remove the `.dark` class from the `<html>` root, instantly swapping all variables through CSS.
