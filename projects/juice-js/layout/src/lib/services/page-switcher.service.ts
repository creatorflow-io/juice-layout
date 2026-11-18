import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { MenuItem, TenantService } from '@juice-js/core';
import { LayoutConfig } from '../layout.config';

/** A page the switcher offers: a menu item with a page of its own. */
export interface PageEntry {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  /** The label of the menu group it sits in, if any. */
  group?: string;
  /** Its go-to keys, such as `g s`. */
  shortcut?: string;
}

/** How long a go-to sequence waits for its next key. */
const SequenceTimeout = 1500;

/**
 * The page switcher (Ctrl+K or ⌘K) and the go-to keys (`g` then a letter) over the app's menu. Every menu entry with a
 * page of its own is offered, also those kept out of the side menu (`inMenu: false`); a group that only links to its
 * first page is offered as that page.
 *
 * Part of the shell ({@link PageComponent}): the pages are its side menu's own items ({@link setItems}), so they
 * follow it (loaded once, and again when the shell is built again for another tenant), and the keys are live only
 * while the shell is on screen ({@link attach}); the shell also shows the switcher while {@link isOpen}.
 * Keys typed into a field or a widget that takes letters are left alone, and so is a Ctrl+K a page already handled.
 */
@Injectable({ providedIn: 'root' })
export class PageSwitcherService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly tenants = inject(TenantService, { optional: true });
  private readonly enabled = inject(LayoutConfig, { optional: true })?.pageSwitcher ?? true;

  private readonly _open = signal(false);
  private readonly _pages = signal<PageEntry[]>([]);
  private ready!: () => void;
  private readyPromise = new Promise<void>(resolve => this.ready = resolve);
  private attached = 0;
  /** Counts menu loads, so a slower earlier one can't replace a later one's pages. */
  private loads = 0;
  private readonly onKey = (e: KeyboardEvent) => this.onKeydown(e);
  private sequence: string[] = [];
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Whether the switcher is on display. */
  readonly isOpen = this._open.asReadonly();
  /** The pages, in menu order; empty until the side menu has loaded. */
  readonly pages = this._pages.asReadonly();

  /** Whether the app has the switcher (`LayoutConfig.pageSwitcher`, default true). */
  get isEnabled(): boolean { return this.enabled; }

  /** The menu's items, from the side menu once it has loaded them. Their links are resolved for the tenant. */
  async setItems(items: MenuItem[]): Promise<void> {
    const load = ++this.loads;
    const tenant = await this.tenants?.getTenantIdentifier().catch(() => null);
    if (load !== this.loads) return;
    this._pages.set(flatten(items, tenant));
    this.ready();
  }

  /** Resolves once the pages are known. */
  whenReady(): Promise<void> { return this.readyPromise; }

  /** Starts listening for the keys, for the shell on screen; the returned function stops. */
  attach(): () => void {
    if (!this.enabled) return () => {};
    if (this.attached++ === 0) this.document.addEventListener('keydown', this.onKey);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      if (--this.attached === 0) {
        this.document.removeEventListener('keydown', this.onKey);
        this.resetSequence();
        this._open.set(false);
        // The shell is gone (another tenant's may follow): its pages go with it until the next menu comes.
        this.loads++;
        this._pages.set([]);
        this.readyPromise = new Promise<void>(resolve => this.ready = resolve);
      }
    };
  }

  open(): void {
    if (this.enabled && this.attached > 0) this._open.set(true);
  }

  close(): void { this._open.set(false); }

  /** Opens a page the switcher offered, and closes it. */
  go(page: PageEntry): void {
    this.close();
    this.router.navigateByUrl(page.routerLink);
  }

  /** The pages matching what was typed, best first: label starts with it, then a word in it does, then it contains it. */
  filter(query: string): PageEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this._pages();
    const rank = (p: PageEntry): number => {
      const label = p.label.toLowerCase();
      if (label.startsWith(q)) return 0;
      if (label.split(/\s+/).some(w => w.startsWith(q))) return 1;
      if (label.includes(q)) return 2;
      if (p.group?.toLowerCase().includes(q)) return 3;
      return -1;
    };
    return this._pages()
      .map((page, index) => ({ page, index, rank: rank(page) }))
      .filter(r => r.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(r => r.page);
  }

  private onKeydown(e: KeyboardEvent): void {
    const target = eventTarget(e);
    // The K key wherever the layout puts its letter (`code`), or a K wherever it is (`key`).
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.code === 'KeyK' || e.key.toLowerCase() === 'k')) {
      // An editor's own Ctrl+K (a link, a chord) wins: one that handled it, or any multi-line or rich text editor.
      // Another dialog open: not over it (a page picked would go behind it, its unsaved input with it).
      if (e.defaultPrevented || isEditor(target) || (!this._open() && this.modalOpen())) return;
      e.preventDefault();
      this._open() ? this.close() : this.open();
      return;
    }
    if (this._open() || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTyping(target)
      || this.modalOpen()) {
      this.resetSequence();
      return;
    }
    if (e.key.length !== 1) return;
    const key = e.key.toLowerCase();
    // A key that doesn't go on with the sequence starts a new one: `g g s` is `g s`.
    if (!this.step([...this.sequence, key], e)) this.step([key], e);
  }

  /** Takes the keys typed so far: goes, waits for more, or (false) leads nowhere. */
  private step(keys: string[], e: KeyboardEvent): boolean {
    const typed = keys.join(' ');
    const shortcuts = this._pages().filter(p => p.shortcut).map(p => ({ page: p, keys: normalize(p.shortcut!) }));
    const hit = shortcuts.find(s => s.keys === typed);
    const longer = shortcuts.some(s => s.keys.startsWith(typed + ' '));
    this.resetSequence();
    if (hit && !longer) {
      e.preventDefault();
      this.router.navigateByUrl(hit.page.routerLink);
      return true;
    }
    if (longer) {
      // Wait for the next key; a shortcut that is the start of a longer one goes when none comes.
      this.sequence = keys;
      this.sequenceTimer = setTimeout(() => {
        this.resetSequence();
        if (hit) this.router.navigateByUrl(hit.page.routerLink);
      }, SequenceTimeout);
      return true;
    }
    return false;
  }

  /** Whether another dialog is open: the keys are its, and a page change would happen behind it. */
  private modalOpen(): boolean {
    // CDK and Material dialogs and bottom sheets, which leave aria-modal off by default, and anything that sets it.
    return !!this.document.querySelector('[aria-modal="true"], .cdk-dialog-container, .mat-bottom-sheet-container');
  }

  private resetSequence(): void {
    this.sequence = [];
    if (this.sequenceTimer) clearTimeout(this.sequenceTimer);
    this.sequenceTimer = null;
  }
}

