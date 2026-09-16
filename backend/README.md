# Samaadhaan AI — Python Backend (FastAPI + SQLite)

A simple, single-file demo backend that replaces the original Node/Express +
Firestore server. It implements every `/api/...` endpoint that the React
frontend already calls (see `src/services/api.ts`), backed by a local SQLite
database file that is auto-created and auto-seeded the first time you run it.

This is a **demo-grade** backend, not production-grade:
- Auth "token" = the user's id (no real JWT / password hashing security).
- "AI analysis" = a small rule-based keyword + urgency heuristic, not a real ML model.
- Good enough for local development, a hackathon demo, or a college project.

## 1. Install

```bash
cd backend
pip install -r requirements.txt
```

## 2. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
 Samaadhaan AI - FastAPI + SQLite demo backend ready
 Database file: .../backend/samaadhaan.db
```

Check it's alive: open http://127.0.0.1:8000/api/health

## 3. Run the frontend against it

In a second terminal, from the project root:

```bash
npm install        # first time only
npm run dev:frontend
```

This starts Vite on **http://localhost:5173**. Vite is configured
(`vite.config.ts`) to proxy every `/api/*` request to
`http://127.0.0.1:8000`, so the frontend code needs **no changes** — it
already calls `fetch('/api/...')` everywhere.

Open http://localhost:5173 in your browser. The app auto-logs you in as a
demo "citizen" account on first load (via `/api/auth/switch-demo`), and you
can switch roles (citizen / admin / institution / expert) from the navbar.

## 4. Reset the demo data

The footer's "Reset Demo Data" button calls `POST /api/seed/reset`, which
wipes and re-seeds the SQLite database back to its original demo state.
You can also just delete `backend/samaadhaan.db` and restart the server.

## What's implemented

| Area | Endpoints |
|---|---|
| Auth | register, login, me, switch-demo |
| Categories & Institutions | list, institution recommendations |
| Problems | list/filter, get one, create (+ heuristic AI analysis + suggested solutions), update, support/un-support |
| Clusters | list, get one, create, update |
| Projects & Milestones | list/filter, get one, create, update, update milestone |
| Solutions | list for a problem, add, vote, update status |
| Analytics | overview, by category, by priority bucket, trends, impact |
| Notifications | list, mark read, mark all read |
| Utility | health check, reset seed data |

## Notes on the frontend fallback logic

`src/services/api.ts` was originally written to fall back to Firestore if the
backend request fails. With this Python backend running, every call should
succeed against `/api/...` first, so Firestore is not needed for the demo.
If you don't want to touch Firebase/Firestore at all, that's fine — those
calls are all wrapped in `try/catch` and silently ignored on failure.
