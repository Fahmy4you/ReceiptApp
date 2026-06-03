# StrukApp

Next.js 15 (App Router) digital receipt generator for Indonesian MSMEs.  
Google OAuth, PostgreSQL via Prisma, Gemini OCR, Puppeteer PDF/PNG.

## Quick start

```bash
npm run dev          # next dev --turbopack (port 3001 via nginx)
npm run build        # prisma generate && next build
npm run start        # next start (production)
npm run lint         # eslint (ignoreDuringBuilds: true)
```

## Architecture

| Layer | Files |
|---|---|
| Pages (thin server) | `src/app/(dashboard)/` — async layouts call `auth()`, render client components |
| Client logic | `src/client/*.tsx` — 1:1 with pages, forms/state/API calls |
| Server actions (CRUD) | `src/models/*.ts` — `"use server"`, auth check per function, direct Prisma |
| API routes | `src/app/api/` — auth (`[...nextauth]`), cetak (Puppeteer), upload, OCR (Gemini) |
| Data access | `src/lib/prisma.ts` — PrismaClient + pg adapter singleton |
| Auth | `src/lib/auth.ts` + `src/lib/auth.config.ts` — NextAuth v5, JWT, Google provider, `trustHost: true` |
| Context | `src/context/` — `ThemeProvider` (light/dark/system), `PrinterProvider` (Web Bluetooth) |
| Components | `src/components/` — UI primitives + layout nav, `src/templates/struk_template.html` (Handlebars) |
| Middleware | `src/middleware.ts` — NextAuth matcher, passes all requests (auth enforced in models) |

## Key conventions

- **Client bundles**: Page files in `(dashboard)/` are thin async wrappers; all interactivity lives in `src/client/`.
- **Auth enforcement** happens per-model in `src/models/*.ts`, not in middleware.
- **CRUD server actions** follow the pattern: `getAll*`, `get*ById`, `create*`, `update*`, `delete*` — each checks `auth()` and validates ownership vs admin role.
- **Dashboard data** comes from `UserStatistic` model with `trackUserPrintActivity` + `getUserDashboardStats`.
- **Receipt generation** (`/api/cetak_struk`): Puppeteer renders `struk_template.html` via Handlebars at 58mm width. Tracks usage automatically.
- **OCR** (`/api/image_to_raw_struk`): Google Gemini API with structured schema extraction from receipt images. Falls back through model chain if primary fails.

## Database

```bash
npx prisma generate               # after pulling or changing schema
npx prisma migrate deploy         # apply pending migrations
npx prisma migrate dev            # create + apply new migration
npx tsx prisma/seed.ts            # seed roles (admin/user) + licenses (4 tiers)
```

PostgreSQL local (v17) on port 5432, db `receipt_app`. Connection string in `.env` (`DATABASE_URL`).  
**Must `systemctl start postgresql` before running dev/build if DB is down.**

## Environment

`.env` (gitignored) requires:
- `DATABASE_URL` — PostgreSQL
- `GEMINI_API_KEY` — Google Gemini for OCR
- `NEXTAUTH_URL` + `NEXTAUTH_SECRET` — NextAuth
- `MIDTRANS_*` — Midtrans payment gateway
- `NEXT_PUBLIC_NAME_APP` — display name

Server actions `allowedOrigins` in `next.config.ts` includes `struk.bydils.site`.

## Production deployment

Served behind nginx reverse proxy → `localhost:3001` (dev) or `next start` port.  
Cloudflare in front. Self-signed SSL at `/etc/nginx/ssl/`.  
Build script: `./build.sh` (nvm use 22, sets DATABASE_URL, runs `next build`).
