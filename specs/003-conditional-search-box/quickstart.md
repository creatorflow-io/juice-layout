# Quickstart: Conditional Search Box

**Feature**: `003-conditional-search-box` | **Date**: 2026-07-17

## Make a page searchable

```ts
import { SearchablePage } from '@juice-js/layout';

@Component({ selector: 'app-orders', templateUrl: './orders.component.html' })
export class OrdersComponent implements SearchablePage {
  onSearch(query: string): void {
    this.filter = query;   // '' means the box was cleared — show everything
  }
}
```

That is the whole opt-in. No service injection, no constructor work, no route configuration. The box appears while this page is displayed and disappears when it is not.

## Make a page not searchable

Implement nothing. Default is off ([spec](./spec.md) FR-003).

## Build and run

```powershell
npm run watch:layout      # the app reads built output from dist/juice-js/ — build the library first
npm start
```

## Verify by hand

The behaviours worth walking, because they are the ones that are broken today ([research.md](./research.md) D1-D3):

| # | Do this | Expect | Covers |
|---|---|---|---|
| 1 | Open `/{tenant}/dashboard` | Box visible | FR-002 |
| 2 | Type `abc`, navigate to a non-searchable page | Box gone | FR-002 |
| 3 | Go back to `dashboard` | Box visible and **empty** — not `abc` | FR-005 (D1) |
| 4 | Type `abc` on `dashboard`, then go to `dashboard1` | Box **empty**, not `abc` | FR-005 (D1) |
| 5 | On `dashboard1` (auth-guarded), trigger a navigation that a guard denies | Box still visible **and still working** | FR-007 (D2) |
| 6 | Switch tenant: `/t1/dashboard` → `/t2/dashboard` | Box still visible and still working | FR-006 (D3) |
| 7 | Refresh directly on `/{tenant}/dashboard` | Box visible | FR-006 |
| 8 | Browser back/forward onto a searchable page | Box visible | FR-006 |
| 9 | Type, then clear with the ✕ | Page receives `''` and shows everything | FR-010 |

Checks 3-6 fail on `master` today. If any of them passes before the change, re-verify the premise in `research.md` before continuing — the defect analysis would be wrong.

## Test

```powershell
npm run test:layout
npm test                  # full suite must pass before merge (Constitution III)
```

## If you are migrating from `enable()`

```ts
// Before
constructor(searchService: SearchService) {
  searchService.enable((text: string, event: Event) => { /* ... */ });
}

// After
export class DashboardComponent implements SearchablePage {
  onSearch(query: string): void { /* ... */ }
}
```

`enable()`/`disable()` still work — deprecated, removal in the next major. Legacy callers get the D1-D3 fixes without changing anything; adopting the interface additionally buys the compile-time contract. See [contracts/searchable-page.md](./contracts/searchable-page.md).

## Gotchas

- **`onSearch` fires on every keystroke.** No debounce, no minimum length, no Enter-to-submit — that is the page's call. The shell deliberately does not decide this for you.
- **Don't reach for `SearchService` to show or hide the box.** `isEnabled` is a computed signal with no setter. Presence follows from the page's declaration; that is the point.
- **Tenant switch reuses the page component.** No new constructor runs, so do any per-tenant re-query from your existing tenant subscription — not from search wiring.
