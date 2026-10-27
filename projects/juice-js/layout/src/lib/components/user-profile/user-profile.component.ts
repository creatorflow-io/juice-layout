import { Component, Optional, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileDialogService } from './profile-dialog.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { LayoutService } from '../../layout.service';
import { IS_PRODUCTION } from '../../layout.config';
import { UserProfile } from './user-profile.model';

/**
 * Toolbar user avatar, or a "Login" button while nobody is signed in.
 *
 * The shell renders before a login completes (and before a stored session is refreshed), so the signed-in state is
 * evaluated in ngOnInit and again on every OAuth event. Async results mark the view for check, so the component
 * also renders in zoneless apps (the Angular 22 default).
 */
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
  authenticated = false;
  isProduction = inject(IS_PRODUCTION);

  @HostBinding('class.anonymous')
  get anonymous(): boolean {
    return !this.authenticated;
  }

  constructor(@Optional() private dialogService: ProfileDialogService,
    private layoutService: LayoutService,
    private oauthService: OAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef) {
    this.oauthService.events.subscribe((e) => {
      if(!this.isProduction && e.type === "token_received") console.debug('Token received', e);
      this.updateState();
    });
  }

  ngOnInit(): void {
    this.updateState();
    if(!this.authenticated && !this.isProduction){
      console.debug('No valid token', this.oauthService.hasValidAccessToken(), this.oauthService.hasValidIdToken());
    }
  }

  /** Starts the code flow; the login-completed page navigates back to the current route. */
  async login() {
    if(!this.oauthService.discoveryDocumentLoaded){
      await this.oauthService.loadDiscoveryDocument();
    }
    this.oauthService.initLoginFlow(this.router.url);
  }

  initImageUrl() {
    if(this.imageUrl){return;}

    const claims = this.oauthService.getIdentityClaims() ?? {};
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
            this.initials = this.initials || this.computeInitials(userProfile.info);
            this.setImageUrl(this.layoutService.userImageUrl(userProfile.info.preferred_username));
            this.cdr.markForCheck();
          }else{
            console.warn('No user profile found', info);
          }
        }).catch(() => {
          // Keep the initials / icon fallback.
        });
      }
    }
  }

  /** Syncs the avatar / login button with the token state. */
  private updateState() {
    const authenticated = this.hasValidToken();
    if(authenticated === this.authenticated){
      return;
    }
    this.authenticated = authenticated;
    if(authenticated){
      // Only on the anonymous -> signed-in transition, so thin claims don't
      // trigger a userinfo request on every OAuth event.
      this.initImageUrl();
    }else{
      this.imageUrl = "";
      this.initials = "";
    }
    this.cdr.markForCheck();
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

  /**
   * Signed in = a usable access token. The id token is not required here: it is short-lived and a refresh-token
   * grant may not renew it, so it can be expired while the session (and its stored claims) is still valid.
   */
  private hasValidToken() {
    return this.oauthService.hasValidAccessToken();
  }
}
