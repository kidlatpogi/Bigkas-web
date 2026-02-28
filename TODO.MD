# BIGKAS Project: Final Polish & Fundamental Strengthening

This document tracks the non-trivial enhancements required to solidify the 
application's security and user experience before moving to advanced ML features.

## 🛡️ Phase 1: Security & System Integrity
*Focus: Protecting the infrastructure and preventing resource exhaustion.*

- [DONE] **Exponential Login Backoff (Brute-Force Protection)**
  - Update Database: Add `failed_attempts` (int) and `lockout_until` (timestamp) to user profiles.
  - Backend Logic: Implement a 3-strike rule (3 fails = 5m lock, 4 = 15m, 5 = 30m).
  - Frontend UX: Display a real-time countdown timer in `LoginPage.jsx` when 423 (Locked) is returned.
- [DONE] **Server-Side Rate Limiting**
  - Enforce the "Generate Script" cooldown on the Python backend to prevent API key exhaustion via manual endpoint hits.
  - Backend Logic: 60-second cooldown per user tracked in profiles table.
  - Frontend UX: Display countdown timer on generate button when in cooldown.

## 🔑 Phase 2: Authentication Overhaul
*Focus: Professionalizing the onboarding experience.*

- [DONE] **Email OTP Transition**
  - Switch Supabase Auth from "Magic Links" to "6-Digit OTP".
- [DONE] **Split-Box OTP Input Component**
  - Build a custom React component in `VerifyEmailPage.jsx` with 6 auto-focusing numeric fields.
- [DONE] **Spam Mitigation**
  - Implement a 60-second cooldown on the "Resend Code" button.

## 📖 Phase 3: Speech Frameworks
*Focus: Adding educational value and structural logic.*

- [ ] **Framework Library (`frameworks.json`)**
  - Research and define: **P.R.E.P** (Point, Reason, Example, Point), **P.A.S** (Problem, Agitation, Solution), and **H.I.C** (Hook, Inform, Call to Action).
- [ ] **Generator Integration**
  - Add a "Framework" dropdown to `GenerateScriptPage.jsx`.
  - Update `aiService.js` to inject the selected framework's rules into the AI system prompt.

## 🎲 Phase 4: Topic Expansion
*Focus: Variety and performance.*

- [ ] **Finalize `topics.json`**
  - Integrate the 200+ topics provided into the project assets.
- [ ] **Lazy Loading Implementation**
  - Ensure `GenerateScriptPage.jsx` fetches/imports the JSON only on user interaction to keep the initial load fast.