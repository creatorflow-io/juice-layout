import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CultureComponent } from './culture.component';
import { LocalizeConfig, ILocalizeConfig } from './localize.config';
import { LocalizeService } from './localize.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    CultureComponent,
  ],
  imports: [
    HttpClientModule,
    MatSelectModule,
    MatOptionModule,
    CommonModule,
    FormsModule
  ],
  exports: [
    CultureComponent
  ]
})
export class LocalizeModule {
  public static forRoot(config: ILocalizeConfig): ModuleWithProviders<LocalizeModule> {

    return {
        ngModule: LocalizeModule,
        providers: [
            LocalizeService,
            {
                provide: LocalizeConfig,
                useValue: config
            }
        ]
    };
  }
 }
