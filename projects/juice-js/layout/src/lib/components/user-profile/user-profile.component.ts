import { Component, Optional, OnInit, inject } from '@angular/core';
import { ProfileDialogService } from './profile-dialog.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../../layout.service';
import { IS_PRODUCTION } from '../../layout.config';
import { UserProfile } from './user-profile.model';
import { filter } from "rxjs/operators";

@Component({
  selector: 'juice-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit{
  imageUrl: string = "";
  isProduction = inject(IS_PRODUCTION);

  constructor(@Optional() private dialogService: ProfileDialogService,
    private layoutService: LayoutService,
    private oauthService: OAuthService) {
    this.oauthService.events.pipe(
      filter(e => e.type === "token_received")
    ).subscribe((e) => {
      if(!this.isProduction) console.debug('Token received', e);
      this.initImageUrl();
    });
  }

  ngOnInit(): void {
    if(this.hasValidToken()){
      this.initImageUrl();
    }else{
      if(!this.isProduction) console.debug('No valid token', this.oauthService.hasValidAccessToken(), this.oauthService.hasValidIdToken());
    }
  }

  initImageUrl() {
    if(this.imageUrl){return;}

    const claims = this.oauthService.getIdentityClaims();
    if(!this.isProduction) console.debug('Trying to get avatar from claims');
    if(claims["picture"]){
      this.imageUrl = claims["picture"];
    }else if(claims["avatar"]){
      this.imageUrl = claims["avatar"];
    }else{
      const username = claims["preferred_username"];
      if(username){
        this.imageUrl = this.layoutService.userImageUrl(username);
      }else{
        if(!this.isProduction) console.debug('Trying to load user profile to get avatar');
        this.oauthService.loadUserProfile().then(info => {
          var userProfile = info as UserProfile;
          if(userProfile){
            this.imageUrl = this.layoutService.userImageUrl(userProfile.info.preferred_username);
          }else{
            console.warn('No user profile found', info);
          }
        });
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
