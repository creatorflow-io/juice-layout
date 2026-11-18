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
    /** False keeps the item out of the side menu; it still reaches the page switcher. */
    inMenu: boolean;
    /** Go-to keys, such as `g s`. */
    shortcut?: string;
    /**
     * Whether it was made as a group (it had children, or children to load), even if none is left for this user: a
     * group without a link has no page of its own, also once empty.
     */
    readonly grouping: boolean;

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
        this.inMenu = menu.inMenu ?? true;
        this.shortcut = menu.shortcut;
        this.grouping = this.children.length > 0 || !!menu.loadChildren;
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
            canDisplay: (route.data!['menuDisplay'] as boolean | any[]),
            inMenu: route.data!['menuInMenu'],
            shortcut: route.data!['menuShortcut']
        });
        return menu;
    }

    hasChildren(): boolean{
        return this.children.length > 0;
    }

    /** The children the side menu shows: all but those marked `inMenu: false`. */
    menuChildren(): MenuItem[]{
        return (this.children ?? []).filter(c => c.inMenu !== false);
    }

    /**
     * Whether the item has a page of its own: a leaf does; a group does when it has a link that none of its children
     * stands for (a group linking to its first child's page has none of its own).
     */
    hasOwnPage(): boolean{
        if(!this.hasChildren()){
            // A leaf is a page ('' is the home page); a group left without children is one only if it has a link.
            return !this.grouping || !!this.rawRouterLink;
        }
        const own = this.routerLink?.trimEndSlash();
        return !!this.routerLink && !this.children.some(c => c.routerLink?.trimEndSlash() === own);
    }

    injectTenant(tenant: string|null|undefined){
        this.children?.forEach(item => {
            if(item.grouping){
                item.injectTenant(tenant);
            }else{
                item.routerLink = item.rawRouterLink.injectTenant(tenant);
            }
        });
        // A group without a link stays without one ('' would otherwise become '/', the home page); '/' is a link.
        this.routerLink = this.grouping && !this.rawRouterLink
            ? '' : this.rawRouterLink.injectTenant(tenant);
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
    canDisplay?: any[] | boolean,
    /**
     * False keeps the item out of the side menu but in the page switcher (Ctrl+K): a page reached from other pages.
     * Default true.
     */
    inMenu?: boolean,
    /** Go-to keys the shell binds to the item: `g` then one letter, such as `g s`. Shown in the page switcher. */
    shortcut?: string
}

export type Menus = Menu[];

export const MENUS = new InjectionToken<Menus[]>('MENUS');

export interface CanDisplay{
    canDisplay(): boolean;
}