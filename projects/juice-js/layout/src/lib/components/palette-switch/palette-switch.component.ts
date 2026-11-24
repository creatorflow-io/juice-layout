import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LayoutService } from '../../layout.service';

/** The palette menu beside the dark mode switch: every page follows the palette picked here. Hidden with one palette. */
@Component({
    selector: 'juice-palette-switch',
    templateUrl: './palette-switch.component.html',
    styleUrl: './palette-switch.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PaletteSwitchComponent {
  private readonly service = inject(LayoutService);
  readonly palettes = this.service.palettes();
  /** The palette in use; without a choice or a configured default, the first one (the stylesheet's default). */
  readonly current = computed(() => this.service.palette() ?? this.palettes[0]?.id);

  select(id: string) {
    this.service.setPalette(id);
  }
}
