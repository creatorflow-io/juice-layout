# @juice-js/notifications

The signed-in person's side of [Juice.Notifications](https://github.com/creatorflow-io/Juice): a notification bell with the unread count, an
inbox panel kept live over SignalR, and settings pages for notification preferences, quiet hours and email addresses.

## Install

```bash
npm install @juice-js/notifications @microsoft/signalr
```

Peers: Angular 22 (`common`, `core`, `forms`, `router`, `material`), `@ngx-translate/core` 18, `angular-oauth2-oidc` 22 (as
`@juice-js/auth` uses) and `@microsoft/signalr` 10.

## Set up

```ts
// app.module.ts (NgModule apps)
import { LAYOUT_TOOLBAR_ITEMS } from '@juice-js/layout';
import { NotificationBellComponent, NotificationsModule } from '@juice-js/notifications';

@NgModule({
  imports: [
    NotificationsModule.forRoot({ apiUrl: 'https://notifications.example.com' }),
  ],
  providers: [
    // The bell in @juice-js/layout's toolbar.
    { provide: LAYOUT_TOOLBAR_ITEMS, useValue: NotificationBellComponent, multi: true },
  ],
})
export class AppModule {}
```

Standalone apps use `provideNotifications({ apiUrl })` and put `<juice-notification-bell>` (or `<juice-inbox-panel>`) in their own toolbar.

- **The token:** list the API in `AuthModuleConfig.allowedUrls`, so `@juice-js/auth`'s interceptor sends the token with REST calls. The hub
  takes it from `OAuthService` (or `accessToken` in the configuration).
- **The tenant:** the API routes by the tenant's id (a GUID). It is the access token's `platform_tenant` claim unless `tenantId` says
  otherwise; it isn't the app's tenant identifier in its URL.
- **The API** must allow the app's origin: `Cors:Origins` in Juice.Notifications.

## Settings pages

```ts
{
  path: ':tenant/notifications',
  canActivate: [TenantGuard, AuthGuard],
  loadChildren: () => import('@juice-js/notifications').then(m => m.NotificationsRoutingModule),
}
```

`…/notifications/preferences` (a mode per category and channel, and quiet hours) and `…/notifications/contact-points` (add an email address,
receive a code, verify it).

## What it shows

- **Bell:** unread items in every group; it starts the inbox when the person signs in and stops it on sign-out.
- **Panel:** a tab per display group of the tenant with its unread count, a "needs action" filter (items with actions, not archived), items
  newest first; opening one marks it read and follows its link; read, unread and archive per item; mark all read; more on demand.
- **Live:** the hub (`inboxChanged`) updates the counts and the items shown; after a reconnect everything reloads.

Item actions are listed from phase 2 and become buttons when Juice.Notifications acts on them (phase 3).

## Configuration

| Field | Default | |
|---|---|---|
| `apiUrl` | (required) | The API's base URL, no trailing slash |
| `hubUrl` | `${apiUrl}/hubs/inbox` | |
| `tenantId` | the token's `platform_tenant` | A GUID, or a function returning one |
| `accessToken` | `OAuthService.getAccessToken()` | For the hub |
| `pageSize` | 20 | Items per page in the panel (≤ 100) |

## Try it locally

With Juice.Notifications' local stack running (`services/notifications/deploy/local`, then `scripts/keycloak-update.sh` once), run
`ng serve -c notifications` here and sign in as `ann` or `ben` (password `PEOPLE_TEST_PASSWORD` in the stack's `.env`).
