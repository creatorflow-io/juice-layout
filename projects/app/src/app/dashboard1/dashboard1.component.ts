import { Component } from '@angular/core';
import { TenantService } from '@juice-js/core';
import { SearchService } from '@juice-js/layout';

@Component({
  selector: 'app-dashboard1',
  templateUrl: './dashboard1.component.html',
  styleUrls: ['./dashboard1.component.scss']
})
export class Dashboard1Component {
  tenantIdentifier: string = "";
  constructor(private tenant: TenantService, private searchService: SearchService) {
    tenant.getTenantIdentifier().then(tenant => {
      console.log(tenant);
      this.tenantIdentifier = tenant??"";
    }); 
    searchService.enable((text: string, event: Event)=>{
      console.log(text, event);
    });
  }

}
