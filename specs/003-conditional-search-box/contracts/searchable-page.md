# Contract: Page ↔ Shell Search

**Feature**: `003-conditional-search-box` | **Date**: 2026-07-17  
**Surface**: public API of `@juice-js/layout`, exported via `public-api.ts`

This is the contract a page implements to make the shell's toolbar search box appear. It is the only supported way to do so; `SearchService.enable()` remains as a deprecated shim.

## Exported surface

### `SearchablePage`

```ts
/**
 * Implemented by a routed page to declare that it supports search.
 *
 * The shell's toolbar hosts one search box, shared by every page. It appears only
 * while the displayed page implements this interface, and disappears otherwise —
 * there is nothing else to opt in to and no flag to set.
 *
 * Implementing `onSearch` IS the declaration: support and handling cannot be
 * declared apart, so a box that accepts typing no page listens to is impossible.
 */
export interface SearchablePage {
  /**
   * Called as the user types, and once with `''` when the box is cleared.
   * An empty query means "show everything" — it is not the same as the box being absent.
   *
   * @param query What the user has typed. Never null; `''` when cleared.
   * @param event The originating DOM event, when there is one.
   */
  onSearch(query: string, event?: Event): void;
}
```

### `isSearchablePage`

```ts
/** Structural type guard used by the shell. Interfaces are erased at runtime. */
export function isSearchablePage(value: unknown): value is SearchablePage;
```

### `SearchService` (public methods)

| Member | Signature | Contract |
|---|---|---|
| `isEnabled` | `Signal<boolean>` | **Read-only.** True iff a page is bound. Computed — no setter exists, so presence can never be set independently of page support. Replaces today's public mutable `isEnabled: boolean`. |
| `query` | `Signal<string>` | **Read-only.** The current query for the displayed page. `''` when cleared or reset. |
| `bindPage` | `(instance: unknown) => void` | **Called by the shell only.** Binds `instance` if it satisfies `isSearchablePage`; otherwise leaves no page bound. Not for page authors. |
| `unbindPage` | `() => void` | **Called by the shell only.** Clears the bound page, any legacy callback, and the query. |
| `submit` | `(query: string, event?: Event) => void` | **Called by the search box only.** Records the query and forwards it to the bound page. No-op when nothing is bound. |
| `enable` | `(callback: Function) => void` | **@deprecated** — implement `SearchablePage` instead. Still functional; scheduled for removal in the next major. |
| `disable` | `() => void` | **@deprecated** — the shell now revokes automatically on page change. Still functional. |

## Guarantees the shell makes to a page

1. `onSearch` is called only while the page is the one displayed — never after it is deactivated, and never for another page's input (FR-004).
2. The box is empty when the page is activated. A previous page's query never arrives (FR-005).
3. The box's presence matches the page's declaration on every activation: first visit, re-entry, direct URL, refresh, and browser back/forward (FR-006).
4. If a navigation away is cancelled or rejected — a guard denies, a lazy chunk fails, the user aborts — the page stays bound and search keeps working (FR-007).
5. A param-only navigation that reuses the page component (for example a tenant switch, `/t1/dashboard` → `/t2/dashboard`) keeps the binding intact. The page's own `onSearch` continues to serve; if it must re-query for the new tenant, that is the page's concern, not the shell's.
6. Clearing the box calls `onSearch('')` — distinct from the box being absent, which calls nothing (FR-010).

## Obligations on a page

1. `onSearch` must be safe to call repeatedly and rapidly — the shell forwards on each keystroke and does not debounce. A page that needs debouncing or a minimum query length owns that.
2. `onSearch` must not throw; the shell does not catch.
3. Support is static for the page's lifetime. The shell reads the declaration once per activation and does not re-check. A page whose searchability varies at runtime should declare support and handle the inapplicable case itself (spec Assumptions).

## Usage

```ts
import { SearchablePage } from '@juice-js/layout';

@Component({ /* ... */ })
export class DashboardComponent implements SearchablePage {
  onSearch(query: string): void {
    this.filter = query;      // '' means show everything
  }
}
```

A page that supports no search implements nothing and injects nothing — the box is absent by default (FR-003).

## Migration from `enable()`

```ts
// Before — claim in the constructor. The comment at dashboard.component.ts:44 warns the
// next author that this must not go in the module constructor, because the router
// disables on NavigationStart and a lazy module constructs only on first entry.
constructor(searchService: SearchService) {
  searchService.enable((text: string, event: Event) => { /* ... */ });
}

// After — declare on the class. No injection, no constructor work, no ordering hazard.
export class DashboardComponent implements SearchablePage {
  onSearch(query: string): void { /* ... */ }
}
```

## Breaking-change note

`SearchService.isEnabled` changes from a mutable `boolean` field to a read-only `Signal<boolean>`. Reading it as a bare property (`service.isEnabled`) — as `search-bar.component.ts:37` does today — must become a call (`service.isEnabled()`).

Both known readers are inside this library and are updated by this feature. The member is *technically* part of the exported surface, so an out-of-repo consumer reading it directly would break. This is judged acceptable rather than versioned as a major, because writing to it was never a supported operation and reading it from outside the shell has no legitimate use — the box is the library's own control. `enable()`/`disable()`, the only members a consumer has reason to call, keep working unchanged. If `/speckit.tasks` surfaces evidence of external readers, revisit and ship `feat!:` instead.
