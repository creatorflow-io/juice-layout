import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ContactPoint } from '../../models';
import { NotificationsApi } from '../../notifications-api.service';
import { problemMessage } from '../problem';

/**
 * The person's email addresses: add one, have a code sent to it and enter the code, or remove one. Only a verified address that hasn't failed
 * is ever used; one your organization's directory vouches for arrives verified.
 */
@Component({
  selector: 'juice-contact-points',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  templateUrl: './contact-points.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPointsComponent implements OnInit {
  private readonly api = inject(NotificationsApi);

  readonly points = signal<ContactPoint[]>([]);
  readonly address = signal('');
  /** Codes being typed, by contact point. */
  readonly codes = signal<Record<string, string>>({});
  /** Contact points a code was sent to, with when it expires. */
  readonly sent = signal<Record<string, string>>({});
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.run(() => this.load());
  }

  async add(): Promise<void> {
    const address = this.address().trim();
    if (!address) {
      return;
    }
    await this.run(async () => {
      const point = await firstValueFrom(this.api.addContactPoint('email', address));
      this.address.set('');
      await this.load();
      await this.sendCode(point, false);
    });
  }

  async sendCode(point: ContactPoint, alone = true): Promise<void> {
    const send = async () => {
      const sent = await firstValueFrom(this.api.sendCode(point.id));
      this.sent.update((s) => ({ ...s, [point.id]: sent.expiresAt }));
    };
    await (alone ? this.run(send) : send());
  }

  setCode(id: string, code: string): void {
    this.codes.update((c) => ({ ...c, [id]: code }));
  }

  async verify(point: ContactPoint): Promise<void> {
    const code = (this.codes()[point.id] ?? '').trim();
    if (!code) {
      return;
    }
    await this.run(async () => {
      await firstValueFrom(this.api.verify(point.id, code));
      this.sent.update(({ [point.id]: _, ...rest }) => rest);
      this.codes.update(({ [point.id]: _, ...rest }) => rest);
      await this.load();
    });
  }

  async remove(point: ContactPoint): Promise<void> {
    await this.run(async () => {
      await firstValueFrom(this.api.removeContactPoint(point.id));
      await this.load();
    });
  }

  private async load(): Promise<void> {
    this.points.set(await firstValueFrom(this.api.contactPoints()));
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.busy.set(true);
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
