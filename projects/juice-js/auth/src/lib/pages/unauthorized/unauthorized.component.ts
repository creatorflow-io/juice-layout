import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

const DEFAULT_MESSAGE = 'You are unauthorized to access this resource.';

const REASON_MESSAGES: {[reason: string]: string} = {
  'tenant-mismatch': 'Your session belongs to a different tenant. Sign out, then sign in again to access this tenant.',
  'role-mismatch': 'You do not have the required role to access this resource.',
};

@Component({
    selector: 'page-unauthorized',
    templateUrl: './unauthorized.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UnauthorizedComponent {
  message: string;

  constructor(activatedRoute: ActivatedRoute) {
    var reason = activatedRoute.snapshot.queryParams['reason'];
    this.message = REASON_MESSAGES[reason] ?? DEFAULT_MESSAGE;
  }
}
