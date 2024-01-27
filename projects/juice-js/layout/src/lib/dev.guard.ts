import { Injectable, inject } from '@angular/core';
import { IS_PRODUCTION } from './layout.config';

@Injectable({
    providedIn: 'root'
  })
export class DevGuard {
    isProduction = inject(IS_PRODUCTION);
    canActivate() {
        console.log('DevGuard: this route is available in development environment only!', this.isProduction);
        return !this.isProduction;
    }

    canDisplay() {
        console.log('DevGuard: this menu is available in development environment only!', this.isProduction);
        return !this.isProduction;
    }
}
