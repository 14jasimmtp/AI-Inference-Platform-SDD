# Implementation Plan: Claude-Like Aesthetic UI Redesign

**Branch**: `004-claude-like-aesthetic-ui` | **Date**: 2026-05-18 | **Spec**: [specs/004-claude-like-aesthetic-ui/spec.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/spec.md)  
**Input**: Feature specification from `/specs/004-claude-like-aesthetic-ui/spec.md`

---

## Summary

The platform UI will be upgraded to a sophisticated, warm-minimalist aesthetic styled after `claude.ai`. We will declare high-legibility CSS design tokens (warm light cream, warm slate dark, amber focus rings, and custom organic easing curves), pair an elegant editorial serif font (Lora/Merriweather) for headers/responses with a sharp, modern sans-serif (Inter) for controls, and apply these layouts systematically across the entire React frontend portal.

---

## Technical Context

**Language/Version**: TypeScript 5 / React 18 / Node 20  
**Primary Dependencies**: TailwindCSS (if already configured) / Vanilla CSS custom properties, Zustand, Lucide React, Axios  
**Storage**: Client localStorage (theme state caching)  
**Testing**: Manual visual validation and React static asset compile verification (`npm run build`)  
**Target Platform**: All modern desktop and mobile browsers (Chrome, Safari, Firefox, Edge)  
**Project Type**: Frontend SPA React Web Application  
**Performance Goals**: 60 FPS hover transitions and page loads; zero layout shifts due to typography  
**Constraints**: Zero addition of heavyweight UI component frameworks; style entirely via pure CSS classes  
**Scale/Scope**: Refactoring global stylesheet and 5 React page templates  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **WSL Mandate Check**: Yes, executing all terminal runs entirely within WSL/Ubuntu.
- **Dependency Violations**: None. Zero slowapi, raw psycopg2, or K8s components used.
- **External Identity Providers**: None. The actual Google SSO callback remains completely local-first and client-controlled, simply styled to match our typography.
- **Result**: **PASS** ✅

---

## Project Structure

### Documentation (this feature)

```text
specs/004-claude-like-aesthetic-ui/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Visual research, color charts, typography
├── data-model.md        # Style contract, property tokens, switcher state
└── quickstart.md        # Quickstart verification and preview guidelines
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── index.css        # GLOBAL STYLESHEET (Defines color variables and custom serif classes)
│   ├── pages/
│   │   ├── LoginPage.tsx        # Unified Sign-in screen refactor
│   │   ├── VerifyEmailPage.tsx  # Dynamic Verification callback screen refactor
│   │   ├── ResetPasswordPage.tsx# Forgot/Reset password screen refactor
│   │   ├── ChatPage.tsx         # Spacious multi-turn Chat canvas refactor
│   │   └── SettingsPage.tsx     # Workspace Settings dashboard refactor
```

**Structure Decision**: Refactoring matches Option 2 (Web application architecture) focusing entirely on the TypeScript React client app.

---

## Complexity Tracking

*No constitution violations present. All constraints are strictly met.*
