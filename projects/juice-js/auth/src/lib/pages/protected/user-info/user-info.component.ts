import { HttpClient } from '@angular/common/http';
import {Component, OnInit} from '@angular/core';
import {OAuthService} from "angular-oauth2-oidc";

@Component({
  selector: 'page-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {

  userInfo = '';
  accessToken = '';
  idToken = '';

  constructor(private oauthService: OAuthService, private http: HttpClient) {
  }

  async ngOnInit() {
    this.accessToken = this.oauthService.getAccessToken();
    this.idToken = this.oauthService.getIdToken();

    console.log(this.oauthService.getIdentityClaims());

    await this.oauthService.loadDiscoveryDocument();

    this.oauthService.loadUserProfile().then(info => {
      this.userInfo = JSON.stringify(info, null, 2);
    });

  }
}
