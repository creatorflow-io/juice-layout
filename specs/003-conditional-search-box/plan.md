# Implementation Plan: Conditional Search Box

**Branch**: `003-conditional-search-box` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-conditional-search-box/spec.md`

## Summary

The toolbar search box already appears per page, but visibility is driven by a mutable boolean that pages set imperatively from their constructor and the router clears on every `NavigationStart`. That mechanism is correct only when timing cooperates, and [research.md](./research.md) traces four defects to it — a query that leaks between pages, a cancelled navigation that kills search, a tenant switch that kills search permanently, and an untyped page↔shell contract.

The approach: a page declares search support by implementing a `SearchablePage` interface, and the shell binds the active page from its own `router-outlet` `(activate)`/`(deactivate)` events instead of listening to router events. Visibility becomes a signal computed from whether a page is bound — derived, never independently settable. This replaces timing-dependent coordination with the outlet lifecycle, which fixes the cancelled-navigation and tenant-switch defects by construction rather than by patching, and makes "declares support without handling the query" unrepresentable. The change is additive: `enable()`/`disable()` survive as deprecated shims, so it ships as a minor version.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (`package.json`)  
**Primary Dependencies**: Angular 22.0.6 (core/router/forms/animations), Angular Material 22.0.4, RxJS 7.8, `@angular/cdk` layout  
**Storage**: N/A — all state is in-memory and per-navigation by design (the query is deliberately *not* persisted; FR-005)  
**Testing**: Karma + Jasmine, `ng test --project @juice-js/layout --watch=false --browsers=ChromeHeadless`  
**Target Platform**: Evergreen browsers (SPA)  
**Project Type**: Angular workspace — publishable library `@juice-js/layout` under `projects/juice-js/`, consumed by the host `app` project via `dist/juice-js/`  
**Performance Goals**: Box reaches its final state within the same navigation the user perceives, no flicker (SC-004); visibility read as a signal rather than a method call per change-detection cycle (all components run `ChangeDetectionStrategy.Eager` = `CheckAlways`)  
**Constraints**: No breaking change to the library's public API — `SearchService` is exported at `public-api.ts:14` and may have out-of-repo consumers; must survive tenant switching (Constitution V)  
**Scale/Scope**: One shell-owned box, 4 routed page types today (`dashboard`, `dashboard1`, `auth`, `page-notfound`), 2 of which support search

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against constitution v1.0.0.

| Principle | Verdict | Notes |
|---|---|---|
| **I. Library-First** | ✅ Pass | All shell changes land in `projects/juice-js/layout/`. The library stays independently buildable and testable; no feature logic moves into the host `app` beyond the two demo pages adopting the new interface. New symbols are exported through `public-api.ts`. No new cross-library dependency — `layout` already depends on `@angular/router`. |
| **II. Angular & TypeScript Discipline** | ✅ Pass | Services via DI (`providedIn: 'root'`, unchanged); `SearchablePage` exported from the existing `LayoutModule`; no manual instantiation. Strict mode respected — the change *removes* untyped surface by replacing `_callback: Function` and `event: any` with a typed contract. No new `any`. SCSS stays component-scoped (untouched). |
| **III. Test Coverage (NON-NEGOTIABLE)** | ✅ Pass | New/updated specs adjacent to source: `search.service.spec.ts` (new — the service has none today), `search-bar.component.spec.ts` (currently a bare CLI stub), `page.component.spec.ts`. Tests target the public contract — bind/unbind and observable visibility — not internals. Full suite must pass before merge. |
| **IV. SemVer & Conventional Commits** | ✅ Pass | Additive: `enable()`/`disable()` retained as `@deprecated` working shims (research Decision 3), so this is `feat:` (minor), not `feat!:`. No manual `package.json` version edits — `semantic-release` derives the bump. |
| **V. Multi-Tenancy & Auth Awareness** | ✅ Pass — and materially improved | This is the principle with real stakes here. Defect **D3**: because routes are `:tenant`-parameterised and no `RouteReuseStrategy` exists, a tenant switch reuses the component; `NavigationStart` disables search and the constructor never re-runs, so search is lost for the session. The outlet-lifecycle design never deactivates on param-only reuse, so the binding survives. No tenant identifiers are embedded; tenant resolution stays with `@juice-js/core`. Auth is untouched — `AuthGuard` denying a navigation is precisely defect D2, also fixed. |

**Gate result: PASS** — no violations, so Complexity Tracking is omitted.

**Post-design re-check (after Phase 1)**: Re-evaluated against the final contract in [contracts/searchable-page.md](./contracts/searchable-page.md) and [data-model.md](./data-model.md). Still PASS on all five principles — the design added one interface and one type guard to the library's public surface, no new project, module, component, or cross-library dependency, so the Principle I and II verdicts are unchanged. Two things surfaced during design that were not visible at the pre-Phase-0 gate and are recorded rather than waved through:

1. **`isEnabled` changes shape** from a mutable `boolean` field to a read-only `Signal<boolean>` on an exported service. Both known readers are inside this library, and writing it was never supported, so this ships as `feat:` — but it is a real surface change, not a pure addition. The reasoning and the condition that would flip it to `feat!:` are written down in the contract's Breaking-change note rather than left implicit. Principle IV verdict holds; the call is documented so a reviewer can overrule it.
2. **Test surface grew** beyond the pre-design estimate: `SearchService` has no spec at all today and `search-bar.component.spec.ts` is a bare CLI stub that passes only because `SearchService` is `providedIn: 'root'`. Principle III is non-negotiable, so this is scoped work for `/speckit.tasks`, not a footnote.

**Pre-existing constitutional drift (flagged, not introduced by this feature)**: the constitution's Technology Stack table (v1.0.0, ratified 2026-06-04) pins Angular 16.x / Material 15.x / TypeScript 5.1.x. The workspace is actually on Angular 22.0.6 / Material 22.0.4 / TypeScript 6.0.3, following feature `001-angular-upgrade`. The constitution's own rule — that major upgrades "MUST be treated as a breaking change and require a migration plan" — was satisfied by that feature, but the table was never amended. This plan targets the versions actually installed. Recommend a separate `docs: amend constitution to v1.1.0 (refresh technology stack)` PR; it is out of scope here and blocks nothing.

## Project Structure

### Documentation (this feature)

```text
specs/003-conditional-search-box/
├── plan.md              # This file
├── research.md          # Phase 0 output — baseline, defects D1-D5, decisions
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── searchable-page.md   # Phase 1 output — the page↔shell contract
├── checklists/
│   └── requirements.md  # From /speckit.specify
├── spec.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
projects/juice-js/layout/src/
├── public-api.ts                                  # + export searchable-page contract
└── lib/
    ├── layout.module.ts                           # unchanged (no new declarations)
    ├── page/
    │   ├── page.component.ts                      # onAttach -> onPageActivate/onPageDeactivate
    │   ├── page.component.html                    # fix dead (activate)="onAttach" binding
    │   └── page.component.spec.ts                 # + activate/deactivate binding tests
    ├── services/
    │   ├── search.service.ts                      # rewrite: signals, bindPage, drop NavigationStart
    │   ├── search.service.spec.ts                 # NEW (no spec exists today)
    │   └── searchable-page.ts                     # NEW: SearchablePage + isSearchablePage
    └── components/search-bar/
        ├── search-bar.component.ts                # read signals; drop local searchText state
        ├── search-bar.component.html              # @if on signal, not method call
        └── search-bar.component.spec.ts           # replace CLI stub with real tests

