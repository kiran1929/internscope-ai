# Phase 2 Documentation — Authentication, Authorization & Project Infrastructure

This document details the implementation of user identity and protected route structures for Phase 2 of **InternScope AI**.

---

## 🔒 Authentication Flow
InternScope AI integrates with **Clerk Authentication** for identity management.

- **Supported Login Methods:**
  - Federated Login: Google SSO
  - Federated Login: GitHub SSO
  - Email & Password Login with Email Verification
- **Session Configuration:** Clerk manages persistent user cookies and session lifetimes automatically on the client and validates sessions server-side in Next.js middleware.
- **Visuals:** Custom themed pages at `/sign-in` and `/sign-up` render Clerk components seamlessly styled with our dark dashboard theme variables.

---

## 📁 Folder Structure (New Additions)
The following directories and files have been introduced in Phase 2:

- **`providers/`**
  - [DashboardStateProvider.tsx](file:///Users/kirandeepgudepu/internship-tracker/providers/DashboardStateProvider.tsx): Implements a shared React Context provider. This preserves the interactive mock state (companies tracking status, saved bookmark lists, application Kanban pipelines, and notifications) when navigating between individual Next.js route pages.
- **`lib/auth/`**
  - [role.ts](file:///Users/kirandeepgudepu/internship-tracker/lib/auth/role.ts): Defines Role-Based Access Control (RBAC) rules, mapping permissions, and check helpers like `hasPermission` and `hasRole`.
- **`types/auth.ts`**
  - [auth.ts](file:///Users/kirandeepgudepu/internship-tracker/types/auth.ts): TypeScript type interfaces for UserRoles, Permissions, UserProfiles, and AuthSessions.
- **`constants/routes.ts`**
  - [routes.ts](file:///Users/kirandeepgudepu/internship-tracker/constants/routes.ts): Stores route arrays defining protected paths, public paths, and redirect targets.

---

## 🛡️ Protected Routes & Middleware Flow
Next.js middleware interceptor secures private pages.

### Protected Paths:
- `/dashboard(.*)`
- `/settings(.*)`
- `/profile(.*)`
- `/applications(.*)`
- `/saved(.*)`
- `/email-reports(.*)`
- `/analytics(.*)`
- `/companies(.*)`

### Public Paths:
- `/` (Landing Page)
- `/pricing`
- `/about`
- `/sign-in(.*)`
- `/sign-up(.*)`

### Middleware Logic (`middleware.ts`):
1. User requests a path.
2. The middleware matches the path against the route pattern lists.
3. If the path matches a protected route, the request calls Clerk's `auth.protect()` utility.
4. If the user session is invalid or unauthenticated, the user is redirected to Clerk's hosted sign-in page. After authentication, the user is redirected back to the initially requested path.
5. If the route is public, the request passes through cleanly.

---

## 👑 Role Architecture (RBAC)
We designed a lightweight hierarchy to scale permissions:

- **User Roles:**
  - `USER`: General candidates (can track, search, prep, customize settings).
  - `ADMIN`: Moderators (can also manage company scraper records).
  - `SUPER_ADMIN`: Internal platform administrators (full system control).

- **Hierarchy:** `SUPER_ADMIN` > `ADMIN` > `USER`
- **Helper methods:**
  - `hasPermission(role, permission)`: Checks if a role is authorized for specific tasks.
  - `hasRole(userRole, requiredRole)`: Validates role hierarchy levels.

---

## 💾 Future Database Integration Planning
In Phase 3, mock state in `DashboardStateProvider` will migrate to database tables:

- **User Mapping:** A PostgreSQL `User` table will bind to Clerk user IDs (`clerk_id` unique indexing) via Webhooks (`user.created` / `user.updated`).
- **Scraper / Company Tracking:** Tracked companies will map to a `CompanyTracking` junction table linking `user_id` and `company_id`.
- **Kanban Board state:** `Application` table with an enum column for pipeline status (`SAVED`, `APPLIED`, `INTERVIEWING`, `OFFERED`, `REJECTED`) linked to `user_id`.

---

## 🔑 Environment Variables Required
Set the following keys in your `.env.local` file:

```env
# Clerk Publishable Key (Client)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Clerk Secret Key (Server-Side Middleware)
CLERK_SECRET_KEY=sk_test_...

# Redirect configurations
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## ⚠️ Known Limitations (Frontend-Only Phase)
- **Session Storage Duration:** User profile changes (first/last name updates) persist in Clerk. However, database state changes (e.g. adding a custom application or tracking a company) are kept in memory by `DashboardStateProvider` and will reset on a hard page reload until the database is integrated in Phase 3.
