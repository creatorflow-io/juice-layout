---
description: "Task list for 003-conditional-search-box"
---

# Tasks: Conditional Search Box

**Input**: Design documents from `/specs/003-conditional-search-box/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/searchable-page.md](./contracts/searchable-page.md), [quickstart.md](./quickstart.md)

**Tests**: INCLUDED, and not optional here. The template treats test tasks as opt-in, but Constitution v1.0.0 Principle III ("Test Coverage — NON-NEGOTIABLE") requires a `.spec.ts` beside every public component, directive, pipe, and service, and states that new public API surface without a matching spec MUST be flagged in review. This feature adds public API (`SearchablePage`, `isSearchablePage`) and reshapes an exported service, so tests are mandatory. The project rule overrides the template default.

**Organization**: Grouped by user story. Each story is independently completable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3, mapping to the user stories in [spec.md](./spec.md)

## Path Conventions

Angular workspace (per plan.md). Library code under `projects/juice-js/layout/src/`; host app under `projects/app/src/`. Tests live *beside* their source as `*.spec.ts` (Constitution III) — there is no separate `tests/` tree.

## Read before starting

Three facts from research that change how these tasks are written. Skipping them will cost you time:

1. **The current test stubs pass by accident.** `search-bar.component.spec.ts` declares `SearchBarComponent` without importing `FormsModule`, which should fail on `[(ngModel)]`. It passes only because `@if (isEnabled())` is false by default, so the input never renders and the binding is never resolved. **Any test that turns the box on must import `FormsModule` or it will fail with a confusing "Can't bind to 'ngModel'" error.** Same trap in `page.component.spec.ts`, which also declares `SearchBarComponent`.
2. **`ChangeDetectionStrategy.Eager` is correct, not a typo.** Angular 22 renamed `Default` → `Eager`. Leave it alone.
3. **The seam already exists and is broken.** `page.component.html:42` binds `(activate)="onAttach"` — no `()`, so it never fires, and `PageComponent.onAttach()` at `page.component.ts:82` is dead code. You are completing an abandoned hook, not adding one.

---

## Phase 1: Setup

**Purpose**: Establish the baseline and confirm the premise before changing anything.

- [X] T001 Run `npm run watch:layout` once (the app reads built output from `dist/juice-js/`), then confirm the suite is green with `npm run test:layout` — establishes that later failures are yours
- [X] T002 Reproduce the baseline defects by hand per [quickstart.md](./quickstart.md) checks 3-6 and record which fail: stale query across pages (D1), cancelled navigation killing search (D2), tenant switch `/t1/dashboard` → `/t2/dashboard` killing search permanently (D3)

**⚠️ Gate on T002**: All four checks are expected to FAIL on `master`. If any *passes*, the defect analysis in [research.md](./research.md) is wrong for that case — stop and correct the research before writing code. The whole design is justified by these failures; do not build on an unverified premise.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The contract every user story binds against.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `SearchablePage` interface (`onSearch(query: string, event?: Event): void`) and the `isSearchablePage(value: unknown): value is SearchablePage` structural type guard in `projects/juice-js/layout/src/lib/services/searchable-page.ts`, with JSDoc per [contracts/searchable-page.md](./contracts/searchable-page.md). No `any` — the guard takes `unknown` (Constitution II)
- [X] T004 [P] Add `searchable-page.spec.ts` beside it in `projects/juice-js/layout/src/lib/services/` covering `isSearchablePage`: true for an object with an `onSearch` method; false for `null`, `undefined`, a primitive, `{}`, and an object whose `onSearch` is a non-function
- [X] T005 [P] Export the contract from `projects/juice-js/layout/src/public-api.ts` (beside the existing `./lib/services/search.service` export at line 14)

**Checkpoint**: `SearchablePage` is importable from `@juice-js/layout`. User stories can begin.

---

## Phase 3: User Story 1 - Search box reflects the page I am on (Priority: P1) 🎯 MVP

**Goal**: The box appears only while the displayed page implements `SearchablePage`, and what the user types reaches that page.

**Independent Test**: Navigate between `dashboard` (searchable) and a non-searchable page in both directions; the box appears and disappears accordingly, and typing on `dashboard` reaches its `onSearch`.

### Tests for User Story 1

> Write these first and watch them fail before implementing.

- [X] T006 [P] [US1] Create `search.service.spec.ts` in `projects/juice-js/layout/src/lib/services/` (none exists today) covering: `isEnabled()` false initially; `bindPage()` with a `SearchablePage` double → `isEnabled()` true; `bindPage()` with a non-searchable object → stays false; `unbindPage()` → false; `submit('abc', evt)` forwards `('abc', evt)` to the bound page; `submit()` with nothing bound is a no-op and does not throw
- [X] T007 [P] [US1] Replace the CLI stub in `projects/juice-js/layout/src/lib/components/search-bar/search-bar.component.spec.ts` with real tests: box absent when `isEnabled()` is false, present when a page is bound, and typing calls `SearchService.submit`. **Import `FormsModule`** — see "Read before starting" #1
- [X] T008 [P] [US1] Extend `projects/juice-js/layout/src/lib/page/page.component.spec.ts` to assert the outlet wiring: `onPageActivate(instance)` binds a searchable instance, `onPageActivate` with a non-searchable instance binds nothing, `onPageDeactivate()` unbinds. Also add `FormsModule` (this spec declares `SearchBarComponent` too)

### Implementation for User Story 1

- [X] T009 [US1] Rewrite `projects/juice-js/layout/src/lib/services/search.service.ts` per [data-model.md](./data-model.md): private `_page` and `_legacyCallback` signals; public `isEnabled` as a **`computed()`** (`_page() !== null || _legacyCallback() !== null`) with no setter; public `query` signal; `bindPage(instance: unknown)` binding only when `isSearchablePage(instance)`; `unbindPage()`; `submit(query, event?)`. **Delete the `Router`/`NavigationStart` subscription entirely** (lines 11-17) — it is the root cause of D2 and D3. Keep `enable()`/`disable()` as `@deprecated` working shims over `_legacyCallback`. Replace `_callback: Function` and `event: any` with the typed contract
- [X] T010 [US1] In `projects/juice-js/layout/src/lib/page/page.component.ts`, replace the dead `onAttach(e: any)` (line 82) with `onPageActivate(instance: unknown)` → `search.bindPage(instance)` and `onPageDeactivate()` → `search.unbindPage()`; inject `SearchService`
- [X] T011 [US1] In `projects/juice-js/layout/src/lib/page/page.component.html` line 42, fix the never-firing binding: `(activate)="onAttach"` → `(activate)="onPageActivate($event)" (deactivate)="onPageDeactivate()"`. Depends on T010 — the handler names must match
- [X] T012 [US1] In `projects/juice-js/layout/src/lib/components/search-bar/search-bar.component.ts`, drop the local `searchText` field and the `isEnabled()` method wrapper; read `service.isEnabled` / `service.query` signals and route input through `service.submit(...)`
- [X] T013 [US1] In `projects/juice-js/layout/src/lib/components/search-bar/search-bar.component.html`, bind `@if` and the input to the signals rather than the method call and local field. Depends on T012
- [X] T014 [P] [US1] Migrate `projects/app/src/app/dashboard/dashboard.component.ts` to `implements SearchablePage` with `onSearch(query, event?)`; remove the `searchService.enable(...)` call and the `SearchService` injection, and delete the now-obsolete comment at lines 44-45 warning about the `NavigationStart`/lazy-module ordering trap — the trap no longer exists
- [X] T015 [P] [US1] Migrate `projects/app/src/app/dashboard1/dashboard1.component.ts` the same way; remove its `SearchService` injection (line 14) and `enable(...)` call (lines 19-21)
- [X] T016 [P] [US1] Delete the orphaned `data: { searchUrl: 'dashboard1/search' }` from `projects/app/src/app/dashboard1/dashboard1-routing.module.ts` line 15 — nothing reads it, research Decision 1 rejects the route-data approach, and leaving it would mislead the next author exactly as it misled this investigation

**Checkpoint**: The box tracks page support. The query still leaks between pages — that is US2.

---

## Phase 4: User Story 2 - Search state does not leak between pages (Priority: P1)

**Goal**: Each page's search starts clean; a query never carries to another page.

**Independent Test**: Type on `dashboard`, navigate to `dashboard1`; the box is empty and `dashboard1` has received nothing. Return to `dashboard`; the box is empty.

**Why separate from US1**: US1 delivers visibility. The leak is a distinct defect with a distinct cause — `searchText` lives on a component the shell mounts once and never destroys (D1), so it outlives every page. US1 moves the state into the service; US2 makes it reset.

### Tests for User Story 2

- [X] T017 [P] [US2] Extend `projects/juice-js/layout/src/lib/services/search.service.spec.ts`: `submit('abc')` then `unbindPage()` → `query()` is `''`; binding a new page starts with `query()` empty; `unbindPage()` also clears `_legacyCallback` so a legacy page's claim does not survive its own page
- [X] T018 [P] [US2] Extend `projects/juice-js/layout/src/lib/components/search-bar/search-bar.component.spec.ts`: clearing via the ✕ calls `submit('')` — the bound page receives `''`, distinct from the box being absent, which calls nothing (FR-010)

### Implementation for User Story 2

- [X] T019 [US2] In `projects/juice-js/layout/src/lib/services/search.service.ts`, make `unbindPage()` reset `query` to `''` alongside clearing `_page` and `_legacyCallback` — the single reset point the outlet lifecycle gives us (FR-005)
- [X] T020 [US2] In `projects/juice-js/layout/src/lib/components/search-bar/search-bar.component.html`, point the ✕ handler at `submit('')` instead of the old `searchText='';onSearchTextChange($event)` (lines 5-8), so clearing flows through the service like any other input

**Checkpoint**: US1 + US2 both hold. Quickstart checks 1-4 and 9 pass.

---

## Phase 5: User Story 3 - Support survives re-entry and interrupted navigation (Priority: P2)

**Goal**: The box behaves identically on the tenth visit as the first, and an abandoned navigation never leaves the toolbar wrong.

**Independent Test**: Re-enter a searchable page several times; deny a navigation with a guard; switch tenant. The box stays correct in all three.

**⚠️ Read this before estimating**: this story needs **no new production code**. Its behaviour falls out of the outlet lifecycle that US1 already lands — a cancelled navigation never deactivates the outlet, and a param-only tenant switch reuses the component so the outlet never deactivates either. These tasks are the regression tests that *prove* it and lock it in. That is deliberate, not padding: D2 and D3 are silent, high-impact failures (D3 is a Constitution V multi-tenancy defect) and nothing else in the suite would catch a regression. If any test here fails, US1's implementation is wrong — most likely a `Router` event subscription crept back into `SearchService`.

### Tests for User Story 3

- [X] T021 [P] [US3] In `projects/juice-js/layout/src/lib/services/search.service.spec.ts`, assert the D2 fix: with a page bound, router events alone (including a `NavigationStart` followed by a `NavigationCancel`) do not unbind — only `unbindPage()` does. This is the regression test for the deleted `NavigationStart` subscription
- [X] T022 [P] [US3] In `projects/juice-js/layout/src/lib/page/page.component.spec.ts`, assert the D3 fix: when the outlet does not deactivate (the param-only reuse case, e.g. tenant `/t1/dashboard` → `/t2/dashboard`), the binding and `isEnabled()` survive
- [X] T023 [P] [US3] In `projects/juice-js/layout/src/lib/page/page.component.spec.ts`, assert re-entry: `onPageDeactivate()` then `onPageActivate(instance)` re-binds and `isEnabled()` is true — the tenth visit equals the first
- [X] T024 [US3] In `projects/juice-js/layout/src/lib/services/search.service.spec.ts`, lock the deprecated-path ordering guarantee from research Decision 3: `unbindPage()` → legacy `enable(cb)` (simulating a constructor) → `bindPage(nonSearchableInstance)` leaves `isEnabled()` **true** and `cb` intact. This is the exact sequence the outlet produces for a legacy page (deactivate → construct → activate); if it breaks, every out-of-repo `enable()` caller silently loses their search box

**Checkpoint**: All three stories hold. Quickstart checks 1-9 pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Add `@deprecated` JSDoc to `enable()` and `disable()` in `projects/juice-js/layout/src/lib/services/search.service.ts` pointing at `SearchablePage` and stating removal in the next major, per [contracts/searchable-page.md](./contracts/searchable-page.md)
- [X] T026 [P] Document the `SearchablePage` contract in `projects/juice-js/layout/README.md` — it is now public API, and the README is currently untouched CLI scaffold with no API section. Keep it short: the interface, a usage snippet, and the `enable()` migration
- [X] T027 Resolve the open question in the contract's Breaking-change note: `isEnabled` moves from a mutable `boolean` field to a read-only `Signal<boolean>`. Confirm both known readers are in-library (`search-bar.component.ts:37`, `page.component.html`) and that no consumer reads it. **If an external reader exists, this ships `feat!:` with a major bump instead of `feat:`** — this decision gates the commit message, so settle it before T029
- [X] T028 Run the full suite: `npm test` and `ng build --project @juice-js/layout` — both must pass, no new TypeScript errors, no circular dependencies (Constitution Quality Gates)
- [ ] T029 Walk all 9 [quickstart.md](./quickstart.md) checks by hand against the running app. Checks 3-6 must now pass where T002 recorded them failing — that delta is the feature. Commit with a Conventional Commit (`feat:`, or `feat!:` if T027 found an external reader)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T002 gates everything — it validates the premise
- **Foundational (Phase 2)**: needs Setup. BLOCKS all user stories
- **US1 (Phase 3)**: needs Foundational
- **US2 (Phase 4)**: needs US1 — it edits the service and search bar that US1 creates. Not parallelisable with US1 (same files)
- **US3 (Phase 5)**: needs US1. Independent of US2 (different concern, disjoint assertions), so US2 and US3 can run in parallel once US1 lands
- **Polish (Phase 6)**: needs all desired stories

### Story Dependency Notes

The stories are **not** fully independent here, and pretending otherwise would mislead planning. All three are consequences of one mechanism swap in `SearchService` + `PageComponent`:

- **US1 is the mechanism.** It is the only story with substantial production code.
- **US2 is a small delta on US1** (one reset line + one template handler), sharing US1's files.
- **US3 is free from US1** — tests only.

The realistic shape is: land US1, then US2 and US3 in parallel. Each story remains *independently testable* per the spec, which is what the checkpoints verify.

### Within Each Story

- Tests before implementation (Constitution III)
- Contract (Phase 2) before anything binds to it
- Service before the components that read it
- Library before host-app migration

### Parallel Opportunities

- T004, T005 together (after T003)
- T006, T007, T008 together — three separate spec files
- T014, T015, T016 together — three separate host-app files
- T017, T018 together; T021, T022, T023 together
- T025, T026 together
- US2 and US3 in parallel after US1

---

## Parallel Example: User Story 1

```text
# Tests first — three different spec files, no shared state:
Task: "T006 search.service.spec.ts — bind/unbind/submit"
Task: "T007 search-bar.component.spec.ts — visibility + typing (import FormsModule!)"
Task: "T008 page.component.spec.ts — outlet activate/deactivate wiring"

