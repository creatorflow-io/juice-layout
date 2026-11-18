import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, viewChild } from '@angular/core';
import { MenuItem } from '@juice-js/core';
import { IsActiveMatchOptions, NavigationEnd, Router } from '@angular/router';
import { MatExpansionPanel } from '@angular/material/expansion';
import { filter } from 'rxjs/operators';
import { TooltipPosition } from '../tooltip/tooltip.directive';

/** A page and the pages under it (`/alerts` and `/alerts/42`), whatever the query string. */
const Section: IsActiveMatchOptions = { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' };
const Exact: IsActiveMatchOptions = { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' };

/**
 * A menu item with children: a header that opens and closes them. The group opens itself whenever a navigation lands
 * on one of its pages (also one kept out of the menu, `inMenu: false`), even if it was closed by hand. A header with a
 * page of its own opens that page too; one without (`routerLink: ''`) only opens and closes.
 */
@Component({
    selector: 'juice-expandable-menu',
    templateUrl: './expandable-menu.component.html',
    styleUrls: ['./expandable-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    host: { '[class.menu-expanded]': 'isExpanded' }
})
export class ExpandableMenuComponent {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly panel = viewChild(MatExpansionPanel);
  private _item: MenuItem = {} as MenuItem;

  @Input()
  isExpanded = false;

  @Input()
  set item(value: MenuItem) {
    this._item = value;
    this.children = value?.menuChildren?.() ?? [];
    this.update();
  }
  get item(): MenuItem { return this._item; }

  TooltipPosition: typeof TooltipPosition = TooltipPosition;
  /** The children the side menu shows. */
  children: MenuItem[] = [];
  /** Whether a page of the group (its own, or any child's, or one under them) is on display. */
  open = false;
  /** Whether to highlight the header: it has a page of its own and that page is on display. */
  headerActive = false;
  /** The header's own page, or null: a header without one (or linking to a child's page) only opens and closes. */
  headerLink: string | null = null;

  constructor() {
    let path = this.path();
    const navigations = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.update();
      // Arriving on one of its pages opens the group, also after it was closed by hand on an earlier one; staying on
      // the same page (a filter writing the query string) leaves it as the user left it.
      const now = this.path();
      if (this.open && now !== path) this.panel()?.open();
      path = now;
      this.cdr.markForCheck();
    });
    inject(DestroyRef).onDestroy(() => navigations.unsubscribe());
  }

  private update() {
    const item = this._item;
    const all = item?.children ?? [];
    const links = all.map(c => c.routerLink).filter(l => !!l);
    this.headerLink = item?.hasOwnPage?.() ? item.routerLink : null;
    this.headerActive = this.isActive(this.headerLink, Exact);
    // The header's own page opens the group with the pages under it, unless it is the home page or the tenant's root.
    const headerSection = !!this.headerLink && !isRoot(item.rawRouterLink);
    this.open = this.headerActive || (headerSection && this.isActive(this.headerLink, Section))
      || all.some(c => this.isActive(c.routerLink, this.matching(c.routerLink, links)));
  }

  /** The URL's path, without query string or fragment. */
  private path(): string {
    return this.router.url.replace(/[?#].*$/, '');
  }

  /**
   * How a child's link matches: with the pages under it, unless other pages of the group sit under it too (a link to
   * `/` or to the tenant's root), which would make it match every page.
   */
  private matching(link: string, links: string[]): IsActiveMatchOptions {
    const path = link.replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (!path) return Exact;
    return links.some(other => other !== link && other.startsWith(path + '/')) ? Exact : Section;
  }

  private isActive(link: string | null | undefined, options: IsActiveMatchOptions): boolean {
    return !!link && this.router.isActive(this.router.parseUrl(link), options);
  }
}

/** A link as written that names the home page or the tenant's root: `''`, `/`, `:tenant`. */
function isRoot(rawLink: string | null | undefined): boolean {
  const path = (rawLink ?? '').replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '');
  return path === '' || path === ':tenant';
}
