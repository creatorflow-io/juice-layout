import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipe, TranslateDirective, provideTranslateService } from '@ngx-translate/core';
import { TenantMismatchComponent } from './tenant-mismatch.component';

describe('TenantMismatchComponent', () => {
  let component: TenantMismatchComponent;
  let fixture: ComponentFixture<TenantMismatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TenantMismatchComponent],
      imports: [
        TranslatePipe, TranslateDirective
      ],
      providers: [provideTranslateService()]
    });
    fixture = TestBed.createComponent(TenantMismatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
