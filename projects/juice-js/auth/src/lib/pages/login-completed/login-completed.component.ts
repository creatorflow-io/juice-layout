import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";
import {delay, filter} from "rxjs/operators";

@Component({
  selector: 'page-login-completed',
  templateUrl: './login-completed.component.html',
  styleUrls: ['./login-completed.component.css']
})
export class LoginCompletedComponent implements OnInit {

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private oauthService: OAuthService) {
  }

  async ngOnInit() {
    this.oauthService.events.pipe(
      filter(e => e.type === "token_received"),
      delay(2000)
    ).subscribe((e) => {
      // `this.oauthService.state` contains the redirect url after login, if any

      let redirectUrl = '';
      if (this.oauthService.state) {
        // TODO: should validate the return url. Also, check if the return URL belongs Wto the current application.
        redirectUrl = decodeURIComponent(decodeURIComponent(this.oauthService.state));
        console.log(redirectUrl);
      }

      this.router.navigateByUrl(redirectUrl);
    });

    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

}
