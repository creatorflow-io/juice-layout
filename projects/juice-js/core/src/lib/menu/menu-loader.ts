
import { Injector, Type, createNgModule } from '@angular/core';
import { wrapIntoObservable} from './utils';
import { MENUS, MenuItem, Menus, CanDisplay } from './menu-item';
import { map } from 'rxjs/operators';
import { Observable, of,  firstValueFrom } from 'rxjs';
import { ROUTES, Route } from '@angular/router';

export interface DefaultExport<T> {
    default: T;
}

export async function loadChildren(menu: MenuItem, parentInjector: Injector, 
  tenant: string|null|undefined): Promise<void>
{
  if(menu.loaded){
    menu.injectTenant(tenant);
    return;
  }
  // console.debug("loadChildren", menu.rawRouterLink);

  await loadChildrenInternal(menu, parentInjector, tenant)
  .then(children => {
    console.debug("loadedChildren", menu.rawRouterLink, children.map(c => c.rawRouterLink));
    menu.children = children;
    menu.loaded = true;
    menu.injectTenant(tenant);
  })
  ;
}

async function loadChildrenInternal(menu: MenuItem, parentInjector: Injector, tenant: string|null|undefined)
: Promise<MenuItem[]>{
  var result: MenuItem[] = [];
  var children = await firstValueFrom(getChildren(menu, parentInjector, tenant));
  for(let child of children){
    var sub = await loadChildrenInternal(child, parentInjector, tenant);
    if(sub.length > 0){
      result = result.concat(sub);
    }else{
      result.push(child);
    }
  }
  
  return result.map(child => {
    child.rawRouterLink = menu.replaceChildRouterLink && menu.rawRouterLink ?
      ('/' + menu.rawRouterLink.trimSlash() + '/' + child.rawRouterLink.trimSlash()).trimEndSlash()
      : '/'+child.rawRouterLink.trimSlash();
    return child;
  });
}
function getChildren(menu:MenuItem, parentInjector: Injector, tenant: string|null|undefined) 
  : Observable<MenuItem[]>{
  if(menu.loadChildren){
    return wrapIntoObservable(menu.loadChildren())
    .pipe(
      map(t => loadMenus(t, parentInjector))
    );
  }else{
    return of(menu.children.filter(m => filterMenu(m, parentInjector)));
  }
}

function loadMenus(menusOrModule: Type<unknown>|Menus, parentInjector: Injector): MenuItem[] {
  
  if(Array.isArray(menusOrModule)){
    return menusOrModule.map(menu => new MenuItem(menu));
  }
  const module = createNgModule(menusOrModule, parentInjector);
  const injector = module.injector;
  const menus = injector.get(MENUS, [], {optional: true, self: true}).flat();
  const routes = injector.get(ROUTES, [], {optional: true, self: true});
  var routeMenus = mapRouteMenu(routes);
  // console.debug("loadMenus", menus, routeMenus);
  return menus.map(menu => new MenuItem(menu)).concat(routeMenus)
    .filter(m => filterMenu(m, injector));
}

function filterMenu(menu: MenuItem, injector: Injector): boolean{

  if(menu.canDisplay instanceof Boolean){
    return menu.canDisplay as boolean;
  }
  const canDisplays = getCanDisplays(menu.canDisplay);

  return (canDisplays.length === 0 || canDisplays.every(
    (c: any) => {
      if(c instanceof Type){
        const service = injector.get<CanDisplay>(c as Type<CanDisplay>);
        return service.canDisplay();
      }else if(c instanceof Function){
        return c();
      }
      return true;
    }
  ))
}

function getCanDisplays(canDisplay: boolean|any[]): Array<any>{
  if(canDisplay instanceof Boolean){
    return [];
  }
  return Array.isArray(canDisplay) ? canDisplay : [];
}

export function mapRouteMenu(routes: Route[][]): MenuItem[]{
  return routes
    .map(route => route.filter(isMenu).map(r => {
          if(!r.data){
            r.data = {};
          }
          return MenuItem.fromRoute(r);
        })
      ).flatMap(m => m.map(r => r!));
}

export function isMenu(route: Route): boolean{
  return route.data && (route.data['menuDisplay'] || route.data['menuWrapper']);
}
