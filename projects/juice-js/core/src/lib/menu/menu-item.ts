import { InjectionToken } from '@angular/core';
import { Route } from '@angular/router';
import { isMenu } from './menu-loader';

export class MenuItem {
    id: string = "";
    label: string = "";
    routerLink: string = "";
    rawRouterLink: string;
    icon: string = "";
    order: number = 0;
    children: MenuItem[];
    loadChildren?: Function;
    replaceChildRouterLink: boolean;
    loaded: boolean = false;
    canDisplay: any[] | boolean;
    
    constructor(menu: Menu){
        this.id = menu.id;
        this.label = menu.label;
        this.routerLink = menu.routerLink;
        this.icon = menu.icon;
        this.order = menu.order??0;
        this.children = menu.children?.map(m => new MenuItem(m))?? [];
        this.loadChildren = menu.loadChildren;
        this.replaceChildRouterLink = menu.replaceChildRouterLink ?? true;
        this.loaded = false;
        this.rawRouterLink = menu.routerLink;
        this.canDisplay = menu.canDisplay??[];
    }

    static fromRoute(route: Route): MenuItem{
        var menu = new MenuItem({
            id: route.path ?? '',
            label: route.data!['menuTitle']??route.title??route.path??'',
            routerLink: route.path??'',
            icon: route.data!['menuIcon']??'',
            order: route.data!['menuOrder']??0,
            children: route.children?.filter(isMenu).map(r => MenuItem.fromRoute(r))??[],
            loadChildren: route.loadChildren,
            replaceChildRouterLink: true,
            canDisplay: (route.data!['menuDisplay'] as boolean | any[])
        });
        return menu;
    }

    hasChildren(): boolean{
        return this.children.length > 0;
    }

    injectTenant(tenant: string|null|undefined){
        this.children?.forEach(item => {
            if(item.hasChildren()){
                item.injectTenant(tenant);
            }else{
                item.routerLink = item.rawRouterLink.injectTenant(tenant);
            }
        });
        this.routerLink = this.rawRouterLink.injectTenant(tenant);
    }
}

export interface Menu {
    id: string,
    label: string,
    routerLink: string,
    icon: string,
    order?: number,
    children?: Menus,
    loadChildren?: any,
    replaceChildRouterLink?: boolean,
    canDisplay?: any[] | boolean
}

export type Menus = Menu[];

export const MENUS = new InjectionToken<Menus[]>('MENUS');

export interface CanDisplay{
    canDisplay(): boolean;
}