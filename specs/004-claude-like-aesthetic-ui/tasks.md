# Tasks: Claude-Like Aesthetic UI Redesign

**Input**: Design documents from `/specs/004-claude-like-aesthetic-ui/`
**Prerequisites**: [plan.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/plan.md) (required), [spec.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/spec.md) (required for user stories), [research.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/research.md), [data-model.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/data-model.md), [quickstart.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/quickstart.md)

**Tests**: Pure manual visual check and browser responsiveness testing (no backend tests are requested since this is a pure presentation styling overhaul).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Path Conventions

- **Web app**: All changes target the directory `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Global style and configuration setup

- [X] T001 Configure global visual theme CSS variables under `:root` and `.dark` selectors in [frontend/src/index.css](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/index.css)
- [X] T002 [P] Configure Lora/Merriweather serif and Inter sans-serif font loaders in [frontend/index.html](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/index.html)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CSS utilities and global theme hooks

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create base utility classes (`.claude-serif-title`, `.claude-sans-control`, `.claude-focus-ring`) in [frontend/src/index.css](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/index.css)
- [X] T004 [P] Implement global theme state manager (dark mode toggler hook) in [frontend/src/hooks/useTheme.ts](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/hooks/useTheme.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - A Warm, Sophisticated Authentication Experience (Priority: P1) 🎯 MVP

**Goal**: Deliver a beautiful, professional, and calm login and registration experience with matching verification screens.

**Independent Test**: Navigate to the Login and Register pages. Ensure centered cards use premium serif typography, and input boxes glow amber on active focus.

### Implementation for User Story 1

- [X] T005 [US1] Refactor Login card container, spacing, and buttons with Claude-like aesthetics in [frontend/src/pages/LoginPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/LoginPage.tsx)
- [X] T006 [P] [US1] Apply CSS class styles, inputs focus rings, and transition easing properties to registration page in [frontend/src/pages/RegisterPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/RegisterPage.tsx)
- [X] T007 [US1] Refactor Email verification page layout, fonts, and borders to inherit the warm-minimalist card theme in [frontend/src/pages/VerifyEmailPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/VerifyEmailPage.tsx)
- [X] T008 [P] [US1] Refactor password recovery and reset screens to inherit identical warm cards in [frontend/src/pages/ResetPasswordPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/ResetPasswordPage.tsx)

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Calm and Focused Chat Workspace (Priority: P1)

**Goal**: Deliver a clutter-free chat session viewport maximizing AI reading ergonomics.

**Independent Test**: Conduct a full chat session. Confirm sidebar matches light/dark settings, and AI responses render in highly legible serif typesetting.

### Implementation for User Story 2

- [X] T009 [US2] Refactor main chat workspace grid container and custom scrollbars in [frontend/src/pages/ChatPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/ChatPage.tsx)
- [X] T010 [P] [US2] Style user message bubbles with `#F1ECE4` (light) / `#2A2A2A` (dark) and soft padding in [frontend/src/components/chat/UserMessage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/components/chat/UserMessage.tsx)
- [X] T011 [US2] Refactor AI assistant response containers to render elegant Lora/Merriweather serif text, custom blockquotes, and code elements in [frontend/src/components/chat/AssistantMessage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/components/chat/AssistantMessage.tsx)
- [X] T012 [P] [US2] Redesign chat input field to feature a soft amber focus ring and transition eases in [frontend/src/components/chat/ChatInput.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/components/chat/ChatInput.tsx)
- [X] T013 [US2] Apply sliding slide-drawer micro-animations and warm hover states to sidebar menu links in [frontend/src/components/layout/Sidebar.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/components/layout/Sidebar.tsx)

**Checkpoint**: At this point, User Stories 1 AND 2 work independently.

---

## Phase 5: User Story 3 - Cohesive Settings Console and Action Dashboards (Priority: P2)

**Goal**: Deliver clean administrative grids and modals.

**Independent Test**: Go to Settings page and verify rate-limit toggle inputs, active modal borders, and API Key layout grids.

### Implementation for User Story 3

- [X] T014 [US3] Refactor organization settings workspace containers and grid layouts in [frontend/src/pages/AdminPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/AdminPage.tsx)
- [X] T015 [P] [US3] Stylize settings API keys tables and rate-limit badges with soft borders and padding in [frontend/src/pages/AdminPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/AdminPage.tsx)
- [X] T016 [US3] Apply cubic-bezier transition curves and scale changes to active modal controls and toggles in [frontend/src/pages/AdminPage.tsx](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend/src/pages/AdminPage.tsx)

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final builds and preview validation

- [X] T017 Verify complete frontend compilation output `npm run build` inside [frontend/](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/frontend) directory
- [X] T018 Execute visual [quickstart.md](file:///c:/Users/MuhamedJasim/AI-Inference-Platform-SDD/specs/004-claude-like-aesthetic-ui/quickstart.md) validation checks to ensure full page responsiveness and 60fps easing curves

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

---

## Parallel Example: User Story 1

```bash
# Launch models and UI templates in parallel:
Task: "Refactor RegisterPage inputs focus rings"
Task: "Refactor password recovery cards and buttons"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (The Authentication portal)
4. **STOP and VALIDATE**: Test User Story 1 independently in browser
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Auth Portal) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Chat Canvas) → Test independently → Deploy/Demo
4. Add User Story 3 (Settings Grids) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
