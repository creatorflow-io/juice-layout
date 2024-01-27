import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { ExpandableMenuComponent } from './expandable-menu.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('ExpandableMenuComponent', () => {
  let component: ExpandableMenuComponent;
  let fixture: ComponentFixture<ExpandableMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExpandableMenuComponent],
      imports: [
        MatExpansionModule,
        MatListModule,
        BrowserAnimationsModule,
        RouterTestingModule
      ]
    });
    fixture = TestBed.createComponent(ExpandableMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
