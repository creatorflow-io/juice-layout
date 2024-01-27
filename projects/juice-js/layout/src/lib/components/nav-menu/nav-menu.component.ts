import { Component} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MenuItem, MenuService, TenantService } from '@juice-js/core';
import { LayoutService } from '../../layout.service';
import { TooltipPosition } from '../tooltip/tooltip.directive';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'juice-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
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
    private breakpointObserver: BreakpointObserver) {
    
    if(route.snapshot.data['settingUrl']){
      this.settingUrl = route.snapshot.data['settingUrl'];
    }else{
      this.settingUrl = layout.settingUrl();
    }
    tenantService.getTenantIdentifier().then(tenant => { this.settingUrl = this.settingUrl?.injectTenant(tenant); });

    breakpointObserver.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.isExpanded = result.matches ? true : this.layout.isMenuOpen();
    });
    this.service.getMenu().subscribe(items => {
      this.items = items;
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
