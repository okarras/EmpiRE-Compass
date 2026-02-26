# Vercel Security Configuration

This document describes how to configure Vercel to prevent API key exposure for both frontend and backend.

## Architecture Overview

| Component                     | Where env vars live                 | Exposed to client?                                |
| ----------------------------- | ----------------------------------- | ------------------------------------------------- |
| **Frontend** (Vite)           | Vercel Dashboard → Frontend project | ⚠️ `VITE_*` vars are **baked into** the JS bundle |
| **Backend** (Node serverless) | Vercel Dashboard → Backend project  | ✅ **Never exposed** – server-side only           |

## ⛔ NEVER Add to Frontend Project

These variables **must never** be set for the frontend (root) project. They would get inlined into the client bundle and exposed to anyone who inspects the deployed app:

- `VITE_OPEN_AI_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_MISTRAL_API_KEY`
- `VITE_GOOGLE_GENERATIVE_AI_API_KEY`
- `VITE_OPEN_ROUTER_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (or any JSON with private keys)

## ✅ Frontend Project – Allowed Variables

These are safe for the frontend (they are non-secret or designed to be public):

| Variable                | Purpose                      | Safe?                            |
| ----------------------- | ---------------------------- | -------------------------------- |
| `VITE_BACKEND_URL`      | Backend API URL              | ✅                               |
| `VITE_FIREBASE_API_KEY` | Firebase client config       | ✅ (Firebase Rules protect data) |
| `VITE_FIREBASE_*`       | Other Firebase client config | ✅                               |
| `VITE_KEYCLOAK_*`       | Keycloak auth URLs/IDs       | ✅                               |
| `VITE_ENDPOINT_URL`     | ORKG/SPARQL endpoint         | ✅                               |

## ✅ Backend Project – Required Variables

Set these only in the **backend** Vercel project:

| Variable                       | Purpose                        | Scoping             |
| ------------------------------ | ------------------------------ | ------------------- |
| `OPENAI_API_KEY`               | OpenAI API                     | Production, Preview |
| `GROQ_API_KEY`                 | Groq API                       | Production, Preview |
| `MISTRAL_API_KEY`              | Mistral API                    | Production, Preview |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI                      | Production, Preview |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin JSON            | Production, Preview |
| `FRONTEND_URL`                 | CORS origin                    | Production          |
| `PORT`                         | Server port (Vercel sets this) | -                   |

## Vercel Project Setup

1. **Two projects** (or monorepo with `vercel.json` in each):

   - Frontend: builds from repo root (`npm run build`)
   - Backend: builds from `backend/` using `backend/vercel.json`

2. **Environment scoping**:

   - Production: All secrets
   - Preview: Add only if PR previews need AI (optional)
   - Development: Not used (local `.env`)

3. **Audit regularly**: Vercel Dashboard → Settings → Environment Variables. Confirm no `VITE_*` AI keys on the frontend project.

## Build-Time Check (Optional)

To fail the build if forbidden vars are present, add to `package.json`:

```json
"scripts": {
  "prebuild": "node scripts/check-env-vars.js",
  ...
}
```

See `scripts/check-env-vars.js` for the implementation.
