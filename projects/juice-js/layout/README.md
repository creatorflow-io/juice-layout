# Layout

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.0.

## Theme and palettes

The layout owns the app's colours, so the shell and every Juice page package (notifications, audit, observability…)
show the same palette, light and dark. With Material 3, include the theme once in the app's global styles:

```scss
@use '@juice-js/layout' as layout;

@include layout.theme();                                   // teal (default) and indigo
@include layout.theme((default: indigo, density: -1));     // another default, denser
@include layout.theme((palettes: (brand: $brand)));        // add your own, beside the built-in ones
```

`theme()` emits:
- **Material 3:** `mat.theme()` for the default palette, and again under `[data-juice-palette="<name>"]` for each one. The colours are `light-dark()` pairs; the dark mode switch puts `.dark` (`color-scheme: dark`) on `body`.
- **The layout's components:** toolbar, sidenav, menus and scrollbars, from Material's system colours.
- **Shared tokens** for the page packages, on the same elements: `--juice-bg`, `--juice-surface`, `--juice-border`, `--juice-text`, `--juice-muted`, `--juice-accent`, `--juice-on-accent`, `--juice-select`, and the tones `--juice-ok`, `--juice-warn`, `--juice-bad`, `--juice-info`, `--juice-none`, each with a `-bg` tint. A package reads them with its own fallback: `var(--juice-accent, …)`.

Options: `default` (the palette before the viewer picks one), `palettes` (name → `(primary: …, tertiary: …)` M3 palettes, as `ng generate @angular/material:theme-color` writes them; a built-in name replaces that palette), `typography` (Roboto) and `density` (0).

At runtime the viewer picks a palette with the palette button beside the dark mode switch. `LayoutService.setPalette(id)` sets `data-juice-palette` on `<html>` and remembers it in the browser; `palette()` is the current one. Configure what the button offers in `LayoutModule.forRoot`:

```ts
LayoutModule.forRoot(production, {
  brand: 'Acme',
  defaultPalette: 'indigo',     // match layout.theme((default: …)), so the menu marks the right one
  palettes: [...LAYOUT_PALETTES, { id: 'brand', name: 'Brand', color: '#c2410c' }],
}),
```

With one palette there is no button. The Material 2 mixins of 1.x (`layout-component-themes`, `layout-component-colors`) still work for apps not on Material 3 yet; they get no palettes and no `--juice-*` tokens.

## Toolbar search: `SearchablePage`

The shell's toolbar hosts one search box, shared by every page. It appears only while the
displayed page implements `SearchablePage`, and disappears otherwise.

```ts
import { SearchablePage } from '@juice-js/layout';

@Component({ /* ... */ })
export class OrdersComponent implements SearchablePage {
  onSearch(query: string): void {
    this.filter = query;   // '' means the box was cleared — show everything
  }
}
```

That is the whole opt-in: no service to inject, no constructor wiring, no route config.
A page that supports no search implements nothing — the box is absent by default.

Implementing `onSearch` *is* the declaration, so a page cannot claim search without
serving it. The shell binds the active page from its own router outlet, which means the
box survives a cancelled navigation and a tenant switch that reuses the page component.

Notes:

- `onSearch` fires on every keystroke. The shell does not debounce, impose a minimum
  length, or wait for Enter — a page that wants any of those owns them.
- Clearing the box calls `onSearch('')`, which is different from the box being absent
  (which calls nothing).

### Migrating from `SearchService.enable()`

`enable()` and `disable()` are deprecated but still functional; they will be removed in
the next major.

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

## Code scaffolding

Run `ng generate component component-name --project layout` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project layout`.
> Note: Don't forget to add `--project layout` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build layout` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build layout`, go to the dist folder `cd dist/layout` and run `npm publish`.

## Running unit tests

Run `ng test layout` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
