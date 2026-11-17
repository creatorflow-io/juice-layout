import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { InboxService } from '../../inbox.service';
import { InboxPanelComponent } from '../inbox-panel/inbox-panel.component';

/**
 * The bell for a toolbar: the person's unread count as its badge, and the inbox panel when clicked. It starts the inbox once the person is
 * signed in (and again after a new sign-in), and stops it on sign-out.
 */
@Component({
  selector: 'juice-notification-bell',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe, InboxPanelComponent],
  template: `
    <button mat-icon-button type="button" [matMenuTriggerFor]="panel" (menuOpened)="inbox.start()"
      [attr.aria-label]="'Notifications' | translate" [title]="'Notifications' | translate">
      <mat-icon [matBadge]="badge()" [matBadgeHidden]="!inbox.unread()" matBadgeSize="small" matBadgeColor="warn"
        [attr.aria-hidden]="true">{{ inbox.unread() ? 'notifications_active' : 'notifications' }}</mat-icon>
    </button>
    <mat-menu #panel="matMenu" class="juice-inbox-menu" xPosition="before">
      <juice-inbox-panel [followLinks]="followLinks()"></juice-inbox-panel>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit {
  readonly inbox = inject(InboxService);
  private readonly oauth = inject(OAuthService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Whether opening an item follows its link. */
  readonly followLinks = input(true);

  badge(): string {
    const unread = this.inbox.unread();
    return unread > 99 ? '99+' : String(unread);
  }

  ngOnInit(): void {
    this.inbox.start();
    this.oauth?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.type === 'token_received') {
        this.inbox.start();
      } else if (event.type === 'logout' || event.type === 'session_terminated') {
        this.inbox.stop();
      }
    });
  }
}
