import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { LAYOUT_TOOLBAR_ITEMS, LayoutModule, UserProfileDialogModule } from '@juice-js/layout';
import { NotificationBellComponent, NotificationsModule } from '@juice-js/notifications';

import { environment } from '../environments/environment';
import { LocalizeModule, SubmitMissingTranslationHandler } from '@juice-js/localize';
import { MissingTranslationHandler, TranslatePipe, TranslateDirective, provideTranslateService } from '@ngx-translate/core';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';
import { AuthModule } from '@juice-js/auth';
import { TenantAuthModule } from '@juice-js/tenant';
import { TenantModule, IdempotencyModule, IDEMPOTENCY_USER_CONTEXT } from '@juice-js/core';
import { CustomUserProfileDialogModule } from './user-profile/custom-user-profile-dialog.module';
import { MockIdempotencyBackendInterceptor } from './mock-backend/mock-idempotency-backend.interceptor';

const { localize, auth, production, layout, tenants, notificationsApi } = environment;

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    MaterialModule,
    LayoutModule.forRoot(production, layout),
    TenantModule.forRoot(tenants),
    IdempotencyModule,
    AuthModule.forRoot(auth),
    UserProfileDialogModule,
    TenantAuthModule,
    AppRoutingModule, // must be last and comes after other modules
    OAuthModule.forRoot(),
    LocalizeModule.forRoot(localize),
    // The person's notification inbox (Juice.Notifications): the bell in the toolbar when an API is configured.
    NotificationsModule.forRoot({ apiUrl: notificationsApi }),
    TranslatePipe,
    TranslateDirective
  ],
  providers: [
    ...(notificationsApi ? [{ provide: LAYOUT_TOOLBAR_ITEMS, useValue: NotificationBellComponent, multi: true }] : []),
    provideTranslateService({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: SubmitMissingTranslationHandler
      }
    }),
    // Scope idempotency keys to the signed-in user so a key is never reused
    // across a user switch (FR-010). Resolved lazily to avoid a core→auth cycle.
    {
      provide: IDEMPOTENCY_USER_CONTEXT,
      deps: [OAuthService],
      useFactory: (oauth: OAuthService) => () => (oauth.getIdentityClaims() as { sub?: string } | null)?.sub ?? null,
    },
    // DEMO-ONLY mock backend. Registered here (after IdempotencyModule's import
    // above) so it sits INSIDE the idempotency interceptor in the chain: the key
    // is attached first, then the mock replies, then the reply flows back out
    // through the retry/backoff and error-mapping logic.
    { provide: HTTP_INTERCEPTORS, useClass: MockIdempotencyBackendInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
