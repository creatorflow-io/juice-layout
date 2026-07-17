import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TenantService } from '@juice-js/core';
import { SearchablePage } from '@juice-js/layout';

@Component({
    selector: 'app-dashboard1',
    templateUrl: './dashboard1.component.html',
    styleUrls: ['./dashboard1.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class Dashboard1Component implements SearchablePage {
  tenantIdentifier: string = "";
  constructor(private tenant: TenantService) {
    tenant.getTenantIdentifier().then(tenant => {
      console.log(tenant);
      this.tenantIdentifier = tenant??"";
    });
  }

  /** Implementing this is what puts the search box in the toolbar on this page. */
  onSearch(query: string, event?: Event): void {
    console.log(query, event);
  }

}
