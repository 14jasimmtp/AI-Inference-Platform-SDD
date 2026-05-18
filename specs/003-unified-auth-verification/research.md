# Architectural Research & Decisions: Unified Authentication

This document outlines the resolved technical decisions and architectural research performed for Feature Phase 3 (Unified Authentication, Verification & Recovery).

---

## 1. Google SSO Integration vs. Host Isolation Constraint

* **Decision**: Implement a **purely local, self-contained Mock Google SSO flow**.
* **Rationale**: 
  - The platform's `constitution.md` imposes a strict hard constraint: `✗ NEVER use: OAuth / OIDC / SAML | any external identity provider`. This is designed to preserve absolute host isolation, prevent runtime dependencies on third-party public web networks, and allow fully self-contained local testing.
  - To fulfill the user's unified signup/login UX requirements without violating this rule, we will create a simulated Google SSO gateway.
  - The frontend will display a standard "Continue with Google" button. Clicking it opens a local developer dialog or redirects to a locally hosted consent portal (`/auth/mock-google-login`).
  - Upon user approval, this simulated portal issues a mock identity response back to the backend. The backend registers the user (if new), marks the account as verified, issues our standard HS256 stateless JWT session token, and logs the user in instantly in a single click.
* **Alternatives Considered**: 
  - *Real Google OAuth Client*: Rejected. Violated hard constraints of the platform constitution and required external credentials/network access.

---

## 2. Transactional Email Delivery in Local Environment

* **Decision**: Add a containerized **Mailpit** service to `docker-compose.yml` to capture SMTP traffic locally.
* **Rationale**:
  - Verification and password recovery require sending actual emails containing verification tokens and recovery links.
  - Rather than configuring a real external SMTP provider (which requires plaintext credentials and internet access), we will declare a local Mailpit container inside the monorepo's orchestration layer.
  - The backend's Python `email_service.py` will connect to `localhost:1025` using standard SMTP protocols to dispatch transactional emails.
  - Developers and users can open the Mailpit web UI at `http://localhost:8025` to instantly inspect verification and password recovery emails, click links, and verify flows in a 100% offline sandbox.
* **Alternatives Considered**:
  - *Log-only email service*: Rejected. Writing links to stdout is sufficient for backend testing but breaks the full end-to-end integration testing and user validation loop on the frontend.
  - *External SMTP API (SendGrid/Mailgun)*: Rejected due to plaintext secret handling and external network dependencies.

---

## 3. Verification & Password Reset Token Persistence

* **Decision**: Store cryptographically random UUID tokens as nullable columns directly inside the `users` table.
* **Rationale**:
  - Keeping tokens inside the `User` table (`verification_token`, `reset_token`, along with corresponding timestamps `verification_sent_at` and `reset_expires_at`) keeps user persistence transactional and simple.
  - Since standard PostgreSQL transactions secure these fields, we can ensure that updating a password and invalidating a reset token happens as a single atomic query.
  - Tokens are fully cleared upon successful verification or consumption.
* **Alternatives Considered**:
  - *Redis-based token cache*: Rejected. Although Redis works well for volatile state, saving token state inside the main user record simplifies transactional rollbacks and keeps all credential-related operations strictly contained within PostgreSQL.
