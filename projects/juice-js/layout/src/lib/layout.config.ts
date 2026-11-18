import { InjectionToken, Type } from '@angular/core';
export enum ThemeMode{
    Light = "light",
    Dark = "dark",
    Auto = "auto"
}
export class LayoutConfig{
    favicon: string = "favicon.ico";
    brand: string = "Juice";
    brandLogo: string = "assets/images/logo.png";
    defaultThemeMode: ThemeMode = ThemeMode.Auto;
    defaultLanguage: string = "en-US";
    defaultMenuOpen: boolean = false;
    settingUrl: string | undefined;
    userImageUrl: string | undefined;
    pageSwitcher: boolean = true;

    constructor(options?: ILayoutConfig){
        if(options){
            Object.assign(this, options);
        }
    }
}

export interface ILayoutConfig{
    favicon?: string;
    brand: string;
    brandLogo?: string;
    defaultThemeMode?: ThemeMode;
    defaultLanguage?: string;
    defaultMenuOpen?: boolean;
    settingUrl?: string;
    userImageUrl?: string;
    /**
     * The page switcher (Ctrl+K or ⌘K, and a toolbar button) and the menu's go-to keys (`shortcut` on a menu item).
     * Default true.
     */
    pageSwitcher?: boolean;
}

export const IS_PRODUCTION = new InjectionToken<boolean>('production');

/**
 * Components an app adds to the toolbar, before the dark mode switch (a notification bell): provide each with `multi: true`.
 * `{ provide: LAYOUT_TOOLBAR_ITEMS, useValue: NotificationBellComponent, multi: true }`.
 */
export const LAYOUT_TOOLBAR_ITEMS = new InjectionToken<Type<unknown>[]>('LAYOUT_TOOLBAR_ITEMS');
