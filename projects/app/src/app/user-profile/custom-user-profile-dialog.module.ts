import { NgModule } from '@angular/core';
import { UserProfileComponent } from './user-profile.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProfileDialogService } from '@juice-js/layout';
import { CustomUserProfileDialogService } from './user-profile-dialog.service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    UserProfileComponent
  ],
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslatePipe,
    TranslateDirective,
    CommonModule
  ],
  exports: [
  ],
  providers: [
    {
      provide: ProfileDialogService,
      useClass: CustomUserProfileDialogService
    }
  ]
})
export class CustomUserProfileDialogModule {
}
