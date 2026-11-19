import { Injectable, Signal, computed, signal } from '@angular/core';

/** A count shown on a side menu entry, such as requests waiting for the user. */
export interface MenuBadge {
  /** Shown while above zero; above 99 it reads `99+`. */
  count: number;
  /** What the count means, for a tooltip and screen readers: `3 requests waiting for your approval`. */
  hint?: string;
}

/**
 * The counts on the side menu's entries, by menu id ({@link Menu.id}). The menu draws them itself: beside the label, or
 * on the icon's corner while the menu is folded to icons. A group shows its pages' counts on its header while it is
 * closed, so a count is never hidden with the page it belongs to, and never shown twice.
 *
 * An app sets a count whenever it knows a new one; setting the same count again does nothing.
 */
@Injectable({ providedIn: 'root' })
export class MenuBadgeService {
  private readonly badges = signal<ReadonlyMap<string, MenuBadge>>(new Map());

  /** Sets the count on the entry with this menu id: a number, a badge with a hint, or null (or a count of zero) for none. */
  set(id: string, badge: MenuBadge | number | null | undefined): void {
    const next = typeof badge === 'number' ? { count: badge } : badge ?? null;
    const now = this.badges().get(id);
    if (!next || !(next.count > 0)) {
      if (!now) return;
      const rest = new Map(this.badges());
      rest.delete(id);
      this.badges.set(rest);
      return;
    }
    if (now && now.count === next.count && now.hint === next.hint) return;
    this.badges.set(new Map(this.badges()).set(id, { count: next.count, hint: next.hint }));
  }

  /** Takes the count off the entry with this menu id. */
  clear(id: string): void {
    this.set(id, null);
  }

  /** The count on the entry with this menu id, or null; read in a template or `computed`, it follows changes. */
  get(id: string | null | undefined): MenuBadge | null {
    return (id && this.badges().get(id)) || null;
  }

  /** The counts of these entries together (a closed group's pages), their hints joined; null when none has one. */
  total(ids: Signal<readonly string[]>): Signal<MenuBadge | null> {
    return computed(() => {
      const all = ids().map(id => this.get(id)).filter((b): b is MenuBadge => !!b);
      if (all.length === 0) return null;
      if (all.length === 1) return all[0];
      const hints = all.map(b => b.hint).filter(h => !!h);
      return { count: all.reduce((sum, b) => sum + b.count, 0), hint: hints.length ? hints.join('; ') : undefined };
    });
  }
}
