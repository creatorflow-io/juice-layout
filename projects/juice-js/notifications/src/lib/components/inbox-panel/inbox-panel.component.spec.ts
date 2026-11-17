import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { InboxService } from '../../inbox.service';
import { InboxItem } from '../../models';
import { FakeHub, ME, TENANT, counts, item, jwt, providers } from '../../testing.spec-helpers';
import { InboxPanelComponent } from './inbox-panel.component';

describe('InboxPanelComponent', () => {
  it('shows the groups with their unread counts and the items, and opening one reads it', async () => {
    TestBed.configureTestingModule({
      imports: [InboxPanelComponent],
      providers: [...providers(new FakeHub(), jwt({ platform_tenant: TENANT })), provideNoopAnimations()],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(InboxService).start();
    http.expectOne(`${ME}/inbox/counts`).flush(counts(1, [['approval', 1], ['general', 0]]));
    http.expectOne((r) => r.url === `${ME}/inbox`).flush([item('a', { actions: [{ id: 'approve', label: 'Approve' }], actionable: true }), item('b', { readAt: 'x' })]);

    const fixture = TestBed.createComponent(InboxPanelComponent);
    fixture.componentRef.setInput('followLinks', false);
    const opened: InboxItem[] = [];
    fixture.componentInstance.opened.subscribe((i) => opened.push(i));
    fixture.detectChanges();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(Array.from(element.querySelectorAll('mat-button-toggle')).map((t) => t.textContent!.replace(/\s+/g, ' ').trim()))
      .toEqual(['All1', 'Approval1', 'General']); // the count is its own badge
    const rows = element.querySelectorAll('.inbox-item');
    expect(rows.length).toBe(2);
    expect(rows[0].classList).toContain('unread');
    expect(rows[1].classList).not.toContain('unread');
    expect(rows[0].querySelector('.inbox-item-action')!.textContent).toContain('Approve');

    (rows[0].querySelector('.inbox-item-open') as HTMLButtonElement).click();
    expect(opened.map((i) => i.id)).toEqual(['a']);
    http.expectOne(`${ME}/inbox/a/read`).flush(item('a', { readAt: 'now' }));
    await fixture.whenStable();
    http.expectOne(`${ME}/inbox/counts`).flush(counts(0));
    http.verify();
  });
});
