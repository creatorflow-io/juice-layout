import { HttpErrorResponse } from '@angular/common/http';
import { classifyError } from './idempotency-response';

function errorWith(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, statusText: 'x', error: body });
}

describe('classifyError', () => {
  it('classifies 409 as in-progress', () => {
    expect(classifyError(errorWith(409))).toBe('in-progress');
  });

  it('classifies 422 as conflict', () => {
    expect(classifyError(errorWith(422))).toBe('conflict');
  });

  it('classifies 400 with an idempotency-key title as required', () => {
    expect(classifyError(errorWith(400, { title: 'Idempotency-Key header required' }))).toBe('required');
  });

  it('classifies a generic 400 as other', () => {
    expect(classifyError(errorWith(400, { title: 'Validation failed' }))).toBe('other');
  });

  it('classifies unrelated statuses as other', () => {
    expect(classifyError(errorWith(500))).toBe('other');
  });
});
