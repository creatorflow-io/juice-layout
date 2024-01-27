import { Injectable } from '@angular/core';
import { LayoutConfig, ThemeMode } from './layout.config';
import { TenantInfo, TenantService } from '@juice-js/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  public static DARK_MODE = "IS_DARK_MODE";
  public static MENU_OPEN = "IS_MENU_OPEN";

  tenantIdentifier: string = "";

  private _tenant: TenantInfo|null = null;
  
  constructor(private options: LayoutConfig, 
    private tenantService: TenantService
    ) {
    tenantService?.getTenantInfo().then(tenantInfo => {
      this.tenantIdentifier = tenantInfo?.identifier ??"";
      this._tenant = tenantInfo;
    });
  }

  public getThemeMode(): ThemeMode {
    let mode = localStorage.getItem(LayoutService.DARK_MODE);
    if(mode){
      return JSON.parse(mode);
    }
    return this.options.defaultThemeMode;
  }
  public toggleDarkMode(){
    var state = this.getThemeMode();
    if(state == ThemeMode.Auto){
      state = ThemeMode.Light;
    }else if(state == ThemeMode.Light){
      state = ThemeMode.Dark;
    }else{
      state = ThemeMode.Auto;
    }
    localStorage.setItem(LayoutService.DARK_MODE, JSON.stringify(state));
  }

  public isMenuOpen(): boolean {
    let isMenuOpen = localStorage.getItem(LayoutService.MENU_OPEN);
    if(isMenuOpen){
      return JSON.parse(isMenuOpen);
    }
    return this.options.defaultMenuOpen;
  }

  public toggleMenu(){
    let state = !this.isMenuOpen();
    localStorage.setItem(LayoutService.MENU_OPEN, JSON.stringify(state));
  }

  public favicon(): string {
    return this._tenant?.favicon ?? this.options.favicon;
  }

  public brandName(): string {
    return this._tenant?.name ?? this.options.brand;
  }

  public brandLogo(): string {
    return this._tenant?.logo ?? this.options.brandLogo;
  }

  public settingUrl(): string | undefined{
    return this.options.settingUrl;
  }

  public userImageUrl(username: string): string{
    return this.options.userImageUrl ? this.options.userImageUrl.replace("{username}", username) : "";
  }
}
