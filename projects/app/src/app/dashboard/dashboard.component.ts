import { Component } from '@angular/core';
import { TenantService } from '@juice-js/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  tenantIdentifier: string = "";
  constructor(private tenant: TenantService) { 
    this.tenant.getTenantIdentifier().then(tenant => {
      console.log(tenant);
      this.tenantIdentifier = tenant??"";
    });
  }
}
