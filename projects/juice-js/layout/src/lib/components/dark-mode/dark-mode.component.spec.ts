import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipe, TranslateDirective, provideTranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DarkModeComponent } from './dark-mode.component';

describe('DarkModeComponent', () => {
  let component: DarkModeComponent;
  let fixture: ComponentFixture<DarkModeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DarkModeComponent],
      imports: [
        TranslatePipe,
        TranslateDirective,
        MatIconModule,
        MatTooltipModule
      ],
      providers: [provideTranslateService()]
    });
    fixture = TestBed.createComponent(DarkModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
