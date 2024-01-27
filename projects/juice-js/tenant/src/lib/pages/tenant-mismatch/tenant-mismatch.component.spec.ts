import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantMismatchComponent } from './tenant-mismatch.component';

describe('TenantMismatchComponent', () => {
  let component: TenantMismatchComponent;
  let fixture: ComponentFixture<TenantMismatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TenantMismatchComponent]
    });
    fixture = TestBed.createComponent(TenantMismatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
