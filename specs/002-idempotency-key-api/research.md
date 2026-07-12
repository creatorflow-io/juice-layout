# Research: Send API Idempotency-Key Header (Client Side)

**Feature**: `002-idempotency-key-api` (juice-layout / Angular)
**Created**: 2026-07-12
**Purpose**: Frame the client-side responsibilities for calling backend APIs that require an `Idempotency-Key` header, and align with the Juice backend contract (`011-idempotency-key-api`).

## Summary

The Angular app is the **consumer** of idempotent APIs. Its job is to generate a key per logical operation, attach it to outgoing state-changing requests via the HTTP interceptor pipeline, reuse it across retries, and interpret the backend's replay / in-progress / conflict / required-key responses. It does **not** store idempotency records — that is the backend's concern.

## Relationship to the backend feature

| Concern | Owner | Notes |
|---|---|---|
| Header name (`Idempotency-Key`), required endpoints | Backend (`011`) | Client conforms |
| Key generation & attachment | **Client (this spec)** | Per-operation, collision-resistant |
| Key reuse on retry | **Client (this spec)** | Same operation → same key |
| Exactly-once processing, response storage | Backend (`011`) | Client just consumes the response |
| Retention window value | Backend (`011`) | Client bounds retry horizon to it (FR-008) |
| Conflict / in-progress / required-key responses | Backend defines; **client handles** | FR-005..FR-008 |

## Client-side design considerations

- **Attachment point**: an Angular `HttpInterceptor` is the natural place to attach the key to opted-in state-changing requests, consistent with the constitution's DI/interceptor conventions. It must distinguish safe vs. unsafe methods and honor an opt-in marker (e.g., a request context token / header hint).
- **Key lifecycle**: the key belongs to a *logical operation*, not a single HTTP call. Reuse requires an operation-scoped store (e.g., keyed by a caller-provided operation id) so retries and double-clicks reuse the same value, while distinct operations get distinct keys.
- **Retry coordination**: if the app uses RxJS `retry`/`retryWhen` or a resilience layer, the key must be generated *before* the retry operator so all attempts share it. Generating inside the request factory per attempt would break idempotency.
- **In-progress handling**: on an in-progress signal from the backend, back off and poll/await rather than firing a parallel request.
- **UI-level guard**: disable/debounce the triggering control and de-duplicate in-flight operations as a second layer (FR-009).
- **Tenant/user scoping**: keys must not leak across tenant/user switches; tie key scope to the resolved `@juice-js` context (FR-010).

## Open questions for `/speckit.clarify`

- Opt-in mechanism: attach keys to all unsafe methods by default, or only to endpoints explicitly marked (e.g., via an interceptor context token)?
- Where does the "operation id" that groups retries come from — caller-provided at dispatch, or derived (route + payload hash)?
- Should the client persist in-flight keys across full page reloads (e.g., sessionStorage) or only in memory for the session?
- Which layer owns retry/backoff today (custom interceptor, RxJS operators, a resilience lib), so key generation can be placed above it?

## Constitution alignment (JuiceLayout)

- **I Library-First**: deliver as a standalone Angular library under `projects/juice-js/` (e.g., an HTTP/idempotency concern in `@juice-js/core` or a dedicated lib), independently buildable/testable with a `public-api.ts` barrel.
- **II Angular & TS Discipline**: interceptor and key service via Angular DI; strict typing; scoped SCSS not applicable (no UI surface beyond error presentation).
- **III Test Coverage**: Karma/Jasmine specs adjacent to source for the interceptor and key service (attachment, reuse-on-retry, method filtering, tenant scoping).
- **V Multi-Tenancy & Auth**: key scoping resolved via existing tenant/auth services; no hard-coded tenant identifiers.
