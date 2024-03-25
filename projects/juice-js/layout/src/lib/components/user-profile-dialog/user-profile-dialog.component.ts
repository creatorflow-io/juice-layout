import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserProfile } from '../user-profile/user-profile.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile-dialog.component.html',
  styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent {
  username = '';
  name = '';
  email = '';
  loggedin = false;
  constructor(private auth: OAuthService) { 
    if(this.auth.hasValidIdToken()){
      const claims = this.auth.getIdentityClaims();
      if(claims['preferred_username']){
        this.setValues(claims);
      }else{
        this.auth.loadUserProfile().then(info => {
          var userProfile = info as UserProfile;
          if(userProfile){
            this.setValues(userProfile.info);
          }else{
            console.debug('No user profile', info);
          }
        });
      }
    }
  }

  setValues(claims: any){
    this.username = claims['preferred_username'];
    this.name = claims['name'];
    this.email = claims['email']??'';
    this.loggedin = true;
  }

  logout(){
    this.auth.loadDiscoveryDocument().then(() => {
      this.auth.logOut();
    });
  }
}
