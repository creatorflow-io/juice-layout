import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";
import {delay, filter} from "rxjs/operators";

@Component({
    selector: 'page-login-completed',
    templateUrl: './login-completed.component.html',
    styleUrls: ['./login-completed.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
        redirectUrl = appRelativeUrl(decodeURIComponent(decodeURIComponent(this.oauthService.state)));
      }

      this.router.navigateByUrl(redirectUrl);
    });

    await this.oauthService.loadDiscoveryDocumentAndTryLogin({disableNonceCheck: true});
  }

}

/**
 * The return URL when it is a path of this application (`/…`), otherwise `''` (the app root). The OAuth `state`
 * round-trips through the browser, so an absolute or protocol-relative URL (`https://…`, `//…`, `/\…`) is not
 * followed.
 */
export function appRelativeUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') ? url : '';
}
