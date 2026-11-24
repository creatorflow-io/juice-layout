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
    palettes: LayoutPalette[] = [...LAYOUT_PALETTES];
    defaultPalette: string | undefined;

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
    /**
     * The colour palettes the viewer can switch between (the palette button beside the dark mode switch), by the names
     * the stylesheet's `layout.theme()` emits. Default: teal and indigo. With one palette, no button.
     */
    palettes?: LayoutPalette[];
    /**
     * The palette before the viewer picks one. Without it, the stylesheet's `default` applies (teal unless
     * `layout.theme((default: …))` changed it).
     */
    defaultPalette?: string;
}

/** A colour palette, as `layout.theme()` names it and the palette menu shows it. */
export interface LayoutPalette {
    /** The palette's name in the stylesheet: `data-juice-palette="<id>"`. */
    id: string;
    /** Shown in the menu (translated). */
    name: string;
    /** The swatch in the menu, a CSS colour; usually the palette's primary. */
    color: string;
}

/** The palettes `layout.theme()` ships. */
export const LAYOUT_PALETTES: readonly LayoutPalette[] = [
    { id: "teal", name: "Teal", color: "#0f766e" },
    { id: "indigo", name: "Indigo", color: "#4f46e5" },
];

export const IS_PRODUCTION = new InjectionToken<boolean>('production');

/**
 * Components an app adds to the toolbar, before the dark mode switch (a notification bell): provide each with `multi: true`.
 * `{ provide: LAYOUT_TOOLBAR_ITEMS, useValue: NotificationBellComponent, multi: true }`.
 */
export const LAYOUT_TOOLBAR_ITEMS = new InjectionToken<Type<unknown>[]>('LAYOUT_TOOLBAR_ITEMS');
