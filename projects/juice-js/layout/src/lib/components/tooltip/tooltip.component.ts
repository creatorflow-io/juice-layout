import { OnInit, Component, ElementRef } from '@angular/core';
import { TooltipPosition } from './tooltip.directive';

@Component({
  selector: 'tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent{
  tooltip: string = '';
  position: TooltipPosition = TooltipPosition.DEFAULT;
  left: number = 0;
  top: number = 0;
  display: boolean = true;
  constructor(private elementRef: ElementRef) { }

  calculatePosition(left:number, right:number, top: number, bottom: number): void {
    switch(this.position) {
      case TooltipPosition.BELOW: {
      this.left = Math.round((right - left) / 2 + left);
      this.top = Math.round(bottom);
      break;
      }
      case TooltipPosition.ABOVE: {
      this.left = Math.round((right - left) / 2 + left);
      this.top = Math.round(top);
      break;
      }
      case TooltipPosition.RIGHT: {
      this.left = Math.round(right);
      this.top = Math.round(top + (bottom - top) / 2);
      break;
      }
      case TooltipPosition.LEFT: {
      this.left = Math.round(left);
      this.top = Math.round(top + (bottom - top) / 2);
      break;
      }
      default: {
      break;
      }
    }
  }
}
