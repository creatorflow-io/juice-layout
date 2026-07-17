import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LayoutService } from '../layout.service';
import { SearchService } from '../services/search.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  // ...
} from '@angular/animations';

@Component({
    selector: 'app-page',
    templateUrl: './page.component.html',
    styleUrls: ['./page.component.scss'],
    animations: [
        trigger('menuTransition', [
            state('expand', style({
                width: '220px'
            })),
            state('collapsed', style({
                width: '60px'
            })),
            transition('* => collapsed', [
                animate('0.15s')
            ]),
            transition('* => expand', [
                animate('0.15s')
            ])
        ]),
        trigger('contentTransition', [
            state('expand', style({
                "margin-left": "60px"
            })),
            state('collapsed', style({
                "margin-left": "220px"
            })),
            state("full", style({
                "margin-left": "0"
            })),
            transition('* => collapsed', [
                animate('0.15s')
            ]),
            transition('* => expand', [
                animate('0.15s')
            ])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PageComponent {
  isMobile: boolean = false;
  isSnavOpenned: boolean = false;
  
  constructor(public service: LayoutService,
    private search: SearchService,
    private breakpointObserver: BreakpointObserver) {
    breakpointObserver.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.isSnavOpenned = !this.isMobile;
    });
  }

  public hideSidenavOnMobile(): void {
    if(this.isMobile){
      this.isSnavOpenned = false;
    }
  }

  public toggleSidenav(): void {
    this.isSnavOpenned = !this.isSnavOpenned;
  }

  public toolbarHeight(): string {
    return "48px"; // this.isMobile ? "42px" : "48px";
  }

  /**
   * The routed page just became visible — offer search if it supports it.
   *
   * Driven by the outlet rather than by router events on purpose: the outlet does not
   * deactivate for a cancelled navigation or a param-only change that reuses the
   * component, so the box correctly survives both.
   */
  public onPageActivate(instance: unknown): void {
    this.search.bindPage(instance);
  }

  /** The routed page is going away — take the search box with it. */
  public onPageDeactivate(): void {
    this.search.unbindPage();
  }
}
