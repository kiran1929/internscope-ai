# InternScope AI — System Architecture & Feature Reference

InternScope AI is a production-grade **AI Internship & Career Intelligence Operating System** built to empower candidates by tracking, matching, and simulating their career trajectories. Below is a comprehensive reference detailing the implementation design of each feature and the technical stack.

---

## 🛠️ Tech Stack Overview

- **Core Framework:** Next.js (App Router, Server Actions, and Client Components).
- **Database Layer:** PostgreSQL database mapped via Prisma ORM for transaction-safe schema migrations.
- **AI Orchestration:** Google Gemini Pro models using retrieval-augmented generation (RAG) paradigms.
- **Authentication:** Clerk secure session handling and SSO authentication.
- **Styling:** Vanilla Tailwind CSS.

---

## 🚀 Core Features & Implementation Details

### 1. Unified Dashboard Context
- **Description:** Tracks overall application funnels, target companies, and saved jobs in a centralized database context provider (`DashboardStateProvider.tsx`).
- **Implementation:** React Context tracks state mutations (toggling tracking, bookmarks, pipeline promotion) and writes directly to PostgreSQL in the background via Next.js Server Actions.

### 2. Expanded 9-Stage Kanban Funnel
- **Description:** A flexible, horizontal-scrolling Kanban pipeline spanning nine key stages (`Discovered`, `Shortlisted`, `Preparing`, `Applied`, `OA / Test`, `Interviewing`, `Offer`, `Rejected`, `Withdrawn`).
- **Implementation:** Mapped using database enums in Prisma. Drag-and-drop state adjustments promote items and store logs dynamically.

### 3. Career Intelligence Console
- **Explainable Readiness Score:** Extracts candidate resume parameters and computes technical/behavioral indices.
- **What-If Career Simulator:** Projects match percentages across all openings in the database by letting candidates choose arbitrary sets of target skills (e.g., Docker, Next.js, Redis).
- **GitHub Profile Auditor:** Scrapes public repository metadata, calculates programming language distributions, and scores code documentation quality using Gemini RAG.
- **Portfolio Website Auditor:** Audits portfolio URLs for correct metadata SEO tags, responsive layout viewports, semantic landmarks, and SSL tags.

### 4. RAG Application Copilot
- **ATS Keyword Checklist:** Matches resumes against target job descriptions to extract missing skills.
- **Tailored Cover Letter Writer:** Drafts highly polished, personalized cover letters.
- **Recruiter Cold Email Generator:** Generates engaging recruiter outreach draft messages.
- **Application Q&A Builder:** Generates tailored answers to application form questions.

### 5. Conversational AI Interviewer
- **Description:** An interactive mock interview simulator that generates customized follow-up questions dynamically in a round-by-round conversation.
- **Implementation:** Leverages Gemini to synthesize previous answers, assess conceptual depth, and guide the candidate through realistic technical scenarios.

### 6. Target Company Preparation & Showcase
- **Description:** Provides curated preparation roadmaps for target firms (e.g. Razorpay Target Roadmap) showing candidate skill gaps and preparation steps.
- **Implementation:** Integrated into the monitored company board (`DashboardCompanies.tsx`).

### 7. Academic Profiles
- **Description:** Synchronizes university, degree, major branch, and CGPA parameters.
- **Implementation:** Mapped under the candidate `Profile` model in the database schema.
