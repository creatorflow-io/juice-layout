import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Preference, PreferenceMode, QuietHours } from '../../models';
import { NotificationsApi } from '../../notifications-api.service';
import { problemMessage } from '../problem';

/** Days as the API names them, Monday first. */
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * The person's notification preferences (a mode per category and channel; `*` for every one; the most specific wins) and quiet hours, when
 * personal channels wait and the inbox doesn't. A mandatory type reaches the person anyway, in the inbox at least.
 */
@Component({
  selector: 'juice-notification-preferences',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    TranslatePipe],
  templateUrl: './preferences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit {
  private readonly api = inject(NotificationsApi);

  readonly channels = ['*', 'inbox', 'email', 'push', 'sms', 'slack', 'teams'];
  readonly modes: PreferenceMode[] = ['on', 'off', 'digest'];
  readonly days = WEEK_DAYS;

  readonly rows = signal<Preference[]>([]);
  readonly quiet = signal<QuietHours | null>(null);
  readonly quietOn = signal(false);
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.run(async () => {
      const [preferences, me] = await Promise.all([firstValueFrom(this.api.preferences()), firstValueFrom(this.api.profile())]);
      this.rows.set(preferences.map((p) => ({ ...p })));
      this.quietOn.set(!!me.quietHours);
      this.quiet.set(me.quietHours ?? { days: null, start: '22:00', end: '07:00', timeZone: me.timeZone ?? browserZone() });
    });
  }

  add(): void {
    this.rows.update((rows) => [...rows, { category: '*', channel: '*', mode: 'on' }]);
  }

  remove(index: number): void {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
  }

  update(index: number, change: Partial<Preference>): void {
    this.rows.update((rows) => rows.map((row, i) => i === index ? { ...row, ...change } : row));
  }

  async savePreferences(): Promise<void> {
    await this.run(async () => {
      this.rows.set(await firstValueFrom(this.api.savePreferences(this.rows())));
      this.message.set('Preferences saved.');
    });
  }

  quietDay(day: string): boolean {
    return this.quiet()?.days?.includes(day) ?? true;
  }

  setQuiet(change: Partial<QuietHours>): void {
    this.quiet.update((q) => q ? { ...q, ...change } : q);
  }

  toggleDay(day: string, on: boolean): void {
    const current = this.quiet()?.days ?? [...WEEK_DAYS];
    const days = WEEK_DAYS.filter((d) => d === day ? on : current.includes(d));
    // Every day is no list at all.
    this.setQuiet({ days: days.length === WEEK_DAYS.length ? null : days });
  }

  async saveQuietHours(): Promise<void> {
    await this.run(async () => {
      if (this.quietOn() && this.quiet()) {
        this.quiet.set(await firstValueFrom(this.api.saveQuietHours(this.quiet()!)));
      } else {
        await firstValueFrom(this.api.clearQuietHours());
      }
      this.message.set('Quiet hours saved.');
    });
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    this.error.set(null);
    try {
      await work();
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}

function browserZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
