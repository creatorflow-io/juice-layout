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
  otherwise; it isn't the app's tenant identifier in its URL. An app whose tenant resolver knows the Id can pass it:
  `tenantId: () => tenantService.currentTenant?.id` (`TenantService` in `@juice-js/core`, `TenantInfo.id`).
- **The API** must allow the app's origin: `Cors:Origins` in Juice.Notifications.

## Colours

The panel takes its colours from your app's theme; the library fixes none. Pass your Angular Material (M2) themes, light and dark, where you
include the others:

```scss
@use '@juice-js/notifications' as notifications;

:root { @include notifications.notifications-colors($light-theme); }
.dark { @include notifications.notifications-colors($dark-theme); }   // your dark-mode selector (juice-layout's: .dark)
```

The accent (unread mark, counts, your choice) is from primary, urgent from warn, the rest from the theme's background and foreground. A
theme has no "done" colour, so a closed request's outcome is Material's green unless you pass one: `notifications-colors($theme, (ok: #00897b))`.
Each value is a `--juice-inbox-*` custom property you can also set directly. Without the mixin the panel uses Material 3's system colours
(`--mat-sys-*`) if your app defines them, and neutral ones otherwise.

## Settings pages

```ts
{
  path: ':tenant/notifications',
  canActivate: [TenantGuard, AuthGuard],
  loadChildren: () => import('@juice-js/notifications').then(m => m.NotificationsRoutingModule),
}
```

`…/notifications/preferences` (a mode per category and channel, and quiet hours) and `…/notifications/contact-points` (add an email address,
or a phone number with `phoneNumbers`, receive a code, verify it; link chat accounts with `linkChannels`).

`…/notifications/templates` is for the tenant's admins: pick a type and a channel, edit its text (Scriban), preview it with sample data, save
it as the tenant's own or go back to the application's.

## Web Push

Copy the service worker to the app's root (`angular.json`, the build's `assets`):

```json
{ "glob": "juice-push-sw.js", "input": "node_modules/@juice-js/notifications/assets", "output": "/" }
```

Then, once the person is signed in and has asked for notifications (a button; browsers refuse a prompt nobody asked for):

```ts
const device = await enableWebPush(api, { vapidPublicKey: environment.vapidPublicKey });
// on sign-out
await disableWebPush(api, device.id);
```

`vapidPublicKey` is the tenant's `webpush` integration's public key. Types with a `push` template then reach this browser; clicking the
notification opens its link.

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
| `linkChannels` | none | Chat accounts people may link: `['slack', 'telegram']` |
| `telegramBot` | | The Telegram bot's username, for the link that opens it with the code |
| `phoneNumbers` | false | People may add phone numbers for SMS |

## Try it locally

With Juice.Notifications' local stack running (`services/notifications/deploy/local`, then `scripts/keycloak-update.sh` once), run
`ng serve -c notifications` here and sign in as `ann` or `ben` (password `PEOPLE_TEST_PASSWORD` in the stack's `.env`).
