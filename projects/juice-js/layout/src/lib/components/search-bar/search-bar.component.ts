import { Component } from '@angular/core';
import { SearchService } from '../../services/search.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  // ...
} from '@angular/animations';

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
})
export class SearchBarComponent {
  searchText: string = "";
  constructor(private service: SearchService) { 

  }

  isEnabled(): boolean {
    return this.service.isEnabled;
  }
  
  onSearchTextChange(event: any){
    this.service.callback(this.searchText, event);
  }
}
