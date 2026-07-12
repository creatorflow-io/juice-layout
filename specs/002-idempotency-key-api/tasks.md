---
description: "Task list for feature 002 — Send API Idempotency-Key Header (Client Side)"
---

# Tasks: Send API Idempotency-Key Header (Client Side)

**Input**: Design documents from `/specs/002-idempotency-key-api/`
**Prerequisites**: plan.md, spec.md, research.md
**Branch**: `002-idempotency-key-api`

**Tests**: INCLUDED — Constitution III (Test Coverage) is NON-NEGOTIABLE; every public service/interceptor has an adjacent `*.spec.ts` (Karma + Jasmine).

**Organization**: Grouped by user story (US1 P1 → US2 P2 → US3 P3) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3
- All paths are repo-relative to `D:\Workspaces\Juice\juice-layout`

## Path Conventions

- Library source: `projects/juice-js/core/src/lib/http/idempotency/`
- Public API: `projects/juice-js/core/src/public-api.ts`
- Tests: adjacent `*.spec.ts` files
- Build/test one lib: `ng build @juice-js/core` / `ng test @juice-js/core --watch=false --browsers=ChromeHeadless`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the idempotency module skeleton in `@juice-js/core` and wire exports.

- [X] T001 Create module folder and `idempotency.module.ts` in `projects/juice-js/core/src/lib/http/idempotency/idempotency.module.ts` (empty `NgModule` that will provide the interceptor)
- [X] T002 [P] Export the new public surface from `projects/juice-js/core/src/public-api.ts` (module, key service, context token, errors) — placeholders added as files are created
- [X] T003 Verify `ng build @juice-js/core` succeeds with the empty module

**Checkpoint**: `@juice-js/core` builds with the new module present.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The opt-in mechanism, the operation-scoped key service, and the interceptor skeleton every story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Create `idempotency.context.ts` in `projects/juice-js/core/src/lib/http/idempotency/idempotency.context.ts` defining an `HttpContextToken` opt-in flag and an optional `operationId` token, per research.md (opt-in mechanism)
- [X] T005 Create `IdempotencyKeyService` in `projects/juice-js/core/src/lib/http/idempotency/idempotency-key.service.ts`: `getKey(operationId)` returns an existing key or generates a collision-resistant one via `crypto.randomUUID()`; `release(operationId)` clears it; internal `Map` keyed by operation id (FR-002, FR-003)
- [X] T006 Make `IdempotencyKeyService` tenant/user-context aware: inject `@juice-js/core` tenant service + `@juice-js/auth` `OAuthService`; clear/namespace keys on tenant or user change so keys never cross contexts (FR-010) (depends on T005)
- [X] T007 Create `IdempotencyInterceptor` skeleton in `projects/juice-js/core/src/lib/http/idempotency/idempotency.interceptor.ts` (mirrors `@juice-js/auth` `AuthInterceptor`): passes through requests that are read-only or not opted-in (FR-004) (depends on T004)
- [X] T008 Provide the interceptor via `HTTP_INTERCEPTORS` (multi: true) in `idempotency.module.ts` (depends on T001, T007)
- [X] T009 [P] Test `idempotency-key.service.spec.ts`: generation is unique per operation, reuse returns the same key, release clears, tenant/user switch invalidates (FR-002, FR-003, FR-010)

**Checkpoint**: Foundation ready — opt-in token, key service, and a pass-through interceptor exist and are tested.

---

## Phase 3: User Story 1 - Double submission from the UI takes effect once (Priority: P1) 🎯 MVP

**Goal**: Opted-in state-changing requests carry an `Idempotency-Key`; a double-triggered action reuses the same key; the replayed backend response is handled as a single result.

**Independent Test**: Trigger the same action twice rapidly; assert both outgoing requests carry the same key and the UI settles on one result.

### Tests for User Story 1 ⚠️ (write first, ensure they fail)

- [X] T010 [P] [US1] Test `idempotency.interceptor.spec.ts`: an opted-in POST/PUT/PATCH/DELETE gets an `Idempotency-Key` header; a GET does not (FR-001, FR-004)
- [X] T011 [P] [US1] Test in `idempotency.interceptor.spec.ts`: two requests for the same `operationId` carry the **same** key (double-trigger) (FR-003, SC-002)

### Implementation for User Story 1

- [X] T012 [US1] Implement header attachment in `idempotency.interceptor.ts`: for opted-in unsafe requests, resolve `operationId` from context, call `IdempotencyKeyService.getKey`, `req.clone` with `Idempotency-Key` set (FR-001, FR-002) (depends on T007, T005)
- [X] T013 [US1] Handle the backend replayed-success response as a normal single result (pass-through, no duplicate side effect) in `idempotency.interceptor.ts` and release the key on terminal success via `IdempotencyKeyService.release` (FR-005) (depends on T012)
- [X] T014 [P] [US1] Add a helper/example showing how a caller opts a request in with an `operationId` (e.g., `withIdempotency(operationId)` returning an `HttpContext`) in `idempotency.context.ts` (depends on T004)

**Checkpoint**: US1 functional — keys attached + reused; MVP demoable (SC-001, SC-002, SC-005).

---

## Phase 4: User Story 2 - Automatic retry after a network failure is safe (Priority: P2)

**Goal**: Retries of the same operation reuse the original key; an in-progress backend response backs off instead of firing a parallel request; retries are bounded to the backend retention window with a distinct expired condition.

**Independent Test**: Simulate a transient failure and a retry; assert the retry reuses the original key; simulate in-progress and expired responses and assert correct handling.

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] Test `idempotency-response.spec.ts`: a retried operation (same `operationId`) reuses the original key across attempts — key generated before the retry, not per attempt (FR-003, SC-003)
- [X] T016 [P] [US2] Test `idempotency-response.spec.ts`: a `409` in-progress response triggers backoff/await, not a parallel request (FR-006)
- [X] T017 [P] [US2] Test `idempotency-response.spec.ts`: exceeding the retry horizon surfaces a distinct "expired" error (FR-008)

