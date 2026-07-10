# Implementation Plan: Angular 16 → 22 Upgrade

**Branch**: `001-angular-upgrade` | **Date**: 2026-06-04 (rev. 2026-07-10) | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-angular-upgrade/spec.md`

## Summary

Upgrade all Angular packages and ecosystem dependencies across the `juice-layout` monorepo from
Angular 16 to Angular 22 (latest stable as of mid-2026). The upgrade is sequential — one major
version at a time (16→17→18→19→20→21→22) — using `ng update` schematics to automate breaking-change
migrations. Third-party dependencies (`angular-oauth2-oidc@22`, `@ngx-translate/core@18`) are
updated after reaching Angular 22. NgModule-to-standalone migration is explicitly out of scope
and deferred to a future feature.

**Toolchain prerequisite**: Node.js requirements differ across the chain and no single version
spans it. Angular 16–19 do not support Node 24 (use **Node 20.19+**); Angular **22 drops Node 20**
and requires **Node 22.22.3+ / 24.15.0+ / 26**. This upgrade ran on Node 20.20.2 for steps 16→21
and Node **24.18.0** for 22. Also note the final stack resolved to **TypeScript 6.0.3** (not 5.9).

## Technical Context

**Language/Version**: TypeScript 5.1.3 → 5.9.x (auto-updated per Angular version step)
**Primary Dependencies**: Angular CLI 22, @angular-devkit/build-angular 22, ng-packagr 22,
Angular Material 22, angular-oauth2-oidc 22, @ngx-translate/core 18
**Runtime**: Node.js 20.19+ (required across the whole 16→22 chain; Node 24 is unsupported by Angular 16–19)
**Storage**: N/A
**Testing**: Karma 6.4 + Jasmine 4.6 (may auto-update to compatible versions)
**Target Platform**: Web browser (same as current — no platform change)
**Project Type**: Angular library monorepo (6 libraries + 1 host app)
**Performance Goals**: No change — migration must not degrade build or runtime performance
**Constraints**: Sequential upgrade (no version skipping); NgModule migration is out of scope;
all existing unit tests must pass; no changes to test logic
**Scale/Scope**: 6 `@juice-js/*` libraries + 1 `app` project; ~100 source files across projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | All work is within `projects/juice-js/*`; no new lib needed |
| II. Angular & TypeScript Discipline | ✅ PASS | Upgrade follows Angular Style Guide; no anti-patterns introduced |
| III. Test Coverage | ✅ PASS | All existing tests must pass; no test logic changes allowed |
| IV. Semantic Versioning & Conventional Commits | ✅ PASS | One `build:` commit per version step; `semantic-release` pipeline unchanged |
| V. Multi-Tenancy & Auth Awareness | ✅ PASS | Auth/tenant libraries upgraded in place; no auth flow changes |

**Post-design re-check**: No complexity violations. No new libraries added. The builder
migration (`browser` → `application` in `angular.json`) is automated by schematics and does not
violate any principle.

## Project Structure

### Documentation (this feature)

```text
specs/001-angular-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0 output — upgrade strategy, version decisions
├── data-model.md        # Phase 1 output — dependency version map
├── quickstart.md        # Phase 1 output — step-by-step validation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
package.json                          # Dependency manifest (primary change target)
angular.json                          # Build config (builder migration: browser → application)
tsconfig.json                         # TypeScript config (auto-updated)
projects/
├── app/                              # Host application
│   ├── tsconfig.app.json
│   └── src/
├── juice-js/
│   ├── auth/                         # @juice-js/auth
│   ├── core/                         # @juice-js/core
│   ├── layout/                       # @juice-js/layout
│   ├── localize/                     # @juice-js/localize
│   └── tenant/                       # @juice-js/tenant
```

**Structure Decision**: No structural changes. The existing monorepo layout is preserved.
`ng update` schematics modify `package.json`, `angular.json`, `tsconfig.json`, and source files
in-place. No new directories or files are introduced beyond what schematics create automatically.

## Migration Sequence

Each step below is atomic: run `ng update`, fix any remaining issues, build all libraries, run
all tests, then commit before proceeding.

### Step 1: Angular 16 → 17

```powershell
npx ng update @angular/core@17 @angular/cli@17
```

Key changes auto-applied by schematics:
- `angular.json` app builder migrated from `:browser` to `:application`
- TypeScript minimum raised to 5.2
- Zone.js updated

Commit: `build: upgrade Angular core and CLI to v17`

---

### Step 2: Angular 17 → 18

```powershell
npx ng update @angular/core@18 @angular/cli@18
```

Key changes:
- TypeScript minimum raised to 5.4
- Minor Material API refinements (auto-migrated)

Commit: `build: upgrade Angular core and CLI to v18`

---

### Step 3: Angular 18 → 19

```powershell
npx ng update @angular/core@19 @angular/cli@19
```

Key changes:
- `standalone: true` becomes default for new components/directives/pipes
- NgModules generate deprecation warnings (not errors — build still succeeds)
- TypeScript minimum raised to 5.5

Commit: `build: upgrade Angular core and CLI to v19`

---

### Step 4: Angular 19 → 20

```powershell
npx ng update @angular/core@20 @angular/cli@20
```

Commit: `build: upgrade Angular core and CLI to v20`

---

### Step 5: Angular 20 → 21

```powershell
npx ng update @angular/core@21 @angular/cli@21
```

Key changes:
- TypeScript minimum raised to 5.6
- ng-packagr updated to 21.x

Commit: `build: upgrade Angular core and CLI to v21`

---

### Step 6: Angular 21 → 22

```powershell
npx ng update @angular/core@22 @angular/cli@22
```

Key changes:
- TypeScript minimum raised to ~5.9 (exact value resolved by the schematic at execution time)
- ng-packagr updated to 22.x
- Angular Material auto-migrated to 22.x

Commit: `build: upgrade Angular core and CLI to v22`

---

### Step 7: Third-Party Dependencies

```powershell
npm install angular-oauth2-oidc@^22
npm install @ngx-translate/core@^18
```

Commit: `build: upgrade third-party deps to Angular 22 compatible versions`

---

### Step 8: Final Validation

Run full quickstart.md checklist. All items must pass before the feature is merged.

Commit (if any remaining fixes): `fix: resolve post-upgrade Angular 22 compatibility issues`

## Complexity Tracking

> No constitution violations — this section is not required.