projects/app/src/app/                              # host app: migrate demo pages (FR-011)
├── dashboard/dashboard.component.ts               # enable(cb) -> implements SearchablePage
├── dashboard1/dashboard1.component.ts             # enable(cb) -> implements SearchablePage
└── dashboard1/dashboard1-routing.module.ts        # remove orphaned `searchUrl` route data
```

**Structure Decision**: Existing Angular workspace layout, unchanged. The feature is confined to the `@juice-js/layout` library (Principle I), with the host `app` touched only to migrate the two pages that use the deprecated call and to delete the dead `searchUrl` key. One new file in the library (`searchable-page.ts`) holds the contract; no new library, module, or component is introduced.

## Known boundaries

Recorded so `/speckit.tasks` does not treat these as oversights:

- **Nested outlets**: `(activate)` on the shell's outlet emits the *direct* child of `PageComponent`. Every route under it today is a leaf, so "direct child" and the spec's "innermost displayed page" coincide. A page that later nests its own outlet would bind its outer component and must relay to its children. Not solved speculatively.
- **Structural detection**: `isSearchablePage()` duck-types `onSearch` because TypeScript interfaces are erased at runtime. Accepted in research Decision 1; the failure mode is remote and benign.
- **Deprecated path**: legacy `enable()` callers keep the untyped `Function` signature and get the D2/D3 fixes, but not the FR-009 guarantee — that requires adopting the interface.
