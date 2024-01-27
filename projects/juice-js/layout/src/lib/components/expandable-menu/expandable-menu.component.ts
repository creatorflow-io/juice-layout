import { Component, Input } from '@angular/core';
import { MenuItem } from '@juice-js/core';
import { Router } from '@angular/router';
import { TooltipPosition } from '../tooltip/tooltip.directive';

@Component({
  selector: 'juice-expandable-menu',
  templateUrl: './expandable-menu.component.html',
  styleUrls: ['./expandable-menu.component.scss']
})
export class ExpandableMenuComponent {
  @Input()
  isExpanded = false;
  @Input()
  item: MenuItem= {} as MenuItem;
  TooltipPosition: typeof TooltipPosition = TooltipPosition;

  constructor(public router: Router) {}
}
