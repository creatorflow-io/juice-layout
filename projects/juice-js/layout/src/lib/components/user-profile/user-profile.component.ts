import { Component, Optional, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ProfileDialogService } from './profile-dialog.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../../layout.service';
import { IS_PRODUCTION } from '../../layout.config';
import { UserProfile } from './user-profile.model';
import { filter } from "rxjs/operators";

@Component({
    selector: 'juice-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserProfileComponent implements OnInit{
  imageUrl: string = "";
  imageFailed = false;
  initials: string = "";
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
    this.initials = this.computeInitials(claims);
    if(!this.isProduction) console.debug('Trying to get avatar from claims');
    if(claims["picture"]){
      this.setImageUrl(claims["picture"]);
    }else if(claims["avatar"]){
      this.setImageUrl(claims["avatar"]);
    }else{
      const username = claims["preferred_username"];
      if(username){
        this.setImageUrl(this.layoutService.userImageUrl(username));
      }else{
        if(!this.isProduction) console.debug('Trying to load user profile to get avatar');
        this.oauthService.loadUserProfile().then(info => {
          var userProfile = info as UserProfile;
          if(userProfile){
            this.setImageUrl(this.layoutService.userImageUrl(userProfile.info.preferred_username));
          }else{
            console.warn('No user profile found', info);
          }
        });
      }
    }
  }

  private setImageUrl(url: string) {
    this.imageUrl = url ?? "";
    this.imageFailed = false;
  }

  private computeInitials(claims: Record<string, any>): string {
    if(!claims){ return ""; }
    const name = claims["name"]
      || [claims["given_name"], claims["family_name"]].filter(Boolean).join(" ")
      || claims["preferred_username"]
      || "";
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    if(words.length === 0){ return ""; }
    const chars = words.length === 1
      ? words[0].slice(0, 2)
      : words[0][0] + words[words.length - 1][0];
    return chars.toUpperCase();
  }

  onImageError() {
    if(!this.isProduction) console.debug('Avatar image failed to load', this.imageUrl);
    this.imageFailed = true;
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
