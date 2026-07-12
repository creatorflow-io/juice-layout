# Implementation Plan: Send API Idempotency-Key Header (Client Side)

**Branch**: `002-idempotency-key-api` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-idempotency-key-api/spec.md`

## Summary

Add client-side idempotency to the Angular app: an `HttpInterceptor` in `@juice-js/core` attaches an `Idempotency-Key` header to opted-in state-changing requests, backed by an operation-scoped key service that generates a collision-resistant key per logical operation and reuses it across retries and double-clicks. The layer interprets the backend's replay / in-progress / conflict / expired responses so duplicates never produce duplicate effects. Mirrors the existing `AuthInterceptor` idiom and conforms to the backend contract defined in the Juice `011-idempotency-key-api` feature.

## Technical Context

**Language/Version**: TypeScript 5.1.x (repo standard), Angular 16.x.
**Primary Dependencies**: `@angular/common/http` (`HttpInterceptor`, `HttpContextToken`), `@juice-js/core` tenant service (scoping), `@juice-js/auth` (`OAuthService`) for user-context awareness. `crypto.randomUUID()` for key generation.
**Storage**: In-memory operation→key map for the session; optional `sessionStorage` persistence deferred (open question in research.md).
**Testing**: Karma + Jasmine, `*.spec.ts` adjacent to source (Constitution III, NON-NEGOTIABLE).
**Target Platform**: Browser (Angular SPA / library consumers).
**Project Type**: Angular library feature under `projects/juice-js/core`.
**Performance Goals**: Interceptor adds a header + a Map lookup per request; no measurable overhead on read-only requests (skipped).
**Constraints**: TypeScript strict mode; `any` justified inline; SCSS scoped (no UI surface beyond error surfacing); no new auth flow (Constitution V).
**Scale/Scope**: One new module (`lib/http/idempotency/`) in `@juice-js/core`: a key service, an interceptor, an opt-in context token, a module, and public-api exports.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| **I. Library-First** | ✅ PASS | Delivered inside the existing standalone `@juice-js/core` library (cross-cutting HTTP concern, alongside tenant/routing); independently buildable/testable; exported via `public-api.ts`. Alternative (a dedicated `@juice-js/http` lib) considered — rejected as heavyweight for one interceptor + service; noted in research.md. |
| **II. Angular & TS Discipline** | ✅ PASS | `HttpInterceptor` + services via Angular DI (mirrors `AuthInterceptor`); NgModule provides the interceptor via `HTTP_INTERCEPTORS`; strict typing; no manual instantiation. |
| **III. Test Coverage (NON-NEGOTIABLE)** | ✅ PASS | `*.spec.ts` for the key service and interceptor (attachment, method filtering, reuse-on-retry, tenant/user scoping, response handling); full suite must pass headless. |
| **IV. SemVer & Conventional Commits** | ✅ PASS | Conventional Commits; `@juice-js/core` version bump derived by semantic-release; no manual version edits. |
| **V. Multi-Tenancy & Auth Awareness** | ✅ PASS | Key scope resolved via `@juice-js/core` tenant service and `@juice-js/auth` user context; keys never reused across tenant/user switch (FR-010); no hard-coded tenant ids; no custom auth. |

**Gate result**: PASS — no violations, no Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-idempotency-key-api/
├── plan.md              # This file
├── research.md          # Client responsibilities + backend-contract alignment + open questions
├── spec.md              # Client-side user stories
├── tasks.md             # /speckit.tasks output
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
projects/juice-js/core/src/
├── public-api.ts                                   # EXTEND — export idempotency public surface
└── lib/http/idempotency/                           # NEW module
    ├── idempotency.context.ts                      # HttpContextToken: opt-in flag + operation id
    ├── idempotency-key.service.ts                  # generate/store/reuse key per operation; tenant/user scoped
    ├── idempotency-key.service.spec.ts             # unit tests
    ├── idempotency.interceptor.ts                  # attach Idempotency-Key to opted-in unsafe requests
    ├── idempotency.interceptor.spec.ts             # unit tests
    ├── idempotency-response.ts                     # map backend 409 in-progress / 422 conflict / expired
    ├── idempotency.errors.ts                       # typed errors surfaced to callers
    └── idempotency.module.ts                       # provides HTTP_INTERCEPTORS
```

**Structure Decision**: Implement inside `@juice-js/core` under a new `lib/http/idempotency/` module. Core already hosts cross-cutting concerns (tenant, routing, dialog) and exposes the tenant service the key scope depends on, so no new library or cross-lib coupling is introduced. The interceptor mirrors `@juice-js/auth`'s `AuthInterceptor`.

## Complexity Tracking

> No Constitution violations — table intentionally empty.
