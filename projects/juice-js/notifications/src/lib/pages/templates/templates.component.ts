import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { TemplatePreview, TenantTemplate, TenantType } from '../../models';
import { NotificationsApi } from '../../notifications-api.service';
import { problemMessage } from '../problem';

/**
 * The tenant's own templates (Juice.Notifications D22): pick a type and a channel, edit the text (Scriban), preview it with the type's sample
 * data or your own, save it over the application's template, or remove it to use the application's again. For the tenant's admins.
 */
@Component({
  selector: 'juice-notification-templates',
  standalone: true,
  imports: [JsonPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, TranslatePipe],
  templateUrl: './templates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesComponent implements OnInit {
  private readonly api = inject(NotificationsApi);

  readonly types = signal<TenantType[]>([]);
  readonly type = signal<string | null>(null);
  readonly channel = signal<string | null>(null);
  readonly template = signal<TenantTemplate | null>(null);
  readonly body = signal('');
  readonly data = signal('');
  readonly preview = signal<TemplatePreview | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  /** The chosen type's channels with a template (the application's or the tenant's). */
  readonly channels = computed(() => this.types().find((t) => t.key === this.type())?.channels.filter((c) => c.declared || c.overridden) ?? []);

  async ngOnInit(): Promise<void> {
    await this.run(async () => this.types.set(await firstValueFrom(this.api.tenantTypes())));
  }

  async pickType(key: string): Promise<void> {
    this.type.set(key);
    const first = this.channels()[0]?.channel ?? null;
    await this.pickChannel(first);
  }

  async pickChannel(channel: string | null): Promise<void> {
    this.channel.set(channel);
    this.template.set(null);
    this.preview.set(null);
    this.data.set('');
    this.saved.set(false);
    const type = this.type();
    if (!type || !channel) {
      return;
    }
    await this.run(async () => {
      const template = await firstValueFrom(this.api.template(type, channel));
      this.template.set(template);
      this.body.set(template.tenant ?? template.application ?? '');
      await this.render();
    });
  }

  async previewNow(): Promise<void> {
    await this.run(() => this.render());
  }

  /** Saves the text as the tenant's template (refused with the reason when it doesn't parse, as a producer's would be). */
  async save(): Promise<void> {
    const type = this.type();
    const channel = this.channel();
    if (!type || !channel || !this.body().trim()) {
      return;
    }
    await this.run(async () => {
      this.template.set(await firstValueFrom(this.api.saveTemplate(type, channel, this.body())));
      this.saved.set(true);
      this.types.update((all) => all.map((t) => t.key !== type ? t
        : { ...t, channels: t.channels.map((c) => (c.channel === channel ? { ...c, overridden: true } : c)) }));
    });
  }

  /** Removes the tenant's template: the application's is used again. */
  async remove(): Promise<void> {
    const type = this.type();
    const channel = this.channel();
    if (!type || !channel || !this.template()?.tenant) {
      return;
    }
    await this.run(async () => {
      await firstValueFrom(this.api.removeTemplate(type, channel));
      this.types.update((all) => all.map((t) => t.key !== type ? t
        : { ...t, channels: t.channels.map((c) => (c.channel === channel ? { ...c, overridden: false } : c)) }));
    });
    await this.pickChannel(channel);
  }

  private async render(): Promise<void> {
    const type = this.type();
    const channel = this.channel();
    if (!type || !channel) {
      return;
    }
    let data: unknown = null;
    if (this.data().trim()) {
      try {
        data = JSON.parse(this.data());
      } catch {
        this.error.set('The data is not JSON.');
        return;
      }
    }
    const preview = await firstValueFrom(this.api.previewTemplate(type, channel, this.body(), data));
    this.preview.set(preview);
    if (!this.data().trim()) {
      this.data.set(JSON.stringify(preview.data, null, 2));
    }
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
