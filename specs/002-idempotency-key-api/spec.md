# Feature Specification: Send API Idempotency-Key Header (Client Side)

**Feature Branch**: `002-idempotency-key-api`  
**Created**: 2026-07-12  
**Status**: Draft  
**Input**: User description: "Support api that required Idempotency-Key header to avoid race condition"

## Overview

The Angular application must safely call backend APIs that require an `Idempotency-Key` header on state-changing requests. This feature adds client-side behavior that generates a unique key per logical operation, attaches it to outgoing requests, reuses the same key when retrying that operation, and handles the server's replay/in-progress/conflict responses — so that double-clicks, automatic retries, and flaky networks never cause duplicate side effects.

The server-side enforcement (the API requiring and validating the header) is specified separately in the Juice backend repository (`011-idempotency-key-api`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Double submission from the UI takes effect once (Priority: P1)

A user triggers a state-changing action in the app (submitting a form, confirming a payment, creating a record) and, because of a double-click or an impatient re-click on a slow network, the app would otherwise send the request twice. The app attaches the same idempotency key to both sends, so the backend applies the effect once and the user sees a single, consistent result.

**Why this priority**: This is the core value on the client — preventing the most common source of duplicates (impatient users on slow networks). Delivering just this story provides a viable MVP.

**Independent Test**: Trigger the same UI action twice in rapid succession and verify both outgoing requests carry the same `Idempotency-Key`, and the UI settles on one consistent result.

**Acceptance Scenarios**:

1. **Given** a state-changing request, **When** the app sends it, **Then** it includes an `Idempotency-Key` header with a unique, collision-resistant value for that operation.
2. **Given** a user double-triggers the same action before the first completes, **When** the second send occurs, **Then** it carries the same key as the first (not a new one).
3. **Given** the backend replays a stored response for a duplicate key, **When** the app receives it, **Then** it presents the single result without treating the duplicate as a separate outcome.

---

### User Story 2 - Automatic retry after a network failure is safe (Priority: P2)

A request fails with a transient/network error where it is unknown whether the server applied it. The app retries the same operation and reuses the original key, so the backend either completes the original operation or returns its recorded result — never applying it twice.

**Why this priority**: Client retry logic is the second most common duplication trigger. It builds on the key-generation behavior from P1.

**Independent Test**: Simulate a transient failure on a state-changing request, let the app retry, and verify the retry reuses the original key and the UI ends in a single consistent state.

**Acceptance Scenarios**:

1. **Given** a state-changing request that fails transiently, **When** the app retries the same operation, **Then** the retry reuses the original key rather than generating a new one.
2. **Given** the backend responds that the operation is still in progress, **When** the app receives it, **Then** the app waits/backs off and does not start a parallel duplicate operation.
3. **Given** retries are exhausted or the retention window may have passed, **When** the app gives up, **Then** it surfaces a clear, non-duplicating error to the user.

---

### User Story 3 - Clear handling of conflict and required-key responses (Priority: P3)

When the backend rejects a request because the key was reused with a different payload, or because a required key was somehow missing, the app surfaces the situation clearly and does not silently resend in a way that could duplicate or corrupt data.

**Why this priority**: Correct handling of the error contract protects data integrity and gives developers/users actionable feedback, but the feature delivers value before this is fully polished.

**Independent Test**: Force the backend to return a conflict (same key, different payload) and a required-key error, and verify the app surfaces each distinctly without blind resubmission.

**Acceptance Scenarios**:

1. **Given** the backend returns a key-conflict response, **When** the app receives it, **Then** it surfaces a distinct error and does not resend with the same key/payload combination.
2. **Given** an endpoint marked as requiring idempotency, **When** the app builds the request, **Then** the key is always attached so a "header required" rejection cannot occur due to client omission.

---

### Edge Cases

- **Which requests get a key**: only state-changing requests (POST/PUT/PATCH/DELETE-style, or endpoints explicitly opted in) receive a key; safe/read-only requests do not.
- **Retry horizon vs. server retention**: the app must not keep reusing a key beyond the server's documented retention window; past it, the request would be treated as new. Retries after that must be surfaced as a distinct "expired" condition.
- **Key lifetime across navigation**: a key must survive component re-render and view navigation for the duration of one logical operation, but must not be accidentally shared across two distinct operations.
- **Concurrent distinct operations**: two different operations issued close together must receive different keys.
- **Multi-tenant / user switch**: switching tenant or user must not reuse a key generated under a previous context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST attach an `Idempotency-Key` header to every state-changing request to endpoints that require it.
- **FR-002**: The app MUST generate a unique, collision-resistant key per distinct logical operation.
- **FR-003**: The app MUST reuse the same key for all retries of the same operation (manual re-click or automatic retry), and MUST NOT regenerate a key on retry.
- **FR-004**: The app MUST NOT attach idempotency keys to safe/read-only requests, and idempotency behavior MUST be scoped to opted-in endpoints/requests.
- **FR-005**: The app MUST correctly handle the backend's replayed success response for a duplicate key, presenting a single consistent result.
- **FR-006**: The app MUST handle an "in-progress" response by waiting/backing off rather than issuing a parallel duplicate request.
- **FR-007**: The app MUST surface key-conflict and required-key rejections as distinct, actionable errors without blind resubmission.
- **FR-008**: The app MUST bound retries so a key is not reused beyond the backend's retention window, surfacing a distinct "expired" condition when exceeded.
- **FR-009**: The app MUST guard against duplicate submits at the UI/dispatch level (e.g., in-flight de-duplication) as an additional layer beyond the key.
- **FR-010**: Key generation and reuse MUST be tenant/user-context aware so a key is never reused across a tenant or user switch.

### Key Entities *(include if feature involves data)*

- **Idempotency Key**: A client-generated, collision-resistant identifier for one logical state-changing operation, sent in the `Idempotency-Key` header and reused across retries of that operation.
- **Operation Context**: The in-app association between a user action, its generated key, and its in-flight state (pending / retrying / settled), used to decide when to reuse vs. generate a key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of state-changing requests to opted-in endpoints carry an `Idempotency-Key` header.
- **SC-002**: A user double-triggering an action results in a single settled outcome in the UI in 100% of trials, with both requests sharing one key.
- **SC-003**: Automatic retries reuse the original key in 100% of cases, and never produce a second effect visible to the user.
- **SC-004**: Conflict, required-key, and expired conditions are each surfaced as distinct, non-duplicating errors in 100% of cases.
- **SC-005**: No state-changing operation results in a duplicate record/charge attributable to client resend behavior.

## Assumptions

- **Client-side scope**: the app is the API consumer; it generates and attaches the header. Server enforcement is the separate Juice backend spec (`011-idempotency-key-api`).
- The backend contract (header name `Idempotency-Key`, conflict/in-progress/required responses, retention window) is defined by the backend feature; this spec conforms to it.
- Idempotency applies to state-changing requests only; safe/read-only requests are excluded.
- Key generation uses collision-resistant values (e.g., UUID-style) available in the app runtime.
- Tenant and auth context are resolved through the existing `@juice-js` core/auth services (Constitution Principle V) and inform key scoping.
- Existing HTTP handling (interceptor pipeline) and error-surfacing mechanisms are reused to attach keys and present conflict/expired errors.
