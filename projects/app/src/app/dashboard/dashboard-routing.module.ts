import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { MenuModule, Menus } from '@juice-js/core';

const routes: Routes = [
    {
        path: 'dashboard',
        component: DashboardComponent
    }
  ];

const menus: Menus = [{
  id: "home",
  label: 'Home',
  icon: 'home',
  routerLink: 'dashboard'
}];

@NgModule({
    imports: [RouterModule.forChild(routes), MenuModule.forChild(menus)],
    exports: [RouterModule, MenuModule]
})
export class DashboardRoutingModule { }