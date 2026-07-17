import { Injectable, Signal, computed, signal } from '@angular/core';
import { SearchablePage, isSearchablePage } from './searchable-page';

/**
 * Mediates between the shell's single toolbar search box and the page on display.
 *
 * The box appears only while the displayed page implements {@link SearchablePage}.
 * The shell binds and unbinds the page from its own `router-outlet` lifecycle — this
 * service deliberately does NOT listen to router events. Revoking on `NavigationStart`
 * (as it once did) fires before guards run and before a reused component is rebuilt,
 * which silently lost the box on a cancelled navigation or a tenant switch.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly _page = signal<SearchablePage | null>(null);
  private readonly _query = signal<string>('');

  /** Set only by the deprecated {@link enable}. */
  private readonly _legacyCallback = signal<Function | null>(null);

  /**
   * Whether the toolbar should offer search — true iff a page is bound.
   *
   * Derived, with no setter: presence cannot be set independently of page support.
   */
  readonly isEnabled: Signal<boolean> = computed(
    () => this._page() !== null || this._legacyCallback() !== null
  );

  /** What the user has currently typed for the displayed page. */
  readonly query: Signal<string> = this._query.asReadonly();

  /**
   * Bind the page now on display. Called by the shell on outlet activation.
   *
   * A page that does not implement {@link SearchablePage} binds nothing, leaving the
   * box hidden — support is opt-in.
   */
  public bindPage(instance: unknown): void {
    this._page.set(isSearchablePage(instance) ? instance : null);
  }

  /**
   * Release the page. Called by the shell on outlet deactivation.
   *
   * Also discards the query: the box is mounted once and shared, so a term left here
   * would surface on the next page, which never received it.
   */
  public unbindPage(): void {
    this._page.set(null);
    this._legacyCallback.set(null);
    this._query.set('');
  }

  /** Forward what the user typed to the bound page. Called by the search box. */
  public submit(query: string, event?: Event): void {
    this._query.set(query);

    const page = this._page();
    if (page) {
      page.onSearch(query, event);
      return;
    }

    const legacy = this._legacyCallback();
    if (legacy) {
      legacy(query, event);
    }
  }

  /**
   * @deprecated Implement {@link SearchablePage} on the page component instead — it ties
   * the declaration to the handler, so search cannot be claimed without being served.
   * Still functional; scheduled for removal in the next major.
   */
  public enable(callback: Function) {
    this._legacyCallback.set(callback);
  }

  /**
   * @deprecated The shell now revokes automatically when the page changes; there is
   * nothing to call. Still functional; scheduled for removal in the next major.
   */
  public disable() {
    this._page.set(null);
    this._legacyCallback.set(null);
  }

  /**
   * @deprecated Renamed to {@link submit}, which also records the query for the box.
   */
  public callback(searchText: string | null, event: any) {
    this.submit(searchText ?? '', event);
  }
}
