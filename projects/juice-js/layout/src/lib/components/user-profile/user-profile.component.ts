import { Component, Optional } from '@angular/core';
import { ProfileDialogService } from './profile-dialog.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../../layout.service';

@Component({
  selector: 'juice-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  imageUrl: string = "";

  constructor(@Optional() private dialogService: ProfileDialogService,
    private layoutService: LayoutService,
    private oauthService: OAuthService) {
    if(this.hasValidToken()){
      const claims = this.oauthService.getIdentityClaims();
      if(claims["picture"]){
        this.imageUrl = claims["picture"];
      }else if(claims["avatar"]){
        this.imageUrl = claims["avatar"];
      }else{
        const username = claims["preferred_username"];
        if(username){
          this.imageUrl = layoutService.userImageUrl(username);
        }
      }
    }
  }

  onClick(){
    if(this.dialogService){
      this.dialogService.open(this.imageUrl);
    }
  }
  
  private hasValidToken() {
    return this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken();
  }
}