# Then, after the library implementation (T009-T013) is green:
Task: "T014 dashboard.component.ts -> implements SearchablePage"
Task: "T015 dashboard1.component.ts -> implements SearchablePage"
Task: "T016 remove orphaned searchUrl route data"
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1 Setup — confirm the defects are real (T002)
2. Phase 2 Foundational — the contract
3. Phase 3 US1 — the mechanism
4. **STOP and VALIDATE**: quickstart checks 1-2 pass; the box tracks page support. The query still leaks — known, and US2's job
5. Demoable: a page opts in with one interface, no service injection, no ordering trap

### Incremental Delivery

1. Setup + Foundational → contract exists
2. US1 → box tracks page support (**MVP**)
3. US2 → no leak (quickstart 3-4, 9)
4. US3 → regression-proofed against D2/D3 (quickstart 5-6)
5. Polish → docs, deprecation, full suite, `feat:` vs `feat!:` call

### Notes

- Commit after each task or logical group, Conventional Commits (Constitution IV)
- Never edit `package.json` versions by hand — `semantic-release` derives the bump
- The constitution's stack table is stale (says Angular 16; the workspace is on 22). Out of scope here; see plan.md. Do not "fix" it in this feature's commits

## Task Summary

- **Total**: 29 tasks
- **Setup**: 2 · **Foundational**: 3 · **US1**: 11 (3 tests, 8 impl) · **US2**: 4 (2 tests, 2 impl) · **US3**: 4 (tests only) · **Polish**: 5
- **Parallel opportunities**: 6 groups
- **MVP**: T001-T016 (Setup + Foundational + US1)
- **Format check**: all 29 tasks carry a checkbox, sequential ID, story label where required (US phases only), and a concrete file path
