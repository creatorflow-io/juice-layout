import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

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
      this.name = claims['name'];
      this.username = claims['preferred_username'];
      this.email = claims['email']??'';
      this.loggedin = true;
    }
  }

  logout(){
    this.auth.logOut();
  }
}
