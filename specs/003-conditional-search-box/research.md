# Phase 0 Research: Conditional Search Box

**Feature**: `003-conditional-search-box` | **Date**: 2026-07-17

## Baseline: what exists today

| Concern | Current state | File |
|---|---|---|
| Visibility flag | `isEnabled: boolean`, mutable, public | `layout/src/lib/services/search.service.ts:8` |
| Revocation | `disable()` on every `NavigationStart` | `search.service.ts:11-17` |
| Claim | Page calls `enable(callback)` in its constructor | `app/src/app/dashboard/dashboard.component.ts:46` |
| Handler type | `Function` — untyped, unchecked | `search.service.ts:9` |
| Box render | `@if (isEnabled())` — method call, re-evaluated every CD cycle | `search-bar.component.html:1` |
| Query state | `searchText` on the component, never reset | `search-bar.component.ts:31` |
| Mount point | Shell toolbar, mounted once | `page/page.component.html:25` |
| Dead config | `data: { searchUrl: 'dashboard1/search' }` — nothing reads it | `dashboard1-routing.module.ts:15` |
| Dead hook | `(activate)="onAttach"` — missing `()`, never fires | `page.component.html:42` |

## Defects traced to the current mechanism

These are the concrete causes behind the spec's user stories. Each was traced in source, not assumed.

- **D1 — Stale query leaks across pages (spec Story 2).** `searchText` lives on `SearchBarComponent`, which the shell mounts once and never destroys. `disable()` clears the flag and callback but never the text. Navigate searchable A → searchable B and B's box still shows A's query, while B has received nothing. The user reads a filtered-looking box over unfiltered content.

- **D2 — Cancelled navigation kills search (spec Story 3, FR-007).** `disable()` fires at `NavigationStart`, which is emitted *before* guards run. `TenantGuard`/`AuthGuard` denying, a failed lazy chunk, or a redirect all leave the user on the current page with search gone and no way to get it back short of a full re-navigation.

- **D3 — Tenant switch permanently kills search (spec FR-006, Constitution V).** This is the sharpest one. Routes are `:tenant` → children (`app-routing.module.ts:12`), and no custom `RouteReuseStrategy` exists (verified: zero matches under `projects/`), so Angular's default applies — `future.routeConfig === curr.routeConfig` means a param-only change **reuses the component instance**. Navigating `/t1/dashboard` → `/t2/dashboard`: `NavigationStart` calls `disable()`, the component is *not* reconstructed, so `enable()` never re-runs. Search disappears for the rest of the session. Multi-tenancy is a constitutional concern (Principle V), which makes this more than cosmetic.

- **D4 — Lazy-module timing trap.** Already documented in-repo at `dashboard.component.ts:44-45`: the router disables on every `NavigationStart` but a lazy module's constructor runs only on first entry, so the claim *must* go in the component. The contract is correct only if the author knows this. A comment warning the next person is a design smell, not a fix.

- **D5 — No contract between page and shell.** `_callback: Function` accepts any arity and any types. A page can declare support and never handle the query; nothing catches it at compile time or runtime (spec edge case: "declares support but never handles what is typed").

## Decision 1 — How a page declares search support

**Decision**: The page component implements a `SearchablePage` interface. The shell detects it from the `router-outlet` `(activate)` event and binds it; `(deactivate)` unbinds.

**Rationale**:
- FR-009 requires support and handling to be inseparable. An interface carries *both* in one declaration — you cannot claim support without providing `onSearch`. Route data cannot carry a handler, so any data-flag design needs a second, separate registration step, which is the very split FR-009 forbids.
- The activate/deactivate lifecycle resolves D2, D3, and D4 *by construction* rather than by patching:
  - Cancelled navigation never deactivates the outlet → state survives (D2, FR-007).
  - Param-only reuse never deactivates → binding survives the tenant switch (D3).
  - No dependence on constructor-vs-router ordering → the lazy-module trap disappears (D4).
- `deactivate` gives an exact, single reset point for the query (D1, FR-005) and fires once per navigation (FR-008).
- Default-off (FR-003) falls out: a page that implements nothing binds nothing.
- FR-001 ("without the shell needing to know about individual pages") holds — the shell tests a structural contract, never a page identity.
- The seam already exists and was clearly intended: `page.component.html:42` binds `(activate)="onAttach"` to a real `onAttach()` handler, missing only the `()`. This completes an abandoned hook rather than inventing a mechanism.

**Alternatives considered**:

- *Route data flag (`data: { searchable: true }`), the `searchUrl` path someone started.* Matches the in-repo precedent for declared capabilities (`nav-menu.component.ts:28` reads `settingUrl` from route data with a config fallback), and is inspectable without running the page. **Rejected**: data is static, so the handler still needs a separate imperative registration — support and handling drift apart, violating FR-009 and preserving D5. It also cannot be read the way the precedent reads it: `settingUrl` sits on the `PageComponent` route itself, so `route.snapshot.data` resolves it directly; search is declared on *child* routes, and route data does not propagate upward. The shell would have to walk `firstChild` to the leaf on every `NavigationEnd` — reintroducing exactly the router-event coupling that causes D2 and D3.
- *Keep `enable(callback)`, move `disable()` from `NavigationStart` to `NavigationEnd`.* Smallest diff; fixes D2. **Rejected**: does not fix D3 (a reused component still never re-enables), and `NavigationEnd` fires *after* the new component's constructor, so it would clobber the incoming page's claim — trading one ordering trap for a worse one. Leaves D5 untouched.
- *Structural directive on each page (`*juiceSearchable`).* Ties visibility to the page's own template. **Rejected**: the box lives in the shell's toolbar, outside the page's view; a directive inside the page cannot own a control outside it without the same shared-service indirection, so it adds a layer without removing one.

