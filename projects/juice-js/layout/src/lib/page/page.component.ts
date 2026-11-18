import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, Type, effect, inject, untracked } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LAYOUT_TOOLBAR_ITEMS } from '../layout.config';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LayoutService } from '../layout.service';
import { SearchService } from '../services/search.service';
import { PageSwitcherService } from '../services/page-switcher.service';
import { PageSwitcherComponent } from '../components/page-switcher/page-switcher.component';
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
  /** The app's own toolbar items ({@link LAYOUT_TOOLBAR_ITEMS}). */
  readonly toolbarItems: Type<unknown>[] = inject(LAYOUT_TOOLBAR_ITEMS, { optional: true }) ?? [];
  isMobile: boolean = false;
  isSnavOpenned: boolean = false;
  
  constructor(public service: LayoutService,
    private search: SearchService,
    /** The page switcher: its keys are live while the shell is, and the shell shows it (see the constructor). */
    public switcher: PageSwitcherService,
    private breakpointObserver: BreakpointObserver,
    cdr: ChangeDetectorRef) {
    breakpointObserver.observe([
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      this.isSnavOpenned = !this.isMobile;
      cdr.markForCheck();
    });
    this.hostPageSwitcher();
  }

  /**
   * Shows the page switcher in a dialog while it is open (the dialog brings the focus trap, Escape, the backdrop and
   * gives focus back), and its keys while the shell is on screen.
   */
  private hostPageSwitcher(): void {
    const dialog = inject(MatDialog);
    /** The dialog on display; `closing` once the switcher closed it (not Escape or the backdrop). */
    let current: { ref: MatDialogRef<PageSwitcherComponent>, closing: boolean } | null = null;
    const show = () => {
      const shown = {
        ref: dialog.open(PageSwitcherComponent, {
          panelClass: 'juice-page-switcher-panel',
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          position: { top: '12vh' },
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          // Gone at once: no closing dialog left to take the keys meant for the next one (Ctrl+K again, Escape).
          exitAnimationDuration: 0,
          ariaLabel: 'Go to page',
        }),
        closing: false,
      };
      current = shown;
      shown.ref.afterClosed().subscribe(() => {
        if (current !== shown) return;                     // a newer one is on display
        current = null;
        if (!shown.closing) this.switcher.close();         // Escape or the backdrop
      });
    };
    inject(DestroyRef).onDestroy(this.switcher.attach());
    effect(() => {
      const open = this.switcher.isOpen();
      if (open && (!current || current.closing)) {
        untracked(show);                                   // only isOpen drives this effect                                            // also while the last one is still closing: at once
      } else if (!open && current && !current.closing) {
        current.closing = true;
        const closing = current.ref;
        untracked(() => closing.close());
      }
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
