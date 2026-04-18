# AGENTS.md — AI Coding Agent Guide for EmpiRE-Compass

Quick-start context for AI coding agents (Copilot, Cursor, etc.). Read this before working on any feature or fix.

---

## 1. Project in One Paragraph

EmpiRE-Compass is a **neuro-symbolic dashboard** that helps researchers explore, synthesise, and reuse empirical research knowledge in Requirements Engineering (RE). It combines a **symbolic layer** (structured SPARQL queries against the [Open Research Knowledge Graph (ORKG)](https://orkg.org)) with a **neural layer** (optional LLMs via multiple providers) to answer both predefined and custom competency questions. The frontend is a React + TypeScript SPA (Vite); the backend is a lightweight Express/Node microservice that proxies AI requests and keeps API keys server-side. Live deployment: <https://empire-compass.tib.eu/R186491/>.

---

## 2. Repository Layout

```
EmpiRE-Compass/
├── src/                    # Frontend (React + TypeScript)
│   ├── api/                # SPARQL query constants and definitions
│   ├── auth/               # Keycloak authentication logic and contexts
│   ├── components/         # Reusable UI components (AI/, Admin/, CustomCharts/, …)
│   ├── firestore/          # Firebase Firestore service helpers
│   ├── hooks/              # Custom hooks (useAIAssistant, useAuth, …)
│   ├── pages/              # Route-level page components
│   ├── services/           # API clients for backend and AI integration
│   ├── store/              # Redux slices (aiSlice, questionSlice)
│   ├── templates/          # JSON schemas for research domain templates
│   └── utils/              # Formatting and data-processing utilities
├── backend/                # Node.js/Express API microservice
│   ├── src/server.ts       # Entry point
│   └── .env.example        # Backend env template
├── paper/                  # JOSS paper (paper.md, paper.bib)
├── scripts/                # Python scripts for ORKG statistics
├── stories/                # Storybook stories
├── docs/                   # Contributing, setup, and security guides
├── .env.example            # Frontend env template
├── vite.config.ts          # Vite build configuration
├── vitest.workspace.ts     # Vitest workspace (frontend + backend)
└── commitlint.config.cjs   # Conventional Commits enforcement
```

---

## 3. Dev Commands

> **Node ≥ 18** required (see `backend/package.json` `engines` field).

```sh
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start frontend dev server (http://localhost:5173)
npm run dev

# Start backend dev server (http://localhost:5001, hot-reload)
cd backend && npm run dev

# Lint (frontend)
npm run lint

# Lint (backend)
cd backend && npm run lint

# Format all files with Prettier
npm run format

# Run frontend tests
npx vitest

# Run backend tests
cd backend && npm test

# Storybook component explorer (http://localhost:6006)
npm run storybook

# Production build (checks env vars, then tsc + vite)
npm run build
```

---

## 4. Environment & Secrets

| File | Purpose |
|---|---|
| `.env.example` | Frontend template — copy to `.env` |
| `backend/.env.example` | Backend template — copy to `backend/.env` |

**Frontend (`.env`)**

| Variable | Required? | Notes |
|---|---|---|
| `VITE_BACKEND_URL` | Yes | URL of the backend API |
| `VITE_KEYCLOAK_URL` / `_REALM` / `_CLIENT_ID` | Optional | Auth disabled when absent |
| `VITE_FIREBASE_*` | Optional | Needed for Firestore features |
| `VITE_OPEN_AI_API_KEY` / `VITE_GROQ_API_KEY` / `VITE_MISTRAL_API_KEY` / `VITE_GOOGLE_GENERATIVE_AI_API_KEY` | Optional / local dev only | **Never expose in production bundles** — use backend keys instead (see `docs/VERCEL_SECURITY.md`) |

**Backend (`backend/.env`)**

| Variable | Required? | Notes |
|---|---|---|
| `PORT` | Optional | Defaults to `5001` |
| `AI_PROVIDER` | Yes | `openai`, `groq`, `mistral`, or `google` |
| `OPENAI_MODEL` / `GROQ_MODEL` / `MISTRAL_MODEL` / `GOOGLE_MODEL` | Optional | Model name per provider |
| `OPENAI_API_KEY` / `GROQ_API_KEY` / `MISTRAL_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | At least one | Must match `AI_PROVIDER` |

⚠️ **Never commit `.env` files or real API keys.** Gitleaks scans every push/PR (see `.gitleaks.toml`).

---

## 5. Architecture Notes for Agents

- **Symbolic layer**: SPARQL queries are defined as constants in `src/api/`. They run against the ORKG SPARQL endpoint. No LLM involvement here.
- **Neural layer**: AI configuration (provider, model, keys) lives in `src/components/AI/` and `src/store/aiSlice`. The backend (`backend/src/server.ts`) proxies AI calls to keep keys out of the frontend bundle.
- **Auth (Keycloak)**: Configured in `src/auth/`. If Keycloak env vars are absent the app starts in unauthenticated mode — login/logout and admin routes are hidden/disabled but the dashboard remains fully functional.
- **Admin routes**: Gated behind Keycloak authentication. Do not remove these guards.
- **Firebase/Firestore**: Used for persistent storage (community questions, stats). Helpers live in `src/firestore/`.
- **State management**: Redux Toolkit (`src/store/`). Use existing slices before adding new ones.
- **Statistics pipeline**: Python scripts in `scripts/` fetch data from ORKG and push results to Firebase. Triggered manually or on schedule via GitHub Actions.

---

## 6. Conventions

- **Language**: TypeScript throughout (strict mode). Avoid `any`.
- **UI**: Material-UI (MUI) v6 + Emotion. Match existing component patterns.
- **State**: Redux Toolkit slices; React hooks for local state.
- **Routing**: React Router v7 (`react-router-dom`). Add routes in the existing router config.
- **Commit messages**: [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint + Husky (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Branch naming**: `<type>/<short-description>` (e.g., `feature/sparql-filter`, `bugfix/chart-crash`). See `docs/CONTRIBUTING.md`.
- **Formatting**: Prettier (`.prettierrc`). Run `npm run format` or rely on lint-staged on commit.
- **PRs**: Small, focused changes; link related issues; at least one maintainer approval required.

---

## 7. Testing & CI

| Workflow | Trigger | What it does |
|---|---|---|
| `gitleaks.yml` | push/PR to `main` | Scans for leaked secrets |
| `update-statistics.yml` | schedule (Mon 6 AM UTC), push with `[stats]` tag, merged PR | Runs Python ORKG stats scripts |
| `draft-pdf.yml` | push to `paper/**` | Builds JOSS draft PDF via openjournals action |

**Run locally the same checks CI runs:**

```sh
# Secret scan (requires gitleaks installed)
gitleaks detect --config .gitleaks.toml

# Frontend tests
npx vitest run

# Backend tests
cd backend && npm test
```

> ⚠️ **Test coverage is sparse.** Do not assume untouched code is covered. Write tests for any logic you add or change.

---

## 8. Paper / JOSS

- Source: `paper/paper.md` and `paper/paper.bib`
- Draft PDF: built automatically by `.github/workflows/draft-pdf.yml` on any push that touches `paper/**` or the workflow file itself
- The PDF artifact is uploaded as `paper` in the workflow run

---

## 9. Do / Don't for Agents

**Do:**
- Match existing code patterns (MUI components, Redux slices, SPARQL constants)
- Keep PRs small and focused on a single concern
- Run `npm run lint` and `npm run format` on any files you touch
- Add or update tests when changing logic
- Reference `.env.example` / `backend/.env.example` when documenting new env vars

**Don't:**
- Edit `.env` or `backend/.env` with real credentials — use placeholder values only
- Remove or weaken Keycloak/auth guards or security-related middleware
- Make large unrelated refactors in the same PR
- Add `VITE_` prefixed AI keys to production deployments (bundle exposure risk)
- Bypass Gitleaks by encoding or obfuscating secrets
