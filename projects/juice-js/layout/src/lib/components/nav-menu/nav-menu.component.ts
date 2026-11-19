import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MenuItem, MenuService, TenantService } from '@juice-js/core';
import { LayoutService } from '../../layout.service';
import { TooltipPosition } from '../tooltip/tooltip.directive';
import { ActivatedRoute } from '@angular/router';
import { PageSwitcherService } from '../../services/page-switcher.service';
import { MenuBadgeService } from '../../services/menu-badge.service';

@Component({
    selector: 'juice-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NavMenuComponent {
  isExpanded = false;
  isMobile = false;
  items: MenuItem[] = [];
  /** The items the side menu shows: all but those marked `inMenu: false` (the page switcher still offers them). */
  menuItems: MenuItem[] = [];
  TooltipPosition: typeof TooltipPosition = TooltipPosition;

  settingUrl: string|null|undefined;
  /** The counts on the entries ({@link MenuBadgeService}). */
  protected readonly badges = inject(MenuBadgeService);

  constructor(private service: MenuService, 
    public layout: LayoutService, private tenantService: TenantService,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private switcher: PageSwitcherService) {
    
    if(route.snapshot.data['settingUrl']){
      this.settingUrl = route.snapshot.data['settingUrl'];
    }else{
      this.settingUrl = layout.settingUrl();
    }
    // Async callbacks don't trigger change detection in zoneless apps (the Angular 22 default), so mark explicitly.
    tenantService.getTenantIdentifier().then(tenant => {
      this.settingUrl = this.settingUrl?.injectTenant(tenant);
      this.cdr.markForCheck();
    });

    breakpointObserver.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.isExpanded = result.matches ? true : this.layout.isMenuOpen();
      this.cdr.markForCheck();
    });
    this.service.getMenu().subscribe(items => {
      console.debug('Menu items', JSON.parse(JSON.stringify(items)));
      this.items = items;
      // A group shows while it has pages to show; one whose pages are all kept out shows as its own page, if it has one.
      this.groups = new Set(items.filter(i => i.menuChildren().length > 0));
      this.menuItems = items.filter(i => i.inMenu !== false && (this.groups.has(i) || i.hasOwnPage()));
      // The switcher offers the same items: one load, renewed whenever the shell (and this menu) is built again.
      this.switcher.setItems(items);
      this.cdr.markForCheck();
    });
  }

  /** The items that show as a group: they have pages the side menu shows. */
  groups = new Set<MenuItem>();

  toggle() {
    this.layout.toggleMenu();
    this.isExpanded = this.layout.isMenuOpen();
  }

  mouseEnter() {
    if(!this.isMobile){
      this.isExpanded = true;
    }
  }
  mouseLeave() {
    if(!this.isMobile){
      this.isExpanded = this.layout.isMenuOpen();
    }
  }

}
