import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ILayoutConfig, IS_PRODUCTION, LayoutConfig } from './layout.config';
import { LayoutService } from './layout.service';
import { DarkModeComponent } from './components/dark-mode/dark-mode.component';
import { PageComponent } from './page/page.component';
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { ExpandableMenuComponent } from './components/expandable-menu/expandable-menu.component';
import { PageNotfoundComponent } from './pages/page-notfound/page-notfound.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { FormsModule } from '@angular/forms';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

const routes: Routes = [ 
  
];

@NgModule({
  declarations: [
    PageComponent,
    DarkModeComponent,
    NavMenuComponent,
    ExpandableMenuComponent,
    PageNotfoundComponent,
    SearchBarComponent,
    UserProfileComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    TranslateModule.forChild(),
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  exports: [
    PageComponent,
    RouterModule
  ]
})
export class LayoutModule { 

  public static forRoot(production: boolean, options: ILayoutConfig): ModuleWithProviders<LayoutModule> {
    let config: LayoutConfig = new LayoutConfig(options);
    return {
      ngModule: LayoutModule,
      providers: [
        LayoutService,
        {
          provide: IS_PRODUCTION,
          useValue: production
        },
        {
          provide: LayoutConfig,
          useValue: config
        }
      ]
    }
  }

}
