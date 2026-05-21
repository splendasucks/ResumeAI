## Learned User Preferences

- When asked to implement an attached plan, execute it end-to-end without editing the plan file itself.
- Prefer the agent to complete setup, configuration, local verification, and deployment steps rather than handing checklists back to the user when the task explicitly requires full delivery.
- Use Doppler for environment secrets on this project when building, syncing env, or deploying (not hand-maintained committed `.env` files for real credentials).
- Introduce or extend testable configuration (for example env validation) with Vitest and TDD rather than ad-hoc `process.env` access alone.
- Run the continual-learning / `AGENTS.md` memory update flow when asked, using incremental transcript indexing.
- Use `uv run` for Python utilities under `scripts/` (for example template or NPOWER build helpers).
- After fixing Next.js compile issues in server action modules, clear `.next` and re-run `npm run build` to confirm SWC sees the corrected file.

## Learned Workspace Facts

- ResumeAI is a Next.js 14 App Router app: Clerk authentication, MongoDB via Mongoose, Gemini (`gemini-2.0-flash` in server actions), Tailwind/shadcn UI.
- Clerk middleware protects `/dashboard` and `/my-resume/:resumeId/edit`; public auth routes use `/sign-in` and `/sign-up` (see `.env.local.example` for required env var names—never commit real values).
- Primary user flow: dashboard → create resume → `/my-resume/{id}/edit` (multi-step form) → `/my-resume/{id}/view` with AI-assisted sections via `lib/actions/gemini.actions.ts`.
- Server action files under `lib/actions/` must start with exactly `"use server";` on line 1 with no leading garbage characters.
- `lib/mongoose.ts` caches the Mongoose connection for dev/HMR; `USE_MEMORY_MONGO=true` enables in-memory Mongo for local work without Atlas.
- Visible Clerk controls live in `components/layout/Header.tsx` because `PageWrapper` uses a full-screen overlay that can hide a minimal header in root `app/layout.tsx`.
- npm scripts are `dev`, `build`, and `start`; production reference deploy is documented at https://resume-ai-app.vercel.app/.
- Doppler editor integration is enabled in `.vscode/settings.json`; treat Doppler as the intended secrets path for this repo when secrets are discussed in sessions.
- Clerk test-mode E2E (when using `pk_test_*` keys): `+clerk_test` email addresses and verification code `424242` are the established local sign-up pattern.
- NPOWER crash-course designer assets (`output/`, `scripts/template_generator.py`, `scripts/build_npower_master.py`) are a separate curriculum workstream alongside the ResumeAI web app.
