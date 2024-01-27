import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CultureComponent } from './culture.component';

describe('LocalizeComponent', () => {
  let component: CultureComponent;
  let fixture: ComponentFixture<CultureComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CultureComponent]
    });
    fixture = TestBed.createComponent(CultureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