/**
 * The menu's pages: those with a page of their own (see `MenuItem.hasOwnPage`), each in the group it sits in, with
 * its link resolved for the tenant (a top-level page's link is still as written: `''` is the home page).
 */
export function flatten(items: MenuItem[], tenant?: string | null, group?: string): PageEntry[] {
  const pages: PageEntry[] = [];
  for (const item of items) {
    if (item.hasOwnPage()) {
      pages.push({
        id: item.id, label: item.label, icon: item.icon, routerLink: (item.routerLink ?? '').injectTenant(tenant),
        group, shortcut: item.shortcut,
      });
    }
    const children = item.children ?? [];
    pages.push(...flatten(children, tenant, children.length ? item.label : group));
  }
  return pages;
}

/** `G  S` → `g s`. */
function normalize(shortcut: string): string {
  return shortcut.trim().toLowerCase().split(/\s+/).join(' ');
}

/** The element the key went to, also inside a web component (whose host is all `e.target` shows). */
function eventTarget(e: KeyboardEvent): HTMLElement | null {
  const first = e.composedPath?.()[0] ?? e.target;
  return first instanceof HTMLElement ? first : null;
}

/** A multi-line or rich text editor (a textarea, as code editors use, or editable content). */
function isEditor(el: HTMLElement | null): boolean {
  return !!el && (el.isContentEditable || el.tagName === 'TEXTAREA');
}

/** Widgets that take letter keys themselves (typeahead, cell editing); focus sits on them or on an item inside. */
const LetterWidgets = ['combobox', 'listbox', 'textbox', 'searchbox', 'menu', 'menubar', 'grid', 'treegrid', 'tree',
  'spinbutton', 'slider'].map(role => `[role="${role}"]`).join(',');

/** Whether letter keys go to what has focus: a field, an editor, or a widget that takes them (a menu's typeahead). */
function isTyping(el: HTMLElement | null): boolean {
  if (!el) return false;
  if (isEditor(el) || el.tagName === 'SELECT') return true;
  // Inputs that take text; a checkbox, radio, button or range doesn't.
  if (el instanceof HTMLInputElement && !/^(checkbox|radio|button|submit|reset|range|color|file|image)$/.test(el.type)) return true;
  return !!el.closest(LetterWidgets);
}