**Trade-off accepted**: Detection is structural (duck-typed `typeof x.onSearch === 'function'`) rather than nominal, since TypeScript interfaces are erased at runtime. A page could satisfy it accidentally. This is remote — `onSearch` is specific — and the failure is benign (a box appears on a page that has an `onSearch` method). Nominal alternatives (a marker token, a base class) cost more than the risk: a base class forbids other inheritance, and a DI token cannot be provided per-activation from the page component without more ceremony than the interface saves.

**Scope note**: `(activate)` on the shell's outlet emits the *direct* child of `PageComponent`. The spec assumes "only the innermost displayed page decides." For today's route tree these coincide — every route under `PageComponent` (`dashboard`, `dashboard1`, `auth`, `PageNotfoundComponent`) is a leaf with no nested outlet. If a page later nests its own outlet, its *outer* component is what binds, and it would need to relay for its children. Recorded in the plan as a known boundary rather than solved speculatively.

## Decision 2 — Where visibility state lives

**Decision**: `SearchService` exposes Angular signals — `isEnabled` (computed from whether a page is bound) and `query`. `isEnabled` is derived, never independently settable.

**Rationale**: The spec's Key Entities require the box's presence to be "derived from the displayed page's declared support, never set independently of it." A `computed()` over the bound page enforces that in the type system — there is no setter to misuse. Angular 22 signals are already the idiomatic choice, and the template's `@if` reads a signal instead of calling a method on every change-detection pass. All components here run `ChangeDetectionStrategy.Eager` (verified as Angular 22's rename of `Default`/`CheckAlways`, with `Default` now deprecated — `@angular/core/types/_debug_node-chunk.d.ts:4811-4818`), so today's `isEnabled()` method call is re-evaluated on every cycle; a signal removes that.

**Alternatives considered**: `BehaviorSubject` + `async` pipe (consistent with RxJS 7.8 already present, but noisier and needs subscription management); keeping the plain mutable boolean (cheapest, but leaves `isEnabled` publicly settable, directly contradicting the Key Entities constraint).

## Decision 3 — Backward compatibility for `enable()` / `disable()`

**Decision**: Retain `enable(callback)` and `disable()` as `@deprecated` shims that keep working. Ship as `feat:` (minor), not `feat!:`.

**Rationale**: `SearchService` is exported from the library's public API (`public-api.ts:14`), so consumers outside this repo may call it. Constitution IV permits breaking changes when marked, but there is no need to spend one: the deprecated path can coexist. Ordering makes this safe — the outlet deactivates the old page *before* the new one is constructed, so a legacy `enable()` in a constructor lands after the reset and is not clobbered:

```
navigate A → B:  outlet.deactivate()        → clear page + legacy callback + query
                 B constructed              → legacy enable() may set callback
                 outlet.activate(B)         → bind B if it implements SearchablePage
```

`isEnabled` is therefore computed as `boundPage() !== null || legacyCallback() !== null`. The `NavigationStart` subscription is deleted outright — it is the root of D2/D3, and the outlet lifecycle replaces it for both paths, so legacy callers get the bug fixes for free.

**Alternatives considered**: Remove `enable`/`disable` and ship `feat!:` with a major bump (cleaner surface; rejected as an unnecessary consumer break for a shim that costs ~6 lines). Keep the `NavigationStart` subscription solely for legacy callers (rejected — it would re-import D2/D3 for exactly the callers who cannot see why, and dual revocation paths would race).

**Migration**: The two in-repo pages (`dashboard`, `dashboard1`) move to `SearchablePage`, satisfying FR-011 by walking each. The orphaned `searchUrl` route data (`dashboard1-routing.module.ts:15`) is removed — Decision 1 rejects the route-data path, so leaving a key nothing reads would mislead the next author, exactly as it misled this investigation.

## Decision 4 — Detecting a page that declares support but cannot serve it

**Decision**: No runtime guard needed. Under Decision 1 the failure mode is unrepresentable — `onSearch` *is* the declaration. In development, `isSearchablePage()` returning false for a page whose author expected search is diagnosed by a `console.warn` only when a page carries the deprecated `enable()` call, pointing at the migration.

**Rationale**: The spec's edge case asks that the mismatch be "detectable during development." Making it impossible to express is strictly better than detecting it. The remaining detectable mistake — implementing `onSearch` but forgetting to name it correctly — surfaces as the box simply not appearing, which is the correct default-off behaviour (FR-003) and is visible on first manual test.

## Resolved unknowns

| Unknown | Resolution |
|---|---|
| Angular/TS version vs. constitution's stack table | Actual: Angular 22.0.6, TS 6.0.3, Material 22.0.4, RxJS 7.8 (`package.json`). Constitution table says Angular 16 / TS 5.1 — **stale**, superseded by feature `001-angular-upgrade`. Pre-existing drift; see plan's Constitution Check. |
| `ChangeDetectionStrategy.Eager` — real or typo? | Real. Angular 22 renamed `Default` → `Eager` (`CheckAlways`); `Default` is deprecated. Repo-wide usage is current, not legacy. |
| Does route reuse actually occur on tenant switch? | Yes. No `RouteReuseStrategy` implementation exists under `projects/`; default reuse applies on param-only change. Confirms D3. |
| Does `(activate)` fire on re-entry, back/forward, direct URL? | Yes — it fires on every outlet activation, which is what FR-006 enumerates. |
| Is `SearchBarComponent` publicly exported? | No — only `SearchService` (`public-api.ts:14`) and `PageComponent`. The bar is internal, so its template/state may change freely; only `SearchService` and the new interface are API surface. |
