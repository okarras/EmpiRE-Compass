---
name: github-issue
description: Expand a rough note into a structured GitHub issue for EmpiRE-Compass using project templates (bug, feature, docs, refactor). Use when the user wants to create, draft, or improve a GitHub issue from a simple description.
---

# GitHub Issue Assistant (EmpiRE-Compass)

Help the user turn a short, informal description into a structured GitHub issue that matches this repository's templates.

## When to use

- User describes a bug, feature, docs gap, or refactor in plain language
- User asks to "create an issue", "improve my issue", or "format this as a bug report"
- User wants Copilot-style issue expansion without leaving Cursor

## Workflow

1. **Identify issue type** from the user's message:

   - `bug` — something broken
   - `feature` — new capability or enhancement
   - `docs` — documentation missing or wrong
   - `refactor` — internal improvement, no user-facing change

2. **Read the matching template** from `scripts/issue-templates/{type}.md` (use `feature.md` for features).

3. **Expand the rough note** into markdown that fills every template section:

   - Keep total length around **125 words** unless the user provided extensive detail
   - Use **TBD** or **Not provided** for unknown facts — never invent stack traces, versions, or steps
   - Bug: numbered reproduction steps, expected vs actual
   - Feature: problem, solution, acceptance criteria as `- [ ]` checklist
   - Docs: location (file path or URL), current vs suggested state
   - Refactor: scope, motivation, risks

4. **Suggest a title** using prefixes: `[Bug]:`, `[Feature]:`, `[Docs]:`, `[Refactor]:`

5. **Suggest labels:** template default + `triage` (see `.github/ISSUE_TEMPLATE/`)

6. **Present** title, body, and labels for the user to copy into GitHub — or offer to run:
   ```sh
   npm run issue:enhance -- --type <type> --text "<rough note>"
   npm run issue:enhance -- --type <type> --text "<rough note>" --create
   ```

## Project context

- Repo: neuro-symbolic ORKG dashboard (React/Vite frontend, Node/Express backend)
- Key areas: AI/SPARQL (`src/components/AI/`), backend API (`backend/src/routes/`), Firebase, Keycloak
- Conventions: `.github/copilot-instructions.md`, `docs/CONTRIBUTING.md`
- GitHub templates: `.github/ISSUE_TEMPLATE/*.yml`

## Example

**User:** "the sparql editor crashes when I paste a long query"

**You produce:**

**Title:** `[Bug]: SPARQL editor crashes when pasting long queries`

**Body:** (filled bug template with Summary, Steps, Expected, Actual, Area: AI/SPARQL, Environment: TBD)

**Labels:** `bug`, `triage`

**Optional:** Run `npm run issue:enhance -- --type bug --text "..."` if the user wants CLI output or `--create` with `gh`.
