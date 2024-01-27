import { ModuleWithProviders, NgModule } from '@angular/core';
import { MenuService } from './menu.service';
import { MENUS, Menus } from './menu-item';

@NgModule({
    declarations: [

    ],
    imports: [
        
    ],
    exports: [

    ]
})
export class MenuModule {

    /**
   * Creates and configures a module with all the menu providers.
   * Optionally sets up an application listener to perform an initial navigation.
   *
   * When registering the NgModule at the root, import as follows:
   *
   * ```
   * @NgModule({
   *   imports: [MenuModule.forRoot(MENUS)]
   * })
   * class MyNgModule {}
   * ```
   *
   * @param menus An array of `Route` objects that define the navigation paths for the application.
   * @return The new `NgModule`.
   *
   */
    public static forRoot(menus: Menus): ModuleWithProviders<MenuModule> {
        
        return {
            ngModule: MenuModule,
            providers: [
                MenuService,
                {
                    provide: MENUS,
                    multi: true,
                    useValue: menus
                }
            ]
        };
    }

    /**
   * Creates a module with all the menus, without creating a new Router service.
   * When registering for submodules and lazy-loaded submodules, create the NgModule as follows:
   *
   * ```
   * @NgModule({
   *   imports: [MenuModule.forChild(MENUS)]
   * })
   * class MyNgModule {}
   * ```
   *
   * @param menus An array of `MenuItem` objects that define the navigation paths for the submodule.
   * @return The new NgModule.
   *
   */
    public static forChild(menus: Menus): ModuleWithProviders<MenuModule> {
        return {
        ngModule: MenuModule,
        providers: [{provide: MENUS, multi: true, useValue: menus}],
        }
    }
    
}