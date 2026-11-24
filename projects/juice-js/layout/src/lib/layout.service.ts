import { Injectable, Optional, signal } from '@angular/core';
import { LAYOUT_PALETTES, LayoutConfig, LayoutPalette, ThemeMode } from './layout.config';
import { TenantInfo, TenantService } from '@juice-js/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  public static DARK_MODE = "IS_DARK_MODE";
  public static MENU_OPEN = "IS_MENU_OPEN";
  public static PALETTE = "JUICE_PALETTE";

  // Signals, not plain fields: the tenant arrives after the shell has rendered, and templates reading
  // brandName()/brandLogo()/tenantIdentifier must re-render then, also in zoneless apps.
  private readonly _tenantIdentifier = signal("");
  private readonly _tenant = signal<TenantInfo|null>(null);
  private _options: LayoutConfig;
  private readonly _palette = signal<string | null>(null);

  /** The palette in use: the viewer's choice, else LayoutConfig.defaultPalette; null means the stylesheet's default. */
  readonly palette = this._palette.asReadonly();

  get tenantIdentifier(): string {
    return this._tenantIdentifier();
  }
  set tenantIdentifier(value: string) {
    this._tenantIdentifier.set(value);
  }

  constructor(@Optional() options: LayoutConfig,
    tenantService: TenantService
    ) {
    tenantService?.getTenantInfo().then(tenantInfo => {
      this._tenantIdentifier.set(tenantInfo?.identifier ??"");
      this._tenant.set(tenantInfo);
    });
    this._options = options ?? new LayoutConfig();
    this.applyPalette(this.storedPalette() ?? this._options.defaultPalette ?? null);
  }

  /** The palettes the viewer can pick from (LayoutConfig.palettes). */
  public palettes(): LayoutPalette[] {
    // A config given as a plain object (not new LayoutConfig()) may have none.
    return this._options.palettes ?? [...LAYOUT_PALETTES];
  }

  /**
   * Switches every page to a palette and remembers it in this browser: it sets `data-juice-palette` on `<html>`, which
   * `layout.theme()` and the Juice pages' tokens follow. Null goes back to the app's default.
   */
  public setPalette(id: string | null) {
    try {
      if (id) localStorage.setItem(LayoutService.PALETTE, id);
      else localStorage.removeItem(LayoutService.PALETTE);
    } catch {
      // Storage blocked: the choice lasts until the page reloads.
    }
    this.applyPalette(id ?? this._options.defaultPalette ?? null);
  }

  private storedPalette(): string | null {
    try {
      const id = localStorage.getItem(LayoutService.PALETTE);
      return id && this.palettes().some(p => p.id === id) ? id : null;
    } catch {
      return null;
    }
  }

  private applyPalette(id: string | null) {
    this._palette.set(id);
    if (typeof document === "undefined") return;
    if (id) document.documentElement.setAttribute("data-juice-palette", id);
    else document.documentElement.removeAttribute("data-juice-palette");
  }

  public getThemeMode(): ThemeMode {
    let mode = localStorage.getItem(LayoutService.DARK_MODE);
    if(mode){
      return JSON.parse(mode);
    }
    return this._options.defaultThemeMode;
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
    return this._options.defaultMenuOpen;
  }

  public toggleMenu(){
    let state = !this.isMenuOpen();
    localStorage.setItem(LayoutService.MENU_OPEN, JSON.stringify(state));
  }

  public favicon(): string {
    return this._tenant()?.favicon ?? this._options.favicon;
  }

  public brandName(): string {
    return this._tenant()?.name ?? this._options.brand;
  }

  public brandLogo(): string {
    return this._tenant()?.logo ?? this._options.brandLogo;
  }

  public settingUrl(): string | undefined{
    return this._options.settingUrl;
  }

  public userImageUrl(username: string): string{
    return this._options.userImageUrl ? this._options.userImageUrl.replace("{username}", username) : "";
  }
}
