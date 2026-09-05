# InternScope AI

**Live:** [https://internscope.ai](https://internscope.ai)  
**Repository:** [github.com/kiran1929/internscope-ai](https://github.com/kiran1929/internscope-ai)

AI-powered internship discovery and career intelligence for student developers. InternScope aggregates internship openings from major ATS boards, matches them to your profile, and helps you prepare, apply, and track every stage of the funnel.

---

## What it does

| Area | Capabilities |
|------|----------------|
| **Discovery** | Ingests internship-only roles from Greenhouse, Lever, Ashby, SmartRecruiters, Workday, and JobVetta (India + global) |
| **Matching** | Resume parsing, skill extraction, and opportunity match scoring |
| **Pipeline** | 9-stage Kanban: Discovered → Shortlisted → Preparing → Applied → OA/Test → Interviewing → Offer → Rejected → Withdrawn |
| **AI Copilot** | ATS keyword gaps, cover letters, recruiter emails, application Q&A |
| **Interview prep** | Conversational mock interviews (Gemini + Groq fallback) with session history |
| **Career intel** | Readiness scores, what-if skill simulation, GitHub & portfolio audits |
| **Alerts** | SMTP digests and high-match opportunity email notifications |
| **Admin** | Scraper controls, metrics dashboard, companies, opportunities, users, analytics |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Auth | Clerk (OAuth + email, RBAC: `USER` / `ADMIN` / `SUPER_ADMIN`) |
| Data | PostgreSQL (Neon), Prisma ORM 7 (`@prisma/adapter-pg`) |
| Jobs | Trigger.dev (scheduled ingestion & background work) |
| AI | Google Gemini, Groq |
| Email | Nodemailer (SMTP) |
| Ingestion | Greenhouse, Lever, Ashby, SmartRecruiters, Workday, JobVetta |
| Docs | unpdf (PDF), Mammoth (DOCX) |
| Payments | Razorpay (plan tiers) |

---

## Architecture

```
internship-tracker/
├── app/                     # App Router pages, layouts, server actions, API routes
│   ├── (protected)/         # Candidate workspace (dashboard, jobs, resume, interview, …)
│   ├── admin/               # Admin console (scraper, opportunities, users, …)
│   ├── sign-in/ | sign-up/  # Clerk auth
│   └── api/                 # Webhooks, payments, etc.
├── components/              # UI (Kanban, search, metrics, forms, …)
├── lib/
│   ├── ingestion/           # Connectors, pipeline, metrics, board runner
│   ├── repositories/        # Prisma data access
│   ├── email/               # SMTP + notification templates
│   └── generated/prisma/    # Generated client (not committed)
├── prisma/                  # schema + migrations
├── scripts/                 # CLI sync / purge / URL fix utilities
├── trigger/                 # Trigger.dev job definitions
├── providers/               # React context (dashboard state)
├── types/                   # Shared TypeScript types
└── middleware.ts            # Clerk route protection
```

**Ingestion flow:** connector `fetchRaw` → parse → normalize → internship filter → URL sanitize → dedupe → persist → metrics.

---

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech/) (or other) PostgreSQL database
- [Clerk](https://clerk.com/) application keys
- Optional: Gemini / Groq API keys, SMTP credentials, JobVetta API key, Razorpay keys

---

## Local setup

```bash
git clone https://github.com/kiran1929/internscope-ai.git
cd internscope-ai
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)). Then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### Useful scripts

```bash
npm run lint                  # ESLint
npm run test                  # Vitest
npm run build                 # prisma generate + Next.js production build

npm run sync:catalog          # Refresh scrape board catalog
npm run fetch:india-ats       # Manual ATS internship sync
npm run fetch:jobvetta        # Manual JobVetta sync (needs JOBVETTA_API_KEY)
npm run purge:non-internships # Remove non-internship rows
npm run purge:expired         # Remove expired opportunities
npm run fix:application-urls  # Sanitize application URLs
```

Scheduled scraping runs when `SCRAPING_ENABLED=true` (typically 9:00 AM & 9:00 PM IST via Trigger.dev).

---

## Environment variables

Copy from `.env.example`. **Never commit real secrets.** Required for a working local/prod app:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres connection |
| `DATABASE_URL_UNPOOLED` | Direct connection (migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | Auth routes (`/sign-in`, `/sign-up`) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (local or production) |
| `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS` | Admin allowlist (must match DB `ADMIN` role users) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk user sync webhook |
| `GEMINI_API_KEY` | Resume / copilot / enrichment |
| `GROQ_API_KEY` | Fast interview LLM (optional fallback) |
| `SMTP_*` | Transactional email |
| `SCRAPING_ENABLED` | `true` / `false` — master scraper switch |
| `JOBVETTA_API_KEY` | JobVetta connector (optional) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Billing (optional) |
| `OPPORTUNITY_EMAIL_THRESHOLD` | Min match % for email alerts (default `80`) |

Clerk redirect URLs and `NEXT_PUBLIC_APP_URL` must match your deployment domain in production.

---

## Roles & access

| Role | Access |
|------|--------|
| `USER` | Candidate dashboard, applications, AI tools |
| `ADMIN` | Admin console, opportunities, scraper, users |
| `SUPER_ADMIN` | Full platform control |

Protected routes are enforced in Clerk middleware (`/dashboard`, `/applications`, `/saved`, `/resume`, `/interview`, `/admin`, …).

---

## Production

- **Production URL:** [https://internscope.ai](https://internscope.ai)
- Hosted on **Vercel**; database on **Neon**; auth via **Clerk**
- Production checklist before going public:
  1. Set `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS` on Vercel (your admin account emails)
  2. Use **Clerk production** keys + webhook signing secret; lock redirect URLs to `https://internscope.ai`
  3. Set `NEXT_PUBLIC_APP_URL=https://internscope.ai`
  4. Run `npx prisma migrate deploy` (includes payment tables)
  5. Confirm SMTP, Gemini/Groq, and (if billing) Razorpay live keys + webhook secret
  6. Keep `SCRAPING_ENABLED` intentional for the environment
  7. Rotate any credentials that were ever shared outside the team
  8. Verify `/privacy` and `/terms` before launch

---

## License

Private / proprietary — all rights reserved unless otherwise stated by the repository owner.
