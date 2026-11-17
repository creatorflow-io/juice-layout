import { ModuleWithProviders, NgModule } from '@angular/core';
import { InboxPanelComponent } from './components/inbox-panel/inbox-panel.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { NOTIFICATIONS_CONFIG, NotificationsConfig } from './notifications.config';

/**
 * For NgModule apps: `NotificationsModule.forRoot({ apiUrl })` once, then `<juice-notification-bell>` in the toolbar. Standalone apps use
 * `provideNotifications` and import the components directly.
 */
@NgModule({
  imports: [NotificationBellComponent, InboxPanelComponent],
  exports: [NotificationBellComponent, InboxPanelComponent],
})
export class NotificationsModule {
  static forRoot(config: NotificationsConfig): ModuleWithProviders<NotificationsModule> {
    return { ngModule: NotificationsModule, providers: [{ provide: NOTIFICATIONS_CONFIG, useValue: config }] };
  }
}
