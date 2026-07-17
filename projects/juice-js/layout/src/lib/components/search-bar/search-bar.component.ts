import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SearchService } from '../../services/search.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  // ...
} from '@angular/animations';

/**
 * The shell's single search box. Mounted once by the toolbar and shared by every page,
 * so it deliberately owns no state of its own: both its visibility and its text come
 * from {@link SearchService}, which scopes them to the page on display. A query held
 * here would outlive the page that was searched and surface on the next one.
 */
@Component({
    selector: 'juice-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss'],
    animations: [
        trigger('enableTrigger', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('100ms', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('100ms', style({ opacity: 0 }))
            ])
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SearchBarComponent {
  constructor(public service: SearchService) {

  }

  onSearchTextChange(event: Event){
    const text = (event.target as HTMLInputElement).value;
    this.service.submit(text, event);
  }

  clear(event: Event){
    this.service.submit('', event);
  }
}
