# Research: Upgrade to Latest Angular

**Feature**: 001-angular-upgrade
**Date**: 2026-06-04
**Sources**: Angular official docs, npm, GitHub changelogs, community upgrade guides

---

## Decision 1: Target Angular Version

**Decision**: Angular 22 (latest stable as of the 2026-07-10 revision)

**Rationale**: Angular 22 reached stable in mid-2026 (it was RC as of the original 2026-06-04
research date and has since been released). Targeting the current stable major keeps the library
on the newest supported release with the longest support window, and avoids a second upgrade
effort shortly after landing on 21.

**Alternatives considered**:
- Angular 21 — rejected as the *final* target; it is stable and supported, but Angular 22 is now
  the current stable release, so stopping at 21 would leave the library one major version behind.
  Note: 21 is still a mandatory intermediate step (see Decision 2 — no version skipping).
- Angular 23 — not yet released; not a candidate.
- Angular 19/20 — rejected; already superseded and closer to end of support.

---

## Decision 2: Upgrade Strategy (Sequential vs. Direct Jump)

**Decision**: Sequential incremental upgrades, one major version at a time:
16 → 17 → 18 → 19 → 20 → 21 → 22

**Rationale**: Angular enforces sequential upgrades. `ng update` will refuse to skip versions.
Each step applies its own migration schematics, which is the only reliable way to handle all
breaking changes automatically.

**Command sequence**:
```powershell
npx ng update @angular/core@17 @angular/cli@17
npx ng update @angular/core@18 @angular/cli@18
npx ng update @angular/core@19 @angular/cli@19
npx ng update @angular/core@20 @angular/cli@20
npx ng update @angular/core@21 @angular/cli@21
npx ng update @angular/core@22 @angular/cli@22
```

After each step: build all libraries, run all tests, commit.

**Alternatives considered**:
- Direct jump — not supported; `ng update` enforces sequential migration.

---

## Decision 3: Angular Material Version

**Decision**: Upgrade Angular Material alongside Angular core, targeting `@angular/material@22`.

**Rationale**: Angular Material versions align 1:1 with Angular core versions. The project is
already on Material 15, which was the version that completed the MDC (Material Design Components)
migration. This means the largest Material breaking-change event is already absorbed. Custom CSS
overrides should require minimal rework — only audit needed.

**Key risk**: Material 15 already uses MDC selectors. However, component APIs, inputs/outputs,
and template syntax may have minor changes from v15→v21 that auto-migration schematics will
handle.

---

## Decision 4: TypeScript Version

**Decision**: TypeScript must be upgraded to ~5.9 to satisfy Angular 22's peer dependency.

**Version requirements by Angular version**:
| Angular | TypeScript minimum |
|---------|-------------------|
| 16 | 4.9–5.1 |
| 17 | 5.2–5.3 |
| 18 | 5.4 |
| 19 | 5.5 |
| 20 | 5.5+ |
| 21 | 5.6+ |
| 22 | ~5.9 (exact minimum resolved by the v22 schematic at execution time) |

**Rationale**: Each `ng update` step will enforce the TypeScript requirement for that version.
TypeScript upgrades are handled automatically by the Angular migration schematics.

---

## Decision 5: Builder Migration (angular.json)

**Decision**: Migrate `angular.json` build targets from the legacy `browser` builder to the new
`application` builder where applicable. This is automated by `ng update` schematics from Angular
17 onward.

**Details**:
- Old builder: `@angular-devkit/build-angular:browser` (deprecated from Angular 17)
- New builder: `@angular-devkit/build-angular:application` (introduced Angular 17)
- The package name `@angular-devkit/build-angular` does NOT change (no rename to `@angular/build`).
- Library projects continue to use `@angular-devkit/build-angular:ng-packagr` — no change.
- The migration schematic updates `angular.json` automatically during `ng update @angular/core@17`.

---

## Decision 6: Third-Party Dependencies

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| `@angular/material` | 15.2.9 | 22.x | Auto-migrated by `ng update` |
| `angular-oauth2-oidc` | ^15.0.1 | ^22.0.0 | Versions align with Angular core; confirm the `@22` release exists on npm before Step 7 |
| `@ngx-translate/core` | ^14.0.0 | ^18.0.0 | v18 supports Angular 20–22; confirm on npm before Step 7 |
| `ng-packagr` | ^16.0.0 | ^22.0.0 | Included in `ng update` |
| `typescript` | ~5.1.3 | ~5.9.x | Auto-updated by Angular schematics |
| `zone.js` | ~0.13.0 | ~0.16.x | Auto-updated by Angular schematics |

**angular-oauth2-oidc**: The library follows Angular's major version numbering. `@22` supports
both NgModule and standalone configurations. If a `@22` release is not yet published at migration
time, fall back to the latest published major that declares Angular 22 peer support.

**@ngx-translate/core**: Version 18 supports Angular 20–22. The NgModule-based `TranslateModule`
API remains available (no breaking change for this project). Confirm the exact latest version on
npm at execution time.

---

## Decision 8: Node.js Runtime

**Decision**: Use **two** Node versions across the chain — there is no single version that spans
16→22:
- **Node 20.19+** for Angular 16→21.
- **Node 24.15.0+** for Angular 22 (which also accepts 22.22.3+ and 26).

**Rationale**: Angular 16–19 do not support Node 24 (Angular 16 reports it *Unsupported* and can
fail intermediate `ng update`/build/Karma runs), so the early steps need Node 20. Angular **22
dropped Node 20 entirely** — its CLI hard-errors with "requires a minimum Node.js version of
v22.22.3 or v24.15.0 or v26.0.0". (Note: even the machine's original Node 24.14.0 is below the
24.15.0 floor.) So Node must be bumped before the 21→22 step.

**Implementation (as executed)**: Installed Node 20.20.2 (winget `OpenJS.NodeJS.20`) for steps
16→21, then Node 24.18.0 (winget `OpenJS.NodeJS.LTS`) for step 22. `node_modules` was reinstalled
when switching Node so native modules matched the runtime.

**TypeScript note**: Angular 22 in this environment resolved to **TypeScript 6.0.3** (not the ~5.9
originally assumed). TS 6.0 errors on the deprecated `baseUrl`/`downlevelIteration` options unless
`"ignoreDeprecations": "6.0"` is set in the root tsconfig.

---

## Decision 7: NgModule Deprecation — Defer Full Migration

**Decision**: Do NOT migrate from NgModules to standalone components as part of this upgrade.
The upgrade is scoped to dependency versions only.

**Rationale**: NgModules are deprecated as of Angular 19 but still fully functional in Angular
21. The migration to standalone is a separate, significant effort. Mixing the two concerns would
expand scope unpredictably. Standalone migration can be a follow-up feature.

**Impact**: Existing `@NgModule` decorators will generate deprecation warnings in Angular 19+.
These are warnings, not errors — the build will succeed.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Third-party lib not ready for Angular 22 | Low | High | Verify on npm before starting; fall back to Angular 21 (last known-good target) if needed |
| Node 24 used for intermediate Angular 16–19 steps | Medium | High | Install and activate Node 20.19+ before Step 1; verify `node --version` at each step |
| Custom Material CSS regressions | Low | Medium | Already on Material 15 MDC; visual audit after upgrade |
| Peer dependency conflicts | Medium | Medium | Use `npm install --legacy-peer-deps` as last resort, document why |
| Test failures from API changes | Medium | High | Auto-migration handles most; run tests after each step |
| Schematics modify root config unexpectedly | Low | Low | Review `git diff` after each `ng update` step |
