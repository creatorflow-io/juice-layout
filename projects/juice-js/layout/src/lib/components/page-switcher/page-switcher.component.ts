import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { PageSwitcherService } from '../../services/page-switcher.service';

/**
 * The page switcher's content: a box to type a page's name in and the pages that match, with their group and go-to
 * keys. Arrow keys move, Enter opens. The shell shows it in a dialog (which brings the focus trap, Escape and the
 * backdrop) while {@link PageSwitcherService.isOpen}.
 */
@Component({
  selector: 'juice-page-switcher',
  templateUrl: './page-switcher.component.html',
  styleUrls: ['./page-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PageSwitcherComponent {
  readonly service = inject(PageSwitcherService);
  readonly query = signal('');
  readonly selected = signal(0);
  readonly results = computed(() => this.service.filter(this.query()));

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  onInput(value: string) {
    this.query.set(value);
    this.selected.set(0);
  }

  onKeydown(e: KeyboardEvent) {
    // Keys that confirm or move within an input method's (IME) composition are the IME's.
    if (e.isComposing) return;
    const count = this.results().length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (count) this.select((this.selected() + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (count) this.select((this.selected() - 1 + count) % count);
        break;
      case 'Enter': {
        e.preventDefault();
        const page = this.results()[this.selected()];
        if (page) {
          this.service.go(page);
        } else if (this.service.pages().length === 0) {
          // Typed and confirmed before the menu had loaded: open the best match once it has.
          this.service.whenReady().then(() => {
            const first = this.results()[0];
            if (first && this.service.isOpen()) this.service.go(first);
          });
        }
        break;
      }
    }
  }

  /** Unique per row (menu ids need not be). */
  optionId(index: number): string {
    return `juice-page-switcher-option-${index}`;
  }

  keys(shortcut: string): string[] {
    return shortcut.trim().split(/\s+/);
  }

  private select(index: number) {
    this.selected.set(index);
    this.list()?.nativeElement.querySelector(`#${this.optionId(index)}`)?.scrollIntoView({ block: 'nearest' });
  }
}
