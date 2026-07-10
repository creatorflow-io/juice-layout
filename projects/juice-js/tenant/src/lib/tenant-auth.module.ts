import { NgModule } from '@angular/core';
import { TenantRoutingModule } from './tenant-routing.module';
import { TenantMismatchComponent } from './pages/tenant-mismatch/tenant-mismatch.component';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@NgModule({
    declarations: [
        TenantMismatchComponent
    ],
    imports: [
        TenantRoutingModule,
        TranslatePipe,
        TranslateDirective
    ],
    exports: []
})
export class TenantAuthModule { }