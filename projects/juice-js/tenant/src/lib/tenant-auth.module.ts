import { NgModule } from '@angular/core';
import { TenantRoutingModule } from './tenant-routing.module';
import { TenantMismatchComponent } from './pages/tenant-mismatch/tenant-mismatch.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [
        TenantMismatchComponent
    ],
    imports: [
        TenantRoutingModule,
        TranslateModule.forChild()
    ],
    exports: []
})
export class TenantAuthModule { }