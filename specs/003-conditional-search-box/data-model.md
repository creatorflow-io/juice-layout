# Phase 1 Data Model: Conditional Search Box

**Feature**: `003-conditional-search-box` | **Date**: 2026-07-17

All state is in-memory and scoped to the current navigation. Nothing is persisted — the spec requires the query to be discarded when the displayed page changes (FR-005), so durability would be a defect, not a feature.

## Entities

### SearchablePage (contract implemented by pages)

The spec's **Page search support**. A page declares support by implementing this interface; the declaration and the handler are the same act, so they cannot drift (FR-009).

| Member | Type | Notes |
|---|---|---|
| `onSearch` | `(query: string, event?: Event) => void` | Receives what the user typed. `query` is `''` when cleared — never `null` (FR-010: an empty query is distinct from an absent box). `event` is the originating DOM event, optional so tests and future non-keyboard triggers need not fabricate one. |

**Validation**: structural — `isSearchablePage(x)` is true when `x` is a non-null object and `typeof x.onSearch === 'function'`. Interfaces are erased at runtime; see research Decision 1 for the accepted trade-off.

**Not modelled**: no `searchable: boolean` flag. Support *is* the presence of `onSearch`. A flag would allow `searchable: true` with no handler — the exact state FR-009 forbids.

### ActiveSearchBinding (internal to SearchService)

The spec's link between the displayed page and the shell. Private; consumers see only its derived effects.

| Field | Type | Notes |
|---|---|---|
| `_page` | `Signal<SearchablePage \| null>` | The bound page, or `null` when the active page declares no support. |
| `_legacyCallback` | `Signal<Function \| null>` | Set only by the deprecated `enable()`. Exists for out-of-repo consumers (research Decision 3). |

### Active search query

The spec's **Active search query**. Scoped to the displayed page, discarded when it changes.

| Field | Type | Notes |
|---|---|---|
| `query` | `Signal<string>` | What the user has currently typed. Owned by `SearchService`, not by the search bar — the bar is mounted once and outlives every page, which is exactly why today's component-local `searchText` leaks (defect D1). |

### Search box visibility

The spec's **Search box**: "presence is derived from the displayed page's declared support, never set independently of it."

| Field | Type | Notes |
|---|---|---|
| `isEnabled` | `Signal<boolean>` | **Computed**, not settable: `_page() !== null \|\| _legacyCallback() !== null`. There is no setter, so the constraint is enforced by the type system rather than by convention. This is the entity that today is a public mutable boolean anyone can flip. |

## State transitions

Driven exclusively by the shell's `router-outlet` lifecycle. No router-event subscription exists in the design — removing it is what fixes defects D2 and D3.

| Trigger | Transition | Requirement |
|---|---|---|
| Outlet deactivates the old page | `_page → null`, `_legacyCallback → null`, `query → ''` | FR-005 (no leak), FR-003 (default off) |
| Outlet activates a page implementing `SearchablePage` | `_page → instance` ⇒ `isEnabled → true` | FR-002, FR-006 |
| Outlet activates a page that does not implement it | `_page` stays `null` ⇒ `isEnabled → false` | FR-003 |
| Legacy page calls `enable(cb)` in its constructor | `_legacyCallback → cb` ⇒ `isEnabled → true` | FR-011 |
| User types | `query → text`, forwarded to `_page.onSearch(text, event)` or `_legacyCallback(text, event)` | FR-004 |
| User clears the box | `query → ''`, forwarded as `''` | FR-010 |
| Navigation cancelled or rejected | *no transition* — the outlet never deactivates | FR-007 (fixes D2) |
| Param-only navigation (tenant switch) | *no transition* — the component is reused, so the outlet never deactivates | FR-006 (fixes D3) |

**Ordering guarantee** (why the deprecated path stays safe): on A → B the outlet deactivates A *before* constructing B, so a legacy `enable()` in B's constructor lands after the reset and is not clobbered.

```
outlet.deactivate()   →  clear _page, _legacyCallback, query
B constructed         →  legacy enable() may set _legacyCallback
outlet.activate(B)    →  bind _page if isSearchablePage(B)
```

## Relationships

```
PageComponent (shell, mounted once)
  ├── juice-search-bar ──reads──► SearchService.isEnabled : Signal<boolean>  (computed)
  │                     ──reads──► SearchService.query     : Signal<string>
  │                     ──calls──► SearchService.submit(text, event)
  └── router-outlet
        ├── (activate)   ──► SearchService.bindPage(instance)
        └── (deactivate) ──► SearchService.unbindPage()
                                    │
                              binds ▼
                          the active page, iff it implements SearchablePage
```

The shell never learns a page's identity — only whether it satisfies the structural contract (FR-001).
