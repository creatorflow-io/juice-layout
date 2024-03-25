import { Injectable, Injector, inject } from '@angular/core';
import { MENUS, MenuItem } from './menu-item';
import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { loadChildren, mapRouteMenu } from './menu-loader';
import { TenantService } from '../tenant/tenant.service';
import { ROUTES, Route } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  routes: Route[][] = [];
  constructor(private injector: Injector, private tenantService: TenantService) { 
    this.routes = inject(ROUTES, {optional: true})??[];
  }

  getMenu():Observable<MenuItem[]>{
    var menus = this.injector.get(MENUS, [], {optional: true, self: true}).flat();
    var routeMenus = mapRouteMenu(this.routes);
    // console.debug("getMenu", menus, routeMenus, this.routes);
    return of(menus)
      .pipe(
        map(menus => menus.map(m => new MenuItem(m))),
        map(async menus => {
          var tenant = await this.tenantService.getTenantIdentifier();
          let menuItems = [];
          for(let menu of menus.concat(routeMenus)){
            await loadChildren(menu, this.injector, tenant);
            menuItems.push(menu);
          }
          return menuItems;
        }),
        mergeMap(menus => menus),
        map(menus => menus.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)))
      );
  }

}
