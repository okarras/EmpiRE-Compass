# AGENTS.md — EmpiRE-Compass

Directions for AI agents and contributors working on this repository.

## Project Map

| Area     | Path                           | Purpose                                              |
| -------- | ------------------------------ | ---------------------------------------------------- |
| Frontend | [`src/`](src/)                 | React 18 + Vite SPA: pages, components, hooks, Redux |
| Backend  | [`backend/src/`](backend/src/) | Express API: auth, CRUD, AI proxy, Firebase Admin    |
| Shared   | [`shared/`](shared/)           | Cross-package types and utilities (cost, AI models)  |
| Scripts  | [`scripts/`](scripts/)         | Python statistics automation                         |
| Docs     | [`docs/`](docs/)               | Contributing, Firebase, versioning                   |

See [`README.md`](README.md) for installation and architecture overview. Backend setup: [`backend/README.md`](backend/README.md).

## Non-Negotiables

1. **Minimal diffs** — change only what the task requires; no drive-by refactors.
2. **Behavior first** — refactor PRs must not change user-visible behavior unless explicitly scoped.
3. **Conventional Commits** — `feat:`, `fix:`, `refactor:`, etc. (see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)).
4. **No secrets** — never commit `.env`, service account keys, or API keys.
5. **One concern per PR** — standards, dedup, each god-file split, and tests are separate PRs.

## Architecture Rules

### UI vs logic

- **Components** (`src/components/`, `src/pages/`) — render UI; keep thin.
- **Hooks** (`src/hooks/`) — state, side effects, orchestration.
- **Services** (`src/services/`, `backend/src/services/`) — API calls, external integrations.

### Data access

- `src/firestore/*` are **API adapters** (backend REST + backup fallback), not direct Firestore SDK usage.
- Prefer `src/services/backendApi/` for new backend calls.
- Pattern: try backend API → fall back to `BackupService` when configured or on failure.

### AI routing

- Always route through `UnifiedAIService` in [`src/services/backendAIService.ts`](src/services/backendAIService.ts).
- User-provided API keys → client `AIService` in [`src/services/aiService.ts`](src/services/aiService.ts).
- Shared/env keys → backend `/api/ai/generate`.
- Model types live in [`shared/aiModels.ts`](shared/aiModels.ts) — do not duplicate model unions elsewhere.

### Authentication

- Inside React: `useAuthData()` from [`src/auth/useAuthData.ts`](src/auth/useAuthData.ts).
- Outside React: [`src/auth/keycloakStore.ts`](src/auth/keycloakStore.ts).
- Backend: [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts) validates Keycloak JWTs.

### Backend routes

- Routes stay thin: validate → call service → log → respond.
- Firestore access belongs in `backend/src/services/`, not inline in route handlers.

## File Size Targets

| Kind               | Target                       |
| ------------------ | ---------------------------- |
| Components / hooks | ≤ ~300 lines                 |
| Route modules      | ≤ ~200 lines per domain file |
| Services           | One domain per file          |

### When to split a file

Split when **any** of these apply:

- Multiple unrelated domains (UI + API + prompts in one file)
- 10+ `useState` / `useEffect` in one component
- File exceeds ~300 lines and has clear extraction boundaries
- Multiple `eslint-disable` directives masking type issues

**Extract before rewrite** — move code verbatim first; simplify in a follow-up PR.

## PR Workflow

1. Branch: `refactor/`, `feat/`, `fix/`, etc. (see CONTRIBUTING).
2. Run `npm run lint` and `npm run format` before committing.
3. Run `npm test` when touching tested modules.
4. Keep PRs reviewable in under 30 minutes.

## Testing Expectations

Add or update Vitest tests when touching:

| Module                                                     | Why               |
| ---------------------------------------------------------- | ----------------- |
| `backend/src/middleware/auth.ts`                           | Security-critical |
| `src/services/backendAIService.ts`                         | AI routing logic  |
| `shared/costCalculator.ts`                                 | Pricing accuracy  |
| `src/constants/data_processing_helper_functions_nlp4re.ts` | Data transforms   |
| `src/firestore/CRUDQuestions.ts`                           | Backup fallback   |

Use mocks for Firebase/Keycloak. Storybook covers visual components; unit tests cover business logic.

## Cursor Rules

File-specific guidance lives in [`.cursor/rules/`](.cursor/rules/):

- `core-standards.mdc` — always applied
- `react-components.mdc` — `src/**/*.tsx`
- `backend-api.mdc` — `backend/**/*.ts`
- `ai-layer.mdc` — AI-related files
- `data-adapters.mdc` — data adapter layer

## Refactoring Principles

1. Preserve import paths via barrel re-exports during migration.
2. No new abstractions for 1–2 lines — inline unless reused 3+ times.
3. Type safety over `eslint-disable` — remove suppressions when splitting files.
4. Name for what it does — document `firestore/` as adapters; rename folder in a dedicated PR later.
