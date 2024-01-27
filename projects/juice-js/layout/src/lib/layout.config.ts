import { InjectionToken } from '@angular/core';
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
}

export const IS_PRODUCTION = new InjectionToken<boolean>('production');
