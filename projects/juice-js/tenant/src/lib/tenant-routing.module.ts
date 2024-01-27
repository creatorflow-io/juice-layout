import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantMismatchComponent } from './pages/tenant-mismatch/tenant-mismatch.component';
import { PageComponent } from '@juice-js/layout';

const routes: Routes = [
  {
    path: 'tenant-mismatch',
    component: PageComponent, 
    children:[
      {path: '', component: TenantMismatchComponent}
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TenantRoutingModule{
 
}