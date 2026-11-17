import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { InboxHubConnector, InboxHubHandle } from './inbox-hub';
import { InboxChange, InboxCounts, InboxItem, InboxQuery } from './models';
import { NotificationsApi } from './notifications-api.service';
import { NOTIFICATIONS_CONFIG } from './notifications.config';

/**
 * The person's inbox as signals, kept current by the hub: the counts (the bell's badge, the panel's tabs), and the items of the group and filter
 * shown. Call {@link start} once signed in (the bell does); {@link stop} on sign-out.
 */
@Injectable({ providedIn: 'root' })
export class InboxService implements OnDestroy {
  private readonly api = inject(NotificationsApi);
  private readonly hub = inject(InboxHubConnector);
  private readonly pageSize = Math.min(Math.max(inject(NOTIFICATIONS_CONFIG).pageSize ?? 20, 1), 100);

  private readonly _counts = signal<InboxCounts | null>(null);
  private readonly _items = signal<InboxItem[]>([]);
  private readonly _group = signal<string | null>(null);
  private readonly _actionable = signal(false);
  private readonly _loading = signal(false);
  private readonly _more = signal(false);
  private readonly _error = signal<unknown>(null);

  readonly counts = this._counts.asReadonly();
  /** Unread in every group: the bell's badge. */
  readonly unread = computed(() => this._counts()?.unread ?? 0);
  readonly actionableOpen = computed(() => this._counts()?.actionableOpen ?? 0);
  readonly items = this._items.asReadonly();
  /** The group shown (a key), or null for every group. */
  readonly group = this._group.asReadonly();
  /** Only actionable and open items. */
  readonly actionableOnly = this._actionable.asReadonly();
  readonly loading = this._loading.asReadonly();
  /** Whether there may be more items past the last one shown. */
  readonly hasMore = this._more.asReadonly();
  /** The last load's error, until the next one succeeds. */
  readonly error = this._error.asReadonly();

  private connection: InboxHubHandle | null = null;
  private listing: Subscription | null = null;
  private started = false;

  /** Loads the counts and the first page, and opens the hub. Again after {@link stop}; once otherwise. */
  start(): void {
    if (this.started) {
      return;
    }
    const tenant = this.api.tenantId();
    if (!tenant) {
      return; // not signed in yet: the bell asks again when it is
    }
    this.started = true;
    this.reload();
    this.connection = this.hub.connect(this.api.hubUrl, tenant, () => this.api.accessToken(), {
      changed: (change) => this.onChange(change),
      reconnected: () => this.reload(),
    });
  }

  stop(): void {
    this.started = false;
    this.listing?.unsubscribe();
    void this.connection?.stop();
    this.connection = null;
    this._counts.set(null);
    this._items.set([]);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /** Shows one group (a key) or every group (null). */
  showGroup(group: string | null): void {
    if (group !== this._group()) {
      this._group.set(group);
      this.loadItems();
    }
  }

  showActionableOnly(only: boolean): void {
    if (only !== this._actionable()) {
      this._actionable.set(only);
      this.loadItems();
    }
  }

  /** The page after the last item shown. */
  loadMore(): void {
    const last = this._items().at(-1);
    if (last && this._more() && !this._loading()) {
      this.loadItems(last.id);
    }
  }

  /** Counts and the first page again. */
  reload(): void {
    this.loadCounts();
    this.loadItems();
  }

  /** Marks an item read (or unread), here at once and then as the API answers. */
  async markRead(item: InboxItem, read = true): Promise<void> {
    if (!!item.readAt === read) {
      return;
    }
    this.replace({ ...item, readAt: read ? new Date().toISOString() : null });
    await this.apply(this.api.read(item.id, read), item);
  }

  /** Archives an item (or restores one): it leaves (or joins) the open items. */
  async archive(item: InboxItem, archive = true): Promise<void> {
    this._items.update((items) => items.filter((i) => i.id !== item.id));
    await this.apply(this.api.archive(item.id, archive), item);
  }

  /** Marks every open item read, in the group shown or all. */
  async readAll(): Promise<void> {
    const group = this._group();
    this._items.update((items) => items.map((i) => i.readAt ? i : { ...i, readAt: new Date().toISOString() }));
    try {
      await firstValueFrom(this.api.readAll(group ?? undefined));
    } catch (error) {
      this._error.set(error);
    }
    this.loadCounts();
  }

  private async apply(call: Observable<InboxItem>, before: InboxItem): Promise<void> {
    try {
      const after = await firstValueFrom(call);
      this.replace(after);
      this._error.set(null);
    } catch (error) {
      this._error.set(error);
      this.loadItems(); // back to what the server has
    }
    this.loadCounts();
  }

  /** An item as it now is: replaced where shown, or dropped if it no longer belongs to the listing. */
  private replace(item: InboxItem): void {
    const fits = !item.archivedAt && (this._group() === null || item.group === this._group()) && (!this._actionable() || item.actionable);
    this._items.update((items) => fits ? items.map((i) => i.id === item.id ? item : i) : items.filter((i) => i.id !== item.id));
  }

  private onChange(change: InboxChange): void {
    this.loadCounts();
    if (change.kind === 'changed') {
      // Only the items shown matter here; any other changed item shows up when its page loads.
      for (const id of change.items.filter((id) => this._items().some((i) => i.id === id))) {
        firstValueFrom(this.api.item(id)).then((item) => this.replace(item), () => this._items.update((items) => items.filter((i) => i.id !== id)));
      }
      return;
    }
    // Added (newest first, so at the top) or reset: the first page again.
    this.loadItems();
  }

  private loadCounts(): void {
    this.api.counts().subscribe({ next: (counts) => this._counts.set(counts), error: (error) => this._error.set(error) });
  }

  private loadItems(before?: string): void {
    this.listing?.unsubscribe();
    const query: InboxQuery = { group: this._group() ?? undefined, actionable: this._actionable(), before, limit: this.pageSize };
    this._loading.set(true);
    this.listing = this.api.inbox(query).subscribe({
      next: (page) => {
        this._items.update((items) => before ? [...items, ...page.filter((p) => !items.some((i) => i.id === p.id))] : page);
        this._more.set(page.length === this.pageSize);
        this._loading.set(false);
        this._error.set(null);
      },
      error: (error) => {
        this._loading.set(false);
        this._error.set(error);
      },
    });
  }
}
