# Quickstart: Testing the Claude Aesthetic UI Redesign

This guide explains how to spin up the local development environment, preview the styled screens, and verify that the redesign meets the Claude-like specifications.

---

## 🛠️ Local Environment Startup

Ensure your container services are running perfectly:

```bash
# Verify the Docker containers are up
docker compose ps

# Rebuild and start the frontend container explicitly with hot-reload enabled
docker compose up -d --build frontend
```

---

## 🖥️ Live Visual Preview Checks

Navigate to the following URLs in your local browser:

### 1. The Login / Registration Portal (`http://localhost:3000/`)
* **Expected Visuals**: Centered frosted-glass card, elegant warm-serif title, soft Google sign-on button, amber glows on input focus, and fluid hover eases.

### 2. The Main Chat Workspace (`http://localhost:3000/chat`)
* **Expected Visuals**: Beautifully styled message blocks. User inputs inside a compact right-aligned card. AI answers typeset cleanly in warm serif body text with custom line-height and structured spacing. Fully responsive sidebar menu with micro-hover slide transitions.

### 3. Verification & Reset Callback Screens (`http://localhost:3000/verify-email`, `http://localhost:3000/reset-password`)
* **Expected Visuals**: Matches the unified warm-minimalist aesthetic, replacing generic un-styled state messages.

---

## 🔬 Compilation and Validation Checks

Ensure typescript and static assets compile successfully without formatting or lint issues:

```bash
# From within the frontend/ directory
npm run build
```
