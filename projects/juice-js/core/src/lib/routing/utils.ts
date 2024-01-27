import { ROUTES, Routes } from "@angular/router";
import { ModuleWithProviders, Type, createNgModule } from "@angular/core";

export function loadChildrenRoutes(menusOrModule: ModuleWithProviders<any>): Routes {
  
    const module = createNgModule(menusOrModule.ngModule);
    const injector = module.injector;
    const menus = injector.get(ROUTES, [], {optional: true, self: true}).flat();
    return menus;
}