import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LayoutService } from '../layout.service';
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
  ]
})
export class PageComponent {
  isMobile: boolean = false;
  isSnavOpenned: boolean = false;
  
  constructor(public service: LayoutService, 
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

  public onAttach(e: any){
    console.log("attached", e);
  }
}
