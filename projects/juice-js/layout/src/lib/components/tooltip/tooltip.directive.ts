import {Directive, Input, ElementRef, HostListener, ComponentRef, ViewContainerRef, EmbeddedViewRef, booleanAttribute} from '@angular/core';
import {TooltipComponent} from "./tooltip.component";

export enum TooltipPosition {
    ABOVE = 'above',
    BELOW = 'below',
    LEFT = 'left',
    RIGHT = 'right',
    DEFAULT = 'above'
}

function tooltipPosition(position: string): TooltipPosition {
  switch(position){
    case TooltipPosition.ABOVE: return TooltipPosition.ABOVE;
    case TooltipPosition.BELOW: return TooltipPosition.BELOW;
    case TooltipPosition.LEFT: return TooltipPosition.LEFT;
    case TooltipPosition.RIGHT: return TooltipPosition.RIGHT;
    default: return TooltipPosition.DEFAULT;
  }
}

@Directive({
  selector: '[tooltip]'
})
export class TooltipDirective {

  @Input() tooltip = '';
  @Input({ transform: tooltipPosition }) tooltipPosition: TooltipPosition = TooltipPosition.DEFAULT;
  @Input({ transform: booleanAttribute }) tooltipDisplay!: boolean;
  componentRef?: ComponentRef<any>;
  constructor(
	private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef) {
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.componentRef) {

        this.componentRef = this.viewContainerRef.createComponent(TooltipComponent);
        const domElem = 
              (this.componentRef.hostView as EmbeddedViewRef<any>)
              .rootNodes[0] as HTMLElement;       
        document.body.appendChild(domElem);
        this.setTooltipComponentProperties();
    }
  }
  private getPosition(): TooltipPosition {
    return this.tooltipPosition;
  }
  private setTooltipComponentProperties() {
    if (this.componentRef) {
      this.componentRef.instance.tooltip = this.tooltip;
      this.componentRef.instance.position = this.getPosition();
      this.componentRef.instance.display = this.tooltipDisplay;
      const {left, right, top, bottom} = this.elementRef.nativeElement.getBoundingClientRect();
      this.componentRef.instance.calculatePosition(left, right, top, bottom);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.destroy();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }
}