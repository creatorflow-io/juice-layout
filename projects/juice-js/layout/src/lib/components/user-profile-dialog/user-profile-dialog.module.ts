import { NgModule } from '@angular/core';
import { UserProfileDialogComponent } from './user-profile-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProfileDialogService } from '../user-profile/profile-dialog.service';
import { UserProfileDialogService } from './user-profile-dialog.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    UserProfileDialogComponent
  ],
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslateModule.forChild(),
    CommonModule
  ],
  exports: [
  ],
  providers: [
    {
      provide: ProfileDialogService,
      useClass: UserProfileDialogService
    }
  ]
})
export class UserProfileDialogModule {
}
