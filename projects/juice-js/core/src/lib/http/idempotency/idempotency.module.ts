import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { IdempotencyInterceptor } from './idempotency.interceptor';

/**
 * Registers the {@link IdempotencyInterceptor} so opted-in state-changing
 * requests automatically carry an `Idempotency-Key` header.
 *
 * @example
 * imports: [IdempotencyModule]
 */
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: IdempotencyInterceptor, multi: true },
  ],
})
export class IdempotencyModule {}
