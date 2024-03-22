import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogService } from '../user-profile/profile-dialog.service';
import { UserProfileDialogComponent } from './user-profile-dialog.component';

@Injectable()
export class UserProfileDialogService extends ProfileDialogService {
    constructor(matDialog: MatDialog) {
        super(matDialog);
    }
    async open(data: string): Promise<any> {
        return this.matDialog.open(UserProfileDialogComponent, {position: { top: '50px', right: '10px'}});
    }
}