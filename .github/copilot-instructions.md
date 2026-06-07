# EmpiRE-Compass — GitHub Copilot Instructions

EmpiRE-Compass is a neuro-symbolic dashboard for empirical research practice in Requirements Engineering. It combines the Open Research Knowledge Graph (ORKG) with LLM-assisted SPARQL generation and data interpretation.

## Stack

- **Frontend:** React 18, TypeScript, Vite, MUI, Redux Toolkit, React Router
- **Backend:** Node.js/Express (`backend/`), Firebase Admin, Keycloak auth
- **AI:** Vercel AI SDK; providers via backend env (`AI_PROVIDER`, OpenRouter default)
- **Data:** ORKG SPARQL endpoint, Firestore for templates/questions, Keycloak for auth

## Key directories

| Path                       | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `src/components/AI/`       | AI assistant, SPARQL editor, chat UI         |
| `src/hooks/`               | `useAIAssistant`, `useQueryGeneration`, etc. |
| `src/services/backendApi/` | Frontend API client modules                  |
| `backend/src/routes/`      | Express routes (thin handlers)               |
| `backend/src/services/`    | Firestore and business logic                 |
| `src/templates/`           | ORKG research template JSON schemas          |

## Issue creation guidelines

When creating or expanding GitHub issues from a user's rough description:

1. **Pick the right template:** bug, feature, docs, or refactor (see `.github/ISSUE_TEMPLATE/`).
2. **Stay concise:** Aim for ~125 words total unless the user provided extensive detail. Focused issues work better for AI agents.
3. **Do not invent facts:** Mark unknown environment details, versions, or reproduction steps as `TBD` or ask the user.
4. **Include acceptance criteria** for features and refactors.
5. **Name affected areas:** frontend, backend API, AI/SPARQL, Firebase, Keycloak, templates/ORKG.
6. **Suggest labels** matching template defaults: `bug`, `enhancement`, `documentation`, `refactor`, `triage`.

### Bug reports must include

- Summary, steps to reproduce, expected vs actual behavior
- Area dropdown value and environment when known
- Reference relevant files only when confident (e.g. `src/components/AI/SparqlEditorPanel.tsx`)

### Feature requests must include

- Problem/motivation, proposed solution, acceptance criteria checklist

## Branch and commit conventions

- Branches: `<type>/<short-description>` — e.g. `bugfix/sparql-paste-crash`, `feature/issue-templates`
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## Development commands

```sh
npm install
npm run dev              # frontend (Vite)
cd backend && npm run dev  # backend API (port 5001)
npm run lint             # ESLint
npm run format           # Prettier
cd backend && npm test   # backend unit tests
npm run issue:enhance    # expand rough issue text with AI (see CONTRIBUTING.md)
```

## Coding standards

- Smallest correct change; match surrounding patterns
- AI calls go through `UnifiedAIService` / backend `/api/ai/generate` — no duplicate AI clients
- Backend routes stay thin; Firestore access in `backend/src/services/`
- Shared model/cost config: `shared/aiModels.ts`, `shared/costCalculator.ts`
- Never commit secrets (`.env`, service account keys)

## Domain notes (SPARQL / ORKG)

- SPARQL is the source of truth for data; LLMs generate queries, not facts
- Main template ID: `R186491`; NLP4RE template: `C121001`
- Empirical study = both data collection AND analysis are not "no collection" / "no analysis"

When assigned an issue, read linked files, run relevant lint/tests, and keep PR scope aligned with the issue acceptance criteria.
