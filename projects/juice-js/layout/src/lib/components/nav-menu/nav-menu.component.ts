import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MenuItem, MenuService, TenantService } from '@juice-js/core';
import { LayoutService } from '../../layout.service';
import { TooltipPosition } from '../tooltip/tooltip.directive';
import { ActivatedRoute } from '@angular/router';

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
  TooltipPosition: typeof TooltipPosition = TooltipPosition;

  settingUrl: string|null|undefined;

  constructor(private service: MenuService, 
    public layout: LayoutService, private tenantService: TenantService,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef) {
    
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
      this.cdr.markForCheck();
    });
  }

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
