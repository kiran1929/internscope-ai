# InternScope AI 🚀

InternScope AI is a premium, AI-powered internship tracking platform designed to help student developers monitor engineering opportunities from top technology hubs, analyze resume alignment, receive custom email reports, and coordinate application pipelines.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [TanStack Table](https://tanstack.com/table) |
| **Backend** | Next.js Server Actions & API Routes, [Trigger.dev](https://trigger.dev/) background jobs |
| **Database** | [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.tech/)), [Prisma ORM 7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| **Authentication** | [Clerk](https://clerk.com/) (OAuth, sessions, webhooks) |
| **AI / LLM** | [Google Gemini](https://ai.google.dev/) (resume parsing, enrichment, copilot, ATS optimizer), [Groq](https://groq.com/) (mock interviews with Gemini fallback) |
| **Email** | [Nodemailer](https://nodemailer.com/) (SMTP — Gmail / custom host) |
| **Job ingestion** | Greenhouse, Lever & Ashby API connectors (scheduled sync + deduplication) |
| **Document parsing** | [unpdf](https://www.npmjs.com/package/unpdf) (PDF), [Mammoth](https://www.npmjs.com/package/mammoth) (DOCX) |
| **Tooling** | ESLint, PostCSS, [Sonner](https://sonner.emilkowal.ski/) toasts |

---

## 🎨 Design Philosophy & Colors
The UI combines design tokens from **Linear**, **Vercel**, **Apple**, and **Stripe**:
- **Background:** `#09090B` (Clean Dark Slate)
- **Sidebar & Drawers:** `#111113` (Contrast Isolation)
- **Card Background:** `#18181B` (Elevation Borders)
- **Accent Blue:** `#2563EB` (Electric Blue highlight)
- **Subtle Borders:** `#27272A` (Minimal separation)
- **Typography:** Display headlines use **Outfit**; operational workspace text uses **Inter** (loaded via Next.js Google Fonts API).

---

## 📂 Project Architecture & Folders
```
internship-tracker/
├── app/                  # Next.js App Router Pages and Layouts
│   ├── (protected)/      # Shared Sidebar/Navbar container for private paths
│   ├── sign-in/          # Clerk custom login form
│   ├── sign-up/          # Clerk custom signup form
│   ├── 401/ | 403/       # Custom Auth Error status pages
│   ├── globals.css       # Core custom animations, scrollbars & glassmorphism
│   ├── layout.tsx        # Root layout loading ClerkProvider & display fonts
│   └── page.tsx          # Responsive landing marketing page
├── components/           # Reusable UI & view sub-panels (Kanban, tables)
├── constants/            # Mock dataset definitions (roles, companies, FAQS)
├── docs/                 # Technical documentation & phase logs
│   └── phase-2.md        # Authentication & RBAC implementation details
├── lib/                  # Helper utilities (Tailwind merges, RBAC hasRole checks)
├── providers/            # Shared React Contexts (Dashboard state)
├── types/                # Strict TypeScript declaration types
└── middleware.ts         # Clerk path guarding middleware
```

---

## 🔒 Authentication & Role Access
InternScope AI secures candidate dashboards via **Clerk Authentication**:
- **OAuth Connections:** Supports Google Login and GitHub Login out-of-the-box.
- **Form Login:** Email + Password entry with verification codes.
- **Protected Routes:** Middleware secures `/dashboard`, `/settings`, `/profile`, `/applications`, `/saved`, and `/email-reports`, redirecting unauthorized users automatically.
- **RBAC Design:** Pre-wired for roles (`USER`, `ADMIN`, `SUPER_ADMIN`) with permission mappings to easily secure custom views in Phase 3.

---

## 🛠️ Local Development & Scripts

### 1. Configure Credentials
Create a `.env.local` file in the root folder with the following variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 2. Start the Development Server
Install dependencies and run the server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page. Clicking "Get Started" or "View Demo" will guide you through the authentication flow to the dashboard.

### 3. Verify Code Quality & Type Checks
```bash
# Run ESLint validation
npm run lint

# Compile Next.js build
npm run build
```

