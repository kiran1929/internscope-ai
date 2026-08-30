# Security Audit Verification Matrix

Repository inspected: `internscope-ai` @ post-merge with `origin/main`.

## Summary

| Classification | Count |
|----------------|-------|
| CONFIRMED | 14 |
| PARTIALLY CONFIRMED | 6 |
| FALSE POSITIVE | 3 |
| DUPLICATE | 8 |
| NOT VERIFIABLE FROM REPOSITORY | 2 |

## Findings

| ID | Area | Audit Claim | Classification | Severity | Phase |
|----|------|-------------|----------------|----------|-------|
| CRIT-001 | Upload | MIME/extension only, no magic bytes | CONFIRMED | Critical | 3 |
| CRIT-002 | Upload | DB record before file write (`PENDING`) | CONFIRMED | Critical | 4 |
| CRIT-003 | Download | Ownership via include, not query filter | PARTIALLY CONFIRMED | High | 5 |
| CRIT-004 | Admin actions | No server-side auth on CMS actions | CONFIRMED (fixed on munaf) | Critical | 1 |
| HIGH-001 | Errors | Raw error.message returned to client | CONFIRMED | High | 6 |
| HIGH-002 | Rate limit | In-memory only limiter | PARTIALLY CONFIRMED | High | 7 |
| HIGH-003 | SSRF | Portfolio URL fetch without guard | FALSE POSITIVE | — | — |
| HIGH-004 | Notifications | findFirst→create race | CONFIRMED | High | 8 |
| HIGH-005 | Pagination | Client limit unbounded in search | PARTIALLY CONFIRMED | Medium | 2 |
| HIGH-006 | Upload | Duplicate of CRIT-001 | DUPLICATE | — | 3 |
| MED-001 | Storage | User filename in path | PARTIALLY CONFIRMED | Medium | 3 |
| MED-002 | Upload | Duplicate of CRIT-001 | DUPLICATE | — | 3 |
| MED-003 | Download | inline disposition on all types | PARTIALLY CONFIRMED | Low | 5 |
| MED-004 | Upload | Duplicate of CRIT-001 | DUPLICATE | — | 3 |
| MED-005 | Versioning | No explicit current version flag | PARTIALLY CONFIRMED | Medium | 9 |
| MED-006 | Upload | Duplicate of CRIT-001 | DUPLICATE | — | 3 |
| ENH-001 | Confidence | Mock parser returns high confidence | CONFIRMED | Low | 10 |
| ENH-002 | Errors | Duplicate of HIGH-001 | DUPLICATE | — | 6 |
| ENH-003 | Versioning | Duplicate of MED-005 | DUPLICATE | — | 9 |
| ENH-004 | Upload | Duplicate of CRIT-001 | DUPLICATE | — | 3 |

## False Positives

- **HIGH-003 SSRF**: `validateOutboundUrl` and `sanitizeGitHubUsername` already exist in `lib/security/ssrf-guard.ts` and are used in `analyzePortfolioIntelligenceAction`.
- **CRIT-004 (partial)**: `requireAdmin()` exists; admin layout also checks email allowlist.
- **Cover letter versioning**: `CoverLetterVersion` model already exists with version increments.

## Corrected Remediation Notes

1. File validation must use magic bytes + structural checks, not MIME alone.
2. Upload workflow must stage file before DB finalization; DB transactions cannot cover filesystem writes.
3. Download must use `findFirst({ where: { id, user: { clerkId } } })` ownership query.
4. Rate limiter should delegate to `RedisCache.rateLimit` when `REDIS_URL` is set.
5. Notification dedup needs DB unique constraint on `(userId, opportunityId)` plus catch on conflict.
6. Mock/rule-based parser confidence should be ~0.55–0.65, not 0.85–0.95.

## Phase Commit Map

Phases 2–12 implement remediations listed above.
