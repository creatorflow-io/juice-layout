import { HttpErrorResponse } from '@angular/common/http';
import { NotificationsProblem } from '../models';
import { NoTenantError } from '../notifications-api.service';

/** A message for the person from an API error: the problem's field errors, else its detail, else a general one. */
export function problemMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (error instanceof NoTenantError) {
    return 'Sign in to see your notifications.';
  }
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    const problem = error.error as Partial<NotificationsProblem>;
    if (problem.errors?.length) {
      return problem.errors.map((e) => e.message).join(' ');
    }
    if (problem.detail) {
      return problem.detail;
    }
  }
  return fallback;
}
