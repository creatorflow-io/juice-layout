import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard1Component } from './dashboard1.component';
import { MenuModule, Menus } from '@juice-js/core';

const routes: Routes = [
    {
        path: 'dashboard1',
        component: Dashboard1Component,
        title: 'Dashboard1',
        data: {
          // menuDisplay: true,
          // menuIcon: 'home',
          // menuOrder: 1
          searchUrl: 'dashboard1/search'
        }
    }
  ];

const menus: Menus = [{
  id: "home1",
  label: 'Home1',
  icon: 'home',
  routerLink: 'dashboard1'
}];

@NgModule({
    imports: [RouterModule.forChild(routes), MenuModule.forChild(menus)],
    exports: [RouterModule, MenuModule]
})
export class Dashboard1RoutingModule { }