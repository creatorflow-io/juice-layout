import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CultureComponent } from './culture.component';
import { LocalizeConfig, ILocalizeConfig } from './localize.config';
import { LocalizeService } from './localize.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@NgModule({ declarations: [
        CultureComponent,
    ],
    exports: [
        CultureComponent
    ], imports: [MatSelectModule,
        MatOptionModule,
        CommonModule,
        FormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
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