### Implementation for User Story 2

- [X] T018 [US2] Create `idempotency-response.ts` in `projects/juice-js/core/src/lib/http/idempotency/idempotency-response.ts` classifying backend responses (in-progress `409`, conflict `422`, expired) into typed outcomes (depends on T004)
- [X] T019 [US2] Implement in-progress backoff handling (await/poll with capped retry) wired into the interceptor pipeline for opted-in operations, ensuring no parallel duplicate is issued (FR-006) (depends on T018, T012)
- [X] T020 [US2] Enforce the retry horizon: stop reusing a key beyond the configured retention bound and emit the expired outcome (FR-008) (depends on T018, T005)
- [X] T021 [US2] Ensure key stability across an outer retry operator (document/guard that `getKey(operationId)` is called once per operation, above `retry`) in `idempotency-key.service.ts` (depends on T005)

**Checkpoint**: US1 AND US2 both work independently — safe retries, in-progress backoff, expired handling (FR-006, FR-008, SC-003).

---

## Phase 5: User Story 3 - Clear handling of conflict and required-key responses (Priority: P3)

**Goal**: Key-conflict (`422`) and required-key (`400`) responses surface as distinct, actionable errors without blind resubmission; keys are always attached so a client-omission rejection cannot occur.

**Independent Test**: Force `422` (same key, different payload) and a `400` required-key; assert each surfaces a distinct error and no automatic resend with the same key/payload.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] Test `idempotency.errors.spec.ts`: a `422` conflict maps to a distinct `IdempotencyConflictError` and does NOT auto-resend (FR-007)
- [X] T023 [P] [US3] Test `idempotency.interceptor.spec.ts`: every opted-in unsafe request always carries a key (no client-omission path) (FR-001)

### Implementation for User Story 3

- [X] T024 [P] [US3] Create typed errors in `projects/juice-js/core/src/lib/http/idempotency/idempotency.errors.ts` (`IdempotencyConflictError`, `IdempotencyKeyRequiredError`, `IdempotencyExpiredError`) (FR-007)
- [X] T025 [US3] Map classified backend outcomes (from `idempotency-response.ts`) to the typed errors and rethrow without blind resubmission in `idempotency.interceptor.ts` (FR-007) (depends on T024, T018, T012)
- [X] T026 [US3] Guarantee attachment: assert/validate a key is present for opted-in unsafe requests before dispatch in `idempotency.interceptor.ts` (FR-001) (depends on T012)

**Checkpoint**: All three stories independently functional — conflict/required-key surfaced distinctly (FR-001, FR-007, SC-004).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI-level guard, exports, docs, and full-suite validation.

- [X] T027 [P] [US1] Add an optional UI double-submit guard (in-flight de-duplication by `operationId`) helper in `projects/juice-js/core/src/lib/http/idempotency/idempotency-key.service.ts` (FR-009)
- [X] T028 [P] Finalize `public-api.ts` exports for the module, service, context helper, and errors in `projects/juice-js/core/src/public-api.ts`
- [X] T029 [P] Add usage docs (opt-in with `operationId`, retry placement, error handling) to the core lib README/JSDoc
- [X] T030 Run the full suite headless: `ng test @juice-js/core --watch=false --browsers=ChromeHeadless` and `ng build @juice-js/core` (Constitution quality gates)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories.
- **User Stories (Phase 3–5)**: all depend on Foundational; then priority order or parallel.
- **Polish (Phase 6)**: depends on the desired user stories.

### User Story Dependencies

- **US1 (P1)**: after Foundational. MVP. No dependency on other stories.
- **US2 (P2)**: after Foundational. Adds response classification + retry behavior; independently testable.
- **US3 (P3)**: after Foundational. Adds typed-error mapping; reuses US2's `idempotency-response.ts` classification but is independently testable.

### Within Each User Story

- Tests written first and failing → implementation.
- Service/context before interceptor wiring.
- Story complete and validated before next priority.

### Parallel Opportunities

- Setup: T002 parallel with T001→T003.
- Foundational: T004 and T009 parallel; T005→T006 serial; T007→T008 serial.
- After Foundational, US1/US2/US3 can be staffed in parallel — but `idempotency.interceptor.ts` is edited by all three (T012/T013/T019/T025/T026), so those are NOT `[P]` across stories; coordinate.
- Polish: T027/T028/T029 parallel.

---

## Parallel Example: User Story 1

```bash
# Tests first (distinct concerns in the interceptor spec):
Task: "Attachment + method-filtering test in idempotency.interceptor.spec.ts"
Task: "Same-operation key-reuse test in idempotency.interceptor.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP and VALIDATE**: same-operation requests share a key; read-only skipped.
3. Deploy/demo — MVP.

### Incremental Delivery

- Foundation → US1 (MVP) → US2 (safe retries) → US3 (error surfacing) → Polish.
- Each story ships independently without breaking the previous.

---

## Notes

- **Shared-file serialization**: `idempotency.interceptor.ts` is touched across US1/US2/US3 (T012, T013, T019, T025, T026) — not `[P]` across stories.
- This client conforms to the backend contract in the Juice repo (`011-idempotency-key-api`): header name `Idempotency-Key`, `409` in-progress, `422` conflict, `400` required-key, and the retention window that bounds the client retry horizon.
- Constitution III: no public service/interceptor merges without an adjacent `*.spec.ts`; the full suite must pass headless.
- Commit after each task or logical group using Conventional Commits (`feat(core): ...`).
