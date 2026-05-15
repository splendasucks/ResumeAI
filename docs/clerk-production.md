# Clerk production setup (fix 500-user login block)

## Problem

Clerk **Development** instances are capped at **500 users**. Sign-up / email verification shows:

> You have reached your limit of 500 users. If you need more users, please use a Production Instance.

ResumeAI’s Doppler secrets currently use **`pk_test_` / `sk_test_`** keys. The Clerk API reports `environment_type: "development"` for those keys.

## Fix (one-time in Clerk Dashboard)

1. Open [Clerk Dashboard](https://dashboard.clerk.com/) and sign in.
2. At the top, open the **Development** instance dropdown → **Create production instance** (clone dev settings or use defaults).
3. **Application domain** on the create dialog is for a hostname you control (DNS/CNAME), not `*.vercel.app`. If you only use `https://resume-ai-app.vercel.app`, use a domain you own for this step, or skip custom DNS and configure **allowed origins** after creation (step 5). Clerk rejects some third-party hostnames (e.g. `resume-ai-app.vercel.app`) in that field.
4. Complete the production checklist (domain/DNS if you use a custom domain; OAuth credentials for social login in prod).
5. Open the **Production** instance → **API keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`)
   - `CLERK_SECRET_KEY` (`sk_live_…`)
6. **Domains / paths** (Production instance — [Domains](https://dashboard.clerk.com/~/domains)):
   - **Allowed origins:** `https://resume-ai-app.vercel.app`, `http://localhost:3000`
   - **Home URL / redirect URLs:** `https://resume-ai-app.vercel.app`, `http://localhost:3000`
   - **Sign-in / sign-up paths:** `/sign-in`, `/sign-up` (match `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` in Doppler)
   - If you add a custom domain later, repeat the same origins for that hostname.
7. Apply keys to Doppler and redeploy:

```bash
chmod +x scripts/apply-clerk-production.sh scripts/verify-clerk-production.sh
./scripts/apply-clerk-production.sh pk_live_XXXX sk_live_XXXX
./scripts/verify-clerk-production.sh prd
doppler run --config prd -- npm run deploy   # or trigger Vercel redeploy
```

## Verify

```bash
./scripts/verify-clerk-production.sh prd
```

Then sign up again on the deployed URL. The 500-user error should be gone.

## Temporary: no custom domain (Development app + fresh 500-user cap)

Clerk **Production** (`pk_live_`) requires a **domain you own**; `*.vercel.app` cannot be used ([Clerk on Vercel](https://clerk.com/docs/deployments/deploy-to-vercel)). Until you have a domain, use a **new Clerk Application** on the **Development** instance:

1. [Clerk Dashboard](https://dashboard.clerk.com/) → app switcher → **Create application** (do not use “Create production instance”).
2. Stay on **Development** → **API keys** → copy `pk_test_…` and `sk_test_…` into [`.env.local`](.env.local). Use the per-field **Copy** buttons (not an old clipboard entry). After apply, `./scripts/apply-clerk-development.sh` must print `Clerk development instance: ins_…` **not** `ins_3D4lJzi93lEUu5YRR4xFgB5Y3pf` (exhausted app).
3. **Configure → Paths**: `/sign-in`, `/sign-up`. **Domains / allowed origins**: `https://resume-ai-app.vercel.app`, `http://localhost:3000`.
4. Apply to Doppler and enable the temporary bypass on `prd`:

```bash
chmod +x scripts/apply-clerk-development.sh
./scripts/apply-clerk-development.sh
npm test
doppler run --config prd -- npm run build:next
# Redeploy Vercel
```

This sets `CLERK_ALLOW_DEVELOPMENT_KEYS=true` on Doppler `prd` so [`lib/clerk-env.ts`](lib/clerk-env.ts) accepts `pk_test_` on the public URL. **Remove that flag** when you switch to `pk_live_` via [`scripts/apply-clerk-production.sh`](scripts/apply-clerk-production.sh).

**Tradeoffs:** new user pool (old Clerk users cannot sign in); another **500-user** cap on that dev instance; not a long-term production setup.

## References

- [Clerk: Deploy to production](https://clerk.com/docs/deployments/overview)
- [Clerk: Development vs Production instances](https://clerk.com/docs/deployments/environments)
