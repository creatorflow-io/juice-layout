import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { InboxService } from '../../inbox.service';
import { InboxItem, canAct, chosenAction } from '../../models';

/**
 * The person's inbox: a tab per display group with its unread count, an "actionable and open" filter, the items newest first (unread ones
 * marked), and per item read and archive. Opening an item reads it and follows its link (`links.self`) unless {@link opened} is handled
 * (`followLinks` false).
 */
@Component({
  selector: 'juice-inbox-panel',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, MatSlideToggleModule, MatTooltipModule, TranslatePipe],
  templateUrl: './inbox-panel.component.html',
  styleUrl: './inbox-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxPanelComponent {
  readonly inbox = inject(InboxService);

  /** Whether opening an item follows its link; when false, handle {@link opened}. */
  readonly followLinks = input(true);
  /** An item was opened (after it was marked read). */
  readonly opened = output<InboxItem>();

  open(item: InboxItem): void {
    void this.inbox.markRead(item);
    this.opened.emit(item);
    if (this.followLinks() && item.url && /^https?:\/\//i.test(item.url)) {
      window.location.assign(item.url);
    }
  }

  toggleRead(item: InboxItem, event: Event): void {
    event.stopPropagation();
    void this.inbox.markRead(item, !item.readAt);
  }

  archive(item: InboxItem, event: Event): void {
    event.stopPropagation();
    void this.inbox.archive(item);
  }

  act(item: InboxItem, actionId: string, event: Event): void {
    event.stopPropagation();
    void this.inbox.act(item, actionId);
  }

  /** How long ago, short ("5 min. ago", "yesterday"), in the page's language; the exact time is the element's title. */
  ago(at: string, now = Date.now()): string {
    const seconds = Math.round((new Date(at).getTime() - now) / 1000);
    if (Number.isNaN(seconds)) {
      return '';
    }
    if (seconds > -60) {
      return this.relative.format(0, 'second');
    }
    for (const [unit, size] of InboxPanelComponent.units) {
      if (-seconds >= size) {
        return this.relative.format(Math.round(seconds / size), unit);
      }
    }
    return '';
  }

  private static readonly units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 86400], ['month', 30 * 86400], ['week', 7 * 86400], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  private readonly relative = new Intl.RelativeTimeFormat(document.documentElement.lang || navigator.language || undefined,
    { numeric: 'auto', style: 'short' });

  readonly canAct = canAct;
  readonly chosen = chosenAction;
}
