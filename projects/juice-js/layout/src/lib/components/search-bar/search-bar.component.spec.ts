import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';

import { SearchBarComponent } from './search-bar.component';
import { SearchService } from '../../services/search.service';
import { SearchablePage } from '../../services/searchable-page';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let service: SearchService;
  let page: jasmine.SpyObj<SearchablePage>;

  const input = (): HTMLInputElement | null =>
    fixture.nativeElement.querySelector('input[type="search"]');

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchBarComponent],
      imports: [NoopAnimationsModule, MatIconModule],
    });
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(SearchService);
    page = jasmine.createSpyObj<SearchablePage>('SearchablePage', ['onSearch']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders no box when no page supports search (FR-003)', () => {
    expect(input()).toBeNull();
  });

  it('renders the box once a searchable page is bound (FR-002)', () => {
    service.bindPage(page);
    fixture.detectChanges();

    expect(input()).not.toBeNull();
  });

  it('renders no box for a page that declares no support (FR-002)', () => {
    service.bindPage({ notSearchable: true });
    fixture.detectChanges();

    expect(input()).toBeNull();
  });

  // fakeAsync/flush: the box has a :leave fade, so it lingers in the DOM until the
  // animation finishes. Without flushing we would assert before it is actually gone.
  it('removes the box when the page is unbound', fakeAsync(() => {
    service.bindPage(page);
    fixture.detectChanges();
    expect(input()).not.toBeNull();

    service.unbindPage();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();

    expect(input()).toBeNull();
  }));

  it('sends what the user types to the bound page (FR-004)', () => {
    service.bindPage(page);
    fixture.detectChanges();

    const el = input()!;
    el.value = 'abc';
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(page.onSearch).toHaveBeenCalledWith('abc', jasmine.any(Event));
  });

  it('shows the current query from the service, not its own state', () => {
    service.bindPage(page);
    service.submit('abc');
    fixture.detectChanges();

    expect(input()!.value).toBe('abc');
  });

  it('clearing tells the page the query is empty (FR-010)', () => {
    service.bindPage(page);
    service.submit('abc');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('mat-icon').click();
    fixture.detectChanges();

    expect(page.onSearch).toHaveBeenCalledWith('', jasmine.any(Event));
    expect(input()!.value).toBe('');
  });

  it('shows no clear icon when there is nothing to clear', () => {
    service.bindPage(page);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
  });

  // The bar is mounted once by the shell and outlives every page — the exact reason a
  // query held here leaked onto the next page (defect D1).
  it('empties the box when the page changes (FR-005)', () => {
    service.bindPage(page);
    service.submit('abc');
    fixture.detectChanges();
    expect(input()!.value).toBe('abc');

    // Navigate to another searchable page, same long-lived bar.
    service.unbindPage();
    service.bindPage(jasmine.createSpyObj<SearchablePage>('next', ['onSearch']));
    fixture.detectChanges();

    expect(input()!.value).toBe('');
  });
});
