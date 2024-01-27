import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogService } from '@juice-js/layout';
import { UserProfileComponent } from './user-profile.component';

@Injectable()
export class UserProfileDialogService extends ProfileDialogService {
    constructor(matDialog: MatDialog) {
        super(matDialog);
    }
    async open(data: string): Promise<any> {
        return this.matDialog.open(UserProfileComponent, {position: { top: '50px', right: '10px'}});
    }
}