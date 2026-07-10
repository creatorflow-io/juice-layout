---
description: "Task list for Angular 16 → 22 upgrade"
---

# Tasks: Angular 16 → 22 Upgrade

**Input**: Design documents from `/specs/001-angular-upgrade/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No new tests are written for this feature. The spec (FR-005, SC-002) requires that all
**existing** unit tests pass without modification to test logic. Test tasks below therefore *run*
the existing suite as a gate; they do not author new specs.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Path Conventions

- Repo root: `D:\Workspaces\Juice\juice-layout`
- Dependency manifest: `package.json`
- Workspace config: `angular.json`, `tsconfig.json`
- Projects: `projects/app/`, `projects/juice-js/{auth,core,layout,localize,tenant}/`

**⚠️ Sequential-migration note**: Angular enforces one-major-version-at-a-time upgrades (`ng update`
refuses to skip). Because each `ng update` step bundles a version bump (US1), the breaking-change
migrations it triggers (US2), and a build/test gate (US3), the three user stories are **interleaved
per version step** rather than fully independent. Each version step (Phase 3.x) is itself an
independently testable increment: after the step, all projects build and all tests pass on that
Angular version. Do **not** parallelize across version steps.

**⚠️ Node.js runtime**: The chain passes through Angular 16–19, which do not support Node.js 24
(the machine default). **Node 20.19+** — supported by every Angular major 16→22 — must be active
for every step. See `plan.md` (Runtime) and `research.md` Decision 8.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a compatible runtime and verify the starting state before mutating anything.

- [ ] T001 Install and activate **Node.js 20.19+** (Node 20 LTS) so it is the `node`/`npm` on PATH in the repo root; confirm with `node --version` reporting `v20.19.x` or newer 20.x (machine default Node 24 must be shadowed/replaced for the duration of the migration)
- [ ] T002 Verify toolchain prerequisites in repo root `D:\Workspaces\Juice\juice-layout`: `node --version` (20.19+), `npx ng version` (Angular/CLI 16.x with **no** "Unsupported" Node warning), and `git status` (clean working tree on branch `001-angular-upgrade`) per `quickstart.md` Step 1
- [ ] T003 [P] Pre-upgrade dependency audit: run `npm outdated` and `npx ng update` (no `--force`) from repo root and record the reported available Angular updates
- [ ] T004 [P] Capture a baseline: run `npm test` on Angular 16 and note the passing spec count so post-upgrade parity can be confirmed against SC-002

**Checkpoint**: Node 20.19+ active, starting state clean on Angular 16, upgrade preview reviewed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Guardrails that MUST be in place before any `ng update` runs.

**⚠️ CRITICAL**: No version-step work can begin until this phase is complete.

- [ ] T005 Confirm third-party compatibility gate BEFORE starting: verify on npm that `angular-oauth2-oidc@^22` and `@ngx-translate/core@^18` exist and declare Angular 22 peer support (per `research.md` Decision 6); if unavailable, escalate the fallback-to-Angular-21 decision recorded in the Risk Register before proceeding
- [ ] T006 Establish the per-step commit discipline: each version step ends with a single conventional `build:` commit and each step is committed only after its build + test gate is green (per `plan.md` Migration Sequence); do not batch multiple version steps into one commit

**Checkpoint**: Compatibility confirmed and commit discipline agreed — sequential upgrade can begin.

---

## Phase 3: User Story 1 — Developer Installs Latest Angular Libraries (Priority: P1) 🎯 MVP

**Goal**: All `@angular/*`, `@angular-devkit/*`, `@angular/cli`, `@angular/material`, and third-party
packages reach the latest stable major (Angular 22) in `package.json`, executed as six sequential
`ng update` steps plus the third-party bump.

**Independent Test**: After the final step, `package.json` lists `@angular/core@^22.x`, `npm install`
completes, and `npx ng version` reports Angular 22 / TypeScript 5.9.x.

> **Interleaving**: Each step below also carries its US2 (fix breaking changes) and US3 (build/test
> gate) sub-tasks so the increment is genuinely testable before the next step starts.

### Step 16 → 17

- [ ] T007 [US1] Run `npx ng update @angular/core@17 @angular/cli@17` in repo root; let schematics migrate `angular.json` (app builder `@angular-devkit/build-angular:browser` → `:application`), `tsconfig.json`, and `zone.js`
- [ ] T008 [US2] Review `git diff` for schematic changes to `package.json`, `angular.json`, `tsconfig.json`, and any source files under `projects/`; resolve any breaking-change usages the schematics flagged but could not auto-migrate (Risk Register: "Schematics modify root config unexpectedly")
- [ ] T009 [US3] Build gate: run `npx ng build --project @juice-js/core`, `@juice-js/auth`, `@juice-js/layout`, `@juice-js/localize`, `@juice-js/tenant`, then `--project app`; require zero errors
- [ ] T010 [US3] Test gate: run `npm test`; require all existing specs pass (parity with T004 baseline), then commit `build: upgrade Angular core and CLI to v17`

### Step 17 → 18

- [ ] T011 [US1] Run `npx ng update @angular/core@18 @angular/cli@18` in repo root (raises TypeScript minimum to 5.4; auto-migrates minor Material API refinements)
- [ ] T012 [US2] Review `git diff` and resolve any breaking-change usages in `projects/juice-js/*` and `projects/app/` not auto-migrated by the v18 schematics
- [ ] T013 [US3] Build gate: build all five `@juice-js/*` libraries and `app`; require zero errors
- [ ] T014 [US3] Test gate: run `npm test`; require all specs pass, then commit `build: upgrade Angular core and CLI to v18`

### Step 18 → 19

- [ ] T015 [US1] Run `npx ng update @angular/core@19 @angular/cli@19` in repo root (TypeScript minimum 5.5; `standalone: true` becomes default; NgModules emit deprecation warnings — warnings, not errors)
- [ ] T016 [US2] Review `git diff` and resolve breaking-change usages in `projects/`; confirm NgModule deprecation warnings are non-blocking and do NOT migrate to standalone (out of scope per `research.md` Decision 7)
- [ ] T017 [US3] Build gate: build all five `@juice-js/*` libraries and `app`; require zero errors (deprecation warnings tolerated)
- [ ] T018 [US3] Test gate: run `npm test`; require all specs pass, then commit `build: upgrade Angular core and CLI to v19`

### Step 19 → 20

- [ ] T019 [US1] Run `npx ng update @angular/core@20 @angular/cli@20` in repo root (raises Node minimum to 20.19; Node 20.19+ already active from T001)
- [ ] T020 [US2] Review `git diff` and resolve any breaking-change usages in `projects/` not auto-migrated by the v20 schematics
- [ ] T021 [US3] Build gate: build all five `@juice-js/*` libraries and `app`; require zero errors
- [ ] T022 [US3] Test gate: run `npm test`; require all specs pass, then commit `build: upgrade Angular core and CLI to v20`

### Step 20 → 21

- [ ] T023 [US1] Run `npx ng update @angular/core@21 @angular/cli@21` in repo root (TypeScript minimum 5.6; `ng-packagr` updated to 21.x)
- [ ] T024 [US2] Review `git diff` and resolve any breaking-change usages in `projects/` not auto-migrated by the v21 schematics
- [ ] T025 [US3] Build gate: build all five `@juice-js/*` libraries and `app`; require zero errors
- [ ] T026 [US3] Test gate: run `npm test`; require all specs pass, then commit `build: upgrade Angular core and CLI to v21`

### Step 21 → 22

- [ ] T027 [US1] Run `npx ng update @angular/core@22 @angular/cli@22` in repo root (TypeScript minimum ~5.9; `ng-packagr` updated to 22.x; Angular Material auto-migrated to 22.x)
- [ ] T028 [US2] Review `git diff` and resolve any breaking-change usages in `projects/` not auto-migrated by the v22 schematics
- [ ] T029 [US3] Build gate: build all five `@juice-js/*` libraries and `app`; require zero errors and zero deprecated-API build warnings (Acceptance Scenario US1-2)
- [ ] T030 [US3] Test gate: run `npm test`; require all specs pass, then commit `build: upgrade Angular core and CLI to v22`

### Third-Party Dependencies (after Angular 22)

- [ ] T031 [US1] Install `angular-oauth2-oidc@^22` and `@ngx-translate/core@^18` in repo root, then run `npm install` to let npm resolve remaining peer deps (use `--legacy-peer-deps` only as a documented last resort per Risk Register)
- [ ] T032 [US1] Confirm `package.json` target state matches `specs/001-angular-upgrade/data-model.md`: `@angular/*@^22.x`, `@angular/material@^22.x`, `angular-oauth2-oidc@^22`, `@ngx-translate/core@^18`, `typescript@~5.9.x`, `zone.js@~0.16.x`
- [ ] T033 [US2] Rebuild all projects and run `npm test` after the third-party bump; resolve any API breakage from `angular-oauth2-oidc` (auth flow, `projects/juice-js/auth/`) or `@ngx-translate/core` (`TranslateModule` usage, `projects/juice-js/localize/`), then commit `build: upgrade third-party deps to Angular 22 compatible versions`

**Checkpoint**: `package.json` is fully on Angular 22; `npx ng version` reports Angular 22 / TS 5.9.x. US1 complete.

---

## Phase 4: User Story 2 — Developer Resolves Breaking-Change API Updates (Priority: P2)

**Goal**: The entire codebase compiles cleanly on Angular 22 with zero TypeScript and zero Angular
template errors, and no deprecated-API build warnings.

**Independent Test**: Build every project in the workspace — zero TS compilation errors, zero template errors.

> Most US2 work happens inline in Phase 3 (the per-step `git diff` review + fix tasks). The tasks
> here are the final cross-cutting sweep once the codebase is on Angular 22.

- [ ] T034 [US2] Full TypeScript compilation sweep: build all six projects and confirm zero TS errors across `projects/juice-js/*` and `projects/app/` (Acceptance Scenario US2-2)
- [ ] T035 [P] [US2] Angular Material audit: verify Material component selectors, inputs, and outputs used in templates across `projects/` still compile with no breaking changes on Material 22 (Acceptance Scenario US2-3), and visually check custom Material CSS overrides for regressions (Risk Register: "Custom Material CSS regressions")
- [ ] T036 [US2] Confirm the two touched-during-branch files, `projects/juice-js/auth/src/lib/auth.module.ts` and `projects/juice-js/auth/src/lib/auth/auth.guard.ts`, compile and behave correctly against `angular-oauth2-oidc@22`

**Checkpoint**: Codebase compiles cleanly on Angular 22 with no deprecated-API errors. US2 complete.

---

## Phase 5: User Story 3 — CI Pipeline Passes on Upgraded Branch (Priority: P3)

**Goal**: The full build and test pipeline is green on the upgraded branch, confirming the change is safe to merge.

**Independent Test**: Run `npm run build` and `npm test` locally — both complete with zero failures.

- [ ] T037 [US3] Full build: run `npm run build` and confirm all library artifacts are produced in `dist/juice-js/` with no errors (Acceptance Scenario US3-1, SC-001)
- [ ] T038 [US3] Full test run: run `npm test` (`ng test --watch=false --browsers=ChromeHeadless --code-coverage`) and confirm zero failures with coverage thresholds met (Acceptance Scenario US3-2, SC-002)
- [ ] T039 [US3] Verify `semantic-release` and `ng-packagr` config remain functional with no pipeline changes (FR-008, SC-005): confirm `package.json` release config and `ng-packagr` build succeed unchanged

**Checkpoint**: Build + test pipeline green on the upgraded branch. US3 complete — safe to merge.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the whole feature.

- [ ] T040 Dev-server smoke test: run `npm start` (or `npm run start:windows`) and verify in-browser per `quickstart.md` Step 7 — app loads with no console errors, menu/navigation renders, auth flow initiates, tenant resolution works, language switching works (SC-003, SC-004)
- [ ] T041 [P] Run the full `specs/001-angular-upgrade/quickstart.md` Acceptance Criteria Checklist and confirm every item passes (including `npx ng version` reporting Angular 22)
- [ ] T042 [P] Confirm `git log --oneline` shows one conventional `build:` commit per major version step (v17…v22) plus the third-party commit (SC-005), and revert the temporary `disableNonceCheck` workarounds (commits `e2ac847`, `3a8bc7f`) if the auth nonce issue is resolved by `angular-oauth2-oidc@22`
- [ ] T043 [P] (Optional) Restore the machine default Node 24 for other projects if a version manager was used, and record the Node 20.19+ requirement in `README`/CI so future builds use a supported runtime

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 (Node install) has no dependency and MUST run first; T002 depends on T001; T003/T004 depend on T002.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all version-step work.
- **User Story 1 (Phase 3)**: Depends on Foundational. Steps within are **strictly sequential**
  (16→17→18→19→20→21→22→third-party); each step's test gate must be green before the next step's `ng update`.
- **User Story 2 (Phase 4)**: The final sweep depends on US1 reaching Angular 22; the per-step US2
  fixes are embedded in Phase 3 and gate each step.
- **User Story 3 (Phase 5)**: Depends on US1 + US2 being complete on Angular 22.
- **Polish (Phase 6)**: Depends on all user stories complete.

### Within Phase 3 (per version step)

- `ng update` (US1) → review + fix breaking changes (US2) → build gate (US3) → test gate + commit (US3).
- A step is never committed until both its build and test gates are green.

### Parallel Opportunities

- Setup: T003 and T004 can run in parallel (`[P]`) after T002; T001→T002 are sequential.
- Within each version step, the five library builds in the build-gate task can run concurrently, but
  the step itself is sequential — **do not run two version steps in parallel** (`ng update` enforces order).
- Phase 4: T035 (Material audit) is `[P]` — independent of T034/T036.
- Phase 6: T041, T042, T043 are `[P]`.

---

## Parallel Example: Phase 1 Setup

```powershell
# T001 (install Node 20.19+) then T002 (verify) run first, in order.
# After T002 confirms clean starting state, run the two audits together:
Task T003: "npm outdated + npx ng update preview"
Task T004: "npm test baseline on Angular 16"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup — including installing Node 20.19+.
2. Complete Phase 2: Foundational (compatibility gate + commit discipline).
3. Complete Phase 3: US1 — the six sequential version steps + third-party bump, each gated by build + test.
4. **STOP and VALIDATE**: `npx ng version` reports Angular 22; `package.json` matches data-model.md.

### Incremental Delivery

1. Each version step (T007–T010, T011–T014, …, T027–T030) is a shippable, independently green
   increment — the branch builds and all tests pass at every committed step.
2. After Angular 22 + third-party (US1) → run the US2 compilation sweep → run the US3 pipeline gate →
   Polish smoke test.
3. Never skip a step's test gate to "catch up later" — the sequential guarantee is what keeps the
   upgrade debuggable.

---

## Notes

- `[P]` tasks = different files/independent, no ordering dependency.
- `[Story]` label maps each task to US1/US2/US3 for traceability, even though the stories interleave per step.
- No new test specs are authored (FR-005): existing tests are the gate, and their logic must not change.
- Keep Node 20.19+ active for every step; re-check `node --version` if a shell is reopened.
- Commit after each version step with the exact conventional message from `plan.md`.
- Review `git diff` after every `ng update` — it is the primary defense against unexpected schematic edits.
