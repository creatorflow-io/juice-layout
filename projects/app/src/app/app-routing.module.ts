import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageComponent, PageNotfoundComponent } from '@juice-js/layout';
import { TenantGuard } from '@juice-js/tenant';
import { MenuModule, Menus } from '@juice-js/core';
import { AuthGuard } from '@juice-js/auth';

const routes: Routes = [ 
  { path:':tenant', redirectTo: ':tenant/dashboard', pathMatch: 'full' },
  {
    path:':tenant',
    component: PageComponent,
    data:{
      menuDisplay: true,
      menuIcon: 'home',
      menuTitle: 'Home',
      menuOrder: 1,
      settingUrl: ':tenant/settings'
    },
    children:[
      {
        path:'',
        data:{menuDisplay: true},
        canActivate: [TenantGuard],
        loadChildren: () => import('./dashboard/dashboard.module').then(m =>{
          return m.DashboardModule;
        })
      },
      {
        path:'',
        canActivate: [TenantGuard, AuthGuard],
        data:{menuDisplay: true},
        loadChildren: () => import('./dashboard1/dashboard1.module').then(m =>{
          return m.Dashboard1Module;
        })
      }
    ]
  },
  {
    path:'',
    component: PageComponent,
    data:{
      menuDisplay: true,
      menuIcon: 'security',
      menuTitle: 'Security',
      menuOrder: 9
    },
    children:[
      {
        path:':tenant/auth',
        data:{
          menuDisplay: true
        },
        canActivate: [TenantGuard],
        loadChildren: () => import('@juice-js/auth').then(m =>{
          return m.AuthRoutingModule;
        })
      }
    ]
  },
  {
    path:':tenant',
    component: PageComponent,
    children:[
      {
        path:'**',
        component: PageNotfoundComponent
      }
    ]
  }
 ];

const menus: Menus = [
  // {
  //   id: "home",
  //   label: 'Home',
  //   icon: 'home',
  //   routerLink: ':tenant',
  //   children: [
  //     {
  //       id: "home1",
  //       label: 'Home1',
  //       icon: 'home',
  //       routerLink: 'dashboard1'
  //     },
  //     {
  //       id: "home2",
  //       label: 'Home2',
  //       icon: 'home',
  //       routerLink: '',
  //       loadChildren: () => import('./dashboard/dashboard.module').then(m =>{
  //         return m.DashboardModule;
  //       })
  //     }
  //   ]
  // },
  // {
  //   id: "auth",
  //   label: 'Security',
  //   icon: 'security',
  //   routerLink: ':tenant/auth',
  //   loadChildren: () => import('@juice-js/auth').then(m =>{
  //     return m.AuthRoutingModule;
  //   })
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), MenuModule.forRoot(menus)],
  exports: [RouterModule, MenuModule]
})
export class AppRoutingModule { }
