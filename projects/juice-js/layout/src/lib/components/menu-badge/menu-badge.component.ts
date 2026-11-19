import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MenuBadge } from '../../services/menu-badge.service';

/**
 * A count on a side menu entry ({@link MenuBadgeService}): beside the label, or small on the icon's top right corner while
 * the menu is folded to icons. Nothing while there is no count.
 */
@Component({
  selector: 'juice-menu-badge',
  template: '{{ text() }}',
  styleUrls: ['./menu-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  host: {
    '[class.folded]': 'folded()',
    '[hidden]': '!text()',
    '[attr.data-menu-id]': 'menuId() || null',
    '[attr.title]': 'badge()?.hint || null',
    '[attr.aria-label]': 'badge()?.hint || null',
  },
})
export class MenuBadgeComponent {
  readonly badge = input<MenuBadge | null>(null);
  /** On the icon's corner, not beside the label. */
  readonly folded = input(false);
  /** The entry's menu id, for tests and styling. */
  readonly menuId = input<string | null>(null);

  protected readonly text = computed(() => {
    const count = this.badge()?.count ?? 0;
    return count <= 0 ? '' : count > 99 ? '99+' : String(count);
  });
}
